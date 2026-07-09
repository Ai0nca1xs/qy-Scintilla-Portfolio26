// 標題流體解算器（WebGL2）。真實不可壓縮流體：
// 自平流 → splat 注入 → 涡量約束 → 散度 → Jacobi 壓力求解 → 梯度減法（無散度）。
// 用速度場對「靜態文字貼圖」做 UV 偏移採樣（不平流染料，文字保持可讀）。
// 觸碰區文字黑→白，邊緣依速度大小散發 藍/品紅/橙/青 四色光暈。
// 任一步驟不支援/失敗 → 回退（不掛載，DOM 標題保留）。

const VERT = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){ vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const ADVECTION = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity; uniform sampler2D uSource;
uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  o = dissipation * texture(uSource, coord);
}`;

const SPLAT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTarget; uniform float aspectRatio;
uniform vec2 point; uniform vec3 color; uniform float radius;
void main(){
  vec2 p = vUv - point; p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;

const CURL = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity; uniform vec2 texelSize;
void main(){
  float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity; uniform sampler2D uCurl;
uniform vec2 texelSize; uniform float curlAmt; uniform float dt;
void main(){
  float L = texture(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, texelSize.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= curlAmt * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const DIVERGENCE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity; uniform vec2 texelSize;
void main(){
  float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uPressure; uniform sampler2D uDivergence; uniform vec2 texelSize;
void main(){
  float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float div = texture(uDivergence, vUv).x;
  o = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uPressure; uniform sampler2D uVelocity; uniform vec2 texelSize;
void main(){
  float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(vel, 0.0, 1.0);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uText; uniform sampler2D uVelocity;
uniform float uUvScale; uniform float uDistort;
void main(){
  vec2 uv = vUv;
  vec2 vel = texture(uVelocity, uv).xy;
  float speed = length(vel);
  vec2 dir = vel * uUvScale;
  vec2 tuv = vec2(uv.x, 1.0 - uv.y);          // 文字貼圖 Y 翻轉
  float tR = texture(uText, tuv + dir * 1.6).g;
  float tG = texture(uText, tuv).g;
  float tB = texture(uText, tuv - dir * 1.6).g;
  float inkR = 1.0 - tR, inkG = 1.0 - tG, inkB = 1.0 - tB;
  float d = clamp(speed * uDistort, 0.0, 1.0);

  // 墨色：平時黑，觸碰處轉白
  vec3 inkColor = mix(vec3(0.06), vec3(1.0), d);
  vec3 rgb = inkColor * inkG;

  // 四色色散光暈（依速度大小）
  vec3 glow = inkB * vec3(0.12, 0.55, 1.0)                  // 藍
            + inkR * vec3(0.95, 0.0, 0.45)                  // 品紅
            + max(inkR - inkG, 0.0) * vec3(1.0, 0.45, 0.0)  // 橙
            + max(inkB - inkG, 0.0) * vec3(0.15, 0.8, 0.72);// 青
  rgb += glow * d * 1.5;

  float a = clamp(inkG + (glow.r + glow.g + glow.b) * d * 0.6, 0.0, 1.0);
  o = vec4(min(rgb, vec3(1.0)), a);
}`;

type GL = WebGL2RenderingContext;
interface FBO {
	tex: WebGLTexture;
	fbo: WebGLFramebuffer;
	w: number;
	h: number;
}
interface DoubleFBO {
	read: FBO;
	write: FBO;
	swap: () => void;
}

export function initFluidTitle(root: HTMLElement) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const canvas = root.querySelector<HTMLCanvasElement>('[data-fluid-canvas]');
	const fallback = root.querySelector<HTMLElement>('.ft-fallback');
	if (!canvas || !fallback) return;

	const gl = canvas.getContext('webgl2', {
		alpha: true,
		premultipliedAlpha: false,
		antialias: false,
		depth: false,
	}) as GL | null;
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) return; // 不支援 → 回退

	// linear 過濾半浮點（WebGL2 核心支援；float 需擴充）
	gl.getExtension('OES_texture_float_linear');

	const compile = (type: number, src: string) => {
		const s = gl.createShader(type)!;
		gl.shaderSource(s, src);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
			console.warn('fluid shader:', gl.getShaderInfoLog(s));
			return null;
		}
		return s;
	};
	const makeProgram = (frag: string) => {
		const vs = compile(gl.VERTEX_SHADER, VERT);
		const fs = compile(gl.FRAGMENT_SHADER, frag);
		if (!vs || !fs) return null;
		const p = gl.createProgram()!;
		gl.attachShader(p, vs);
		gl.attachShader(p, fs);
		gl.bindAttribLocation(p, 0, 'aPosition');
		gl.linkProgram(p);
		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
		const u: Record<string, WebGLUniformLocation | null> = {};
		const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < n; i++) {
			const info = gl.getActiveUniform(p, i)!;
			u[info.name] = gl.getUniformLocation(p, info.name);
		}
		return { p, u };
	};

	const progs = {
		advection: makeProgram(ADVECTION),
		splat: makeProgram(SPLAT),
		curl: makeProgram(CURL),
		vorticity: makeProgram(VORTICITY),
		divergence: makeProgram(DIVERGENCE),
		pressure: makeProgram(PRESSURE),
		gradient: makeProgram(GRADIENT),
		display: makeProgram(DISPLAY),
	};
	if (Object.values(progs).some((x) => !x)) return; // 任一失敗 → 回退

	// 全屏三角形
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	const SIM = 160; // 速度場解析度
	let simW = SIM;
	let simH = SIM;

	const createFBO = (w: number, h: number, internal: number, format: number): FBO => {
		const tex = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
		const fbo = gl.createFramebuffer()!;
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		gl.viewport(0, 0, w, h);
		gl.clear(gl.COLOR_BUFFER_BIT);
		return { tex, fbo, w, h };
	};
	const createDouble = (w: number, h: number, internal: number, format: number): DoubleFBO => {
		let read = createFBO(w, h, internal, format);
		let write = createFBO(w, h, internal, format);
		return {
			get read() {
				return read;
			},
			get write() {
				return write;
			},
			swap() {
				const t = read;
				read = write;
				write = t;
			},
		} as unknown as DoubleFBO;
	};

	const RG16F = gl.RG16F;
	const R16F = gl.R16F;
	let velocity = createDouble(simW, simH, RG16F, gl.RG);
	let divergence = createFBO(simW, simH, R16F, gl.RED);
	let curl = createFBO(simW, simH, R16F, gl.RED);
	let pressure = createDouble(simW, simH, R16F, gl.RED);

	// —— 文字貼圖：把 SCINTILLA. 畫到 2D canvas → 上傳為貼圖 ——
	const textTex = gl.createTexture()!;
	const textCanvas = document.createElement('canvas');
	const tctx = textCanvas.getContext('2d')!;

	const drawText = (w: number, h: number) => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		textCanvas.width = Math.max(2, Math.floor(w * dpr));
		textCanvas.height = Math.max(2, Math.floor(h * dpr));
		const cs = getComputedStyle(fallback);
		tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		tctx.clearRect(0, 0, w, h);
		tctx.fillStyle = '#ffffff';
		tctx.fillRect(0, 0, w, h);
		tctx.fillStyle = '#000000';
		tctx.textAlign = 'center';
		tctx.textBaseline = 'middle';
		const fs = parseFloat(cs.fontSize);
		tctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
		(tctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0.02em';
		tctx.fillText(root.dataset.text || 'SCINTILLA.', w / 2, h / 2 + fs * 0.02);
		gl.bindTexture(gl.TEXTURE_2D, textTex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
	};

	let dispW = 0;
	let dispH = 0;
	const resize = () => {
		const rect = root.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		dispW = Math.max(2, Math.floor(rect.width * dpr));
		dispH = Math.max(2, Math.floor(rect.height * dpr));
		canvas.width = dispW;
		canvas.height = dispH;
		drawText(rect.width, rect.height);
	};
	resize();

	const blit = (target: FBO | null) => {
		if (target) {
			gl.viewport(0, 0, target.w, target.h);
			gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
		} else {
			gl.viewport(0, 0, dispW, dispH);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};
	const use = (prog: { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }) => {
		gl.useProgram(prog.p);
		return prog.u;
	};
	const bindTex = (u: WebGLUniformLocation | null, tex: WebGLTexture, unit: number) => {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.uniform1i(u, unit);
	};

	const texel: [number, number] = [1 / simW, 1 / simH];
	const dt = 0.016;

	// —— 指針 → splat ——
	const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, down: false };
	const onMove = (e: PointerEvent) => {
		const rect = root.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		pointer.dx = (x - pointer.x) * 6;
		pointer.dy = (y - pointer.y) * 6;
		pointer.x = x;
		pointer.y = y;
		pointer.moved = true;
	};
	// 監聽整個 hero 區域，游標像球一樣掃過文字
	const hero = root.closest('.hero-section') || root;
	hero.addEventListener('pointermove', onMove as EventListener, { passive: true });

	const splat = (x: number, y: number, dx: number, dy: number) => {
		const u = use(progs.splat!);
		bindTex(u.uTarget, velocity.read.tex, 0);
		gl.uniform1f(u.aspectRatio, simW / simH);
		gl.uniform2f(u.point, x, y);
		gl.uniform3f(u.color, dx, dy, 0);
		gl.uniform1f(u.radius, 0.0002);
		blit(velocity.write);
		velocity.swap();
	};

	let rafId = 0;
	let running = true;

	const step = () => {
		gl.disable(gl.BLEND);
		// 1. 平流速度場（自平流）
		let u = use(progs.advection!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uVelocity, velocity.read.tex, 0);
		bindTex(u.uSource, velocity.read.tex, 1);
		gl.uniform1f(u.dt, dt);
		gl.uniform1f(u.dissipation, 0.992);
		blit(velocity.write);
		velocity.swap();

		// 2. splat 注入（游標移動量 → 力）
		if (pointer.moved && (Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0)) {
			splat(pointer.x, 1 - pointer.y, pointer.dx, -pointer.dy);
			pointer.moved = false;
			pointer.dx = 0;
			pointer.dy = 0;
		}

		// 3. 涡量約束
		u = use(progs.curl!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uVelocity, velocity.read.tex, 0);
		blit(curl);
		u = use(progs.vorticity!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uVelocity, velocity.read.tex, 0);
		bindTex(u.uCurl, curl.tex, 1);
		gl.uniform1f(u.curlAmt, 26);
		gl.uniform1f(u.dt, dt);
		blit(velocity.write);
		velocity.swap();

		// 4. 散度
		u = use(progs.divergence!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uVelocity, velocity.read.tex, 0);
		blit(divergence);

		// 5. 壓力 Jacobi 迭代
		u = use(progs.pressure!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uDivergence, divergence.tex, 1);
		for (let i = 0; i < 20; i++) {
			bindTex(u.uPressure, pressure.read.tex, 0);
			blit(pressure.write);
			pressure.swap();
		}

		// 6. 梯度減法 → 無散度
		u = use(progs.gradient!);
		gl.uniform2f(u.texelSize, texel[0], texel[1]);
		bindTex(u.uPressure, pressure.read.tex, 0);
		bindTex(u.uVelocity, velocity.read.tex, 1);
		blit(velocity.write);
		velocity.swap();

		// 7. 顯示：速度場對文字貼圖做 UV 偏移採樣 + 色散光暈
		u = use(progs.display!);
		bindTex(u.uText, textTex, 0);
		bindTex(u.uVelocity, velocity.read.tex, 1);
		gl.uniform1f(u.uUvScale, 0.7);
		gl.uniform1f(u.uDistort, 3.4);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied-ish over transparent
		gl.clearColor(0, 0, 0, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, dispW, dispH);
		gl.clear(gl.COLOR_BUFFER_BIT);
		blit(null);
	};

	const frame = () => {
		if (!running) return;
		step();
		rafId = requestAnimationFrame(frame);
	};

	root.classList.add('ready');
	frame();

	// 視口外暫停
	const io = new IntersectionObserver(
		([e]) => {
			running = e.isIntersecting;
			if (running && !rafId) frame();
			if (!running) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
		},
		{ threshold: 0 }
	);
	io.observe(canvas);

	let rt: number | undefined;
	const onResize = () => {
		clearTimeout(rt);
		rt = window.setTimeout(resize, 150);
	};
	window.addEventListener('resize', onResize);

	const destroy = () => {
		running = false;
		cancelAnimationFrame(rafId);
		io.disconnect();
		window.removeEventListener('resize', onResize);
		hero.removeEventListener('pointermove', onMove as EventListener);
		const ext = gl.getExtension('WEBGL_lose_context');
		ext?.loseContext();
	};
	window.addEventListener('fluid-title:destroy', destroy, { once: true });

	// 暴露測試鉤子
	(root as HTMLElement & { __fluidSplat?: typeof splat }).__fluidSplat = splat;
}

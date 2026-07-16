// 首頁標題「流體墨水」——完整移植自 Ksenia Kondrashova
// «WebGL Fluid Simulation With Your Text»（codepen.io/ksenia-k/pen/MWMObrY，
// 基於 Pavel Dobryakov 的 WebGL Fluid Simulation）。
//
// 原理：游標移動向速度場與染料場注入 splat → 散度 + 10 次 Jacobi 壓力迭代 +
// 梯度減法（不可壓縮）→ 平流。文字貼圖參與三處：
// ① 平流耗散 .96 + .04*text —— 字內墨水不衰減（積墨顯字），字外拖尾快速消散；
// ② 壓力 +0.2*text —— 字形作為壓力源，墨流沿字形繞行；
// ③ splat ×(.7+.2*text) —— 字內注入略強。
// 輸出取反色（1-C）呈白底墨痕；本站改造：輸出帶 alpha（無墨處透明），
// 透出底層 HeroField 光弧；文字用站點標題字體，染料用品牌洋紅。
// 未互動時沿 Lissajous 軌跡自動巡遊（預覽），首次真實移動後交還游標。
// WebGL / 浮點紋理不可用時直接返回，由組件保留純黑 DOM 標題（永不開天窗）。

const VERT = `
precision highp float;
varying vec2 vUv;
attribute vec2 a_position;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;

void main () {
    vUv = .5 * (a_position + 1.);
    vL = vUv - vec2(u_texel.x, 0.);
    vR = vUv + vec2(u_texel.x, 0.);
    vT = vUv + vec2(0., u_texel.y);
    vB = vUv - vec2(0., u_texel.y);
    gl_Position = vec4(a_position, 0., 1.);
}`;

const FRAG_ADVECTION = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform float u_dt;
uniform float u_use_text;
uniform sampler2D u_text_texture;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
    vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
    float text = texture2D(u_text_texture, vec2(vUv.x, 1. - vUv.y)).r;
    float dissipation = (.96 + text * .04 * u_use_text);
    gl_FragColor = dissipation * bilerp(u_input_texture, coord, u_texel);
    gl_FragColor.a = 1.;
}`;

const FRAG_DIVERGENCE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;

void main () {
    float L = texture2D(u_velocity_texture, vL).x;
    float R = texture2D(u_velocity_texture, vR).x;
    float T = texture2D(u_velocity_texture, vT).y;
    float B = texture2D(u_velocity_texture, vB).y;
    float div = .6 * (R - L + T - B);
    gl_FragColor = vec4(div, 0., 0., 1.);
}`;

const FRAG_PRESSURE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;
uniform sampler2D u_text_texture;

void main () {
    float text = texture2D(u_text_texture, vec2(vUv.x, 1. - vUv.y)).r;
    float L = texture2D(u_pressure_texture, vL).x;
    float R = texture2D(u_pressure_texture, vR).x;
    float T = texture2D(u_pressure_texture, vT).x;
    float B = texture2D(u_pressure_texture, vB).x;
    float C = texture2D(u_pressure_texture, vUv).x;
    float divergence = texture2D(u_divergence_texture, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    pressure += (.2 * text);
    gl_FragColor = vec4(pressure, 0., 0., 1.);
}`;

const FRAG_GRADIENT_SUBTRACT = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;

void main () {
    float L = texture2D(u_pressure_texture, vL).x;
    float R = texture2D(u_pressure_texture, vR).x;
    float T = texture2D(u_pressure_texture, vT).x;
    float B = texture2D(u_pressure_texture, vB).x;
    vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0., 1.);
}`;

const FRAG_SPLAT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;
uniform sampler2D u_text_texture;

void main () {
    vec2 p = vUv - u_point.xy;
    p.x *= u_ratio;
    vec3 splat = pow(2., -dot(p, p) / u_point_size) * u_point_value;
    float text = texture2D(u_text_texture, vec2(vUv.x, 1. - vUv.y)).r;
    splat *= (.7 + .2 * text);
    vec3 base = texture2D(u_input_texture, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.);
}`;

// 輸出：反色（1-C）呈白底墨痕；alpha = 墨量 → 無墨處透明，透出底層光場
const FRAG_OUTPUT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_output_texture;

void main () {
    vec3 C = texture2D(u_output_texture, vUv).rgb;
    float ink = clamp(max(max(C.r, C.g), C.b), 0., 1.);
    gl_FragColor = vec4(clamp(vec3(1.) - C, 0., 1.), ink);
}`;

type FBO = {
	fbo: WebGLFramebuffer;
	width: number;
	height: number;
	attach(id: number): number;
};

type DoubleFBO = {
	width: number;
	height: number;
	texelSizeX: number;
	texelSizeY: number;
	read(): FBO;
	write(): FBO;
	swap(): void;
};

export function initFluidTitle(root: HTMLElement) {
	const canvasEl = root.querySelector<HTMLCanvasElement>('[data-fluid-canvas]');
	const fallback = root.querySelector<HTMLElement>('.ft-fallback');
	if (!canvasEl || !fallback) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	// 游標事件綁在整個 hero 區（畫布鋪滿 hero，pointer-events 為 none）
	const heroEl = (root.closest('.hero-section') as HTMLElement) ?? root;
	const text = root.dataset.text || 'SCINTILLA.';
	const metaText = root.dataset.meta || '';
	// 染料色：品牌洋紅相鄰的亮品紅。r 通道取 1（同原 demo）——
	// splat 注入 1-color 時紅通道為 0，積墨飽和後停在該色系（趨紅）而非發黑
	const dye = { r: 1.0, g: 0.0, b: 0.49 };

	const textureEl = document.createElement('canvas');
	const textureCtx = textureEl.getContext('2d');

	let gl: WebGLRenderingContext | null = null;
	try {
		gl = canvasEl.getContext('webgl', { alpha: true, premultipliedAlpha: false });
	} catch {
		return;
	}
	if (!gl || !textureCtx) return;
	if (!gl.getExtension('OES_texture_float')) return; // 浮點紋理不可用 → 保留 DOM 黑字

	const GL = gl;

	const compile = (source: string, type: number) => {
		const shader = GL.createShader(type)!;
		GL.shaderSource(shader, source);
		GL.compileShader(shader);
		if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
			throw new Error(GL.getShaderInfoLog(shader) ?? 'shader compile failed');
		}
		return shader;
	};

	type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> };

	let vertexShader: WebGLShader;
	const createProgram = (fragSource: string): Program => {
		const program = GL.createProgram()!;
		GL.attachShader(program, vertexShader);
		GL.attachShader(program, compile(fragSource, GL.FRAGMENT_SHADER));
		GL.linkProgram(program);
		if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
			throw new Error(GL.getProgramInfoLog(program) ?? 'program link failed');
		}
		const uniforms: Record<string, WebGLUniformLocation> = {};
		const count = GL.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
		for (let i = 0; i < count; i++) {
			const name = GL.getActiveUniform(program, i)!.name;
			uniforms[name] = GL.getUniformLocation(program, name)!;
		}
		return { program, uniforms };
	};

	let splatProgram: Program;
	let divergenceProgram: Program;
	let pressureProgram: Program;
	let gradientSubtractProgram: Program;
	let advectionProgram: Program;
	let outputProgram: Program;

	try {
		vertexShader = compile(VERT, GL.VERTEX_SHADER);
		splatProgram = createProgram(FRAG_SPLAT);
		divergenceProgram = createProgram(FRAG_DIVERGENCE);
		pressureProgram = createProgram(FRAG_PRESSURE);
		gradientSubtractProgram = createProgram(FRAG_GRADIENT_SUBTRACT);
		advectionProgram = createProgram(FRAG_ADVECTION);
		outputProgram = createProgram(FRAG_OUTPUT);
	} catch {
		return;
	}

	GL.bindBuffer(GL.ARRAY_BUFFER, GL.createBuffer());
	GL.bufferData(GL.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), GL.STATIC_DRAW);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, GL.createBuffer());
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), GL.STATIC_DRAW);
	GL.vertexAttribPointer(0, 2, GL.FLOAT, false, 0, 0);
	GL.enableVertexAttribArray(0);

	// —— FBO（全部 RGBA float：WebGL1 無 RG 格式，RGB float 可渲染性無保證）——
	const createFBO = (w: number, h: number): FBO => {
		GL.activeTexture(GL.TEXTURE0);
		const texture = GL.createTexture()!;
		GL.bindTexture(GL.TEXTURE_2D, texture);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, w, h, 0, GL.RGBA, GL.FLOAT, null);
		const fbo = GL.createFramebuffer()!;
		GL.bindFramebuffer(GL.FRAMEBUFFER, fbo);
		GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
		if (GL.checkFramebufferStatus(GL.FRAMEBUFFER) !== GL.FRAMEBUFFER_COMPLETE) {
			throw new Error('float framebuffer unsupported');
		}
		GL.viewport(0, 0, w, h);
		GL.clear(GL.COLOR_BUFFER_BIT);
		return {
			fbo,
			width: w,
			height: h,
			attach(id: number) {
				GL.activeTexture(GL.TEXTURE0 + id);
				GL.bindTexture(GL.TEXTURE_2D, texture);
				return id;
			},
		};
	};

	const createDoubleFBO = (w: number, h: number): DoubleFBO => {
		let fbo1 = createFBO(w, h);
		let fbo2 = createFBO(w, h);
		return {
			width: w,
			height: h,
			texelSizeX: 1 / w,
			texelSizeY: 1 / h,
			read: () => fbo1,
			write: () => fbo2,
			swap() {
				const t = fbo1;
				fbo1 = fbo2;
				fbo2 = t;
			},
		};
	};

	// —— 文字貼圖：站點標題字體（Roboto Mono）白字黑底 + 輕微模糊軟化邊緣 ——
	const canvasTexture = GL.createTexture()!;
	GL.bindTexture(GL.TEXTURE_2D, canvasTexture);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

	// 1.5x 上限：流體本就柔霧狀，解析度差異不可見，Retina 上省 ~27% 像素量
	const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

	const updateTextCanvas = () => {
		const cs = getComputedStyle(fallback);
		const titleSize = parseFloat(cs.fontSize) * dpr;
		textureCtx.filter = 'none';
		textureCtx.fillStyle = 'black';
		textureCtx.fillRect(0, 0, textureEl.width, textureEl.height);
		textureCtx.fillStyle = '#ffffff';
		textureCtx.textAlign = 'center';

		// 主標題
		textureCtx.font = `${cs.fontWeight} ${titleSize}px ${cs.fontFamily}`;
		textureCtx.filter = `blur(${3 * dpr}px)`;
		const textBox = textureCtx.measureText(text);
		const titleBaseline = 0.5 * textureEl.height + 0.5 * textBox.actualBoundingBoxAscent;
		textureCtx.fillText(text, 0.5 * textureEl.width, titleBaseline);

		// meta 句（Residue of a thousand burnt eras）：標題下方一行小字，同屬墨水圖層
		if (metaText) {
			textureCtx.font = `500 ${Math.max(12 * dpr, titleSize * 0.085)}px ${cs.fontFamily}`;
			textureCtx.filter = `blur(${dpr}px)`; // 小字用輕模糊，保住可讀性
			textureCtx.fillText(
				metaText,
				0.5 * textureEl.width,
				titleBaseline + Math.max(30 * dpr, titleSize * 0.28)
			);
		}

		GL.activeTexture(GL.TEXTURE0);
		GL.bindTexture(GL.TEXTURE_2D, canvasTexture);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, textureEl);
	};

	// —— 狀態 ——
	let outputColor: DoubleFBO;
	let velocity: DoubleFBO;
	let divergence: FBO;
	let pressure: DoubleFBO;
	let pointerSize = 0.005;
	let isPreview = true; // 首次真實移動前沿軌跡自動巡遊
	const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false };
	let rafId = 0;
	let destroyed = false;
	let paused = false; // 離開視口 / 分頁隱藏時整套模擬停機（FBO 狀態保留，回來無縫續播）

	const initFBOs = () => {
		const w = Math.max(64, Math.floor(0.5 * heroEl.clientWidth));
		const h = Math.max(64, Math.floor(0.5 * heroEl.clientHeight));
		outputColor = createDoubleFBO(w, h);
		velocity = createDoubleFBO(w, h);
		divergence = createFBO(w, h);
		pressure = createDoubleFBO(w, h);
	};

	const resizeCanvas = () => {
		const w = heroEl.clientWidth;
		const h = heroEl.clientHeight;
		pointerSize = 4 / h;
		canvasEl.width = textureEl.width = Math.floor(w * dpr);
		canvasEl.height = textureEl.height = Math.floor(h * dpr);
		initFBOs();
		updateTextCanvas();
	};

	const blit = (target: FBO | null) => {
		if (target === null) {
			GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
			GL.bindFramebuffer(GL.FRAMEBUFFER, null);
		} else {
			GL.viewport(0, 0, target.width, target.height);
			GL.bindFramebuffer(GL.FRAMEBUFFER, target.fbo);
		}
		GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
	};

	const updatePointer = (relX: number, relY: number) => {
		if (!Number.isFinite(relX) || !Number.isFinite(relY)) return; // 防合成事件 NaN 污染流場
		const x = relX * dpr;
		const y = relY * dpr;
		pointer.moved = true;
		pointer.dx = 5 * (x - pointer.x);
		pointer.dy = 5 * (y - pointer.y);
		pointer.x = x;
		pointer.y = y;
	};

	const render = (t?: number) => {
		if (destroyed) return;
		const dt = 1 / 60;

		// 未互動時的自動巡遊（原 demo 的 Lissajous 預覽軌跡）
		if (t && isPreview) {
			updatePointer(
				(0.5 - 0.45 * Math.sin(0.003 * t - 2)) * heroEl.clientWidth,
				(0.5 + 0.1 * Math.sin(0.0025 * t) + 0.1 * Math.cos(0.002 * t)) * heroEl.clientHeight
			);
		}

		if (pointer.moved) {
			if (!isPreview) pointer.moved = false;

			// 速度場 splat
			GL.useProgram(splatProgram.program);
			GL.uniform1i(splatProgram.uniforms.u_text_texture, 0);
			GL.uniform1i(splatProgram.uniforms.u_input_texture, velocity.read().attach(1));
			GL.uniform1f(splatProgram.uniforms.u_ratio, canvasEl.width / canvasEl.height);
			GL.uniform2f(
				splatProgram.uniforms.u_point,
				pointer.x / canvasEl.width,
				1 - pointer.y / canvasEl.height
			);
			GL.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 1);
			GL.uniform1f(splatProgram.uniforms.u_point_size, pointerSize);
			blit(velocity.write());
			velocity.swap();

			// 染料場 splat（注入 1-color，輸出反色後即品牌色）
			GL.uniform1i(splatProgram.uniforms.u_input_texture, outputColor.read().attach(1));
			GL.uniform3f(splatProgram.uniforms.u_point_value, 1 - dye.r, 1 - dye.g, 1 - dye.b);
			blit(outputColor.write());
			outputColor.swap();
		}

		GL.useProgram(divergenceProgram.program);
		GL.uniform2f(divergenceProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
		GL.uniform1i(divergenceProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
		blit(divergence);

		GL.useProgram(pressureProgram.program);
		GL.uniform1i(pressureProgram.uniforms.u_text_texture, 0);
		GL.uniform2f(pressureProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
		GL.uniform1i(pressureProgram.uniforms.u_divergence_texture, divergence.attach(1));
		// 壓力迭代 10→8：主導成本項，對這種柔霧墨跡的觀感差異不可見，卻省下每幀兩趟全屏 blit
		for (let i = 0; i < 8; i++) {
			GL.uniform1i(pressureProgram.uniforms.u_pressure_texture, pressure.read().attach(2));
			blit(pressure.write());
			pressure.swap();
		}

		GL.useProgram(gradientSubtractProgram.program);
		GL.uniform2f(
			gradientSubtractProgram.uniforms.u_texel,
			velocity.texelSizeX,
			velocity.texelSizeY
		);
		GL.uniform1i(gradientSubtractProgram.uniforms.u_pressure_texture, pressure.read().attach(1));
		GL.uniform1i(gradientSubtractProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
		blit(velocity.write());
		velocity.swap();

		// 平流速度場（不受文字耗散影響）
		GL.useProgram(advectionProgram.program);
		GL.uniform1i(advectionProgram.uniforms.u_text_texture, 0);
		GL.uniform1f(advectionProgram.uniforms.u_use_text, 0);
		GL.uniform2f(advectionProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
		GL.uniform1i(advectionProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
		GL.uniform1i(advectionProgram.uniforms.u_input_texture, velocity.read().attach(1));
		GL.uniform1f(advectionProgram.uniforms.u_dt, dt);
		blit(velocity.write());
		velocity.swap();

		// 平流染料場（字內不衰減 → 積墨顯字）
		GL.uniform1f(advectionProgram.uniforms.u_use_text, 1);
		GL.uniform2f(advectionProgram.uniforms.u_texel, outputColor.texelSizeX, outputColor.texelSizeY);
		GL.uniform1i(advectionProgram.uniforms.u_input_texture, outputColor.read().attach(2));
		blit(outputColor.write());
		outputColor.swap();

		// 反色 + alpha 輸出到畫布
		GL.useProgram(outputProgram.program);
		GL.uniform1i(outputProgram.uniforms.u_output_texture, outputColor.read().attach(1));
		blit(null);

		rafId = paused ? 0 : requestAnimationFrame(render);
	};

	// —— 事件 ——
	const onMouseMove = (e: MouseEvent) => {
		isPreview = false;
		const r = heroEl.getBoundingClientRect();
		updatePointer(e.clientX - r.left, e.clientY - r.top);
	};
	const onTouchMove = (e: TouchEvent) => {
		isPreview = false;
		const r = heroEl.getBoundingClientRect();
		updatePointer(e.targetTouches[0].clientX - r.left, e.targetTouches[0].clientY - r.top);
	};
	const onResize = () => {
		try {
			resizeCanvas();
		} catch {
			destroy();
		}
	};

	// —— 視口 / 分頁可見性驅動的暫停 ——
	// 舊版 render 無條件自我排程：滾動到下方閱讀 Profile / Practice / Gallery 時，
	// 這套 WebGL 流體仍在畫面外全速運轉（每幀 8 次壓力迭代 + 多趟全屏 blit），
	// 與滾動搶佔主線程 —— 正是「卡頓」的主因。離開即停、回來即續。
	let heroInView = true;
	let pageHidden = false;
	const applyPause = () => {
		const next = pageHidden || !heroInView;
		if (next === paused) return;
		paused = next;
		if (paused) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		} else if (!destroyed && !rafId) {
			rafId = requestAnimationFrame(render);
		}
	};

	const io = new IntersectionObserver(
		([entry]) => {
			heroInView = entry.isIntersecting;
			applyPause();
		},
		{ threshold: 0 }
	);
	io.observe(heroEl);

	const onVisibility = () => {
		pageHidden = document.hidden;
		applyPause();
	};
	document.addEventListener('visibilitychange', onVisibility);

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		cancelAnimationFrame(rafId);
		io.disconnect();
		document.removeEventListener('visibilitychange', onVisibility);
		heroEl.removeEventListener('mousemove', onMouseMove);
		heroEl.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('resize', onResize);
		root.classList.remove('ready');
	}

	try {
		resizeCanvas();
	} catch {
		return; // 浮點 FBO 不可渲染 → 保留 DOM 黑字
	}

	heroEl.addEventListener('mousemove', onMouseMove);
	heroEl.addEventListener('touchmove', onTouchMove, { passive: true });
	window.addEventListener('resize', onResize);
	window.addEventListener('fluid-title:destroy', destroy, { once: true });

	root.classList.add('ready');
	rafId = requestAnimationFrame(render);
}

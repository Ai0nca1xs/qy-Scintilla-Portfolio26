// 文字載入動效（兩式）：
// ① Scroll Text Motion（data-text-motion）：逐詞拆分，滾動進度連續驅動（scrub）——
//    每個詞依自身視口位置由「下沉 + 微傾 + 失焦」滑向就位，上下滾動皆即時跟隨。
// ② Type Shuffle · effect3（data-type-shuffle）：逐字拆分，進入視口後每字經歷
//    數輪隨機字符翻牌再落定，左→右 stagger，呈「顯影 / 解碼」的載入感。
// 兩式皆保留原始文本於無障礙樹（aria-label），減弱動效時完全跳過。

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- *
 * ① Scroll Text Motion：逐詞 scrub
 * ---------------------------------------------------------------- */

// 遞歸走訪文本節點，把每個詞包成 span（保留 <strong>/<em> 等內聯標籤）
function wrapWords(node: Node, wordClass: string): HTMLElement[] {
	const words: HTMLElement[] = [];
	const walk = (n: Node) => {
		if (n.nodeType === Node.TEXT_NODE) {
			const text = n.textContent ?? '';
			if (!text.trim()) return;
			const frag = document.createDocumentFragment();
			const parts = text.split(/(\s+)/);
			for (const part of parts) {
				if (!part) continue;
				if (/^\s+$/.test(part)) {
					frag.appendChild(document.createTextNode(part));
				} else {
					const span = document.createElement('span');
					span.className = wordClass;
					span.textContent = part;
					frag.appendChild(span);
					words.push(span);
				}
			}
			n.parentNode?.replaceChild(frag, n);
		} else if (n.nodeType === Node.ELEMENT_NODE) {
			Array.from(n.childNodes).forEach(walk);
		}
	};
	walk(node);
	return words;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function initTextMotion(root: ParentNode = document) {
	if (reducedMotion()) return;
	const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-text-motion]:not([data-tm-ready])'));
	if (!targets.length) return;

	type Entry = { words: HTMLElement[] };
	const entries: Entry[] = [];

	for (const el of targets) {
		el.setAttribute('data-tm-ready', '');
		el.setAttribute('aria-label', el.textContent?.trim() ?? '');
		const words = wrapWords(el, 'tm-word');
		words.forEach((w) => w.setAttribute('aria-hidden', 'true'));
		entries.push({ words });
	}

	let rafId = 0;
	const update = () => {
		rafId = 0;
		const vh = window.innerHeight;
		for (const { words } of entries) {
			for (const w of words) {
				const r = w.getBoundingClientRect();
				if (r.bottom < -100 || r.top > vh + 100) continue;
				// 詞的顯現進度：進入視口下緣 88% 處開始，走過 38% 視口高度完成
				const p = clamp01((vh * 0.88 - r.top) / (vh * 0.38));
				w.style.opacity = (0.1 + 0.9 * p).toFixed(3);
				w.style.transform =
					p >= 1
						? 'none'
						: `translateY(${((1 - p) * 0.55).toFixed(3)}em) rotate(${((1 - p) * 3).toFixed(2)}deg)`;
				w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * 5).toFixed(2)}px)`;
			}
		}
	};
	const onScroll = () => {
		if (!rafId) rafId = requestAnimationFrame(update);
	};

	update();
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
	document.addEventListener(
		'astro:before-swap',
		() => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		},
		{ once: true }
	);
}

/* ---------------------------------------------------------------- *
 * ② Type Shuffle · effect3：逐字隨機翻牌解碼
 * ---------------------------------------------------------------- */

const GLYPHS = '!<>-_\\/[]{}—=+*^?#$%&@0123456789abcdefghijklmnopqrstuvwxyz';
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function shuffleElement(el: HTMLElement) {
	const original = el.textContent ?? '';
	el.setAttribute('aria-label', original.trim());

	// 逐字包 span（空白原樣保留，不參與翻牌）
	el.textContent = '';
	const holder = document.createElement('span');
	holder.setAttribute('aria-hidden', 'true');
	type Cell = { span: HTMLElement; final: string; start: number; flips: number };
	const cells: Cell[] = [];
	let idx = 0;
	for (const ch of original) {
		if (/\s/.test(ch)) {
			holder.appendChild(document.createTextNode(ch));
			continue;
		}
		const span = document.createElement('span');
		span.textContent = ch;
		span.style.opacity = '0';
		holder.appendChild(span);
		// effect3 節奏：左→右 stagger，每字翻 2–4 輪隨機字符後落定
		cells.push({ span, final: ch, start: idx * 16, flips: 2 + Math.floor(Math.random() * 3) });
		idx++;
	}
	el.appendChild(holder);

	const FLIP_MS = 44;
	const t0 = performance.now();
	let rafId = 0;
	const frame = (now: number) => {
		const elapsed = now - t0;
		let pending = false;
		for (const c of cells) {
			const local = elapsed - c.start;
			if (local < 0) {
				pending = true;
				continue;
			}
			const step = Math.floor(local / FLIP_MS);
			if (step < c.flips) {
				c.span.style.opacity = '1';
				c.span.style.color = 'var(--color-ink-soft)';
				c.span.textContent = randGlyph();
				pending = true;
			} else if (c.span.textContent !== c.final || c.span.style.color) {
				c.span.textContent = c.final;
				c.span.style.opacity = '1';
				c.span.style.color = '';
			}
		}
		if (pending) rafId = requestAnimationFrame(frame);
	};
	rafId = requestAnimationFrame(frame);
	document.addEventListener('astro:before-swap', () => cancelAnimationFrame(rafId), { once: true });
}

export function initTypeShuffle(root: ParentNode = document) {
	const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-type-shuffle]:not([data-ts-ready])'));
	if (!targets.length) return;
	targets.forEach((el) => el.setAttribute('data-ts-ready', ''));
	if (reducedMotion() || !('IntersectionObserver' in window)) return;

	const observer = new IntersectionObserver(
		(obsEntries) => {
			for (const entry of obsEntries) {
				if (!entry.isIntersecting) continue;
				observer.unobserve(entry.target);
				shuffleElement(entry.target as HTMLElement);
			}
		},
		{ threshold: 0.25 }
	);
	targets.forEach((el) => observer.observe(el));
	document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
}

/**
 * 沉澱式入場（data-settle）：元素初始懸浮微失焦，進入視口後緩慢「落定」——
 * 模擬物質冷卻、沉澱的時間性（非線性瞬間跳轉）。動畫本體在 global.css，
 * 這裡只負責：標記 JS 就緒（html.settle-ready，腳本失效時內容照常可見）＋
 * IntersectionObserver 觸發 .settled。減弱動效時不啟用（CSS 同步豁免）。
 */
export function initSettle(root: ParentNode = document) {
	const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-settle]:not(.settled)'));
	if (!targets.length) return;
	if (reducedMotion() || !('IntersectionObserver' in window)) return;

	document.documentElement.classList.add('settle-ready');

	const observer = new IntersectionObserver(
		(obsEntries) => {
			for (const entry of obsEntries) {
				if (!entry.isIntersecting) continue;
				observer.unobserve(entry.target);
				entry.target.classList.add('settled');
			}
		},
		{ threshold: 0.12 }
	);
	targets.forEach((el) => observer.observe(el));
	document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
}

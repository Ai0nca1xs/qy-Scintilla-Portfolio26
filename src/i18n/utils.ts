import { dict, defaultLang, type Lang, type Dict } from './ui';

// GitHub Pages 專案站點會部署在子路徑下（例如 /Scintilla/），
// 所有站內連結都必須經過 withBase() 加上這個前綴，否則部署後會 404。
const rawBase = import.meta.env.BASE_URL;
export const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export function withBase(path: string): string {
	return `${base}${path}`;
}

function stripBase(pathname: string): string {
	return base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
}

export function getLangFromUrl(url: URL): Lang {
	const [, first] = stripBase(url.pathname).split('/');
	return first?.toUpperCase() === 'FR' ? 'FR' : defaultLang;
}

export function useTranslations(lang: Lang): Dict {
	return dict[lang];
}

/** 生成帶語言前綴的站內連結，例如 localizePath('EN', '/project') */
export function localizePath(lang: Lang, path: string): string {
	return withBase(`/${lang}${path}`);
}

/** 保持當前頁面不變、僅切換語言的 URL */
export function getLangSwitchUrl(url: URL, target: Lang): string {
	const rest = stripBase(url.pathname).replace(/^\/(EN|FR)(?=\/|$)/i, '');
	return withBase(`/${target}${rest || '/'}`);
}

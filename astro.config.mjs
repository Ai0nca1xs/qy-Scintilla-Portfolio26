// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// GitHub Pages 專案站點：部署在 https://ai0nca1xs.github.io/Scintilla/
	// base 是子路徑前綴（= 倉庫名），站內連結需透過 src/i18n/utils.ts 的 withBase() 生成。
	// ⚠ 若再次改倉庫名：同步改這裡的 base 與 PrintBook.astro 的 SITE_URL
	site: 'https://ai0nca1xs.github.io',
	base: '/Scintilla',
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 「標本卡」數據結構：每件作品一個 Markdown 文件，按語言分資料夾存放
// （src/content/projects/en/*.md 與 src/content/projects/fr/*.md，同名 slug 互為翻譯）。
// frontmatter 承載卡片的中繼資料，Markdown 正文承載詳情頁的完整敘述。
const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			// 分類學編碼，例如 INS-02（分類代碼 + 類內時間序號）
			code: z.string(),
			title: z.string(),
			// 卡片上的簡短概念說明（1-2 句）
			summary: z.string(),
			// 年份以字符串存儲，支持 '2019–2024' 這類跨度
			year: z.string(),
			// GRA 平面編輯 / SCE 場景世界觀 / INS 裝置互動 / PRD 物件產品 / PHO 攝影
			category: z.enum(['GRA', 'SCE', 'INS', 'PRD', 'PHO']),
			tags: z.array(z.string()),
			medium: z.string().optional(),
			materials: z.string().optional(),
			dimensions: z.string().optional(),
			exhibitions: z.array(z.string()).optional(),
			status: z.enum(['completed', 'in-progress']).default('completed'),
			// featured 作品出現在首頁精選；order 控制排序（小者在前）
			featured: z.boolean().default(false),
			order: z.number().default(99),
			cover: image().optional(),
			// 可選：覆蓋檔案庫大圖板的底色（預設用分類色），如 KÉNOSE 用墨黑
			tone: z.string().optional(),
		}),
});

export const collections = { projects };

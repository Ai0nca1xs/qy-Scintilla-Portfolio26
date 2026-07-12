// Gallery 磚清單（畫布與打印成冊頁共用）。
// 新增磚：照抄一行改內容；x/y/w/h 是磚在 1500×1080 畫布單元裡的位置與大小，
// 注意與鄰磚保持間距（磚下方還有 4 行說明文字，留 ~80px 空隙）。
// 磚面圖片：把 GAL-XXX.jpg 放進 src/assets/gallery/（多圖：GAL-XXX-02-圖注.jpg）。

export type GalleryTile = {
	code: string;
	title: string;
	matiere: string; // 尺寸和材質行
	desc: string; // 創作簡介行
	date: string; // 創作年份行
	tone: string;
	ink?: string;
	x: number;
	y: number;
	w: number;
	h: number;
	quote?: string;
};

export const galleryTiles: GalleryTile[] = [
	{ code: 'GAL-001', title: 'Simulacre', matiere: 'Collage — fragments de magazines', date: '2020–2021', tone: 'var(--color-magenta)', x: 60, y: 90, w: 300, h: 390, desc: 'Collages émotionnels reconstruits — retenir ce qui s’efface.' },
	{ code: 'GAL-002', title: 'Rythme', matiere: 'Laser, haut-parleur, fumée', date: '2019–2020', tone: '#0b0c0e', x: 440, y: 40, w: 260, h: 260, desc: 'Un faisceau laser réfracté par les vibrations sonores.' },
	{ code: 'GAL-003', title: 'XX : XX', matiere: 'Lumière colorée, objets', date: '2020', tone: 'var(--color-orange)', x: 790, y: 130, w: 220, h: 280, desc: 'Étude d’illumination : superpositions sous divers angles.' },
	{ code: 'GAL-004', title: 'La rumeur', matiere: 'Photographie, enregistrements', date: '2026', tone: 'var(--color-slate)', x: 1100, y: 70, w: 320, h: 220, desc: 'Échange de photographies et de sons entre camarades.' },
	{
		code: 'GAL-005',
		title: 'Écrits',
		matiere: 'Poésie, textes courts',
		date: '—',
		tone: '#1a1a1a',
		x: 120, y: 600, w: 380, h: 240,
		quote: 'Le bonheur est comme l’eau, il coule, s’évapore, aucune goutte ne persiste pour toujours.',
		desc: 'Un journal de la pensée qui accompagne les projets.',
	},
	{ code: 'GAL-006', title: 'Photographie', matiere: 'Numérique, argentique', date: '2019–2026', tone: 'var(--color-slate)', x: 590, y: 420, w: 280, h: 350, desc: 'Errances quotidiennes, la lumière comme carnet visuel.' },
	{ code: 'GAL-007', title: 'Audio', matiere: 'Field recordings', date: '—', tone: 'var(--color-yellow)', ink: '#1a1a1a', x: 950, y: 510, w: 240, h: 160, desc: 'Enregistrements de terrain et partages sonores.' },
	{ code: 'GAL-008', title: 'Noctiluca', matiere: 'Métal, peau translucide', date: 'En cours', tone: 'var(--color-blue)', x: 1250, y: 400, w: 260, h: 210, desc: 'Lampe portable inspirée de la méduse.' },
	{ code: 'GAL-009', title: 'Poèmes', matiere: 'Texte', date: '—', tone: 'var(--color-magenta)', x: 100, y: 930, w: 210, h: 140, desc: 'Fragments poétiques.' },
	{ code: 'GAL-010', title: '⌮', matiere: 'Signe, identité', date: '2026', tone: '#fdfdfe', ink: '#1a1a1a', x: 720, y: 870, w: 160, h: 160, desc: 'Le signe qui donne son nom à cet espace.' },
	{ code: 'GAL-011', title: 'KÉNOSE', matiere: 'Croquis, notes d’univers', date: '2026–2027', tone: '#0b0c0e', x: 1010, y: 760, w: 300, h: 190, desc: 'Univers en construction — projet de diplôme.' },
];

// Scintilla 雙語詞典：所有介面文字集中在這裡維護。
// 設計約定：分類學編碼與 metadata（等寬字體的機器風格文字）保持英文，不翻譯。

export type Lang = 'EN' | 'FR';

export const defaultLang: Lang = 'EN';

export const languages: Record<Lang, string> = {
	EN: 'English',
	FR: 'Français',
};

export interface Dict {
	site: {
		title: string;
		tagline: string;
		description: string;
	};
	nav: {
		home: string;
		project: string;
		gallery: string;
		contact: string;
	};
	home: {
		pageTitle: string;
		heroMeta: string;
		concept: string;
		introHtml: string;
		cvEducation: string[];
		cvExperience: string[];
		cvMeta: string[];
		practiceLabel: string;
		practiceIntroHtml: string;
		domains: {
			title: string;
			blurb: string;
			cats: ('GRA' | 'SCE' | 'INS' | 'PRD' | 'PHO')[];
			lens: 'GRA' | 'SCE' | 'INS' | 'PRD' | 'PHO';
		}[];
		galleryLabel: string;
		galleryText: string;
		galleryCta: string;
	};
	project: {
		pageTitle: string;
		heading: string;
		filterAll: string;
		statusInProgress: string;
		back: string;
	};
	categories: Record<'GRA' | 'SCE' | 'INS' | 'PRD' | 'PHO', string>;
	// 精煉版分類標籤（篩選欄 / 懸停縮略圖用）
	categoriesShort: Record<'GRA' | 'SCE' | 'INS' | 'PRD' | 'PHO', string>;
	gallery: {
		pageTitle: string;
		heading: string;
	};
	contact: {
		pageTitle: string;
		heading: string;
		email: string;
		blurbHtml: string;
		role: string;
		location: string;
		cvButton: string;
	};
}

export const dict: Record<Lang, Dict> = {
	EN: {
		site: {
			title: 'Scintilla',
			tagline: "Qianyu's digital space",
			description:
				'Scintilla — the digital space and design archive of Qianyu, multidisciplinary designer.',
		},
		nav: {
			home: 'Home',
			project: 'Projects',
			gallery: 'Gallery',
			contact: 'Contact',
		},
		home: {
			pageTitle: "Scintilla — Qianyu's digital space",
			heroMeta: 'Residue of a thousand burnt eras',
			concept: 'A physical translation of poetics through light, space, and material.',
			introHtml:
				'I am <span class="hover-bold">Qianyu</span><span class="hover-bold">, a multidisciplinary designer</span> exploring the boundaries between <strong>Visual Identity</strong>, <strong>Spatial Narrative</strong>, and <strong>Interactive Experience</strong>. My work seeks to capture the <em>scintilla</em>—the subtle, fleeting sparks of conceptual fusion—and solidify them through rigorous design processes.',
			cvEducation: [
				'2025— · EBABX — École supérieure des beaux-arts de Bordeaux',
				'2024–25 · Université de Reims — CIEF, French B2',
				'2017–21 · China Academy of Art — BA Art & Technology, GPA 3.88/5',
			],
			cvExperience: [
				'2021–22 · Reel Light Environment — colour designer, architectural lighting',
				'2021 · 2022 · Exhibited at Hangzhou Art Museum & Ningbo Art Museum',
				'2019–20 · Nouveaux Pousseurs — inclusive design for autistic children',
				'2019 · Hangzhou Asian Games — campus light installations',
			],
			cvMeta: ['Based in Bordeaux, FR', 'Open to internships', 'EN · FR · ZH · JP'],
			practiceLabel: 'Practice | What I Do',
			practiceIntroHtml:
				'I design with <strong>colour</strong> as a method — across print, light, object and space. Each domain below is one wavelength of the same spectrum.',
			domains: [
				{
					title: 'Graphic & Image',
					blurb:
						'Editorial systems, typography and photography — colour used as a signature, print as a site of memory.',
					cats: ['GRA', 'PHO'],
					lens: 'GRA',
				},
				{
					title: 'Installation & Object',
					blurb:
						'Light, colour and matter in dialogue — interactive installations and objects that probe sensory perception.',
					cats: ['INS', 'PRD'],
					lens: 'INS',
				},
				{
					title: 'Scenography & Worldbuilding',
					blurb:
						'Narrative spaces and speculative universes — from trend scenography to worldbuilding as a design practice.',
					cats: ['SCE'],
					lens: 'SCE',
				},
			],
			galleryLabel: 'Personal Aesthetic',
			galleryText: 'Audio, Painting, Photography, Writing, Music Sharing.',
			galleryCta: 'ENTER DIGITAL GALLERY ↗',
		},
		project: {
			pageTitle: 'Projects — Scintilla',
			heading: 'PROJECTS',
			filterAll: 'All',
			statusInProgress: 'In progress',
			back: '← Back to archive',
		},
		categories: {
			GRA: 'Graphic & Editorial',
			SCE: 'Scenography & Worldbuilding',
			INS: 'Installation & Interaction',
			PRD: 'Object & Product',
			PHO: 'Photography',
		},
		categoriesShort: {
			GRA: 'Graphic',
			SCE: 'Scenography',
			INS: 'Installation',
			PRD: 'Object',
			PHO: 'Photography',
		},
		gallery: {
			pageTitle: 'Gallery — Scintilla',
			heading: 'AESTHETIC GALLERY',
		},
		contact: {
			pageTitle: 'Contact — Scintilla',
			heading: 'INITIATE TRANSMISSION',
			email: 'felicettec341a@gmail.com',
			blurbHtml:
				'Based in Bordeaux, France.<br />Open to internships, freelance opportunities and collaborations.',
			role: 'Multidisciplinary designer — colour, light & narrative',
			location: 'Bordeaux, France',
			cvButton: 'Download CV',
		},
	},
	FR: {
		site: {
			title: 'Scintilla',
			tagline: "L'espace numérique de Qianyu",
			description:
				"Scintilla — l'espace numérique et l'archive de design de Qianyu, designer pluridisciplinaire.",
		},
		nav: {
			home: 'Accueil',
			project: 'Projets',
			gallery: 'Galerie',
			contact: 'Contact',
		},
		home: {
			pageTitle: "Scintilla — l'espace numérique de Qianyu",
			heroMeta: 'Residue of a thousand burnt eras',
			concept: "Une traduction physique de la poétique, par la lumière, l'espace et la matière.",
			introHtml:
				"Je suis <span class='hover-bold'>Qianyu</span><span class='hover-bold'>, designer pluridisciplinaire</span> explorant les frontières entre <strong>identité visuelle</strong>, <strong>narration spatiale</strong> et <strong>expérience interactive</strong>. Mon travail cherche à capter la <em>scintilla</em> — ces étincelles subtiles et fugaces où les concepts fusionnent — et à les fixer par un processus de design rigoureux.",
			cvEducation: [
				'2025— · EBABX — École supérieure des beaux-arts de Bordeaux',
				'2024–25 · Université de Reims — CIEF, français B2',
				'2017–21 · Académie des Beaux-Arts de Chine — Licence Art & Technologie, GPA 3,88/5',
			],
			cvExperience: [
				'2021–22 · Reel Light Environment — designer couleurs, éclairage architectural',
				'2021 · 2022 · Expositions aux Musées d’Art de Hangzhou et de Ningbo',
				'2019–20 · Nouveaux Pousseurs — design inclusif pour enfants autistes',
				'2019 · Jeux Asiatiques de Hangzhou — installations lumineuses de campus',
			],
			cvMeta: ['Basée à Bordeaux, FR', 'Ouverte aux stages', 'EN · FR · ZH · JP'],
			practiceLabel: 'Pratique | Ce que je fais',
			practiceIntroHtml:
				'Je conçois avec la <strong>couleur</strong> comme méthode — entre imprimé, lumière, objet et espace. Chaque domaine ci-dessous est une longueur d’onde d’un même spectre.',
			domains: [
				{
					title: 'Graphisme & Image',
					blurb:
						'Systèmes éditoriaux, typographie et photographie — la couleur comme signature, l’imprimé comme lieu de mémoire.',
					cats: ['GRA', 'PHO'],
					lens: 'GRA',
				},
				{
					title: 'Installation & Objet',
					blurb:
						'Lumière, couleur et matière en dialogue — installations interactives et objets qui sondent la perception sensorielle.',
					cats: ['INS', 'PRD'],
					lens: 'INS',
				},
				{
					title: 'Scénographie & Univers',
					blurb:
						'Espaces narratifs et univers spéculatifs — de la scénographie de tendances à la construction de mondes.',
					cats: ['SCE'],
					lens: 'SCE',
				},
			],
			galleryLabel: 'Univers personnel',
			galleryText: 'Audio, peinture, photographie, écriture, partages musicaux.',
			galleryCta: 'ENTRER DANS LA GALERIE ↗',
		},
		project: {
			pageTitle: 'Projets — Scintilla',
			heading: 'PROJETS',
			filterAll: 'Tous',
			statusInProgress: 'En cours',
			back: '← Retour à l’archive',
		},
		categories: {
			GRA: 'Graphique & Éditorial',
			SCE: 'Scénographie & Univers',
			INS: 'Installation & Interaction',
			PRD: 'Objet & Produit',
			PHO: 'Photographie',
		},
		categoriesShort: {
			GRA: 'Graphique',
			SCE: 'Scénographie',
			INS: 'Installation',
			PRD: 'Objet',
			PHO: 'Photographie',
		},
		gallery: {
			pageTitle: 'Galerie — Scintilla',
			heading: 'GALERIE PERSONNELLE',
		},
		contact: {
			pageTitle: 'Contact — Scintilla',
			heading: 'INITIATE TRANSMISSION',
			email: 'felicettec341a@gmail.com',
			blurbHtml:
				'Bordeaux, France.<br />Disponible pour stages, missions freelance et collaborations.',
			role: 'Designer pluridisciplinaire — couleur, lumière & récit',
			location: 'Bordeaux, France',
			cvButton: 'Télécharger le CV',
		},
	},
};

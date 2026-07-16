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
		cvSkills: string[];
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
				'Scintilla — the portfolio and digital space of Qianyu He, designer and artist. One concept carried from research to installation, across graphic, space, object, sound, image and writing.',
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
			concept: 'One concept, carried from research to matter.',
			introHtml:
				'I am <span class="hover-bold">Qianyu&nbsp;He</span><span class="hover-bold">, a designer and artist</span> who works by <strong>conceptual coherence</strong>: one idea governs the whole process, carried from cultural research and <strong>narrative</strong> to visual form and <em>physical installation</em>. My range — graphic, space, object, sound, image, <strong>writing</strong> — is not scattered skills but a single method holding many media together.',
			cvEducation: [
				'2025— · EBABX, Bordeaux — Design: graphic & editorial, space, scenography & object',
				'2017–21 · China Academy of Art (CAA), Hangzhou — BA, Colour Design (Synthetic Design)',
			],
			cvExperience: [
				'2026 · AQUABAL — Capc musée d’art contemporain de Bordeaux · wearable «jellyfish», with Lucas Tortolano',
				'2022–24 · Independent — light installations & architectural lighting',
				'2021–22 · Reel Light Environment — colour designer',
				'2019–20 · Colour & cognition — visual programme for autistic children',
				'2019 · Hangzhou Asian Games — campus light installations',
			],
			cvSkills: [
				'Visual communication · Narrative · Conceptual coherence · Cross-media production',
				'Colour & cognition · Light & sensory installation · Editorial & narrative design',
				'Generative AI — image, sound, creative code (vibe coding), explored as research',
			],
			cvMeta: ['Based in Bordeaux, FR', 'Open to internships & freelance', 'ZH · FR · EN · JP · KO'],
			practiceLabel: 'Practice | Method & Range',
			practiceIntroHtml:
				'Every project begins with a <strong>concept</strong> and is carried end to end. The domains below are not separate skills but one <strong>method</strong> — narrative and conceptual unity — expressed in different media.',
			domains: [
				{
					title: 'Graphic & Image',
					blurb:
						'Editorial and image systems where a narrative sets the rules — typography, colour and photography as carriers of memory and meaning.',
					cats: ['GRA', 'PHO'],
					lens: 'GRA',
				},
				{
					title: 'Installation & Object',
					blurb:
						'Concepts made physical — light, colour and matter staged as installations and objects that act on perception and cognition.',
					cats: ['INS', 'PRD'],
					lens: 'INS',
				},
				{
					title: 'Scenography & Worldbuilding',
					blurb:
						'Narrative spaces and constructed worlds — scenography, worldbuilding and writing as one speculative practice.',
					cats: ['SCE'],
					lens: 'SCE',
				},
			],
			galleryLabel: 'Personal Universe',
			galleryText: 'A personal universe — image, sound, writing and worldbuilding, gathered as one sensibility.',
			galleryCta: 'ENTER THE UNIVERSE ↗',
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
			role: 'Designer & artist — one concept, from research to matter',
			location: 'Bordeaux, France',
			cvButton: 'Download CV',
		},
	},
	FR: {
		site: {
			title: 'Scintilla',
			tagline: "L'espace numérique de Qianyu",
			description:
				"Scintilla — le portfolio et l'espace numérique de Qianyu He, designer et artiste. Un concept porté de la recherche à l'installation, à travers graphisme, espace, objet, son, image et écriture.",
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
			concept: 'Un seul concept, porté de la recherche à la matière.',
			introHtml:
				"Je suis <span class='hover-bold'>Qianyu&nbsp;He</span><span class='hover-bold'>, designer et artiste</span>. Je travaille par <strong>cohérence conceptuelle</strong> : une même idée gouverne tout le processus, portée de la recherche culturelle et du <strong>récit</strong> jusqu'à la forme visuelle et l'<em>installation</em>. Mon registre — graphisme, espace, objet, son, image, <strong>écriture</strong> — n'est pas un éparpillement de compétences mais une seule méthode qui tient ensemble plusieurs médias.",
			cvEducation: [
				'2025— · EBABX, Bordeaux — Design : graphique & édition, espace, scénographie & objet',
				'2017–21 · Académie des Beaux-Arts de Chine (CAA), Hangzhou — Licence, Design de couleur (design synthétique)',
			],
			cvExperience: [
				'2026 · AQUABAL — Capc musée d’art contemporain de Bordeaux · dispositif «méduse», avec Lucas Tortolano',
				'2022–24 · Indépendante — installations lumineuses & éclairage architectural',
				'2021–22 · Reel Light Environment — designer couleur',
				'2019–20 · Couleur & cognition — programme visuel pour enfants autistes',
				'2019 · Jeux Asiatiques de Hangzhou — installations lumineuses de campus',
			],
			cvSkills: [
				'Communication visuelle · Récit · Cohérence conceptuelle · Production cross-média',
				'Couleur & cognition · Installation lumineuse & sensorielle · Design éditorial & narratif',
				'IA générative — image, son, code créatif (vibe coding), explorée comme recherche',
			],
			cvMeta: ['Basée à Bordeaux, FR', 'Ouverte aux stages & freelance', 'ZH · FR · EN · JP · KO'],
			practiceLabel: 'Pratique | Méthode & registre',
			practiceIntroHtml:
				"Chaque projet part d'un <strong>concept</strong> et se déploie de bout en bout. Les domaines ci-dessous ne sont pas des compétences séparées mais une même <strong>méthode</strong> — unité narrative et conceptuelle — déclinée en plusieurs médias.",
			domains: [
				{
					title: 'Graphisme & Image',
					blurb:
						'Systèmes éditoriaux et d’image où le récit fixe les règles — typographie, couleur et photographie comme porteurs de mémoire et de sens.',
					cats: ['GRA', 'PHO'],
					lens: 'GRA',
				},
				{
					title: 'Installation & Objet',
					blurb:
						'Le concept rendu physique — lumière, couleur et matière mises en scène en installations et objets qui agissent sur la perception et la cognition.',
					cats: ['INS', 'PRD'],
					lens: 'INS',
				},
				{
					title: 'Scénographie & Univers',
					blurb:
						'Espaces narratifs et mondes construits — scénographie, worldbuilding et écriture comme une seule pratique spéculative.',
					cats: ['SCE'],
					lens: 'SCE',
				},
			],
			galleryLabel: 'Univers personnel',
			galleryText: 'Un univers personnel — image, son, écriture et worldbuilding, réunis en une seule sensibilité.',
			galleryCta: "ENTRER DANS L'UNIVERS ↗",
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
			role: 'Designer & artiste — un concept, de la recherche à la matière',
			location: 'Bordeaux, France',
			cvButton: 'Télécharger le CV',
		},
	},
};

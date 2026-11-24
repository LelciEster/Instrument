// Configurator state shared by the 3D scene and the UI.
export const varnishes = [
	{ id: 'cremona', name: 'Cremona Bernstein', tint: [1, 1, 1], swatch: '#b4581d' },
	{ id: 'rosso', name: 'Rosso Veneziano', tint: [1.05, 0.5, 0.42], swatch: '#8f2414' },
	{ id: 'miele', name: 'Goldhonig', tint: [1.5, 1.35, 0.75], swatch: '#d4892c' },
	{ id: 'antico', name: 'Antik Braun', tint: [0.62, 0.5, 0.42], swatch: '#5e2f17' },
	{ id: 'nero', name: 'Nero Lucido', tint: [0.16, 0.13, 0.13], swatch: '#1a1311' },
	{ id: 'blond', name: 'Ahorn Blond', tint: [2.1, 2.0, 1.55], swatch: '#e2b77a' }
];
export const fittings = [
	{ id: 'ebony', name: 'Ebenholz', color: [0.011, 0.009, 0.008], swatch: '#0d0b0a' },
	{ id: 'rose', name: 'Palisander', color: [0.075, 0.022, 0.012], swatch: '#4a1d10' },
	{ id: 'box', name: 'Buchsbaum', color: [0.52, 0.36, 0.14], swatch: '#c9a35e' }
];
export const strings = [
	{ id: 'steel', name: 'Stahl', color: [0.8, 0.78, 0.74], metal: 1, rough: 0.15 },
	{ id: 'gold', name: 'Gold', color: [1, 0.72, 0.3], metal: 1, rough: 0.18 },
	{ id: 'gut', name: 'Darm', color: [0.72, 0.55, 0.32], metal: 0, rough: 0.45 }
];
export const sizes = [
	{ id: '4/4', scale: 1 }, { id: '3/4', scale: 0.93 }, { id: '1/2', scale: 0.86 }, { id: '1/4', scale: 0.78 }
];
export const moods = [
	{ id: 'studio', name: 'Studio' },
	{ id: 'stage', name: 'Bühne' },
	{ id: 'candle', name: 'Kerze' },
	{ id: 'day', name: 'Tageslicht' }
];
export const views = [
	{ id: 'CAM_01_Hero', name: 'Gesamt' },
	{ id: 'CAM_03_Scroll', name: 'Schnecke' },
	{ id: 'CAM_04_Bridge_FHoles', name: 'Steg' },
	{ id: 'CAM_05_Bow_Frog', name: 'Frosch' },
	{ id: 'CAM_02_TopDown', name: 'Oben' },
	{ id: 'CAM_06_Low_Profile', name: 'Profil' }
];

export const cfg = $state({
	varnish: 'cremona',
	custom: '' as string, // hex from color picker, overrides preset
	gloss: 1, // 0 = satin, 1 = mirror
	fitting: 'ebony',
	strings: 'steel',
	hair: 'white' as 'white' | 'black',
	stick: 'pernambuco' as 'pernambuco' | 'carbon',
	width: 0, // morph target -1..1
	size: '4/4',
	explode: 0,
	mood: 'studio',
	autoRotate: false,
	showBow: true,
	view: '' as string, // camera preset request
	viewTick: 0
});

export function goView(id: string) {
	cfg.view = id;
	cfg.viewTick++;
}

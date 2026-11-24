import * as Tone from 'tone';

type Note = { t: number; d: number; midi: number; name: string; sA: number; sB: number };
export type Piece = { id: string; title: string; composer: string; bpm: number; notes: [string, number][] };

export const pieces: Piece[] = [
	{
		id: 'canon', title: 'Kanon in D', composer: 'J. Pachelbel', bpm: 66,
		notes: [['F#5', 2], ['E5', 2], ['D5', 2], ['C#5', 2], ['B4', 2], ['A4', 2], ['B4', 2], ['C#5', 2],
			['D5', 2], ['C#5', 2], ['B4', 2], ['A4', 2], ['G4', 2], ['F#4', 2], ['G4', 2], ['E4', 2],
			['D4', 1], ['F#4', 1], ['A4', 1], ['G4', 1], ['F#4', 1], ['D4', 1], ['F#4', 1], ['E4', 1],
			['D4', 1], ['B3', 1], ['D4', 1], ['A4', 1], ['G4', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['F#4', 4]]
	},
	{
		id: 'menuett', title: 'Menuett in G', composer: 'C. Petzold', bpm: 116,
		notes: [['D5', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['G4', 1], ['G4', 1],
			['E5', 1], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 1], ['G4', 1], ['G4', 1],
			['C5', 1], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 1], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5],
			['F#4', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['A4', 3]]
	},
	{
		id: 'freude', title: 'Ode an die Freude', composer: 'L. v. Beethoven', bpm: 96,
		notes: [['F#4', 1], ['F#4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 1], ['F#4', 1], ['E4', 1],
			['D4', 1], ['D4', 1], ['E4', 1], ['F#4', 1], ['F#4', 1.5], ['E4', 0.5], ['E4', 2],
			['F#4', 1], ['F#4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 1], ['F#4', 1], ['E4', 1],
			['D4', 1], ['D4', 1], ['E4', 1], ['F#4', 1], ['E4', 1.5], ['D4', 0.5], ['D4', 2]]
	}
];

export const KEYS: Record<string, string> = { a: 'D4', s: 'E4', d: 'F#4', f: 'G4', g: 'A4', h: 'B4', j: 'C#5', k: 'D5', l: 'E5' };

const S_MIN = 0.12, S_MAX = 0.68;
const LEAD = 0.9; // seconds for the bow to travel onto the strings

let sampler: Tone.Sampler | null = null;
let meter: Tone.Meter, wave: Tone.Waveform;
let ready: Promise<void> | null = null;

export function loadSamples(onProgress?: (p: number) => void) {
	if (ready) return ready;
	const urls: Record<string, string> = {};
	for (const n of ['G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6', 'E6', 'G6', 'A6']) urls[n] = `${n}.mp3`;
	ready = new Promise((res) => {
		const reverb = new Tone.Reverb({ decay: 3.4, preDelay: 0.02, wet: 0.32 });
		const vib = new Tone.Vibrato({ frequency: 5.4, depth: 0.06, wet: 0.7 });
		const comp = new Tone.Compressor(-18, 3);
		meter = new Tone.Meter({ normalRange: true, smoothing: 0.82 });
		wave = new Tone.Waveform(512);
		sampler = new Tone.Sampler({ urls, baseUrl: '/samples/', release: 0.9, attack: 0.04, onload: () => { onProgress?.(1); res(); } });
		sampler.chain(vib, comp, reverb, Tone.getDestination());
		reverb.connect(meter); reverb.connect(wave);
	});
	return ready;
}

export const level = () => (meter ? Math.min(1, (meter.getValue() as number) * 2.2) : 0);
export const waveform = () => (wave ? wave.getValue() : null);

const midiOf = (n: string) => Tone.Frequency(n).toMidi();
// which string a note is played on (G, D, A, E) -> bow tilt across the arched bridge
export const stringOf = (m: number) => (m < 62 ? 0 : m < 69 ? 1 : m < 76 ? 2 : 3);
const TILT = [0.13, 0.045, -0.045, -0.13];

export const player = $state({ playing: false, piece: 'canon', noteName: '', noteIndex: -1, total: 0, progress: 0, live: false });
let timeline: Note[] = [];
let endAt = 0;

function plan(p: Piece) {
	const spb = 60 / p.bpm;
	let t = 0, s = S_MIN + 0.02, dir = 1;
	timeline = p.notes.map(([name, beats]) => {
		const d = beats * spb;
		const len = Math.min(0.5, Math.max(0.09, d * 0.32));
		if (s + dir * len > S_MAX || s + dir * len < S_MIN) dir *= -1;
		const n: Note = { t, d, midi: midiOf(name), name, sA: s, sB: s + dir * len };
		s = n.sB; dir *= -1; t += d;
		return n;
	});
	endAt = t;
}

export async function play(id = player.piece) {
	await loadSamples();
	await Tone.start();
	stop(false);
	const p = pieces.find((x) => x.id === id)!;
	player.piece = id;
	plan(p);
	const tr = Tone.getTransport();
	tr.cancel(); tr.position = 0;
	timeline.forEach((n, i) => {
		tr.schedule((time) => {
			sampler!.triggerAttackRelease(n.name, n.d * 1.04, time, 0.75 + Math.random() * 0.15);
			Tone.getDraw().schedule(() => { player.noteName = n.name; player.noteIndex = i; }, time);
		}, n.t);
	});
	tr.schedule(() => Tone.getDraw().schedule(() => stop(), Tone.now() + 0.6), endAt + 0.4);
	tr.start('+' + LEAD);
	player.total = timeline.length;
	player.playing = true;
}

export function stop(release = true) {
	const tr = Tone.getTransport();
	tr.stop(); tr.cancel();
	if (release) sampler?.releaseAll();
	player.playing = false; player.noteIndex = -1; player.noteName = ''; player.progress = 0;
}

// ---------- live keyboard play ----------
let live: { midi: number; name: string; t0: number; s0: number; dir: number } | null = null;
let liveS = 0.3, liveDir = 1, lastLive = -10;
export async function keyDown(name: string) {
	await loadSamples(); await Tone.start();
	if (player.playing) stop();
	if (live) sampler!.triggerRelease(live.name);
	liveDir *= -1;
	live = { midi: midiOf(name), name, t0: performance.now() / 1000, s0: liveS, dir: liveDir };
	sampler!.triggerAttack(name, Tone.now(), 0.8);
	player.live = true; player.noteName = name;
}
export function keyUp(name: string) {
	if (live && live.name === name) { sampler?.triggerRelease(name); live = null; lastLive = performance.now() / 1000; player.noteName = ''; }
}

// ---------- bow pose for the 3D scene ----------
const ease = (x: number) => x * x * (3 - 2 * x);
export function bowPose(): { on: boolean; s: number; tilt: number } {
	const now = performance.now() / 1000;
	if (live) {
		let s = live.s0 + live.dir * (now - live.t0) * 0.32;
		while (s > S_MAX || s < S_MIN) { s = s > S_MAX ? 2 * S_MAX - s : 2 * S_MIN - s; live.dir *= -1; live.s0 = s; live.t0 = now; }
		liveS = s;
		return { on: true, s, tilt: TILT[stringOf(live.midi)] };
	}
	if (now - lastLive < 1.4) return { on: true, s: liveS, tilt: 0 };
	player.live = false;
	if (!player.playing || !timeline.length) return { on: player.playing, s: S_MIN + 0.02, tilt: TILT[stringOf(timeline[0]?.midi ?? 66)] };
	const t = Tone.getTransport().seconds;
	player.progress = Math.min(1, t / endAt);
	let i = timeline.findIndex((n) => t >= n.t && t < n.t + n.d);
	if (i < 0) i = t <= 0 ? 0 : timeline.length - 1;
	const n = timeline[i];
	const k = Math.min(1, Math.max(0, (t - n.t) / n.d));
	const s = n.sA + (n.sB - n.sA) * ease(k);
	const prev = timeline[Math.max(0, i - 1)];
	const tilt = TILT[stringOf(prev.midi)] + (TILT[stringOf(n.midi)] - TILT[stringOf(prev.midi)]) * Math.min(1, k * 6);
	return { on: true, s, tilt };
}

<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas } from '@threlte/core';
	import * as THREE from 'three';
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import Scene from '../lib/Scene.svelte';
	import Panel from '../lib/Panel.svelte';
	import Transport from '../lib/Transport.svelte';
	import { cfg, views, goView } from '../lib/config.svelte';
	import { loadSamples, keyDown, keyUp, KEYS, level } from '../lib/audio.svelte';

	let gltf: GLTF | null = $state(null);
	let pModel = $state(0), pSound = $state(0);
	let done = $state(false), gone = $state(false);
	const pct = $derived(Math.round((pModel * 0.85 + pSound * 0.15) * 100));
	const steps = ['Fichtendecke', 'Ahornboden', 'Bernsteinlack', 'Darmsaiten', 'Pernambukbogen', 'Stimmen'];

	let mx = $state(50), my = $state(40);
	let amp = $state(0);
	let canvasEl: HTMLCanvasElement | undefined;

	onMount(() => {
		new GLTFLoader().load('/violin.glb', (g) => { gltf = g; pModel = 1; }, (e) => { if (e.total) pModel = e.loaded / e.total; });
		loadSamples(() => (pSound = 1));
		let raf = 0;
		const loop = () => { amp = level(); document.documentElement.style.setProperty('--amp', amp.toFixed(3)); raf = requestAnimationFrame(loop); };
		loop();
		const down = (e: KeyboardEvent) => { const n = KEYS[e.key.toLowerCase()]; if (n && !e.repeat && !(e.target instanceof HTMLInputElement)) keyDown(n); };
		const up = (e: KeyboardEvent) => { const n = KEYS[e.key.toLowerCase()]; if (n) keyUp(n); };
		addEventListener('keydown', down); addEventListener('keyup', up);
		return () => { cancelAnimationFrame(raf); removeEventListener('keydown', down); removeEventListener('keyup', up); };
	});
	$effect(() => {
		if (pct >= 100 && gltf && !done) setTimeout(() => { done = true; setTimeout(() => (gone = true), 1600); }, 500);
	});
	$effect(() => { document.documentElement.dataset.mood = cfg.mood; });

	function screenshot() {
		const src = document.querySelector('.stage canvas') as HTMLCanvasElement;
		const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
		const x = out.getContext('2d')!;
		x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0c0a09';
		x.fillRect(0, 0, out.width, out.height); x.drawImage(src, 0, 0);
		const a = document.createElement('a'); a.download = `violino-${cfg.varnish}.png`; a.href = out.toDataURL('image/png'); a.click();
	}
</script>

<svelte:head><title>Liuteria Shkodra · Violino N°1 — 3D Konfigurator</title></svelte:head>

<svelte:window onpointermove={(e) => { mx = (e.clientX / innerWidth) * 100; my = (e.clientY / innerHeight) * 100; }} />

<div class="bg" style="--mx:{mx}%; --my:{my}%">
	<div class="word" aria-hidden="true" style="transform: translate({(mx - 50) * -0.15}px, {(my - 50) * -0.1}px)">Violino</div>
</div>

<div class="stage">
	{#if gltf}
		<Canvas
			dpr={[1, 2]}
			toneMapping={THREE.ACESFilmicToneMapping}
			createRenderer={(c) => new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true })}
		>
			<Scene {gltf} />
		</Canvas>
	{/if}
</div>

<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>

{#if done}
	<header class="top in">
		<div class="brand">
			<span class="mono">Liuteria Shkodra — Est. 2026</span>
			<h1><em>Violino</em> N°1</h1>
			<p class="mono dim">Fichte · Riegelahorn · Ebenholz · Pernambuk — 4/4 · 356 mm Korpus</p>
		</div>
		<nav class="views mono">
			{#each views as v, i}
				<button class:on={cfg.view === v.id} onclick={() => goView(v.id)}><i>{String(i + 1).padStart(2, '0')}</i>{v.name}</button>
			{/each}
		</nav>
	</header>

	<Panel onshot={screenshot} />
	<Transport />

	<div class="hint mono in">Ziehen = drehen · Scrollen = zoomen · Rechtsklick = verschieben · Tasten <b>A–L</b> = live spielen</div>
{/if}

{#if !gone}
	<div class="loader" class:out={done}>
		<div class="lmeta mono"><span>Liuteria Shkodra</span><span>3D Konfigurator</span></div>
		<div class="pct"><em>{pct}</em><small>%</small></div>
		<svg class="string" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
			<path d="M0 30 Q 250 30 500 30 T 1000 30" class="track" />
			<path d="M0 30 Q 250 {30 + 26 * (1 - pct / 100)} 500 30 T 1000 30" class="vib" style="stroke-dasharray:1000; stroke-dashoffset:{1000 - pct * 10}" />
		</svg>
		<ul class="steps mono">
			{#each steps as s, i}<li class:ok={pct >= ((i + 1) / steps.length) * 100 - 1}>{s}</li>{/each}
		</ul>
		<p class="mono dim tune">Stimmung A = 442 Hz</p>
		<div class="curtain"></div>
	</div>
{/if}

<style>
	.bg { position: fixed; inset: 0; z-index: 0; background:
		radial-gradient(900px 700px at var(--mx) var(--my), var(--glow), transparent 60%),
		radial-gradient(1400px 900px at 50% 110%, var(--floor), transparent 70%), var(--bg);
		transition: background-color 1.2s; overflow: hidden; }
	.word { position: absolute; left: -2vw; right: -2vw; top: 50%; translate: 0 -55%; text-align: center; font-family: var(--serif);
		font-style: italic; font-size: 29vw; line-height: 0.8; letter-spacing: calc(-0.04em + var(--amp) * 0.06em);
		color: transparent; -webkit-text-stroke: 1px var(--line); opacity: calc(0.55 + var(--amp) * 0.45); user-select: none; transition: -webkit-text-stroke-color 1s; }
	.stage { position: fixed; inset: 0; z-index: 1; }
	.grain { position: fixed; inset: -50%; z-index: 5; pointer-events: none; opacity: 0.09; mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		animation: grain 0.6s steps(4) infinite; }
	@keyframes grain { 0% { transform: translate(0, 0) } 25% { transform: translate(-3%, 2%) } 50% { transform: translate(2%, -3%) } 75% { transform: translate(-1%, 3%) } }
	.vignette { position: fixed; inset: 0; z-index: 4; pointer-events: none; box-shadow: inset 0 0 22vmin 4vmin var(--vig); }

	.top { position: fixed; z-index: 10; left: 0; right: 0; top: 0; padding: 28px 34px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
	.brand h1 { margin: 6px 0 4px; font-family: var(--serif); font-weight: 400; font-size: clamp(44px, 6vw, 92px); line-height: 0.85; letter-spacing: -0.02em; }
	.brand h1 em { color: var(--accent); }
	.views { display: flex; gap: 4px; pointer-events: auto; flex-wrap: wrap; justify-content: flex-end; max-width: 46vw; }
	.views button { background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 12px; font: inherit; cursor: pointer; border-radius: 999px; transition: 0.3s; }
	.views button i { font-style: normal; opacity: 0.45; margin-right: 6px; }
	.views button:hover, .views button.on { background: var(--ink); color: var(--bg); }
	.hint { position: fixed; z-index: 10; left: 34px; bottom: 26px; opacity: 0.55; max-width: 30ch; line-height: 1.6; }
	.hint b { color: var(--accent); font-weight: 500; }
	.in { animation: rise 1.2s cubic-bezier(0.2, 0.8, 0.1, 1) both 0.4s; }
	@keyframes rise { from { opacity: 0; transform: translateY(24px); filter: blur(6px) } }

	.loader { position: fixed; inset: 0; z-index: 50; background: #0a0807; color: #efe6da; display: grid; place-items: center; align-content: center; gap: 28px; }
	.lmeta { position: absolute; top: 28px; left: 34px; right: 34px; display: flex; justify-content: space-between; opacity: 0.6; }
	.pct { font-family: var(--serif); font-size: clamp(110px, 20vw, 260px); line-height: 0.8; display: flex; align-items: flex-start; }
	.pct em { font-variant-numeric: tabular-nums; }
	.pct small { font-size: 0.25em; margin-top: 0.4em; opacity: 0.5; font-style: italic; }
	.string { width: min(80vw, 900px); height: 60px; overflow: visible; }
	.string path { fill: none; stroke-width: 1.2; }
	.string .track { stroke: #ffffff18; }
	.string .vib { stroke: #e8a25a; filter: drop-shadow(0 0 6px #e8a25a); animation: vib 0.09s linear infinite alternate; transition: stroke-dashoffset 0.4s; }
	@keyframes vib { to { transform: translateY(1.6px) } }
	.steps { list-style: none; padding: 0; margin: 0; display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; opacity: 0.4; }
	.steps li { transition: 0.4s; } .steps li::before { content: '○ '; } .steps li.ok { opacity: 1; color: #e8a25a; } .steps li.ok::before { content: '● '; }
	.tune { position: absolute; bottom: 28px; }
	.curtain { position: absolute; inset: 0; background: #e8a25a; transform: scaleY(0); transform-origin: bottom; }
	.loader.out { animation: lift 1.4s linear forwards; }
	.loader.out > :not(.curtain) { transition: opacity 0.4s; opacity: 0; }
	.loader.out .curtain { animation: curtain 1.4s cubic-bezier(0.8, 0, 0.15, 1) forwards; }
	@keyframes curtain { 0% { transform: scaleY(0); transform-origin: bottom } 45% { transform: scaleY(1); transform-origin: bottom } 55% { transform: scaleY(1); transform-origin: top } 100% { transform: scaleY(0); transform-origin: top } }
	@keyframes lift { 0%, 44% { background: #0a0807 } 46% { background: transparent } 99% { visibility: visible } 100% { background: transparent; visibility: hidden } }
	@media (max-width: 800px) { .top { flex-direction: column; gap: 14px; padding: 18px } .views { max-width: none; justify-content: flex-start } .hint { display: none } }
</style>

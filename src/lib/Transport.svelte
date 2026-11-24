<script lang="ts">
	import { onMount } from 'svelte';
	import { pieces, player, play, stop, waveform } from './audio.svelte';
	let cv: HTMLCanvasElement;
	const piece = $derived(pieces.find((p) => p.id === player.piece)!);

	onMount(() => {
		const x = cv.getContext('2d')!;
		let raf = 0;
		const draw = () => {
			const w = (cv.width = cv.clientWidth * 2), h = (cv.height = cv.clientHeight * 2);
			x.clearRect(0, 0, w, h);
			const d = waveform();
			const col = getComputedStyle(document.documentElement).getPropertyValue('--accent');
			x.strokeStyle = col; x.lineWidth = 2; x.shadowColor = col; x.shadowBlur = 12;
			x.beginPath();
			for (let i = 0; i < w; i += 2) {
				const v = d ? (d[Math.floor((i / w) * d.length)] as number) : 0;
				const y = h / 2 + v * h * 1.6 + Math.sin(i * 0.02 + performance.now() * 0.002) * (player.playing || player.live ? 0 : 1.5);
				i ? x.lineTo(i, y) : x.moveTo(i, y);
			}
			x.stroke();
			raf = requestAnimationFrame(draw);
		};
		draw();
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="transport">
	<button class="play" class:on={player.playing} onclick={() => (player.playing ? stop() : play())} aria-label={player.playing ? 'Stopp' : 'Spielen'}>
		<span class="ring"></span>
		{#if player.playing}<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
		{:else}<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" /></svg>{/if}
	</button>
	<div class="info">
		<div class="row">
			{#each pieces as p}
				<button class="mono" class:on={player.piece === p.id} onclick={() => play(p.id)}>{p.title}</button>
			{/each}
		</div>
		<div class="now">
			<span class="title"><em>{piece.title}</em> <span class="mono dim">— {piece.composer}</span></span>
			<span class="note">{player.noteName || (player.live ? '' : '♩')}</span>
		</div>
		<div class="bar"><canvas bind:this={cv}></canvas><i style="width:{player.progress * 100}%"></i></div>
	</div>
</div>

<style>
	.transport { position: fixed; z-index: 10; left: 50%; bottom: 22px; translate: -50% 0; width: min(640px, calc(100vw - 20px)); display: flex; gap: 18px; align-items: center;
		background: var(--card); backdrop-filter: blur(18px); border: 1px solid var(--line); border-radius: 999px; padding: 10px 26px 10px 10px;
		animation: up 1.2s cubic-bezier(0.2, 0.8, 0.1, 1) both 0.9s; }
	@keyframes up { from { transform: translateY(160%) } }
	.play { flex: none; width: 76px; height: 76px; border-radius: 50%; border: 0; background: var(--accent); color: #120c08; cursor: pointer; position: relative; display: grid; place-items: center; transition: transform 0.3s; }
	.play:hover { transform: scale(1.05); }
	.play svg { width: 26px; fill: currentColor; }
	.ring { position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--accent); opacity: calc(0.3 + var(--amp)); transform: scale(calc(1 + var(--amp) * 0.35)); box-shadow: 0 0 calc(10px + var(--amp) * 60px) var(--accent); }
	.play:not(.on) .ring { animation: pulse 2.4s infinite; }
	@keyframes pulse { 50% { transform: scale(1.12); opacity: 0.15 } }
	.info { flex: 1; min-width: 0; }
	.row { display: flex; gap: 12px; flex-wrap: wrap; }
	.row button { background: none; border: 0; color: var(--ink); opacity: 0.45; cursor: pointer; padding: 0; font-size: 11px; }
	.row button.on { opacity: 1; color: var(--accent); }
	.now { display: flex; justify-content: space-between; align-items: baseline; margin: 2px 0; }
	.title { font-family: var(--serif); font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.note { font-family: var(--serif); font-style: italic; font-size: 30px; color: var(--accent); min-width: 2.5ch; text-align: right; }
	.bar { position: relative; height: 26px; }
	.bar canvas { width: 100%; height: 100%; display: block; }
	.bar i { position: absolute; left: 0; bottom: 0; height: 1px; background: var(--ink); opacity: 0.5; }
	@media (max-width: 800px) { .play { width: 58px; height: 58px } .title { font-size: 17px } }
</style>

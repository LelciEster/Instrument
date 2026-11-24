<script lang="ts">
	import { cfg, varnishes, fittings, strings, sizes, moods } from './config.svelte';
	let { onshot }: { onshot: () => void } = $props();
	let open = $state(true);
	const vName = $derived(cfg.custom ? 'Eigener Lack ' + cfg.custom.toUpperCase() : varnishes.find((v) => v.id === cfg.varnish)!.name);
</script>

<aside class="panel" class:closed={!open}>
	<button class="tab mono" onclick={() => (open = !open)}>{open ? 'Karte schließen' : '+ Werkstattkarte'}</button>
	<div class="card">
		<div class="head mono"><span>Werkstattkarte</span><span>Nº 0001</span></div>

		<section>
			<h3><i>01</i> Lack</h3>
			<div class="drops">
				{#each varnishes as v}
					<button class="drop" class:on={!cfg.custom && cfg.varnish === v.id} style="--c:{v.swatch}" title={v.name}
						onclick={() => { cfg.varnish = v.id; cfg.custom = ''; }}></button>
				{/each}
				<label class="drop pick" class:on={!!cfg.custom} title="Eigene Farbe">
					<input type="color" value={cfg.custom || '#b4581d'} oninput={(e) => (cfg.custom = e.currentTarget.value)} />
				</label>
			</div>
			<p class="val">{vName}</p>
			<div class="range"><span>Satin</span><input type="range" min="0" max="1" step="0.01" bind:value={cfg.gloss} /><span>Spiegel</span></div>
		</section>

		<section>
			<h3><i>02</i> Garnitur</h3>
			<div class="seg">{#each fittings as f}<button class:on={cfg.fitting === f.id} onclick={() => (cfg.fitting = f.id)}><b style="--c:{f.swatch}"></b>{f.name}</button>{/each}</div>
		</section>

		<section>
			<h3><i>03</i> Saiten</h3>
			<div class="seg">{#each strings as s}<button class:on={cfg.strings === s.id} onclick={() => (cfg.strings = s.id)}>{s.name}</button>{/each}</div>
		</section>

		<section>
			<h3><i>04</i> Form <small class="mono">Morph Target</small></h3>
			<div class="range"><span>Schlank</span><input type="range" min="-1" max="1" step="0.01" bind:value={cfg.width} /><span>Breit</span></div>
			<div class="seg sizes">{#each sizes as s}<button class:on={cfg.size === s.id} onclick={() => (cfg.size = s.id)}>{s.id}</button>{/each}</div>
		</section>

		<section>
			<h3><i>05</i> Bogen</h3>
			<div class="seg">
				<button class:on={cfg.stick === 'pernambuco'} onclick={() => (cfg.stick = 'pernambuco')}>Pernambuk</button>
				<button class:on={cfg.stick === 'carbon'} onclick={() => (cfg.stick = 'carbon')}>Carbon</button>
			</div>
			<div class="seg">
				<button class:on={cfg.hair === 'white'} onclick={() => (cfg.hair = 'white')}>Haar weiß</button>
				<button class:on={cfg.hair === 'black'} onclick={() => (cfg.hair = 'black')}>Haar schwarz</button>
				<button class:on={!cfg.showBow} onclick={() => (cfg.showBow = !cfg.showBow)}>{cfg.showBow ? 'Ausblenden' : 'Einblenden'}</button>
			</div>
		</section>

		<section>
			<h3><i>06</i> Licht</h3>
			<div class="seg">{#each moods as m}<button class:on={cfg.mood === m.id} onclick={() => (cfg.mood = m.id)}>{m.name}</button>{/each}</div>
		</section>

		<section>
			<h3><i>07</i> Ansicht</h3>
			<div class="range"><span>Ganz</span><input type="range" min="0" max="1" step="0.01" bind:value={cfg.explode} /><span>Explosion</span></div>
			<div class="seg">
				<button class:on={cfg.autoRotate} onclick={() => (cfg.autoRotate = !cfg.autoRotate)}>Auto-Rotation</button>
				<button onclick={onshot}>Foto speichern ↓</button>
			</div>
		</section>
	</div>
</aside>

<style>
	.panel { position: fixed; z-index: 10; right: 24px; top: 168px; bottom: 150px; width: 330px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
		transition: transform 0.7s cubic-bezier(0.7, 0, 0.2, 1); animation: slide 1.2s cubic-bezier(0.2, 0.8, 0.1, 1) both 0.7s; }
	@keyframes slide { from { transform: translateX(120%) } }
	.panel.closed { transform: translateX(calc(100% - 150px)); }
	.panel.closed .card { opacity: 0; pointer-events: none; }
	.tab { background: none; border: none; color: var(--ink); opacity: 0.7; cursor: pointer; font: inherit; padding: 2px 0; }
	.card { width: 100%; overflow-y: auto; scrollbar-width: none; background: var(--card); backdrop-filter: blur(18px) saturate(1.3); border: 1px solid var(--line);
		border-radius: 4px; padding: 6px 20px 14px; transition: opacity 0.4s; }
	.head { display: flex; justify-content: space-between; padding: 10px 0 12px; border-bottom: 1px dashed var(--line); opacity: 0.6; }
	section { padding: 14px 0 12px; border-bottom: 1px solid var(--line); }
	section:last-child { border: 0; }
	h3 { margin: 0 0 10px; font-family: var(--serif); font-weight: 400; font-size: 26px; display: flex; align-items: baseline; gap: 10px; }
	h3 i { font-family: var(--mono); font-style: normal; font-size: 11px; color: var(--accent); }
	h3 small { margin-left: auto; font-size: 10px; opacity: 0.45; }
	.drops { display: flex; gap: 10px; flex-wrap: wrap; }
	.drop { width: 34px; height: 34px; border-radius: 50%; border: 0; cursor: pointer; position: relative; padding: 0;
		background: radial-gradient(circle at 32% 28%, #fff9 0 6%, transparent 22%), radial-gradient(circle at 50% 60%, var(--c), color-mix(in srgb, var(--c) 45%, black));
		box-shadow: 0 6px 14px -6px #000, inset 0 -3px 6px #0006; transition: transform 0.3s; }
	.drop:hover { transform: translateY(-3px) scale(1.06); }
	.drop.on { outline: 1px solid var(--ink); outline-offset: 4px; }
	.pick { --c: conic-gradient(red, gold, lime, cyan, blue, magenta, red); background: conic-gradient(from 30deg, #e44, #eb4, #4c6, #4ce, #44e, #c4c, #e44); overflow: hidden; }
	.pick input { opacity: 0; width: 100%; height: 100%; cursor: pointer; }
	.val { margin: 10px 0 6px; font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--accent); }
	.seg { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
	.seg button { flex: 1 1 auto; background: transparent; color: var(--ink); border: 1px solid var(--line); padding: 8px 10px; font: 12px/1 var(--sans); cursor: pointer; border-radius: 2px; transition: 0.25s; display: flex; gap: 7px; align-items: center; justify-content: center; }
	.seg button b { width: 10px; height: 10px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 1px var(--line); }
	.seg button:hover { border-color: var(--ink); }
	.seg button.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
	.sizes button { font-family: var(--serif); font-size: 17px; }
	.range { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; font: 11px var(--mono); opacity: 0.85; margin: 4px 0; }
	input[type='range'] { appearance: none; background: transparent; height: 20px; cursor: pointer; }
	input[type='range']::-webkit-slider-runnable-track { height: 1px; background: linear-gradient(90deg, var(--accent), var(--line)); }
	input[type='range']::-moz-range-track { height: 1px; background: var(--line); }
	input[type='range']::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); margin-top: -7px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent); }
	input[type='range']::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: var(--accent); }
	@media (max-width: 800px) { .panel { left: 10px; right: 10px; width: auto; top: auto; bottom: 120px; height: 42vh; } .panel.closed { transform: translateY(calc(100% - 26px)); } }
</style>

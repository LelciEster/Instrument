<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
	<meta name="description" content="Violino N°1 — interaktiver 3D-Konfigurator für eine Violine mit Bogen. Lack, Garnitur, Saiten, Form, Licht und echter Klang." />
</svelte:head>

{@render children()}

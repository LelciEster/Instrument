<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { OrbitControls, ContactShadows } from '@threlte/extras';
	import * as THREE from 'three';
	import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
	import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { cfg, varnishes, fittings, strings, sizes } from './config.svelte';
	import { bowPose, level } from './audio.svelte';

	let { gltf }: { gltf: GLTF } = $props();
	const { scene, renderer, camera } = useThrelte();

	// ---------- environment reflections (no download needed) ----------
	const pmrem = new THREE.PMREMGenerator(renderer as THREE.WebGLRenderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environmentIntensity = 0.5;

	// ---------- model setup ----------
	const root = gltf.scene;
	const outer = new THREE.Group();
	outer.add(root);
	const byName = (n: string) => root.getObjectByName(n) as THREE.Mesh;
	const mats: Record<string, THREE.MeshPhysicalMaterial> = {};
	const morphMeshes: THREE.Mesh[] = [];
	root.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.castShadow = true;
		const mat = m.material as THREE.MeshPhysicalMaterial;
		mats[mat.name] = mat;
		if (m.morphTargetDictionary && 'BodyWidth' in m.morphTargetDictionary) morphMeshes.push(m);
	});
	const origMap: Record<string, THREE.Texture | null> = {};
	for (const k in mats) origMap[k] = mats[k].map;
	mats['String_Metal'].emissive = new THREE.Color(1, 0.62, 0.3);

	// where the bow meets the strings (computed before centering = root-local space)
	root.updateMatrixWorld(true);
	const bridgeBox = new THREE.Box3().setFromObject(byName('Violin_Bridge'));
	const bc = bridgeBox.getCenter(new THREE.Vector3());
	const neckZ = new THREE.Box3().setFromObject(byName('Violin_NeckScroll')).getCenter(new THREE.Vector3()).z;
	const contact = new THREE.Vector3(bc.x, 0, bc.z + Math.sign(neckZ - bc.z) * 0.034);
	const ray = new THREE.Raycaster();
	let topY = 0;
	for (let x = -0.02; x <= 0.02; x += 0.0015) {
		ray.set(new THREE.Vector3(bc.x + x, bridgeBox.max.y + 0.1, contact.z), new THREE.Vector3(0, -1, 0));
		const hit = ray.intersectObject(byName('Violin_Strings'))[0];
		if (hit) topY = Math.max(topY, hit.point.y);
	}
	contact.y = (topY || bridgeBox.max.y - 0.006) + 0.0004;

	const bow = root.getObjectByName('Bow')!;
	const restPos = bow.position.clone(), restQuat = bow.quaternion.clone();

	// center on the floor
	const box = new THREE.Box3().setFromObject(root);
	const c = box.getCenter(new THREE.Vector3());
	root.position.set(-c.x, -box.min.y, -c.z);
	root.updateMatrixWorld(true);

	// exploded view: offsets along world-up for each violin part
	const EXP: Record<string, number> = {
		Violin_Back: -0.05, Violin_Top: 0.05, Violin_Purfling: 0.052, Violin_FHoles: 0.052, Violin_Bridge: 0.1,
		Violin_Strings: 0.14, Violin_Fingerboard: 0.085, Violin_Nut: 0.085, Violin_Tailpiece: 0.12, Violin_Pegs: 0.06, Violin_NeckScroll: 0.025
	};
	const exParts = Object.keys(EXP).map((n) => {
		const o = byName(n);
		const up = new THREE.Vector3(0, 1, 0).applyQuaternion(o.parent!.getWorldQuaternion(new THREE.Quaternion()).invert());
		return { o, base: o.position.clone(), up, d: EXP[n] };
	});

	// ---------- lights ----------
	let key = $state<THREE.DirectionalLight>(), rim = $state<THREE.DirectionalLight>(), spot = $state<THREE.SpotLight>(), candle = $state<THREE.PointLight>(), fill = $state<THREE.HemisphereLight>();
	const MOODS: Record<string, { env: number; key: number; rim: number; spot: number; candle: number; fill: number; rimCol: number[] }> = {
		studio: { env: 0.55, key: 2.4, rim: 2.6, spot: 0, candle: 0, fill: 0.25, rimCol: [0.75, 0.85, 1] },
		stage: { env: 0.1, key: 0.15, rim: 3.2, spot: 14, candle: 0, fill: 0.03, rimCol: [1, 0.55, 0.3] },
		candle: { env: 0.05, key: 0.05, rim: 0.7, spot: 0, candle: 0.9, fill: 0.02, rimCol: [1, 0.45, 0.15] },
		day: { env: 1.3, key: 3.2, rim: 1.2, spot: 0, candle: 0, fill: 0.6, rimCol: [1, 1, 1] }
	};

	// ---------- dust particles ----------
	const N = 700;
	const dustGeo = new THREE.BufferGeometry();
	const pos = new Float32Array(N * 3), speed = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		pos[i * 3] = (Math.random() - 0.5) * 1.4; pos[i * 3 + 1] = Math.random() * 0.6; pos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
		speed[i] = 0.004 + Math.random() * 0.012;
	}
	dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const spr = document.createElement('canvas'); spr.width = spr.height = 64;
	const g = spr.getContext('2d')!; const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	rg.addColorStop(0, 'rgba(255,220,170,1)'); rg.addColorStop(0.35, 'rgba(255,190,120,0.35)'); rg.addColorStop(1, 'rgba(255,170,90,0)');
	g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
	const dustMat = new THREE.PointsMaterial({ size: 0.007, map: new THREE.CanvasTexture(spr), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 });

	// ---------- camera fly-to (uses the cameras exported from Blender) ----------
	let controls: any = $state();
	let fly: { p: THREE.Vector3; t: THREE.Vector3; fov: number } | null = null;
	let lastTick = 0;
	$effect(() => {
		if (cfg.viewTick === lastTick) return;
		lastTick = cfg.viewTick;
		let o = root.getObjectByName(cfg.view) as THREE.Object3D | undefined;
		const cam = o && ((o as THREE.Camera).isCamera ? o : o.children.find((c) => (c as THREE.Camera).isCamera)) as THREE.PerspectiveCamera;
		if (!cam) return;
		outer.updateMatrixWorld(true);
		const p = cam.getWorldPosition(new THREE.Vector3());
		const d = cam.getWorldDirection(new THREE.Vector3());
		const ctr = new THREE.Vector3(0, 0.03, 0);
		const t = p.clone().add(d.clone().multiplyScalar(Math.max(0.15, ctr.clone().sub(p).dot(d))));
		const back = t.clone().sub(p).length() * 0.6;
		p.addScaledVector(d, -back);
		fly = { p, t, fov: Math.min(38, Math.max(20, cam.fov * 1.3)) };
	});

	// ---------- per-frame ----------
	const tmpC = new THREE.Color(), tq = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
	let bowBlend = 0, morph = 0, scale = 1, explode = 0, time = 0;
	const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

	useTask((dt) => {
		time += dt;
		const k = 1 - Math.exp(-dt * 5);
		const amp = level();

		// varnish colour + gloss
		const v = varnishes.find((x) => x.id === cfg.varnish)!;
		if (cfg.custom) tmpC.set(cfg.custom).multiplyScalar(2.4); else tmpC.setRGB(v.tint[0], v.tint[1], v.tint[2]);
		for (const n of ['Varnished_Spruce_Top', 'Varnished_Maple_Back', 'Varnished_Maple_Ribs', 'Varnished_Maple_Neck']) {
			const m = mats[n]; if (!m) continue;
			m.color.lerp(tmpC, k);
			m.clearcoat = lerp(m.clearcoat, cfg.gloss, k);
			m.clearcoatRoughness = lerp(m.clearcoatRoughness, lerp(0.4, 0.012, cfg.gloss), k);
			m.roughness = lerp(m.roughness, lerp(0.6, 0.22, cfg.gloss), k);
		}
		// fittings
		const f = fittings.find((x) => x.id === cfg.fitting)!;
		tmpC.setRGB(f.color[0], f.color[1], f.color[2]);
		mats['Ebony_Polished'].color.lerp(tmpC, k);
		const fb = mats['Ebony_Fingerboard'];
		const wantMap = cfg.fitting === 'ebony' ? origMap['Ebony_Fingerboard'] : null;
		if (fb.map !== wantMap) { fb.map = wantMap; fb.needsUpdate = true; }
		fb.color.lerp(wantMap ? tmpC.setRGB(1, 1, 1) : tmpC, k);
		// strings (glow with the music)
		const s = strings.find((x) => x.id === cfg.strings)!;
		const sm = mats['String_Metal'];
		sm.color.lerp(tmpC.setRGB(s.color[0], s.color[1], s.color[2]), k);
		sm.metalness = lerp(sm.metalness, s.metal, k); sm.roughness = lerp(sm.roughness, s.rough, k);
		sm.emissiveIntensity = amp * 1.6;
		// bow
		const hair = mats['Horsehair'];
		hair.color.lerp(cfg.hair === 'white' ? tmpC.setRGB(1, 1, 1) : tmpC.setRGB(0.05, 0.045, 0.04), k);
		const st = mats['Pernambuco_Stick'];
		const stMap = cfg.stick === 'pernambuco' ? origMap['Pernambuco_Stick'] : null;
		if (st.map !== stMap) { st.map = stMap; st.needsUpdate = true; }
		st.color.lerp(stMap ? tmpC.setRGB(1, 1, 1) : tmpC.setRGB(0.018, 0.018, 0.02), k);
		bow.visible = cfg.showBow;

		// geometry: morph target + size
		morph = lerp(morph, cfg.width, k);
		for (const m of morphMeshes) m.morphTargetInfluences![m.morphTargetDictionary!['BodyWidth']] = morph;
		scale = lerp(scale, sizes.find((x) => x.id === cfg.size)!.scale, k);
		outer.scale.setScalar(scale);

		// bow on the strings
		const pose = bowPose();
		const on = pose.on && cfg.showBow;
		bowBlend = lerp(bowBlend, on ? 1 : 0, 1 - Math.exp(-dt * 3.2));
		const e = bowBlend * bowBlend * (3 - 2 * bowBlend);
		tq.setFromAxisAngle(zAxis, pose.tilt);
		const hairY = 0.0016 - 0.001 * (pose.s - 0.0756) / 0.6454 - 0.00035;
		const playPos = new THREE.Vector3(-pose.s, -hairY, 0).applyQuaternion(tq).add(contact);
		bow.position.lerpVectors(restPos, playPos, e);
		bow.position.y += Math.sin(Math.PI * e) * 0.12;
		bow.quaternion.slerpQuaternions(restQuat, tq, e);

		// exploded view (folds back while playing)
		explode = lerp(explode, on ? 0 : cfg.explode, k);
		for (const p of exParts) p.o.position.copy(p.base).addScaledVector(p.up, p.d * explode);

		// lights
		const M = MOODS[cfg.mood];
		scene.environmentIntensity = lerp(scene.environmentIntensity, M.env, k);
		if (key && rim && spot && candle && fill) {
			key.intensity = lerp(key.intensity, M.key, k);
			rim.intensity = lerp(rim.intensity, M.rim + amp * 2, k);
			rim.color.lerp(tmpC.setRGB(M.rimCol[0], M.rimCol[1], M.rimCol[2]), k);
			spot.intensity = lerp(spot.intensity, M.spot * (1 + amp * 0.6), k);
			const flick = 1 + Math.sin(time * 13) * 0.08 + Math.sin(time * 31.7) * 0.06 + (Math.random() - 0.5) * 0.1;
			candle.intensity = lerp(candle.intensity, M.candle * flick, 0.5);
			fill.intensity = lerp(fill.intensity, M.fill, k);
		}

		// dust
		const pa = dustGeo.attributes.position as THREE.BufferAttribute;
		for (let i = 0; i < N; i++) {
			let y = pa.getY(i) + speed[i] * dt * (1 + amp * 6);
			if (y > 0.6) y = 0;
			pa.setY(i, y);
			pa.setX(i, pa.getX(i) + Math.sin(time * 0.3 + i) * 0.00008);
		}
		pa.needsUpdate = true;
		dustMat.opacity = lerp(dustMat.opacity, (cfg.mood === 'day' ? 0.12 : 0.32) + amp * 0.7, k);

		// camera fly-to
		const cam = camera.current as THREE.PerspectiveCamera;
		if (fly && controls) {
			const kk = 1 - Math.exp(-dt * 3);
			cam.position.lerp(fly.p, kk);
			controls.target.lerp(fly.t, kk);
			cam.fov = lerp(cam.fov, fly.fov, kk); cam.updateProjectionMatrix();
			if (cam.position.distanceTo(fly.p) < 0.002) fly = null;
		}
	});
</script>

<T.PerspectiveCamera makeDefault fov={30} near={0.01} far={30} position={[1.2, 0.68, 1.0]}>
	<OrbitControls
		bind:ref={controls}
		enableDamping
		dampingFactor={0.07}
		target={[0.1, 0.03, -0.08]}
		minDistance={0.18}
		maxDistance={2.6}
		maxPolarAngle={1.5}
		autoRotate={cfg.autoRotate}
		autoRotateSpeed={0.7}
		onstart={() => (fly = null)}
	/>
</T.PerspectiveCamera>

<T is={outer} />
<T.Points args={[dustGeo, dustMat]} />

<T.DirectionalLight bind:ref={key} position={[-1.2, 1.6, 1.0]} color="#ffe2c2" intensity={2.4} />
<T.DirectionalLight bind:ref={rim} position={[0.8, 0.5, -1.4]} intensity={2.6} />
<T.HemisphereLight bind:ref={fill} args={['#fff4ea', '#1a1410', 0.25]} />
<T.SpotLight bind:ref={spot} position={[0.1, 1.6, 0.25]} angle={0.32} penumbra={0.75} decay={2} color="#ffd29a" intensity={0} />
<T.PointLight bind:ref={candle} position={[-0.32, 0.22, 0.28]} color="#ff9a3c" distance={3} decay={2} intensity={0} />

<ContactShadows scale={2.4} blur={2.6} far={0.6} opacity={0.75} resolution={1024} position.y={0.0005} />

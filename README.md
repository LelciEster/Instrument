# Violino N°1 · 3D-Konfigurator (ITP-Projekt)

Online-Produktkonfigurator für eine Violine mit Bogen. Gebaut mit **SvelteKit**, **Threlte** und **Three.js**. Das Modell kommt aus Blender (`static/violin.glb`).

## Funktionen
- Drehen, Zoomen und Verschieben mit der Maus (OrbitControls)
- 6 Kamera-Ansichten, die direkt aus Blender exportiert wurden (Gesamt, Schnecke, Steg, Frosch, Oben, Profil)
- **Lack:** 6 Farben + eigene Farbe, Glanz von Satin bis Spiegel
- **Garnitur:** Ebenholz, Palisander, Buchsbaum
- **Saiten:** Stahl, Gold, Darm
- **Form:** Korpusbreite über ein **Morph Target** (`BodyWidth`), Größe 4/4, 3/4, 1/2, 1/4
- **Bogen:** Pernambuk oder Carbon, weißes oder schwarzes Haar, ein- und ausblenden
- **Licht:** Studio, Bühne, Kerze, Tageslicht
- **Explosionsansicht**, Auto-Rotation und Foto-Export
- **Spielen:** Der Bogen geht auf die Saiten und streicht im Takt. Jede Note ist ein Bogenstrich, und der Bogen wechselt die Saite. Echte Violin-Samples mit Vibrato und Hall
- Live spielen mit den Tasten **A bis L**
- Ladeanzeige mit echtem Fortschritt (Modell und Klänge)

## Start
```bash
npm install
npm run dev
```

## Deploy (Vercel)
Das Repo auf GitHub pushen, dann auf vercel.com importieren. `adapter-auto` erkennt Vercel automatisch.

## Credits
Violin-Samples: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) von Nicholaus P. Brosowsky, Lizenz CC-BY 3.0.
Musik: Pachelbel, Petzold, Beethoven (gemeinfrei).

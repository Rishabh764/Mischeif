# Piece photos

The showroom uses a transparent cut-out PNG for each side of each piece. Any piece without a photo shows its drawn stand-in instead.

## Status

All ten pieces have a front and a back photo (20 files, about 0.8 MB in total). They were generated with Canva's AI image tool on a green screen, cut out, and saved as WebP. The Curfew Hoodie front was made by recolouring the Riot Hoodie photo. The Static Noise Tee front was generated with its back as the reference, so the two sides match.

The Design Studio's blank tee and hoodie live in `assets/studio/` (front and back of each). They are grey photos turned into greyscale shading maps, which the Studio tints live with the chosen garment and trim colours; see `js/studio/garment-art.js`.

The hero piece (Riot Hoodie) also has a 12-frame turntable, `riot-hoodie-turn-000.webp` to `riot-hoodie-turn-330.webp`, one frame every 30°. The 0° and 180° frames are the front and back photos; the other ten were generated in Canva with the front and back as references. Unlike the other cut-outs, the turntable frames are all scaled to the same garment height, so the hoodie doesn't grow and shrink as the narrow side views come round.

## Adding a photo

1. Generate or shoot the image on a **flat green screen background** (or pure white for dark garments). Portrait, 4:5, the whole garment visible with margin around it.
2. Cut out the background and frame it on a 960×1200 transparent card. The existing files were made this way.
3. Save it here as `<piece-id>-front.webp` or `<piece-id>-back.webp` (PNG also works) (ids are in `js/data/products.js`).
4. In `js/data/products.js`, add the file to that piece: `images: { front: "assets/pieces/<id>-front.webp", back: "assets/pieces/<id>-back.webp" }`.

A piece with a front photo but no back photo shows the front on both sides.

For a true hero spin, add `turntable: [...]` to a piece with 12–24 frames of one full rotation, starting at the front and turning so the front swings toward the right of the picture. Frame every angle at the same garment height.

## Prompts

These are the prompts the current images came from. Use them to regenerate or restyle a piece.

Put this in front of every prompt:

> Fashion e-commerce product photo, ghost mannequin style, perfectly centred and symmetrical, soft studio lighting showing the fabric texture. Perfectly flat solid pure green chroma key background (#00FF00) with no shadow and no gradient. No person, no mannequin, no hanger, no watermark. The whole garment is visible with empty margin around it.

For every **back** view, give the generator the matching front image as a reference and add: "Back view of this exact same garment: same fabric, colour, fit and lighting."

| File | Describe |
|---|---|
| `riot-hoodie-back` | Heavyweight oversized black hoodie, hood resting on the upper back, bold white "RIOT" print across the upper back with a thin red line under it |
| `troublemaker-tee-back` | Boxy deep blood-red tee, large off-white puff-print "TROUBLE" across the upper back |
| `blackout-bomber-front` | Matte black technical bomber, closed silver zip, ribbed collar, cuffs and hem, slanted pockets, small red badge on the left sleeve |
| `blackout-bomber-back` | Same bomber from behind, tonal outlined "MISCHIEF" lettering across the back |
| `static-hoodie-back` | Cropped boxy bone off-white hoodie, hood on the upper back, tonal grey TV-static print all over, a few tiny red glitch marks |
| `sneak-cargo-front` | Tapered storm-grey ripstop cargo pants, elastic waist with drawcord, flap cargo pockets on both thighs, ankle zips |
| `sneak-cargo-back` | Same cargo pants from behind, two back pockets, small red label on the waistband |
| `staticnoise-tee-front` | Generated from the back as reference: the same bone tee and static print seen from the front, small dark grey "MISCHIEF" wordmark on the left chest |
| `staticnoise-tee-back` | Same tee from behind, plain, with "STATIC" in dark grey across the upper back |
| `curfew-hoodie-front` | Clean midweight storm-grey hoodie, small tonal embroidered "MISCHIEF" on the left chest |
| `curfew-hoodie-back` | Same hoodie from behind, "CURFEW" in off-white across the upper back |
| `riot-cap-front` | Structured six-panel bone off-white cap, three-quarter front view, red square patch with a white "M" on the front |
| `riot-cap-back` | Same cap from behind, adjustable strap with metal buckle, small "MISCHIEF" above the opening |
| `nightcrawler-tee-front` | Heavyweight black long-sleeve tee, ribbed cuffs, small red square patch on the left chest, three short red stripes on the left forearm |
| `nightcrawler-tee-back` | Same long-sleeve tee from behind, "NIGHT" in off-white across the upper back |
| `static-beanie-front` | Deep blood-red ribbed beanie with a wide folded cuff, small off-white woven label on the cuff, upright as if worn |
| `static-beanie-back` | Same beanie from behind, no label |

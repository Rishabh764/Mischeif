# Depth maps

One small greyscale image per side of each piece (`<piece-id>-front.png`, `<piece-id>-back.png`, 240×300). White is nearest to the camera; the transparent area is outside the garment.

The showroom builds each garment's 3D shape from these in the browser (`js/scene/garment3d.js`): the outline gives the body its rounded volume and the depth adds the folds, hood and pockets. The piece photos in `assets/pieces/` are wrapped over that shape.

They were made from the piece photos with the Depth Anything V2 (small) model, run locally on the CPU. If a photo changes, its depth map must be remade from the new photo, or the shape and the picture won't line up.

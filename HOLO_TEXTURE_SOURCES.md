# Holo texture sources

LR3.22 uses image-backed textures where they improve the individual holo identities.

## Galaxy / Cosmos
- Uses the galaxy/cosmos image supplied directly by Matt in the LR3 development chat.
- A compact copy is embedded directly in the holo stylesheet so the effect does not depend on a remote image host or CORS.
- Used beneath a restrained moving rainbow/highlight layer.

## Glitter
- **Glitter Foil Texture Background** by Martina Stokow
- Public Domain Pictures: https://www.publicdomainpictures.net/en/view-image.php?image=495267&picture=glitter-foil-texture-background
- License: CC0 / public domain
- Used by Amazing Rare and VMAX as the real glitter/sparkle texture.

## Removed foil texture
- The ambientCG Foil002 raster introduced in LR3.20 was removed in LR3.22 because it did not look good on Night Ledger's card treatment.
- V Full Art now uses a cleaner etched/prismatic surface while a better physical foil texture is evaluated.

## Reference implementation
- Simey / pokemon-cards-css: https://github.com/simeydotme/pokemon-cards-css
- Reference for the layer/blend approach. Night Ledger uses its own selectors, interaction variables, card rendering, and texture choices.

# PWA Icons Generation

This folder contains all PWA (Progressive Web App) icons for BILLIONAIRS LUXURY.

## Icon Sizes

The following sizes are generated for optimal PWA support:

- **72x72** - Android Chrome (ldpi)
- **96x96** - Android Chrome (mdpi)
- **128x128** - Android Chrome, iOS
- **144x144** - Windows Metro Tile
- **152x152** - iOS iPad
- **192x192** - Android Chrome (baseline)
- **384x384** - Android Chrome (high-res)
- **512x512** - Android Chrome (maximum), PWA splash screen

## Design

- **Background**: Dark obsidian (#0C0C0C)
- **Primary**: Rose gold (#E8B4A0)
- **Typography**: Letter "B" from Playfair Display
- **Style**: Luxury minimalist with gold border glow

## Manual Creation

If you prefer to create icons manually:

1. Use **Figma**, **Photoshop**, or **Illustrator**
2. Create 512x512 canvas with black background
3. Add rose gold (#E8B4A0) letter "B" in Playfair Display font
4. Add rounded rectangle border with glow effect
5. Export to all required sizes

## Online Tool

Alternatively, use: https://realfavicongenerator.net/

1. Upload your 512x512 base icon
2. Generate all PWA sizes automatically
3. Download and replace files in this folder

## Usage

Icons are referenced in `/manifest.json`:

```json
{
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    ...
  ]
}
```

## Verification

Check icons are loaded correctly:
- Chrome DevTools → Application → Manifest
- Lighthouse → PWA Audit

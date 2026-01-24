# Kenya Bookstore Style Guide (Jan 24, 2026)

## Palette
- Ink `#0F172A` (primary text/background depth)
- Midnight `#0C1A2C` (dark accents)
- Ecru `#F6F1E8` (main canvas)
- Bone `#E8DFCF` (secondary surface)
- Oxblood `#722F37` (accent)
- Brass `#C08A3A` (highlight outlines/buttons)

## Typography
- Headlines: Playfair Display, weights 600–700; sizes 44/36/28/24px; line-height 1.1–1.2; letter-spacing -0.01em.
- Body: Inter 18px, line-height 1.6, letter-spacing 0.01em.
- Overlines/labels: Inter uppercase, 12–13px, letter-spacing 0.08em.

## Components
- Buttons: primary filled `bg-oxblood text-ecru` with brass border; ghost uses `border-brass bg-transparent` and brass text.
- Cards: no heavy shadows; 1px translucent brass border, paper-grain overlay; generous padding.
- Imagery: warm grading, consistent aspect ratios (2:3 for books), subtle vignette on hover.
- Motion: 250–400ms cubic-bezier(0.32,0.72,0,1); stagger reveals 120ms; hero parallax on hover.

## Layout Notes
- Max content width 1180px; gutters 32–40px desktop, 20–24px mobile.
- Sections separated by 72–96px on desktop (48–64px mobile).
- Use textured backgrounds on hero and footer; keep white space around carousels.

## Accessibility
- Body text >=18px, headings high contrast on ink; focus outline brass 2px with 2px offset.
- Tap targets >=44px; carousel arrows readable.

## Photo Direction
- Warm light, soft shadows; avoid mixed color temperatures. Grade with slight warmth and lifted shadows.

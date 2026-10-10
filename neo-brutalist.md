# Prompt for Claude Sonnet 4.6 — Neo-Brutalist UI Migration

## Context

I have a Next.js SSI demo application with shadcn/ui components already in place. The current UI is functional but visually default shadcn. I need you to migrate the entire UI to a neo-brutalist design system inspired by Linear's aesthetic — high contrast, hard black borders, flat offset shadows, no gradients, no rounded corners, monospace accents. Keep all existing functionality, logic, and component structure intact. Only touch visual styling.

---

## Design System to Establish First

Before touching any page, create a design token file at `lib/design-tokens.ts` and a global CSS override at `app/neo-brutal.css` (import it in `app/layout.tsx`).

### Color Palette

```css
--background: #F5F5F0;        /* off-white, not pure white */
--foreground: #0A0A0A;        /* near-black */
--primary: #0A0A0A;           /* black — buttons, borders */
--primary-foreground: #F5F5F0;
--accent: #FFDD00;            /* yellow — the only pop of color, used sparingly */
--accent-foreground: #0A0A0A;
--destructive: #FF2D2D;       /* red — errors, invalid states only */
--muted: #E8E8E3;             /* slightly darker off-white for muted surfaces */
--border: #0A0A0A;            /* all borders are black, always */
--success: #00C853;           /* green — valid/success states only */
```

Dark mode: invert background to `#0A0A0A` and foreground to `#F5F5F0`. Accent yellow stays. Borders become `#F5F5F0`.

### Typography

```css
--font-sans: 'Inter', system-ui, sans-serif;     /* body text */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;  /* DIDs, keys, JWT strings, code */
```

- All headings: `font-weight: 800`, `letter-spacing: -0.03em`
- Body: `font-weight: 400`, `line-height: 1.6`
- Monospace elements (DID strings, JWT, public keys): always `font-mono`, `text-sm`, `bg-muted`, `border border-border`, `px-2 py-1`

### The Brutalist Rules (apply everywhere, no exceptions)

1. **No border-radius anywhere** — `border-radius: 0` on every element. Override shadcn's default `rounded-*` classes globally.
2. **Hard black borders** — every Card, Button, Input, Badge, Dialog, Table gets `border: 2px solid var(--border)`.
3. **Offset box shadows only** — no blur, no spread. The only allowed shadow is `4px 4px 0px #0A0A0A` (dark mode: `4px 4px 0px #F5F5F0`). Applied to Cards and primary Buttons.
4. **No gradients** — flat fills only.
5. **No subtle/muted borders** — if a border exists, it's black and 2px.
6. **Hover on buttons** — translate `(-2px, -2px)` and increase shadow to `6px 6px 0px`. Creates the "lift" effect. Transition: `100ms ease`.
7. **Active/pressed on buttons** — translate `(2px, 2px)` and remove shadow. Creates "press" effect.

---

## shadcn Component Overrides

Override these components globally in `components/ui/` — do not create new components, restyle the existing ones.

### Button
```
- border: 2px solid #0A0A0A
- border-radius: 0
- font-weight: 700
- box-shadow: 4px 4px 0px #0A0A0A
- hover: translate(-2px, -2px), shadow 6px 6px 0px
- active: translate(2px, 2px), shadow none
- variant "destructive": bg #FF2D2D, same border/shadow rules
- variant "outline": bg transparent, black border, no shadow, hover gets shadow
- variant "ghost": no border, no shadow — only use for icon buttons
```

### Card
```
- border: 2px solid #0A0A0A
- border-radius: 0
- box-shadow: 4px 4px 0px #0A0A0A
- background: #F5F5F0
- CardHeader: border-bottom: 2px solid #0A0A0A, pb-4
- CardTitle: font-size 1.1rem, font-weight 800, letter-spacing -0.02em
```

### Input / Textarea
```
- border: 2px solid #0A0A0A
- border-radius: 0
- background: white
- focus: outline none, border-color stays black, box-shadow: 4px 4px 0px #0A0A0A
- no ring, no glow
```

### Badge
```
- border: 2px solid #0A0A0A
- border-radius: 0
- font-weight: 700
- font-size: 0.7rem
- letter-spacing: 0.05em
- text-transform: uppercase
- variant "default": bg #0A0A0A, text #F5F5F0
- variant "success": bg #00C853, text #0A0A0A
- variant "destructive": bg #FF2D2D, text #F5F5F0
- variant "accent": bg #FFDD00, text #0A0A0A
- no rounded corners
```

### Alert
```
- border: 2px solid #0A0A0A
- border-radius: 0
- border-left: 6px solid — color depends on variant (black/green/red)
- box-shadow: 4px 4px 0px #0A0A0A
```

### Dialog
```
- border: 2px solid #0A0A0A
- border-radius: 0
- box-shadow: 8px 8px 0px #0A0A0A
- overlay: bg rgba(0,0,0,0.7) — darker than default
- DialogHeader: border-bottom: 2px solid #0A0A0A
```

### Table
```
- border: 2px solid #0A0A0A on the table wrapper
- TableHeader: bg #0A0A0A, text #F5F5F0, font-weight 700
- TableRow: border-bottom: 1px solid #0A0A0A
- TableRow hover: bg #FFDD00 — the yellow appears here
- TableCell: font-size 0.875rem
```

### Tabs
```
- TabsList: border: 2px solid #0A0A0A, border-radius: 0, bg #muted, p-0
- TabsTrigger: border-radius: 0, font-weight: 700, border-right: 2px solid #0A0A0A (except last)
- TabsTrigger[data-state=active]: bg #0A0A0A, text #F5F5F0
```

---

## Layout & Navigation

### Global Layout (`app/layout.tsx`)

Add a top navigation bar:
```
- height: 56px
- border-bottom: 2px solid #0A0A0A
- background: #F5F5F0
- left: logo text "SSI DEMO" in font-weight 900, font-size 1.1rem, letter-spacing -0.03em
- right: nav links — OAUTH INSPECTOR / DID / ISSUER / HOLDER / VERIFIER / COMPARE
- active link: bg #FFDD00, px-3 py-1, border: 2px solid #0A0A0A, font-weight 700
- logged-in user email shown in monospace, small, muted — far right before a logout button
```

### Page Layout Pattern

Every page follows this structure:
```
- Page wrapper: min-h-screen, bg background, px-6 py-8 max-w-5xl mx-auto
- Page header: h1 (font-weight 900, text-3xl, letter-spacing -0.04em) + optional subtitle in muted
- A thick horizontal rule after the header: border-t-2 border-black mt-4 mb-8
- Content below
```

---

## Page-Specific UI

### `/oauth-inspector`

- Page title: "WHAT GOOGLE KNOWS ABOUT YOU"
- Subtitle (monospace, muted): "data captured on login · read-only"
- The data table uses the brutalist Table styles above
- Scope badges: green for read-only, red for write/sensitive — uppercase, no border-radius
- Bottom callout: a Card with `border-left: 6px solid #FF2D2D`, heading "THE PROBLEM" in bold, body text as is

### `/did`

- Page title: "YOUR DECENTRALIZED IDENTITY"
- DID string displayed in a full-width monospace block: `border: 2px solid black`, `bg: white`, `p-4`, `font-mono`, `text-sm`, `word-break: break-all`
- "Generate DID" button: primary variant, full-width, large
- "Anchor on Cheqd" button: accent variant (`bg: #FFDD00`, `border: 2px solid black`) — only shown for Issuer
- DID Document shown in a `<pre>` block styled as: `bg: #0A0A0A`, `text: #00C853`, `font-mono`, `text-xs`, `p-4`, `border: 2px solid black`, `overflow-x: auto` — terminal aesthetic
- Cheqd tx hash: monospace, with an external link icon, styled as a muted text link with underline on hover

### `/issuer`

- Page title: "ISSUE A CREDENTIAL"
- Form card with `box-shadow: 6px 6px 0px #0A0A0A`
- Each form field: label in `font-weight: 700`, `text-xs`, `uppercase`, `letter-spacing: 0.08em` above the input
- Submit button: full-width, large, primary
- After issuance — two side-by-side Cards:
  - Left: "RAW JWT" — monospace pre block, dark terminal style (same as DID Document above)
  - Right: "DECODED PAYLOAD" — syntax-highlighted JSON (use a simple approach: stringify with 2-space indent in same terminal block)
  - Both cards have `box-shadow: 4px 4px 0px #0A0A0A`

### `/holder`

- Page title: "YOUR CREDENTIALS"
- VC cards: each has a thick `border-left: 6px solid #0A0A0A`, the credential type as heading in bold, issuer DID truncated in monospace below
- Status badge top-right of each card: "ACTIVE" in black, "EXPIRED" in red
- "Create Presentation" button: accent (`bg: #FFDD00`) — this is the most important action, make it stand out
- Ownership proof section: separate Card with title "PROVE OWNERSHIP", a monospace display of the signed challenge, label reads "ONLY YOUR KEY CAN PRODUCE THIS"

### `/verifier`

- Page title: "VERIFY A CREDENTIAL"
- Textarea for JWT VP paste: tall (min 8 rows), monospace font, brutalist border
- "VERIFY" button: large, full-width, primary — this is the CTA
- Result Alert:
  - Valid: `border-left: 6px solid #00C853`, heading "✓ CREDENTIAL VALID", green accent
  - Invalid: `border-left: 6px solid #FF2D2D`, heading "✗ VERIFICATION FAILED", red accent
- Verification checklist below the alert: each step as a row with a monospace label left and a ✓ or ✗ badge right, `border-bottom: 1px solid black` between rows

### `/compare`

- Page title: "IDENTITY: THEN VS NOW"
- Two equal columns side by side, each a Card
- Left card header: "OAUTH (LEGACY)" with `border-left: 6px solid #FF2D2D`
- Right card header: "SSI (SELF-SOVEREIGN)" with `border-left: 6px solid #00C853`
- Each row inside the cards: label in muted uppercase monospace, value below in regular weight
- Bottom row of each card: "WHO CONTROLS THIS?" — left says "Google + this app", right says "Only you" — make this the visual focal point, larger text, bold

---

## What NOT to change

- No logic, no API routes, no DB queries, no types
- Do not change any file in `lib/` except adding `lib/design-tokens.ts`
- Do not change `components/ui/` files that aren't listed above
- Do not add new dependencies except `@fontsource/inter` and `@fontsource/jetbrains-mono` if not already present, or use Google Fonts via `next/font`

---

## Deliverables

1. `app/neo-brutal.css` — global overrides
2. `lib/design-tokens.ts` — token constants for use in className strings if needed
3. Reworked `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `alert.tsx`, `dialog.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`
4. Updated `app/layout.tsx` with nav bar
5. All page files (`page.tsx` for each route) with updated layout and classNames
6. No other files touched

Go file by file. Do not summarize what you're about to do — just implement.

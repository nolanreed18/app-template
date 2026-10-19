# Design guide: how the apps look and feel

The look is code: `template/app/theme.py` holds both palettes, the fonts
and the stylesheet, and the reference `app/ui.py` holds the helpers (cards,
badges, pills, empty states). This page says what that code is trying to
do, so a new page is designed the same way without re-deriving it.

## The idea

A quiet desk, not a dashboard. White (or near-black) cards on a soft
background, one accent gradient that always means "this one" or "the main
action", small uppercase labels, numbers in a monospace face, and colour
only where it carries meaning. Everything works at phone width first.

## Palette

| Role | Light | Dark |
|---|---|---|
| Page background | `#f8fafc` | `#0b0f19` |
| Card / surface | `#ffffff` | `#111827` |
| Text | `#0f172a` | `#f8fafc` |
| Secondary text | `#475569` | `#94a3b8` |
| Muted (labels, hints) | `#64748b` | `#64748b` |
| Border | `#e2e8f0` | `#1e293b` |
| Accent (primary) | `#2563eb` | `#3b82f6` |
| Link | `#0e7490` | `#22d3ee` |
| Sidebar | `#f1f5f9` | `#0d121e` |

The one gradient: `linear-gradient(135deg, blue #2563eb at 0.9, cyan
#06b6d4 at 0.75)`. It is used for the primary button, the current sidebar
page and the selected pill (softer, as a wash). Nothing else is gradient.

Badge colours (Streamlit's `:color-badge[...]`): blue `#3b82f6`, green
`#10b981`, orange `#f59e0b`, red `#f43f5e`, grey `#64748b`, violet
`#8b5cf6` / `#c084fc`, yellow `#ca8a04` / `#facc15`.

**Colour means something, always the same thing:** blue = in progress or
informational, green = good or done, orange = needs attention soon, red =
overdue, closed or bad, grey = neutral or inactive, yellow = unverified (an
estimate, a missing value), violet = a category of its own (used sparingly).
Never pick a colour for looks.

## Type

- Text: Inter (loaded from Google Fonts), base 15px, weights 400–700.
- Numbers, codes, subtitles, badges: JetBrains Mono, with tabular numerals.
- Headings: 1.5rem page title, then 1.2 / 1.05 / 1rem; all bold.
- **Microlabels**: section headings (`st.subheader`) and input labels are
  small (0.7rem), bold, uppercase, letter-spaced, in secondary text colour.
  They organise; they don't shout.
- The page head is a bold title with a one-line mono subtitle under it
  (`ui.setup(title, subtitle)`).

## Shapes and surfaces

- Corner radius 10px on widgets, 6px on buttons, 12–16px on cards and
  empty states. Borders are hairlines (1px) in the border colour.
- **Cards** (`ui.card(key)`): a bordered surface with 0.9rem/1rem padding;
  on hover the border turns blue and the surface lifts a shade. One record,
  one card. Inside a card, a text column plus a button column is the
  standard row; the text column shrinks, the button keeps its width.
- **Stat cards** (`st.metric(border=True)`): a muted microlabel over a big
  mono number; three fit across a phone.
- **Buttons**: the gradient for the one main action on a page (and form
  submits); every other button is a quiet card with a hairline, and turns
  blue on hover. `width="stretch"` inside cards and column pairs.
- **Badges**: mono pills with a hairline in their own colour. Use the
  helpers (`status_badge`, `attention_badge`, kind badges) so a status
  always looks the same everywhere.
- **Pills** (`ui.sections()` and horizontal radios): a segmented control;
  the selected one carries the soft gradient and a cyan edge. Sub-pages are
  pills, never tabs.
- **Empty states** (`ui.empty(icon, title, text)`): a dashed panel with a
  Material icon, a short heading and one sentence saying why it's empty and
  what to do next. Every list that can be empty has one.
- **Disclosures** (`ui.disclosure(label, key)`): add forms open from a
  button and show a "Close" button while open, instead of expanders.
- Icons are Material Symbols names in Streamlit's `:material/...:` form or
  the empty-state helper; no emoji in the interface.

## Behaviour that is part of the look

- Light by default; the **Dark mode** switch in the sidebar is saved in the
  database, so every device follows. Both palettes must read well: check
  the yellow badge and the selected pill in dark.
- A green banner and a toast confirm an action (`flash`); the toast is for
  phones, where the banner scrolls away.
- Deletes ask for a tick first (`ui.delete_button`). Pick-one dropdowns get
  a fresh key after a delete so they never show a vanished choice.
- Tables show blanks, never "None" or "nan" (`logic.for_display`).
- User text goes through `ui.md()` so a `$` or `*` can't break the page.
- Reduced motion is respected: no transitions when the system asks.

## Phone first

Every page is checked at about 380px wide: no horizontal scrollbar, stat
cards three across, a card's Add and secondary control side by side without
clipping, labels that wrap rather than truncate, and nothing that splits a
number from its label (use a non-breaking space) or a range at its dash
(use a word joiner).

## Where it lives

`template/app/theme.py` (palettes `PALETTES`, shared options `SHARED`,
tokens for the stylesheet `TOKENS`, `stylesheet(mode)`), copied as is;
`.streamlit/config.toml` carries the light palette for the first paint and
a test keeps the two equal. Change the look there, port it back here, and
every app gets it on its next copy.

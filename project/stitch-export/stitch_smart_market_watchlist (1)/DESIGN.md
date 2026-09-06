---
name: Editorial Intelligence
colors:
  surface: '#101412'
  surface-dim: '#101412'
  surface-bright: '#363a38'
  surface-container-lowest: '#0b0f0d'
  surface-container-low: '#181c1a'
  surface-container: '#1c201e'
  surface-container-high: '#272b28'
  surface-container-highest: '#323633'
  on-surface: '#e0e3df'
  on-surface-variant: '#bfc9bf'
  inverse-surface: '#e0e3df'
  inverse-on-surface: '#2d312f'
  outline: '#89938a'
  outline-variant: '#404941'
  surface-tint: '#8dd6a6'
  primary: '#aaf6c3'
  on-primary: '#00391e'
  primary-container: '#8fd9a8'
  on-primary-container: '#12603a'
  inverse-primary: '#206b43'
  secondary: '#abcebe'
  on-secondary: '#15362a'
  secondary-container: '#2f4f42'
  on-secondary-container: '#9dc0b0'
  tertiary: '#ffded6'
  on-tertiary: '#4f2418'
  tertiary-container: '#ffb8a6'
  on-tertiary-container: '#7a4639'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a8f3c0'
  primary-fixed-dim: '#8dd6a6'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#00522e'
  secondary-fixed: '#c6ebd9'
  secondary-fixed-dim: '#abcebe'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#2d4d40'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#fcb6a4'
  on-tertiary-fixed: '#350f06'
  on-tertiary-fixed-variant: '#6a392c'
  background: '#101412'
  on-background: '#e0e3df'
  surface-variant: '#323633'
  negative-coral: '#E57A77'
  tier-significant: '#E5A96A'
  tier-notable: '#7D9BB2'
  tier-normal: '#5A6560'
  surface-base: '#0B0F0D'
  surface-lifted: '#131A16'
  surface-elevated: '#1B2420'
  surface-border: '#232E28'
  text-primary: '#F2F5F3'
  text-secondary: '#9EABA4'
  text-muted: '#606D66'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  data-metric:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  data-delta:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-3xs: 0.125rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  max-width: 1280px
---

## Brand & Style

This design system delivers an executive, editorial intelligence interface for modern financial observation. It departs from frantic, hyper-saturated day-trading terminal paradigms, favoring instead a measured, quiet authority reminiscent of Swiss financial journalism and high-grade archival instruments.

The target audience comprises portfolio stewards, strategic investors, and analysts who require high-signal density without sensory exhaustion. Visual styling pairs strict functional minimalism with architectural precision: dense tabular data balanced against generous negative space, restrained tonal depth, and delicate luminous sage indicators that guide attention without shouting.

## Colors

The palette is engineered around dark, carbon-sage foundational surfaces. Rather than cold, pure black, the background utilizes a warm, mineral green-black (`#0B0F0D`), establishing an organic, restful canvas.

- **Primary Accent (`#8FD9A8`)**: Muted sage-mint. Serves as the primary positive Delta anchor, selection beacon, and active data visualizer. It provides luminous legibility without terminal glare.
- **Secondary Accent (`#4A6B5D`)**: Weathered spruce. Used for contextual focus states, subtle progress rings, and secondary graphical fills.
- **Negative Accent (`#E57A77`)**: Soft mineral coral, calibrated strictly to prevent alarming crimson shock while maintaining immediate peripheral legibility for negative values.
- **Editorial Tiers**:
  - `tier-significant` (`#E5A96A`): Warm amber for macro regime changes and high-impact volatility.
  - `tier-notable` (`#7D9BB2`): Muted slate blue for notable structural movements.
  - `tier-normal` (`#5A6560`): Quiet neutral gray-green for baseline asset flows.

## Typography

Geist provides the unbending, technical clarity required for dense analytical review. Every typographic role adheres to a disciplined hierarchy where weights do not exceed `600`, preserving the editorial dignity of the presentation.

All financial values, rates, yields, and time intervals must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1`). Metric layouts juxtapose larger, medium-weight valuations directly against delicate, uppercase tracking labels to ensure scan efficiency.

## Layout & Spacing

Layouts follow a structured, balanced 12-column system anchored by a centralized maximum container width of `1280px`.

- **Desktop (>= 1024px)**: 12 columns with `1.5rem` (`24px`) gutters and container margin padding. Watchlists align into multi-tiered analytical panels or 3-column modular grids.
- **Tablet (768px – 1023px)**: 8 columns with `1.25rem` (`20px`) gutters, collapsing peripheral sector matrices below primary instruments.
- **Mobile (< 768px)**: 4 columns with `1rem` (`16px`) gutters. Card matrices reflow into linear, vertical intelligence feeds with horizontal category snapping.

Spacing inside analytical components prioritizes data grouping: tighter intra-row margins (`0.5rem` to `0.75rem`) within cards paired with structural boundaries (`1.5rem` to `2rem`) between distinct asset buckets.

## Elevation & Depth

Depth is established through subtle tonal shifts and delicate structural strokes rather than conventional drop shadows, keeping data flat and distraction-free:

- **Base Surface (`#0B0F0D`)**: The foundational canvas, representing deep recession.
- **Surface Lifted (`#131A16`)**: Default state for watchlist cards, asset summaries, and navigation rails. Defined by a `1px` subtle border of `#232E28`.
- **Surface Elevated (`#1B2420`)**: Hovered assets, flyout sheets, and dropdown selectors. Augmented by an ultra-soft atmospheric ambient shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.45)`.
- **Luminescent Highlights**: Interactive highlights apply an internal glow inset stroke (`inset 0 0 0 1px rgba(143, 217, 168, 0.25)`) instead of heavy border color changes.

## Shapes

The geometric framework balances crisp structural rhythm with modern ergonomics:

- **Cards & Data Modules**: Standardized to `12px` border radius (`rounded-lg` under setting `2`), softening the analytical surface while preserving edge alignment with data columns.
- **Inputs & Field Controls**: Fixed to `8px` (`rounded-md`).
- **Interactive Badges, Pill Tiers, & Chips**: Strictly full pill geometry (`rounded-full` / `9999px`) to create an unambiguous visual distinction between informational containers and status chips.

## Components

### Watchlist Cards
- Background: `surface-lifted` (`#131A16`) with a `1px` border in `surface-border` (`#232E28`).
- Radius: `12px`. Padding: `1.25rem` (`20px`).
- Header: Asset ticker in `Geist` Medium (`headline-sm`) accompanied by full issuer title in `body-sm` (`text-secondary`).
- Data Display: Primary price rendered in `data-metric` with tabular numbers. Secondary indicator placed directly below in an auto-layout pill or text inline with directional micro-indicators (`+` / `−`).

### Editorial Tier Indicator Chips
- Shape: Full pill (`rounded-full`).
- Padding: `2px 8px`. Height: `20px`. Typography: `label-sm`.
- Variations:
  - *Significant*: `#E5A96A` text with `rgba(229, 169, 106, 0.12)` fill and subtle border.
  - *Notable*: `#7D9BB2` text with `rgba(125, 155, 178, 0.12)` fill.
  - *Normal*: `#5A6560` text with `rgba(90, 101, 96, 0.12)` fill.

### Buttons & Actions
- **Primary**: Background `#8FD9A8`, text `#0B0F0D`, font weight `500`. Border-radius: `8px`. Hover: `#A4E2B9`.
- **Secondary / Ghost**: Background `rgba(143, 217, 168, 0.06)`, text `#8FD9A8`, border `1px solid rgba(143, 217, 168, 0.2)`. Hover: `rgba(143, 217, 168, 0.12)`.
- **Icon / Control**: Ghost surface with `text-secondary`, transitioning to `text-primary` on hover with a `surface-elevated` background.

### Input Fields & Search
- Surface: `#0E1411` with `1px` border `#232E28`.
- Height: `38px`. Radius: `8px`. Typography: `body-md`.
- Focus state: Border transitions to `#8FD9A8` at `40%` opacity, paired with an ambient inner glow. Placeholder text in `text-muted`.

### Tabular Lists & Ticker Rows
- Alternating subtle rows using hairline separator borders (`#1B2420`).
- Padding: `10px 16px` per row.
- Hover behavior: Entire row lifts to `#161F1A` via immediate `150ms` ease transition.
---
name: Field Direct
colors:
  surface: '#f9f9ff'
  surface-dim: '#cbdbf7'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d4e3ff'
  on-surface: '#0c1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#223146'
  inverse-on-surface: '#ebf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ee8'
  primary: '#0047d3'
  on-primary: '#ffffff'
  primary-container: '#1e5eff'
  on-primary-container: '#f0f0ff'
  inverse-primary: '#b6c4ff'
  secondary: '#505f78'
  on-secondary: '#ffffff'
  secondary-container: '#d1e0fe'
  on-secondary-container: '#54637c'
  tertiary: '#006338'
  on-tertiary: '#ffffff'
  tertiary-container: '#157e4c'
  on-tertiary-container: '#c7ffd6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#003ab2'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b7c7e4'
  on-secondary-fixed: '#0b1c32'
  on-secondary-fixed-variant: '#38475f'
  tertiary-fixed: '#97f7b9'
  tertiary-fixed-dim: '#7bda9e'
  on-tertiary-fixed: '#00210f'
  on-tertiary-fixed-variant: '#00522e'
  background: '#f9f9ff'
  on-background: '#0c1c30'
  surface-variant: '#d4e3ff'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 16px
  gutter: 12px
---

## Brand & Style

The design system is engineered for field sales professionals who require efficiency and reliability while on the move. The brand personality is **Professional, Dependable, and High-Utility**. It avoids unnecessary decorative elements in favor of a clean, systematic approach that ensures data is digestible at a glance, even in high-glare outdoor environments.

The visual style is **Corporate / Modern**, leaning heavily into functional minimalism. It utilizes a card-based architecture to group information logically, ensuring that the "white space" is used to define hierarchy rather than just provide breathing room. The aesthetic communicates a high-trust, enterprise-grade tool that is approachable enough for daily, high-frequency usage.

## Colors

This design system utilizes a high-contrast palette to ensure legibility in varying lighting conditions typical of field work. 

- **Primary Blue** is the engine of the UI, used for primary actions and active states.
- **Dark Navy** provides a grounded foundation for navigation and sidebar elements, establishing a clear structural boundary from content.
- **Surface & Background** are carefully tuned; the `#eef2f7` background ensures that white cards (`#ffffff`) "pop" with distinct elevation, reducing cognitive load when scanning lists.
- **Status Colors** (Success, Warning, Danger) are saturated and meet AA accessibility standards for use against both white and light-blue backgrounds.

## Typography

The design system uses **Inter** for its exceptional legibility and neutral, systematic character. The type scale is optimized for high-speed scanning.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to appear tighter and more professional.
- **Body Text:** Uses a standard 16px base for mobile comfort, ensuring that field agents can read notes and client details without straining.
- **Labels:** Uppercase styles with increased letter-spacing are used for section headers and metadata captions to differentiate them from actionable body content.

## Layout & Spacing

The design system employs a **Fluid Grid** model with an 8px rhythmic scale. On mobile, the layout relies on a 4-column system, while tablet expands to a 12-column grid.

- **Safe Areas:** A minimum horizontal margin of 16px is maintained across all mobile screens.
- **Touch Targets:** All actionable elements (buttons, list items) maintain a minimum height of 48px to accommodate field use (often used one-handed).
- **Vertical Rhythm:** Cards are separated by 12px or 16px depending on the information density required, creating a clear vertical "stack" that is easy to scroll.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of physical hierarchy.

- **Level 0 (Background):** The `#eef2f7` base layer.
- **Level 1 (Cards/Surface):** White surfaces with a very soft, diffused shadow (Blur: 8px, Y: 2px, Opacity: 4% Black). These are used for the primary content blocks.
- **Level 2 (Floating/Active):** Elements like "Check-in" buttons or active modals use a more pronounced shadow (Blur: 16px, Y: 4px, Opacity: 8% Primary Blue) to indicate they are the top-most interaction layer.
- **Outlines:** Subtle 1px borders (`#d1d9e6`) are used on input fields and secondary buttons to maintain structure without adding visual noise.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) corner radius for standard components. This creates an approachable and modern feel while remaining structured enough for a business application. Large containers and cards utilize the `rounded-lg` (16px) tokens to feel substantial and contained.

## Components

### Buttons
- **Primary:** Solid `#1e5eff` with white text. Height: 48px or 56px for "Main Actions" (like "Submit Order"). 
- **Secondary:** Outlined with Primary Blue or Ghost style for less urgent actions.

### Status Badges (Chips)
- Small, caps-style labels with light background tints of their respective status colors (e.g., Success Green text on a 10% opacity green background). These indicate lead status or payment state.

### Input Fields
- Enclosed boxes with a light gray border. Labels are always visible (not floating) to ensure the user doesn't lose context while typing on a small screen.

### Cards
- The primary container for the "Activity Feed" and "Customer Lists." Cards should include a 16px internal padding and clear separation between header and body text.

### Bottom Tab Bar
- A fixed navigation element with 4-5 icons. Active states use the Primary Blue, while inactive states use Muted Gray. Icons should be accompanied by short text labels for maximum clarity.

### Lists
- High-density lists use 72px row heights with a subtle divider. Each row must be a large tap target that provides immediate visual feedback (ripple or highlight) upon touch.
---
name: A Taste of Naija
colors:
  surface: '#f3faff'
  surface-dim: '#bedfef'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#d8f2ff'
  surface-container-high: '#ccedfe'
  surface-container-highest: '#c6e8f8'
  on-surface: '#001f29'
  on-surface-variant: '#5b403f'
  inverse-surface: '#123441'
  inverse-on-surface: '#dff4ff'
  outline: '#8f6f6e'
  outline-variant: '#e4bebc'
  surface-tint: '#bb152c'
  primary: '#b7102a'
  on-primary: '#ffffff'
  primary-container: '#db313f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3b1'
  secondary: '#8e4e14'
  on-secondary: '#ffffff'
  secondary-container: '#ffab69'
  on-secondary-container: '#783d01'
  tertiary: '#00685d'
  on-tertiary: '#ffffff'
  tertiary-container: '#008376'
  on-tertiary-container: '#f4fffb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#8cf5e4'
  tertiary-fixed-dim: '#6fd8c8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#f3faff'
  on-background: '#001f29'
  surface-variant: '#c6e8f8'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  pidgin-italic:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is a celebration of Nigerian culinary heritage filtered through a modern, tech-forward lens. It balances professional reliability with the high-energy, communal spirit of West African dining. The aesthetic is "Vibrant Modernism"—a clean, functional framework enriched by rhythmic patterns inspired by Adire and Ankara textiles.

The brand persona is warm, charismatic, and efficient. We use "Flavor-first" visuals where high-quality food photography is paired with bold, energetic colors. The emotional goal is to evoke the feeling of a bustling Lagos kitchen—inviting, aromatic, and undeniably alive—while maintaining the frictionless experience expected of a top-tier fintech or food-logistics platform. 

Microcopy should leverage Nigerian Pidgin ("Correct taste," "Oya, let’s go!") to build immediate cultural rapport without sacrificing clarity.

## Colors
The palette is rooted in the ingredients of the Nigerian kitchen.
- **Jollof Orange (Primary):** A high-energy red-orange used for primary actions, buttons, and brand-heavy moments.
- **Palm Oil Yellow (Secondary):** Used for accents, warnings, and highlighting membership or premium features.
- **Tropical Green (Tertiary):** Represents freshness, sustainability, and "Ready" statuses.
- **Charcoal (Neutral):** The grounding force. Used for high-contrast typography and deep-mode surfaces.
- **Warm Canvas (Background):** A soft, off-white (#FFFBF7) serves as the primary background to prevent the high-vibrancy colors from causing eye strain.

## Typography
The typography system uses a dual-font approach to marry confidence with accessibility.
- **Headings:** Montserrat provides a geometric, bold foundation that feels architectural and modern. Use `700` weight for displays to command attention.
- **Body & Interface:** Be Vietnam Pro is selected for its contemporary, friendly terminals and excellent legibility at small sizes. 
- **Microcopy:** Use the `pidgin-italic` style for culturally-specific callouts to give them a distinct "voice" separate from functional instructions.

## Layout & Spacing
The layout follows a 12-column fluid grid for desktop and a 4-column grid for mobile. 
- **The 8px Rhythm:** All spacing (padding, margins, gap) must be a multiple of 8px.
- **Container Strategy:** Content should be housed in contained cards with generous internal padding (24px) to create a sense of breathability.
- **Adire Backgrounds:** Large layout sections should utilize a watermark-style Adire pattern (stroke: Charcoal, opacity: 3-5%) to fill whitespace without distracting from the content.

## Elevation & Depth
This design system utilizes **Tonal Layers** combined with **Soft Ambient Shadows**. 
- **Level 0 (Surface):** The background (#FFFBF7).
- **Level 1 (Cards):** Pure white (#FFFFFF) with a 1px stroke of Charcoal at 5% opacity. This creates a "paper-on-table" feel.
- **Level 2 (Interactive):** When hovered or active, cards lift using a soft, diffused shadow (Color: Charcoal, Alpha: 0.08, Blur: 20px, Y: 8px).
- **Glassmorphism:** Use sparingly for navigation overlays or floating action buttons (FABs) to maintain a modern, high-tech edge.

## Shapes
The shape language is "Friendly Geometry." 
- **Standard Radius:** We use a base 16px (`rounded-lg`) for all primary cards and containers to echo the softness of the brand.
- **Small Elements:** Buttons and input fields use 8px (`rounded-md`) for a more precise, functional feel.
- **Interactive Circles:** Icons and status indicators should be fully circular to provide visual contrast against the structured card layout.

## Components
- **Buttons:** Primary buttons use Jollof Orange with white text. Use 16px horizontal padding and 12px vertical. Transitions should be "snappy" (200ms ease-out).
- **Cards:** White backgrounds, 16px corner radius, and a subtle pattern-fill in the footer or header areas to reinforce brand identity.
- **Input Fields:** Use Charcoal for borders at 20% opacity. Upon focus, the border shifts to Jollof Orange with a 2px stroke.
- **Chips/Badges:** Use Tropical Green for "Fresh" or "Available" statuses, and Palm Oil Yellow for "Popular" or "Spicy" tags.
- **Lists:** Use 16px gutters between list items, with a subtle horizontal divider (#264653 at 5% opacity).
- **Specialty Component - "The Flavor Bar":** A horizontal scrolling list of food categories using stylized icons and bold Montserrat labels.
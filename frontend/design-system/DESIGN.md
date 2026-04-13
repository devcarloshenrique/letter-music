# Sonic Língua Design System

## 1. Core Identity & Philosophy
Sonic Língua utilizes a "Neon Dark" aesthetic. It bridges the concepts of "music" and "language" through energetic, high-contrast colors, deep space backgrounds, and tactile glassmorphism. The UI is designed to feel rhythmic, modern, and highly interactive.

## 2. Design Tokens

### 2.1 Colors
- **Background**: `#08070A` (Deep Space Black)
- **Surface**: `#1B191D` (Solid base), `#141317` (Glass base / translucid)
- **Primary (Electric Purple)**: `#BF40FF` (Core action & branding)
- **Secondary (Cyan)**: `#00E5FF` (Secondary accents & contrast)
- **Text**: `#f7f2f7` (Primary, High contrast), `#aeaaae` (Secondary, Muted)
- **Status**: `#ff6e84` (Error/Critical)

### 2.2 Typography
- **Typeface**: `Inter` (Sans-serif) - chosen for legibility and digital presence.
- **H1 (Hero)**: `900` weight, `-0.05em` tracking. Tight and impactful.
- **H2 (Section)**: `700` weight, standard tracking.
- **Body**: `400` weight, relaxed line-height for reading long lyrics or texts.
- **Labels/Microcopy**: `600`/`700` weight, `uppercase`, `tracking-widest` (0.1em+).

### 2.3 Spacing & Layout
- **Base Unit**: `4px` / `8px` scale.
- **Containers**: `max-w-7xl` (1120px) centrally aligned (`mx-auto`).
- **Layout System**: Bento-style grid configurations (`grid-cols-1`, `md:grid-cols-3` or `12-column` variants).
- **Gaps**: `gap-6` (24px) or `gap-8` (32px) for structural integrity.

### 2.4 Effects & Depth
- **Glassmorphism (`.glass-card`)**: `rgba(20, 19, 23, 0.6)` background with `blur(12px)` and a subtle `rgba(191, 64, 255, 0.1)` border.
- **Glows**: Traditional drop-shadows are replaced with colored glows. 
  - Primary Glow: `shadow-[0_0_15px_rgba(191,64,255,0.4)]`
- **Border Radii**: 
  - Components: `rounded-lg` (8px), `rounded-xl` (12px)
  - Layout Cards: `rounded-2xl` (16px)

### 2.5 Motion & Interactions
- **Transitions**: `transition-all duration-300` is the standard timing.
- **Interactions**:
  - Hover: `scale-105` for small elements, `scale-[1.02]` for large/full-width buttons.
  - Active (Click): `scale-95` to give physical button feedback.
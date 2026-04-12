# Blueprint Arquitetural: Frontend Sonic Língua

Este documento define os padrões técnicos, visuais e arquiteturais para o desenvolvimento do frontend do Sonic Língua utilizando **React.js**, **TailwindCSS** e arquitetura orientada a features.

O objetivo é garantir consistência visual, escalabilidade técnica e fidelidade ao design premium do produto.

---

# 1. Filosofia do Frontend

O frontend do Sonic Língua deve seguir os princípios de:

- **Feature-Driven Architecture**
- **Design System First**
- **Composition Over Configuration**
- **Visual Consistency Above Individual Preference**
- **Premium UX / Motion-Driven Interfaces**

---

# 2. Diretrizes de Identidade Visual

## Visual Language

O produto deve transmitir:

- Futurismo
- Tecnologia Premium
- Imersão Auditiva / Sensorial
- Elegância Editorial
- Interface Cinematográfica

---

## Estilo Base

### Tema Principal
```text
Dark Premium Interface
```

### Influências Visuais
```text
Glassmorphism
Neo-Brutal Minimalism
Gradient Neon Accents
Editorial Typography
Immersive Motion Design
```

---

# 3. Design Tokens Oficiais

## Core Colors

```ts
background: "#0F0E11"
surface: "#1B191D"
surface-high: "#27252A"

primary: "#DB90FF"
primary-dim: "#B12EF1"

secondary: "#00E3FD"
secondary-dim: "#00D4EC"

tertiary: "#F9F9F9"

outline: "#787479"
outline-variant: "#49474B"

error: "#FF6E84"
```

---

## Semantic Usage

### Backgrounds
```text
background -> App Background
surface -> Base Cards / Panels
surface-high -> Elevated Surfaces / Inputs / Navbars
```

### Accent Colors
```text
primary -> Main CTA / Active States / Glow
secondary -> Secondary Accent / Metadata / Highlights
```

---

# 4. Tailwind Theme Contract

Toda estilização deve utilizar exclusivamente tokens semânticos.

### Proibido
```tsx
bg-[#db90ff]
text-cyan-400
```

---

### Obrigatório
```tsx
bg-primary
text-secondary
bg-surface
```

---

# 5. Tipografia Oficial

## Font Family
```text
Inter
```

---

## Type Scale

### Display Large
```text
64–96px
Weight: 900
Tracking: Tight / Tighter
```

---

### Headline
```text
32–48px
Weight: 700–800
```

---

### Body
```text
14–20px
Weight: 300–400
Line Height: Relaxed
```

---

### Labels / Metadata
```text
10–12px
Weight: 700
Uppercase
Tracking Wide
```

---

# 6. Shape Language

## Border Radius

```ts
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
full: 9999px
```

---

## Component Shape Rules

### Inputs / Buttons
```text
Rounded Full / Pill
```

---

### Cards
```text
Rounded 24–32px
```

---

### Floating Navigation / Mobile Nav
```text
Rounded 32px+
```

---

# 7. Shadows / Glow System

## Primary Glow

```css
0 0 20px rgba(219,144,255,0.35)
```

---

## Secondary Glow

```css
0 0 20px rgba(0,227,253,0.35)
```

---

## Ambient Shadow

```css
0 10px 40px rgba(0,0,0,0.35)
```

---

# 8. Glassmorphism Rules

Utilizar glass effect apenas em superfícies elevadas:

- Topbars
- Floating Panels
- Search Bars
- Modals
- Navigation

---

## Glass Style

```css
background: rgba(45,43,49,0.6)
backdrop-filter: blur(24px)
border: 1px solid rgba(255,255,255,0.05)
```

---

# 9. Motion Design Guidelines

## Interações Obrigatórias

Todo elemento interativo deve possuir feedback visual.

---

### Hover
```text
Brightness Increase
Glow Increase
Border Accent
```

---

### Active / Pressed
```text
scale(0.95)
duration: 150ms
```

---

### Entrance Animations
```text
Fade In
Slide Up
Scale In
Blur Reveal
```

---

## Biblioteca Recomendada
```text
Framer Motion
```

---

# 10. Estrutura de Pastas

```text
src/
├── app/
│   ├── providers/
│   ├── layouts/
│   └── routes/
│
├── features/
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── schemas/
│       ├── types/
│       ├── utils/
│       ├── pages/
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── utils/
│   └── constants/
│
└── styles/
```

---

# 11. Component Library Base

## UI Primitives Obrigatórios

```text
Button
IconButton
Input
SearchInput
Card
GlassPanel
Badge
Tabs
ProgressBar
Navbar
BottomNav
Avatar
Tooltip
Modal
Dropdown
```

---

# 12. Component Rules

## UI Components
Devem ser:

- Stateless sempre que possível
- Sem regra de negócio
- Sem chamadas API
- Altamente composáveis

---

## Feature Components
Podem conter:

- Hooks específicos
- Integração com API
- Lógica de apresentação da feature

---

# 13. Layout Guidelines

## Container Width

```text
max-width: 1280px / 1440px
```

---

## Section Spacing

```text
Mobile: 48px
Desktop: 80–120px
```

---

## Grid Usage

Preferir:

```text
CSS Grid > Flexbox
```

Para layouts estruturais.

---

# 14. Responsividade

## Estratégia
```text
Mobile First
```

---

## Mobile Navigation
Obrigatório Bottom Navigation em mobile.

---

## Breakpoints

```ts
sm: 640
md: 768
lg: 1024
xl: 1280
2xl: 1536
```

---

# 15. Estado e Data Fetching

## Server State
```text
TanStack Query
```

---

## Forms
```text
React Hook Form + Zod
```

---

## Global State
```text
Zustand
```

---

# 16. Performance

## Obrigatório

### Route Lazy Loading
### Image Lazy Loading
### Skeleton Loading States
### Memoização Estratégica

---

# 17. Acessibilidade

Mesmo com visual premium:

Obrigatório:

- Focus States Visíveis
- Navegação por Teclado
- Contraste Mínimo WCAG AA
- aria-labels
- Labels Semânticos

---

# 18. Anti-Patterns Proibidos

## Não Fazer

### Hardcoded Visual Values
```tsx
className="bg-[#db90ff]"
```

---

### Componentes Gigantes
Máximo recomendado:
```text
200 linhas por componente
```

---

### Shared Prematuro
Só abstrair após:
```text
2-3 usos reais
```

---

### Lógica de Negócio em JSX
Mover para hooks/helpers.

---

# 19. Stack Oficial

```text
React
TypeScript
Vite
TailwindCSS
Framer Motion
TanStack Query
React Hook Form
Zod
Zustand
clsx
tailwind-merge
class-variance-authority
Lucide / Material Symbols
```

---

# 20. Regra Suprema

> Todo novo componente/tela deve parecer que foi desenhado pelo mesmo designer e implementado pelo mesmo engenheiro.

Se um componente destoar visualmente:
- Está errado.
- Deve ser refatorado.
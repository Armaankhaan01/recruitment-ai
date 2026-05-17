---
name: SaaS AI Recruiting System
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#09090b'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
  foreground: '#f8fafc'
  muted: '#1e293b'
  accent-gradient: 'linear-gradient(to right, #6366f1, #a855f7)'
  border: '#27272a'
typography:
  display:
    fontFamily: Inter
    fontSize: 3.75rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.015em
  h2:
    fontFamily: Inter
    fontSize: 1.875rem
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.75'
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 280px
  gutter: 1.5rem
  section-gap: 2rem
  component-padding: 1rem
---

# UI/UX & Design Architecture (design.md)
## 1. Visual Identity & Theming
- **Aesthetic:** Minimalist, cinematic, and highly professional "SaaS-style" interface. High-contrast elements with extensive dark mode support.
- **Color Palette:** 
  - Background (Dark): `#09090b` (Zinc 950)
  - Primary Accent: `#3b82f6` (Blue 500) or a sleek primary gradient (Indigo to Purple).
  - Text: `#f8fafc` (Slate 50) for high readability.
- **Typography:** Inter or Geist Sans for a clean, modern tech feel.
## 2. Component Library & Styling
- **Core Library:** `shadcn/ui` based on Radix UI primitives. 
- **Styling Engine:** Tailwind CSS with `tailwind-merge` and `clsx` for dynamic utility class management.
- **Animations:** `framer-motion` for micro-interactions (e.g., smooth modal appearances, skeleton loading states, list reordering when AI ranks candidates).
- **Icons:** `lucide-react`.
## 3. Core Pages & Layouts
1. **Dashboard Layout:** Sidebar navigation with quick stats (Time-to-fill, Total Candidates, AI Parse Success Rate) in the top header.
2. **Job Postings Board:** Kanban-style or Data Table view using `@tanstack/react-table` for sorting and filtering open positions.
3. **Candidate Profile View:** A split-pane view. Left side: Uploaded PDF resume. Right side: AI-generated candidate summary, matching score, and extracted key skills.
## 4. User Experience (UX) Rules
- **Optimistic UI:** Use React's `useOptimistic` or React Query mutations to show instant feedback before the server responds.
- **Loading States:** Never use generic spinners. Use UI skeletons that mimic the shape of the data loading.
- **Form Handling:** All forms must use `react-hook-form` integrated with `zod` for strict schema validation and error messaging.
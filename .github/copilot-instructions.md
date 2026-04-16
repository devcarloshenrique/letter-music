# Project Guidelines

## Code Style
Both Frontend and Backend are built with **TypeScript**.
- **Frontend**: React + Vite. Uses strict type-aware linting (`tseslint.configs.strictTypeChecked`). See `frontend/eslint.config.js`.
- **Backend**: Node.js + Express. Adheres closely to SOLID principles and interface-based dependency injection.

## Architecture
This workspace contains a full-stack application (Sonic Língua) for learning languages through music. It is split into two primary environments:

- **Backend (`backend/`)**: Uses **Vertical Slice Architecture (VSA)**. Features are isolated by domain under `backend/src/features/`. Each slice contains everything needed for a complete operation (Controller, UseCase, DTO, Spec, and Swagger) to minimize technical coupling. For the complete structural philosophy, see `backend/blueprint.md`.
- **Frontend (`frontend/`)**: Uses **Feature-Driven Architecture** and **Composition Over Configuration**. Code is organized by feature under `frontend/src/features/`.

## Build and Test
- **Frontend (`cd frontend`)**: 
  - Install: `npm install`
  - Run dev: `npm run dev`
  - Build: `npm run build`
- **Backend (`cd backend`)**:
  - Install: `npm install`
  - Run dev: `npm run dev`
  - Test: `npx vitest` (See `backend/vitest.config.ts` for config)

## Conventions
- **Backend API Responses**: ALL controller responses must follow the strict Envelope Pattern for success and errors. See `backend/blueprint.md` (Section 3).
- **Backend Scraping**: Web scraping logic is isolated in `backend/src/shared/providers/scraping/`. Never bypass `iser-scraping.provider.ts`.
- **Frontend Styling**: Strictly adhere to the "Neon Dark" premium Design System tokens. Do not use raw colors or generic Tailwind classes (e.g., avoid `text-white` or `bg-[#000]`). Use semantic variables exclusively (e.g., `text-primary`, `bg-surface`, `bg-surface-high`). See `frontend/memory.md` and `frontend/design-system/DESIGN.md` for styling principles.
- **Frontend Lyrics Playback**: Keep a single mounted YouTube host across route transitions to prevent handoff stutter. When docking the video in the lyrics workspace, use visual projection (CSS position sync) instead of iframe reparenting. See `frontend/docs/lyrics-player-persistence.md` and `.github/skills/persistent-lyrics-player/SKILL.md`.
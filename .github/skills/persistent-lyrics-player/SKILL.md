---
name: persistent-lyrics-player
description: Implement and protect uninterrupted YouTube playback across route transitions while keeping the video docked in the lyrics sidebar without iframe remounts.
---

# Persistent Lyrics Player

Use this skill whenever you modify lyrics playback, global player hosting, workspace docking, route transitions, or sidebar video rendering.

## Goal

Guarantee both outcomes at the same time:

- uninterrupted audio when navigating between screens
- visible video in the lyrics sidebar on desktop layout

## Required Architecture

- Keep one mounted `<YouTube />` instance for the active playback context.
- Mount `GlobalLyricsPlayerHost` at app root level.
- Do not reparent or remount the iframe to switch layouts.
- In docked mode, project the host visually to the sidebar slot via CSS geometry sync.

## Approved Pattern

1. Keep host in root layout and control behavior via `mode` only.
2. Use a stable slot id in workspace sidebar: `lyrics-sidebar-video-slot`.
3. Sync position with `requestAnimationFrame` and `getBoundingClientRect()`.
4. Update wrapper inline styles: top, left, width, height, opacity, pointer-events.
5. Preserve sidebar structure with a fixed-size slot placeholder.

## Forbidden Patterns

- Multiple simultaneous `<YouTube />` instances for the same playback state.
- Portal-based or parent-swapping render strategies that can remount iframe.
- Conditional unmount of global host during route transitions.
- Layout hacks that remove the slot container or collapse its height.

## Validation Checklist

Run this checklist before concluding:

1. Start playback on Home and navigate to Lyrics: audio must continue.
2. Navigate Lyrics -> Home: audio must continue.
3. Desktop workspace sidebar shows live video (not only thumbnail).
4. No overlap with sidebar controls, no flex collapse, no black flash regression.
5. Run frontend build (`npm run build`) successfully.

## Relevant Paths

- `frontend/src/app/layouts/root-layout.tsx`
- `frontend/src/features/lyrics/components/global-lyrics-player-host.tsx`
- `frontend/src/features/lyrics/pages/lyrics-workspace-page.tsx`
- `frontend/src/features/lyrics/components/lyrics-control-panel.tsx`

## Notes

If a new layout mode is introduced, extend the mode contract without changing host ownership in the React tree.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

sofi-anki — a personal-use Anki clone. Keep it simple; no need for multi-user features, auth, or backend complexity. Built with React + TypeScript, Vite 8, Tailwind CSS 4, and the React Compiler (via Babel plugin).

## Development Guidelines

- Use **Tailwind CSS** for all styling.
- Use **shadcn/ui** for UI components. Do not create shadcn components manually — ask the user to run the CLI (`pnpm dlx shadcn@latest add <component>`) to add them.

## Commands

- `pnpm dev` — start dev server with HMR
- `pnpm build` — type-check (`tsc -b`) then bundle with Vite
- `pnpm lint` — ESLint across all TS/TSX files
- `pnpm preview` — serve the production build locally

Package manager is **pnpm**.

## Architecture

- `src/main.tsx` — React entry point, renders `<App />` into `#root` with StrictMode.
- `src/App.tsx` — root component (currently the Vite starter template).
- `src/index.css` — global styles; imports Tailwind and defines CSS custom properties for theming (light/dark via `prefers-color-scheme`).
- `src/App.css` — component-level styles for App.
- Path alias: `@/*` maps to `./src/*` (configured in `tsconfig.app.json`).

## Tech Notes

- React Compiler is enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` in `vite.config.ts`.
- Tailwind 4 uses the Vite plugin (`@tailwindcss/vite`) — no `tailwind.config` file; configuration is done in CSS with `@import "tailwindcss"`.
- TypeScript target is ES2023; strict unused-variable/parameter checks are on (`noUnusedLocals`, `noUnusedParameters`).

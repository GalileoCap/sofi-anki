# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

sofi-anki is a personal-use Anki clone. Keep it simple: no multi-user features, auth, or backend. Built with React + TypeScript, Vite 8, Tailwind CSS 4, and the React Compiler (via Babel plugin).

## Development Guidelines

- Use **Tailwind CSS** for all styling.
- Use **shadcn/ui** for UI components. Do not create shadcn components manually: ask the user to run the CLI (`pnpm dlx shadcn@latest add <component>`) to add them.

## Commands

- `pnpm dev`: start dev server with HMR
- `pnpm build`: type-check (`tsc -b`) then bundle with Vite
- `pnpm lint`: ESLint across all TS/TSX files
- `pnpm preview`: serve the production build locally

Package manager is **pnpm**.

## Architecture

- `src/main.tsx`: React entry point, renders `<App />` into `#root` with StrictMode.
- `src/App.tsx`: root component, switches between the deck list, a deck, a study session, a deck's stats, the global stats and a shared deck (the `View` union).
- `src/index.css`: global styles. It imports Tailwind and defines the CSS custom properties for theming (light and dark).
- Path alias: `@/*` maps to `./src/*` (configured in `tsconfig.app.json`).

## Tech Notes

- React Compiler is enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` in `vite.config.ts`.
- Tailwind 4 uses the Vite plugin (`@tailwindcss/vite`), so there is no `tailwind.config` file: configuration is done in CSS with `@import "tailwindcss"`.
- TypeScript target is ES2023; strict unused-variable/parameter checks are on (`noUnusedLocals`, `noUnusedParameters`).

## Documents

- [docs/session-kit-adoption.md](docs/session-kit-adoption.md): what the project lacks against the session-kit rules and `CODE.md`, and the plan to close it.

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

A brochure website for Newlands Cottages guest house in Cape Town. Built with Astro (static site generator), TailwindCSS v4, and Flowbite components. Hosted on Netlify with automatic deploys.

- **Production:** https://newlandscottages.co.za/
- **Staging:** Netlify Deploy Previews auto-generated for PRs

## Architecture

### Tech Stack

- **Astro 5** - Static site generator with `.astro` component format
- **TailwindCSS 4** - Configured via `@tailwindcss/vite` plugin in astro.config.mjs
- **Flowbite** - UI component library loaded via CDN in BaseLayout.astro

### Key Files

- `astro.config.mjs` - Site URL and base path configured via environment variables (SITE_URL, BASE_URL)
- `src/layouts/BaseLayout.astro` - Main layout with SEO, OpenGraph, and structured data (JSON-LD)
- `src/styles/global.css` - Global styles imported by BaseLayout

### Utilities

- `src/utils/url.ts` - Contains `joinWithBase()` helper for handling base URL paths

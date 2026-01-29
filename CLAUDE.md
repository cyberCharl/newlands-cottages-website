# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A brochure website for Newlands Cottages guest house in Cape Town. Built with Astro (static site generator), TailwindCSS v4, and Flowbite components. Hosted on Netlify with automatic deploys.

- **Production:** https://newlandscottages.co.za/
- **Staging:** Netlify Deploy Previews auto-generated for PRs

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
npm run format   # Format code with Prettier
```

## Architecture

### Tech Stack
- **Astro 5** - Static site generator with `.astro` component format
- **TailwindCSS 4** - Configured via `@tailwindcss/vite` plugin in astro.config.mjs
- **Flowbite** - UI component library loaded via CDN in BaseLayout.astro

### Key Files
- `astro.config.mjs` - Site URL and base path configured via environment variables (SITE_URL, BASE_URL)
- `src/layouts/BaseLayout.astro` - Main layout with SEO, OpenGraph, and structured data (JSON-LD)
- `src/styles/global.css` - Global styles imported by BaseLayout

### Pages
- `/` - Home (index.astro)
- `/clarkia-guest-cottage` - Cottage details with image carousel
- `/about` - About page
- `/contact-us` - Contact page with embedded map

### Components
- `Header.astro` - Flowbite navbar with responsive mobile menu
- `Footer.astro` - Site footer
- `ImageCarousel.astro`, `CarouselSlide.astro`, `CarouselDots.astro` - Custom swipeable carousel with GLightbox for fullscreen viewing
- `AmenitiesSection.astro` - Cottage amenities display
- `BookBanner.astro` - Call-to-action booking banner
- `Map.astro` - Embedded Google Map

### Utilities
- `src/utils/url.ts` - Contains `joinWithBase()` helper for handling base URL paths

## Deployment

- **Main branch** → Auto-deploys to Netlify production
- **Pull Requests** → Auto-generates Netlify Deploy Preview
- **Stage branch** → Deploys to GitHub Pages via `.github/workflows/stg_deploy.yml`

## Development Workflow

Uses GitHub Flow (trunk-based development):
1. Create feature branch from `main` (e.g., `feature/add-gallery`, `fix/phone-number`)
2. Open PR against `main`
3. Review via Netlify Deploy Preview link
4. Squash and merge to `main`
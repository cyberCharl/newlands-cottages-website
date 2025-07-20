# Newlands Cottages Website

[![Netlify Deploy Status](https://api.netlify.com/api/v1/badges/fe7fd6ac-e35a-4865-97d1-8c1fc4a31065/deploy-status)](https://app.netlify.com/projects/newlandscottages/deploys)

A simple, fast, and responsive brochure website for Newlands Cottages guest house.

- **Production:** [https://newlandscottages.co.za/](https://newlandscottages.co.za/)
- **Staging:** Staging environments are generated automatically for each Pull Request via Netlify Deploy Previews.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) (Static Site Generator)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **Components:** [Flowbite](https://flowbite.com/)
- **Hosting:** [Netlify](https://www.netlify.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Local Development

1.  Clone the repository:

    ```bash
    git clone https://github.com/cybercharl/newlands-cottages-website.git
    cd newlands-cottages-website
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the local development server:
    ```bash
    npm run dev
    ```
    This will start a hot-reloading development server, typically at `http://localhost:4321`.

## Development and Deployment Workflow

This project uses a simplified trunk-based development model (GitHub Flow).

1.  **Create a Feature Branch:** All new work (features, fixes, content updates) must be done in a branch created from `main`. Use a descriptive name.

    ```bash
    # Example for a new feature
    git checkout -b feature/add-photo-gallery

    # Example for a bug fix
    git checkout -b fix/correct-phone-number
    ```

2.  **Commit Changes:** Make your changes and commit them with clear, concise messages.

3.  **Open a Pull Request:** When your work is complete, push the branch to GitHub and open a Pull Request (PR) against the `main` branch.

4.  **Review and Stage:** A Netlify Deploy Preview link will be automatically generated and posted as a comment in your PR. Use this link to review your changes in a live, staging-like environment.

5.  **Merge to Production:** Once the PR is approved, merge it into `main` using the **"Squash and Merge"** option on GitHub. This keeps the `main` branch history clean and atomic.

6.  **Automatic Deployment:** Merging to `main` automatically triggers a production deployment via Netlify.

## Website Structure

1.  **Home:** `/`
2.  **Cottage Details:** `/clarkia-guest-cottage`
3.  **About:** `/about`
4.  **Contact:** `/contact-us`

## 🚀 Project Structure

_{ Stuff from the Astro starter. Might still be useful later }_

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

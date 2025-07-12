**TASK:** Modify the Astro project to automate deployment to GitHub Pages. This involves updating the Astro configuration and adding a GitHub Actions workflow file.

**INSTRUCTIONS:**

1.  **Modify `astro.config.mjs`:**
    *   Open the `astro.config.mjs` file.
    *   Add two new properties inside the `defineConfig` object: `site` and `base`.
    *   The `site` property should be the full URL to your GitHub Pages site.
    *   The `base` property should be the name of your repository, preceded by a forward slash.

    ```javascript
    import { defineConfig } from 'astro/config';

    // https://astro.build/config
    export default defineConfig({
      // Add these two lines:
      site: 'https://cyberCharl.github.io',
      base: '/newlands-cottages-website',
    });
    ```

2.  **Create the GitHub Actions Workflow File:**
    *   Create a new directory structure: `.github/workflows/`.
    *   Inside the `.github/workflows/` directory, create a new file named `deploy.yml`.
    *   Populate `deploy.yml` with the following content. This workflow will trigger on every push to the `main` branch, build the Astro site, and deploy the output to the `gh-pages` branch.

    ```yaml
    name: Deploy to GitHub Pages

    on:
      push:
        branches:
          - main

    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout 🛎️
            uses: actions/checkout@v4

          - name: Setup Astro and Deploy 🚀
            uses: withastro/action@v2
            # with:
              # path: . # The root location of your Astro project. (optional)
              # node-version: 20 # The specific Node.js version to use. (optional)
              # package-manager: npm # The package manager to use. (optional)

    ```
---
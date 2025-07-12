**TASK:** Modify the existing `.github/workflows/deploy.yml` file to grant the necessary permissions for deploying to GitHub Pages.

**INSTRUCTIONS:**

1.  Open the file `.github/workflows/deploy.yml`.
2.  Add a `permissions` block at the top level of the file, right after the `on:` block. This will grant the required permissions to the entire workflow.
3.  The `permissions` block must contain:
    *   `pages: write` (Allows the action to deploy to GitHub Pages)
    *   `id-token: write` (Required for authentication with GitHub's internal services)

**Here is the complete, corrected `deploy.yml` file:**

```yaml
name: Deploy to GitHub Pages

on:
  # Triggers the workflow on push events to the main branch
  push:
    branches:
      - main

# Add this permissions block
permissions:
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v4

      - name: Setup Astro and Deploy 🚀
        uses: withastro/action@v2
        # No 'with' block is needed for a standard setup
```
# Dev setup & stuff

## Dev & deployment flow

`dev` branch – all commits, run locally, save progress
* PR (squash merge) into stage to deploy to staging env

`stage` branch – deploy on PR to github pages via Github Action
* @ [https://cybercharl.github.io/newlands-cottages-website/]()
* PR (rebase and fast-forward) into main to deploy to live link

`main` branch – deployed to Netlify (still todo)
* @ [https://newlandscottages.co.za/]() (still todo):
    * Config the DNS records and set up deployment correctly

# Project Stack and Website Structure
## Stack

(todo: add nice banners here for the tech used)
* Astro static site generator
* TailwindCSS
* Flowbite component Library

## Website Structure

1. **Home (/)**

2. **Cottage Details (/clarkia-guest-cottage)**

3. **About (/about)**

4. **Contact (/contact-us)**

## Project Structure


# Astro Starter Kit: Basics

## 🚀 Project Structure

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

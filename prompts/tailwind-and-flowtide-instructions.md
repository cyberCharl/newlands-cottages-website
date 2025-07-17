### **Instructions**

**TASK:**
Refactor an existing 2-page Astro website to use Tailwind CSS and Flowbite components. Expand the site to four pages using the provided copy. Replace all custom CSS, inline styles, and custom JavaScript for UI components (like the navigation) with Flowbite's pre-built, interactive components.

**CONTEXT:**
The current project uses custom CSS, inline styles, and custom JavaScript for the hamburger menu. The image carousel on the cottage page has already been implemented. The goal is to remove the custom styling and JS in favor of a standardized system using Tailwind and Flowbite, while keeping the existing functionality for the carousel.

**INPUTS:**
The user will provide the complete, refined copy for all four pages in a separate Markdown document `Newlands Cottages New Copy.md`. Use this copy as the source of truth for all text content on the respective pages.

---

### **CORE REQUIREMENTS & ACTION PLAN**

**1. Setup and Configuration:**

- **Install Tailwind CSS:** Use the Astro CLI to add Tailwind to the project: `npx astro add tailwind`.
- **Install Flowbite:** Add Flowbite and its dependencies to the project: `npm install -D flowbite flowbite-typography`.
- **Configure Tailwind:** Modify `tailwind.config.cjs` to include the Flowbite plugin and content paths:
  ```javascript
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: [
      './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
      './node_modules/flowbite/**/*.js', // Add this line
    ],
    theme: {
      extend: {},
    },
    plugins: [
      require('flowbite/plugin'), // Add this line
      require('flowbite-typography'), // Add this line
    ],
  };
  ```

**2. Global Refactoring (`BaseLayout.astro`):**

- **Remove Old CSS:** Delete the link to `global.css`. All styling will now come from Tailwind.
- **Implement Flowbite Navbar:** Replace the entire existing `<header>` and mobile navigation overlay with a responsive Navbar component from Flowbite. It must include the logo, links to "Home," "Clarkia Cottage," "About," and "Contact," and have a built-in, functional hamburger menu for mobile.
- **Refactor Footer:** Re-style the footer using Tailwind's flexbox and typography utilities for clean alignment.

**3. Page-Specific Refactoring:**

- **`index.astro` (Home Page):**
  - Remove all inline `style` attributes from the hero section.
  - Recreate the hero section layout using Tailwind CSS utility classes (e.g., `relative`, `flex`, `items-center`, `justify-center`, `z-10`, `p-8`, `bg-black/50`).
  - Use Flowbite's "Button" components for the "View The Cottage" and "Book Now" links.

- **`cottage.astro` (Cottage Details Page):**
  - **Style the Swiper Carousel:** Keep the existing Swiper.js implementation, but remove all associated custom CSS. Re-style the carousel container, navigation arrows (`<`, `>`), and pagination dots using only Tailwind utility classes. The arrows should be styled as clean, circular buttons positioned over the carousel.
  - **Refactor Content Sections:** Re-style the "About the Space" and "Amenities" sections using Tailwind's typography and layout utilities. The amenities list should be a responsive two-column grid on larger screens that collapses to a single column on mobile.
  - **Refactor Booking Button:** Replace the final "Book Now" link with a large, prominent Flowbite Button component.

**4. New Page Creation (Mobile-First Design):**

- **`about.astro`:**
  - **Layout:** Create a clean, readable page. On mobile, it should be a single column: an image of the cottage, followed by the "Our Story" headline and text, then the "Location" headline and text, and finally a placeholder for testimonials.
  - **Content:** Use the provided copy from the Markdown document for all text.
  - **Styling:** Use the `prose` class from `@tailwindcss/typography` or `flowbite-typography` on the main content container for beautiful, readable text styling out-of-the-box.

- **`contact.astro`:**
  - **Layout:** Create a two-section layout that stacks on mobile.
  - **Section 1 (Contact Info):** Display the email, phone, and address details clearly. Use Tailwind's flexbox and spacing utilities.
  - **Section 2 (Map Placeholder):** Create a container with a placeholder background color and text that says "Embedded Google Map will be here." This container should have an aspect ratio of 16:9 or 4:3.
  - **No Form:** Do not add a contact form for this iteration.

**5. Deferred Tasks (Explicitly Exclude):**

- **Do not** implement a live Google or TripAdvisor review feed. A simple `<h2>What Our Guests Say</h2>` headline with a paragraph placeholder on the `about.astro` page is sufficient for now.

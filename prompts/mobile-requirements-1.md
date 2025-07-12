### Astro Mobile Adjustments

**TASK:** Modify the existing Astro project (`index.astro`, `cottage.astro`, `BaseLayout.astro`, `global.css`) to incorporate specific mobile-responsive features.

**MODIFICATION REQUIREMENTS:**

1.  **Hamburger Menu Implementation:**
    *   **Behavior:** On screens with a `max-width` of `768px` (or whatever `medium` breakpoint is used in `global.css`), the main navigation links in the header (`Home`, `The Cottage`) should be hidden.
    *   **Trigger:** A "Hamburger" icon (`☰`) should appear in the header on mobile. Clicking this icon should toggle the visibility of an overlay navigation menu.
    *   **Overlay Menu:** When active, the overlay menu should cover only the necassary screen sapce, display the navigation links vertically, and include a "Close" (`✕`) button.
    *   **Implementation:** Use vanilla JavaScript for the toggle functionality. Do *not* introduce any new JavaScript frameworks or libraries. Ensure ARIA attributes for accessibility (e.g., `aria-expanded`, `aria-controls`).
    *   **CSS:** Provide the necessary CSS for styling the hamburger icon, the overlay, and its active state.

2.  **Sticky "Book Now" Banner:**
    *   **Behavior:** On the `cottages.astro`page, add a sticky banner at the bottom of the viewport. This banner should be visible on mobile devices (screens with a `max-width` of `768px` or `medium` breakpoint).
    *   **Content:** The banner should contain **only** the "Check Availability & Book Now" button, linking to `https://book.nightsbridge.com/12344` and opening in a new tab (`target="_blank"`).
    *   **Styling:** The banner should have a distinct but subtle background color, be full-width, and z-indexed above other content. Ensure it does not obstruct content unnecessarily.
    *   **Placement:** The `cottage.astro` page should still retain its original "Book Now" button within the main content for larger screens or users who scroll. The sticky banner is an *addition* for mobile UX.

3.  **Image Gallery and Carousel Functionality (for `cottage.astro`):**
    *   **Initial View:** The four cottage images on `cottage.astro` should be displayed in a responsive grid layout. They should not stack vertically on larger screens.
    *   **Click-to-Enlarge/Carousel:** When any image in the grid is clicked:
        *   An overlay modal should appear, displaying a larger version of the clicked image.
        *   The modal should include "Next" and "Previous" navigation arrows to cycle through all images in a carousel.
        *   A "Close" (`✕`) button should be present in the modal.
    *   **Implementation:** Again, use vanilla JavaScript for the modal and carousel logic. Do *not* introduce any new JavaScript frameworks or libraries. Implement lazy loading for the images within the carousel for performance. Ensure accessibility with appropriate ARIA roles and keyboard navigation.
    *   **CSS:** Provide all necessary CSS for the gallery grid, modal overlay, carousel navigation, and image styling.

**FILE MODIFICATIONS REQUIRED:**

*   `src/layouts/BaseLayout.astro` (for header/hamburger, potentially shared sticky banner structure)
*   `src/pages/index.astro` (for ensuring consistent header behavior)
*   `src/pages/cottage.astro` (for sticky banner, image gallery/carousel)
*   `public/styles/global.css` (for all new styling)

Ensure all new JavaScript is integrated correctly within Astro components (e.g., using `<script>` tags).
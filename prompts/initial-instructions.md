**TASK:** Generate the complete code for a two-page static website for a guest house business called "Newlands Cottages".

**PROJECT REQUIREMENTS:**

1.  **File Structure:** Create four files:
    *   `src/pages/index.astro` (Landing Page)
    *   `src/pages/cottage.astro` (Cottage Details Page)
    *   `src/layouts/BaseLayout.astro` (Reusable Layout Component)
    *   `src/styles/global.css` (Shared Stylesheet)

2.  **Global Styling (`src/styles/global.css`):**
    *   **Font:** Import 'Inter' from Google Fonts and apply it to all text.
    *   **Color Palette:**
        *   Primary Text: `#1a1a1a`
        *   Background: `#fdfdfd`
        *   Primary Accent (buttons, links): `#004d40` (a dark teal/green)
        *   Accent Hover: `#00382e`
    *   **Layout:**
        *   Implement a `box-sizing: border-box;` reset.
        *   The main content on all pages should be contained within a `div` with a `max-width` of `1100px` and centered horizontally.
        *   Ensure the layout is fully responsive using media queries for tablet and mobile screen sizes (e.g., breakpoints at `768px` and `480px`).

3.  **`src/layouts/BaseLayout.astro` - Reusable Layout:**
    *   This component will encapsulate the common HTML structure, including the `doctype`, `html`, `head`, and shared header/footer.
    *   It should accept `title` and `description` props for SEO.
    *   It should include the `global.css` import.
    *   It must use `<slot />` to render page-specific content.
    *   **Header:**
        *   Business Name: `Newlands Cottages`
        *   Navigation: Links to "Home" (`/`) and "Clarkia Cottage" (`/clarkia`).
    *   **Footer:**
        *   Contact Information: `Contact: info@clarkia.co.za` (make this a `mailto:` link).
        *   Copyright: `© 2018 Newlands Cottages. All rights reserved.`

4.  **`src/pages/index.astro` - Landing Page:**
    *   Use the `BaseLayout` component.
    *   **Props to BaseLayout:**
        *   `title="Newlands Cottages | Tranquil Self-Catering Accommodation"`
        *   `description="Discover peace and privacy at Newlands Cottages. A fully-equipped, self-catering cottage perfect for your next getaway. Book your stay today."`
    *   **Page-specific Content (within BaseLayout):**
        *   **Main Content (Hero Section):**
            *   A large, high-quality hero image that spans the width of the viewport. Use a placeholder: `https://via.placeholder.com/1920x1080`.
            *   Overlay text on the hero image:
                *   `<h1>` Headline: `Your Private Escape in Newlands`
                *   `<p>` Sub-headline: `A serene, fully-equipped cottage offering comfort and tranquility.`
                *   A prominent button styled with the primary accent color:
                    *   Text: `View The Cottage`
                    *   Link: `/cottage`


5.  **`src/pages/cottage.astro` - Cottage Details Page:**
    *   Use the `BaseLayout` component.
    *   **Props to BaseLayout:**
        *   `title="Clarkia Guest Cottage | Newlands Cottages Accommodation Details"`
        *   `description="View photos, amenities, and details for our private self-catering cottage. Features a full kitchen, private garden, and modern comforts."`
    *   **Page-specific Content (within BaseLayout):**
        *   `<h1>` Headline: `Clarkia Guest Cottage`
        *   **Photo Gallery:**
            *   Create a responsive grid of 4 images using CSS Grid.
            *   Use placeholders: `https://via.placeholder.com/600x400` for each image.
        *   **Description Section:**
            *   `<h2>` Sub-heading: `About the Space`
            *   `<p>` Paragraph: `Clarkia Cottage is a two bedroom, two bathroom self-catering cottage.  The bedrooms contain either a king-size bed or 2 single beds. One bathroom is en-suite with a bath and shower – the second bathroom is off the living area with only a shower.  The TV/kitchen/dining area is open plan with a fridge, 2ring gas hob, convection steam oven, microwave, Nespresso coffee machine, kettle, toaster, tv and combustion wood fireplace.  There is a private front garden with a porch and a back patio with a Weber braai. The cottage has a separate entrance, parking space for 1 sedan car, alarm and good security.  Newlands/Rondebosch area is very central and easy driving (10-15min) to City Centre.`
        *   **Amenities Section:**
            *   `<h2>` Sub-heading: `Amenities`
            *   An unordered list (`<ul>`) with two columns. Include items like:
                *   `<li>`Queen-size Bed`</li>`
                *   `<li>`High-speed Wi-Fi`</li>`
                *   `<li>`Fully-equipped Kitchenette`</li>`
                *   `<li>`Nespresso Machine`</li>`
                *   `<li>`Private Garden & Patio`</li>`
                *   `<li>`Secure Off-street Parking`</li>`
                *   `<li>`Smart TV with Netflix`</li>`
                *   `<li>`En-suite Bathroom with Shower`</li>`
        *   **Booking Section:**
            *   A large, centered, and highly visible button.
            *   Text: `Check Availability & Book Now`
            *   Link: `https://book.nightsbridge.com/12344`
            *   This button should open the link in a new tab (`target="_blank"`).

Generate the code for all four files.
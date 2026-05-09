# Host payment middleware on Cloudflare

The site is moving from Netlify to Cloudflare so the Yoco/Beds24 payment middleware can use Cloudflare Workers with D1 as its native persistent store. Netlify Functions plus Netlify Database and Vercel Functions plus Marketplace storage were both viable, but Cloudflare gives this project the simplest first-party SQL persistence for recording payment attempts, Yoco webhook events, and Beds24 notification attempts without introducing a separate database vendor.

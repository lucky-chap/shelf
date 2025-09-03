# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Digital Store with file uploads and Stripe checkout
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup

## Features

- Links
  - Create, update, delete, and reorder links (drag-and-drop)
  - Click tracking and analytics
  - Link scheduling for time-limited promotions

- Digital Store
  - Upload and sell digital products (PDFs, images, etc.)
  - Stripe integration for secure payments
  - Free downloads (price = 0) with instant access
  - File uploads for cover photos and digital products
  - Secure download URLs with automatic expiration

- Guestbook
  - Public submissions with moderation
  - Export entries as JSON or CSV

- Site Settings
  - Title, description, avatar URL
  - Theme presets and custom colors
  - Custom domain configuration with DNS verification

- Custom Domains
  - Connect your own domain name
  - Automatic DNS verification
  - Step-by-step setup instructions
  - SSL certificate provisioning

- Admin
  - Password-protected admin dashboard
  - No third-party auth required

## Analytics

The analytics view includes:
- Total link clicks
- Total guest messages and pending moderation count
- Top performing links
- Recent guestbook activity
- Visitor analytics with device and location breakdown
- Link-specific heatmaps and click patterns

## Custom Domain Setup

Users can configure custom domains for their landing pages:

1. Domain Configuration: Enter your domain in the admin settings
2. DNS Verification: System checks for proper DNS configuration
3. Setup Instructions: Step-by-step guides for popular domain providers
4. SSL Certificates: Automatically provisioned for verified domains

### DNS Records Required

- CNAME Record: Points your domain to the hosting platform
- TXT Record: Verifies domain ownership

The system provides real-time verification and detailed setup instructions for popular domain providers including GoDaddy, Namecheap, and Cloudflare.

## Environment Variables (Frontend vs Backend)

This project uses different environment variable conventions for the frontend (Vite) and the backend (Node/Encore):

- Frontend (Vite):
  - Only variables prefixed with VITE_ are exposed to the browser.
  - Access with import.meta.env.VITE_YOUR_KEY.

- Backend (Node/Encore):
  - Access with process.env.YOUR_KEY (server-side only).
  - If you deploy on Encore, you can also configure [Secrets] in the Infrastructure tab. The backend will first check process.env and then fall back to Encore Secrets when available.

Create a .env file in the project root by copying .env.example and filling in your values.

Example .env:

VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

Notes:
- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE_ to the browser runtime.

## Required Configuration

### Stripe (Required for Digital Store)

To enable the Digital Store and paid checkout with Stripe, you must set these env vars:

- Frontend env (Vite):
  - VITE_STRIPE_PUBLISHABLE_KEY = pk_test_... (publishable key, safe to expose)

- Backend env (Node/Encore):
  - STRIPE_SECRET_KEY = sk_test_... (secret key, server-side only)
  - STRIPE_WEBHOOK_SECRET = whsec_... (required only if you plan to receive webhooks)

After adding variables:
1. Restart the app so changes take effect.
2. Open Admin → Store and confirm the Stripe status shows “Stripe: Configured” and “Digital Store is enabled.”

Test the store:
1. Set the variables above.
2. Open Admin → Store → Add Product.
3. Upload a cover photo and digital file, set a price > 0.
4. Visit the landing page and click “Buy Now” to test Stripe checkout.
5. Use test card: 4242 4242 4242 4242, any future date, any CVC.

If keys are missing:
- The app will not crash; only the Digital Store will be disabled.
- A clear message is logged in the console and shown in the Admin panel explaining how to configure Stripe.

## Optional Configuration

- Unsplash is OPTIONAL (enables Unsplash background selection in Theme Settings). If not set, the Unsplash option will be hidden.

Optional configuration:
- Frontend (Vite env, in .env):
  - VITE_UNSPLASH_ACCESS_KEY (optional, only for client-side references)

- Backend (Node env, in .env or Encore Secrets):
  - UNSPLASH_ACCESS_KEY (optional, used server-side when searching Unsplash)

Important:
- Never put secret keys in frontend code.
- The Unsplash backend API validates that UNSPLASH_ACCESS_KEY is set, or returns a clear error.

### Unsplash Configuration

- Backend env:
  - UNSPLASH_ACCESS_KEY = your_unsplash_key (server-side)

- Frontend env:
  - VITE_UNSPLASH_ACCESS_KEY = your_unsplash_key (used for enabling the UI option)

- Test Unsplash image search:
  1. Set both UNSPLASH_ACCESS_KEY and VITE_UNSPLASH_ACCESS_KEY.
  2. Open Admin → Settings → Theme → Background Settings.
  3. Choose "Unsplash Image", search, and select an image.
  4. Save settings, then preview on the landing page.

## General Notes

- Ensure .env is loaded for both Vite (frontend) and Node/Encore (backend).
- Never hardcode keys; always use environment variables (or Encore Secrets for backend).
- Clear errors are returned if configuration is missing or invalid.
- For Stripe testing, use test card numbers: https://stripe.com/docs/testing#cards

[Secrets]: https://encore.dev/docs/primitives/config

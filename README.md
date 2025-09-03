# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup
- Digital Store for selling/serving digital products (Stripe for paid items)

## Features

- Links
  - Create, update, delete, and reorder links (drag-and-drop)
  - Click tracking and analytics
  - Link scheduling for time-limited promotions

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

- Digital Store
  - Upload products (cover photo + digital file)
  - Fixed-price or free products (no pay-what-you-want)
  - Stripe Checkout for paid items
  - Secure download URLs for delivered files

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

Create a .env file in the project root by copying .env.example and filling in your real values.

Example .env:

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_123
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
STRIPE_SECRET_KEY=sk_test_123
STRIPE_WEBHOOK_SECRET=whsec_123
UNSPLASH_ACCESS_KEY=your_unsplash_key

Notes:
- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE_ to the browser runtime.

## Mandatory Configuration

- Stripe is REQUIRED (Checkout and secure downloads).
- Unsplash is OPTIONAL (enables Unsplash background selection in Theme Settings). If not set, the Unsplash option will be hidden.

Required configuration:
- Frontend (Vite env, in .env):
  - VITE_STRIPE_PUBLISHABLE_KEY (must start with pk_)
  - VITE_UNSPLASH_ACCESS_KEY (optional, only for client-side references)

- Backend (Node env, in .env or Encore Secrets):
  - STRIPE_SECRET_KEY (must start with sk_)
  - STRIPE_WEBHOOK_SECRET (optional, must start with whsec_ if you use webhooks)
  - UNSPLASH_ACCESS_KEY (optional, used server-side when searching Unsplash)

Important:
- Never put secret keys (sk_ or whsec_) in frontend code.
- The backend validates that STRIPE_SECRET_KEY exists and starts with "sk_" when Stripe functionality is used.
- The webhook endpoint validates STRIPE_WEBHOOK_SECRET if configured.
- The Unsplash backend API validates that UNSPLASH_ACCESS_KEY is set, or returns a clear error.

### Stripe Configuration

- Backend env:
  - STRIPE_SECRET_KEY = sk_test_...
  - STRIPE_WEBHOOK_SECRET = whsec_... (optional unless using webhooks)

- Frontend env:
  - VITE_STRIPE_PUBLISHABLE_KEY = pk_test_...

- Test payment flow:
  1. Set environment variables as above and restart the app.
  2. Create a product in the Admin dashboard (Store tab) and set a price (>= $0.50 for paid, or 0 for free).
  3. On the public page, click Buy/Download on the product card.
  4. For paid products, you will be redirected to Stripe Checkout. Use Stripe test card 4242 4242 4242 4242 with any valid future expiry and any CVC and ZIP.
  5. After payment, you will land at /checkout/success where the app verifies the session and provides a signed download link.

- Webhook (optional but recommended):
  - Endpoint: POST /store/stripe/webhook
  - Set the webhook secret (STRIPE_WEBHOOK_SECRET) from your Stripe Dashboard → Developers → Webhooks.
  - The webhook handler validates events using the configured secret. Due to framework request parsing, if signature verification fails, it falls back to verifying the event by retrieving it using the event id from Stripe's API.

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

[Secrets]: https://encore.dev/docs/primitives/config

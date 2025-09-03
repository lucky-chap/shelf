# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup
- Digital store powered by Stripe (sell digital products)

Note: The previous legacy Digital Store was removed earlier; this new Store is rebuilt with Stripe integration.

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

- Digital Store (Stripe)
  - Create digital products with:
    - File upload (max 100MB)
    - Cover image upload (max 5MB)
    - Title, description
    - Price in cents (0 for free items)
  - Secure file storage using Encore Object Storage
  - Stripe Checkout for paid items
  - Free items bypass Stripe and show a direct download dialog
  - Webhook handling for `checkout.session.completed`
  - Secure, time-limited download links

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
  - If you deploy on Encore, configure Secrets in the Infrastructure tab. The backend reading of Stripe keys uses Encore Secrets.

Create a .env file in the project root by copying .env.example and filling in your values.

Example .env:

VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
stripe_secret_key=sk_test_your_secret_key
stripe_webhook_secret=whsec_your_webhook_secret

Notes:
- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE_ to the browser runtime.

## Optional Configuration

- Unsplash is OPTIONAL (enables Unsplash background selection in Theme Settings). If not set, the Unsplash option will be hidden.

Optional configuration:
- Frontend (Vite env, in .env):
  - VITE_UNSPLASH_ACCESS_KEY (optional, only for client-side references)
  - VITE_STRIPE_PUBLISHABLE_KEY (required for Stripe checkout redirect)

- Backend (Encore Secrets, configured in Infrastructure tab or .env for local dev ONLY):
  - stripe_secret_key (required for creating Checkout Sessions)
  - stripe_webhook_secret (required for validating webhooks)
  - UNSPLASH_ACCESS_KEY (optional, used server-side when searching Unsplash)

Important:
- Never put secret keys in frontend code.
- The Unsplash backend API validates that UNSPLASH_ACCESS_KEY is set, or returns a clear error.
- Stripe keys are read from Encore Secrets.

### Unsplash Configuration

- Backend env:
  - UNSPLASH_ACCESS_KEY = your_unsplash_key (server-side)

- Frontend env:
  - VITE_UNSPLASH_ACCESS_KEY = your_unsplash_key (used for enabling the UI option)

### Stripe Configuration

- Backend secrets (Encore Infrastructure tab):
  - stripe_secret_key = sk_live_xxx or sk_test_xxx
  - stripe_webhook_secret = whsec_xxx

- Frontend env:
  - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxx or pk_test_xxx

Flow:
- Paid product: Frontend calls backend to create a Checkout Session, then redirects using Stripe.js.
- Success page: Reads session_id and requests the backend to generate a secure, time-limited download link.
- Free product: Frontend requests a short-lived signed download URL directly from the backend and shows the dialog.

## General Notes

- Ensure .env is loaded for both Vite (frontend) and Node/Encore (backend).
- Never hardcode keys; always use environment variables (and Encore Secrets for backend).
- Clear errors are returned if configuration is missing or invalid.

[Secrets]: https://encore.dev/docs/primitives/config

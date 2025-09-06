# Creator Landing Page

A simple landing page with:

- Public landing page with custom theme
- Links list with click tracking
- Digital store with Stripe integration
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup

## Features

- Links

  - Create, update, delete, and reorder links (drag-and-drop)
  - Click tracking and analytics
  - Link scheduling for time-limited promotions

- Digital Store

  - Create and manage digital downloadable products
  - Upload files and cover images to Encore storage
  - Support for free (price $0) and paid products ($1+)
  - Stripe Checkout integration for paid items
  - Instant downloads for free products
  - Secure download links after purchase

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
- Product sales and revenue
- Top performing links
- Recent guestbook activity
- Visitor analytics with device and location breakdown
- Link-specific heatmaps and click patterns

## Digital Store Setup

To enable the digital store functionality:

1. **Stripe Configuration**: Create a Stripe account and get your API keys
2. **Environment Variables**: Configure the required Stripe environment variables
3. **Product Management**: Create digital products through the admin dashboard
4. **File Storage**: Upload digital files and cover images (stored securely in Encore)

### Required Environment Variables

- Frontend (Vite env, in .env):

  - `VITE_STRIPE_PUBLISHABLE_KEY` (required for Stripe Checkout)

- Backend (Encore env/secrets, configured in Infrastructure tab or .env for local dev ONLY):
  - `STRIPE_SECRET_KEY` (required for processing payments)
  - `STRIPE_WEBHOOK_SECRET` (required for webhook validation)

### Stripe Webhook Configuration

Configure a webhook endpoint in your Stripe dashboard:

- URL: `https://your-domain.com/store/webhook`
- Events: `checkout.session.completed`

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

  - Only variables prefixed with VITE\_ are exposed to the browser.
  - Access with import.meta.env.VITE_YOUR_KEY.

- Backend (Node/Encore):
  - Access with process.env.YOUR_KEY (server-side only).

Create a .env file in the project root by copying .env.example and filling in your values.

Example .env:

VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

Notes:

- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE\_ to the browser runtime.

## Optional Configuration

- Unsplash is OPTIONAL (enables Unsplash background selection in Theme Settings). If not set, the Unsplash option will be hidden.

Optional configuration:

- Frontend (Vite env, in .env):

  - VITE_UNSPLASH_ACCESS_KEY (optional, only for client-side references)

- Backend (Encore env/secrets, configured in Infrastructure tab or .env for local dev ONLY):
  - UNSPLASH_ACCESS_KEY (optional, used server-side when searching Unsplash)

Important:

- Never put secret keys in frontend code.
- The Unsplash backend API validates that UNSPLASH_ACCESS_KEY is set, or returns a clear error.

### Unsplash Configuration

- Backend env:

  - UNSPLASH_ACCESS_KEY = your_unsplash_key (server-side)

- Frontend env:
  - VITE_UNSPLASH_ACCESS_KEY = your_unsplash_key (used for enabling the UI option)

## General Notes

- Ensure .env is loaded for both Vite (frontend) and Node/Encore (backend).
- Never hardcode keys; always use environment variables.
- Clear errors are returned if configuration is missing or invalid.

## Legacy URL Redirects

The app redirects old store/product/checkout URLs to the homepage:

- /product/\*
- /store/\*
- /checkout/\*

[Secrets]: https://encore.dev/docs/primitives/config

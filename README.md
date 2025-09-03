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
  - This project also supports Encore secrets as a fallback where applicable.

Create a .env file in the project root by copying .env.example and filling in your real values.

Example .env:

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_123
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
STRIPE_SECRET_KEY=sk_test_123
STRIPE_WEBHOOK_SECRET=whsec_123

Notes:
- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE_ to the browser runtime.

## Mandatory Configuration

Stripe and Unsplash configuration is required for the app to run.

Required configuration:
- Frontend (Vite env, in .env):
  - VITE_STRIPE_PUBLISHABLE_KEY (must start with pk_)
  - VITE_UNSPLASH_ACCESS_KEY (optional if you don't use Unsplash features)

- Backend (Node env, in .env or platform secrets):
  - STRIPE_SECRET_KEY (must start with sk_)
  - STRIPE_WEBHOOK_SECRET (optional, only if you add webhooks; must start with whsec_)

Important:
- Never put secret keys (sk_ or whsec_) in frontend code.
- The backend validates that STRIPE_SECRET_KEY exists and starts with "sk_".
- The frontend enforces that VITE_STRIPE_PUBLISHABLE_KEY exists and starts with "pk_".
- On startup, the backend Stripe module validates configuration and throws clear errors if missing.

### Stripe Configuration

- Backend env:
  - STRIPE_SECRET_KEY = sk_test_...
  - STRIPE_WEBHOOK_SECRET = whsec_... (optional unless using webhooks)

- Frontend env:
  - VITE_STRIPE_PUBLISHABLE_KEY = pk_test_...

### Unsplash Configuration

- Backend secret:
  - UNSPLASH_ACCESS_KEY (used server-side when searching Unsplash)

- Frontend env:
  - VITE_UNSPLASH_ACCESS_KEY (used for client-side integrations)


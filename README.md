# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup
- Store with Polar.sh integration for digital products

Note: The old Stripe store feature has been removed and replaced with Polar.sh integration.

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

- Store (Polar.sh)
  - Add products (digital files) via admin when Polar is configured
  - Upload product file and cover image
  - Set product title, description and minimum price (0 for free)
  - Products are created and managed via Polar’s API
  - Public storefront section lists products with Buy buttons
  - Buy redirects to Polar Checkout; delivery and receipts handled by Polar
  - Shows checkout confirmation in the UI after successful purchase

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

Create a .env file in the project root by copying .env.example and filling in your values.

Example .env:

VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
POLAR_API_KEY=your_polar_api_key
POLAR_ORGANIZATION_ID=org_XXXXXXXXXXXX

Notes:
- Do not hardcode keys in code. Always use environment variables.
- Vite only exposes variables prefixed with VITE_ to the browser runtime.

## Optional Configuration

- Unsplash is OPTIONAL (enables Unsplash background selection in Theme Settings). If not set, the Unsplash option will be hidden.

Optional configuration:
- Frontend (Vite env, in .env):
  - VITE_UNSPLASH_ACCESS_KEY (optional, only for client-side references)

- Backend (Encore env/secrets, configured in Infrastructure tab or .env for local dev ONLY):
  - UNSPLASH_ACCESS_KEY (optional, used server-side when searching Unsplash)
  - POLAR_API_KEY (required to enable Store)
  - POLAR_ORGANIZATION_ID (required to scope Polar API calls)

Important:
- Never put secret keys in frontend code.
- The Unsplash backend API validates that UNSPLASH_ACCESS_KEY is set, or returns a clear error.
- The Store backend validates that Polar keys are configured, or returns a clear error and hides store UI.

### Unsplash Configuration

- Backend env:
  - UNSPLASH_ACCESS_KEY = your_unsplash_key (server-side)

- Frontend env:
  - VITE_UNSPLASH_ACCESS_KEY = your_unsplash_key (used for enabling the UI option)

### Store (Polar.sh) Configuration

- Backend env (server-side only):
  - POLAR_API_KEY = your Polar API key
  - POLAR_ORGANIZATION_ID = your Polar organization id

- Behavior:
  - If Polar keys are present, the Admin dashboard shows the Store tab for product management.
  - Public site shows a Store section listing products.
  - Checkout redirects to Polar. Delivery handled by Polar.
  - After a successful checkout, the UI shows a purchase confirmation message.

## General Notes

- Ensure .env is loaded for both Vite (frontend) and Node/Encore (backend).
- Never hardcode keys; always use environment variables.
- Clear errors are returned if configuration is missing or invalid.

## Legacy URL Redirects

The app redirects old store/product/checkout URLs to the homepage:
- /product/*
- /store/*
- /checkout/*

[Secrets]: https://encore.dev/docs/primitives/config

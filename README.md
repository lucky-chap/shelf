# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity
- Custom domain configuration with DNS setup

Note: The Digital Store feature (products, purchases, Stripe payments) has been removed.

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

## Analytics

The analytics view includes:
- Total link clicks
- Total guest messages and pending moderation count
- Top performing links
- Recent guestbook activity
- Visitor analytics with device and location breakdown
- Link-specific heatmaps and click patterns

Store-related analytics (sales, revenue, top products) have been removed.

## Custom Domain Setup

Users can configure custom domains for their landing pages:

1. **Domain Configuration**: Enter your domain in the admin settings
2. **DNS Verification**: System checks for proper DNS configuration
3. **Setup Instructions**: Step-by-step guides for popular domain providers
4. **SSL Certificates**: Automatically provisioned for verified domains

### DNS Records Required

- **CNAME Record**: Points your domain to the hosting platform
- **TXT Record**: Verifies domain ownership

The system provides real-time verification and detailed setup instructions for popular domain providers including GoDaddy, Namecheap, and Cloudflare.

## Notes

- No Stripe integration is used.
- Any legacy URLs like /store/* or /product/* are redirected to the homepage.
- Custom domains require proper DNS configuration before activation.
- SSL certificates are automatically managed for verified custom domains.

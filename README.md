# Creator Landing Page

A simple landing page with:
- Public landing page with custom theme
- Links list with click tracking
- Guestbook with moderation
- Admin dashboard with authentication
- Analytics for links and guestbook activity

Note: The Digital Store feature (products, purchases, Stripe payments) has been removed.

## Features

- Links
  - Create, update, delete, and reorder links (drag-and-drop)
  - Click tracking and analytics

- Guestbook
  - Public submissions with moderation
  - Export entries as JSON or CSV

- Site Settings
  - Title, description, avatar URL
  - Theme presets and custom colors

- Admin
  - Password-protected admin dashboard
  - No third-party auth required

## Analytics

The analytics view includes:
- Total link clicks
- Total guest messages and pending moderation count
- Top performing links
- Recent guestbook activity

Store-related analytics (sales, revenue, top products) have been removed.

## Notes

- No Stripe integration is used.
- Any legacy URLs like /store/* or /product/* are redirected to the homepage.

# `shelf🔗⚡`

Transforming a static page into a dynamic experience

## Table of Contents

| Section                                 | Description                             |
| --------------------------------------- | --------------------------------------- |
| [Introduction](#introduction)           | Brief overview of what the project does |
| [Features](#features)                   | Highlight key functionalities           |
| [Local Development](#local-development) | How to install and run the project      |
| [Contributing](#contributing)           | How others can help with development    |
| [License](#license)                     | Licensing information                   |

## Introduction

`Shelf` is an open-source alternative to Linktree - simple, fast, themeable and fully yours.
Most existing open-source link-in-bio solutions feel outdated or lack key features, like analytics, guestbook signing etc (most proproietary ones even lack this) leaving creators stuck with closed platforms. Shelf changes that by offering a modern, lightweight, and customizable solution you can self-host, extend, and truly own.

## Features

- `🔗Links`

  - Create, update, delete, and reorder links (drag-and-drop)
  - Click tracking and analytics
  - Link scheduling for time-limited promotions

- `🏪Digital Store`

  - Create and manage digital downloadable products
  - Upload files and cover images to Encore storage
  - Support for free (price $0) and paid products ($1+)
  - Stripe Checkout integration for paid items
  - Instant downloads for free products
  - Secure download links after purchase

- `📔Guestbook`

  - Public submissions with moderation
  - Export entries as JSON or CSV

- `⚙️Site Settings`
  - Title, description, avatar URL
  - Theme presets and custom colors
  - Unsplash integration for backgrounds

<!-- - `Custom Domains`
  - Connect your own domain name
  - Automatic DNS verification
  - Step-by-step setup instructions
  - SSL certificate provisioning -->

- `🔏Admin`

  - Password-protected admin dashboard
  - No third-party auth required

- `🩺Analytics`
  - Total link clicks
  - Total guest messages and pending moderation count
  - Product sales and revenue
  - Top performing links
  - Recent guestbook activity
  - Visitor analytics with device and location breakdown
  - Link-specific heatmaps and click patterns

## Local Development

### 1. Prerequisites

- Download and install Encore at [Encore](https://encore.dev)
- Download and install Bun at [Bun](https://bun.sh)
- Download and install Stripe CLI for your platform [Stripe CLI](https://docs.stripe.com/stripe-cli/install)
- Download and install Docker Desktop at [Docker](https://www.docker.com/)

### 2. Cloning & Installation

```bash
# Clone the repo
git clone https://github.com/lucky-chap/shelf.git

# Navigate into project
cd shelf

# Install dependencies
bun install
```

### 3. Encore CLI Login

- After installing the Encore CLI, open up a terminal and type `encore auth login` to login

### 4. Stripe CLI Login

- After extracting the Stripe CLI, add it to your PATH
- Open up a terminal and type `stripe login` to login
- After logging in, type `stripe listen` to listen for Stripe
  Events in the app
- Copy your `webhook secret` that appears and populate
  as shown below

### 5. Environment Variables

#### Backend Variables

`cd` into the `backend` folder and do these:

```bash
encore secrets set --type local,dev,pr,prod STRIPE_SECRET_KEY
```

```bash
encore secrets set --type local,dev,pr,prod STRIPE_WEBHOOK_SECRET
```

```bash
encore secrets set --type local,dev,pr,prod STRIPE_PUBLISHABLE_KEY
```

```bash
encore secrets set --type local,dev,pr,prod UNSPLASH_ACCESS_KEY
```

#### Frontend Variables

There are no frontend variables used in this project

### 6. Running the app

`cd` into the `frontend` folder and run this
in your terminal

```bash
npx vite dev
```

`cd` into the `backend` folder and run this
in your terminal

```bash
encore run
```

## More

You can also check out [DEVELOPMENT.md](./DEVELOPMENT.md) for more details on how to run

## License

View [LICENSE](./LICENSE)

# Nesti Frontend

A modern Next.js 14+ application built with App Router and Tailwind CSS.

## Backend API

Auth and app APIs are served by the **Node.js + Express** app in `node-backend` (not NestJS). Point the frontend at it with `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_NODE_BACKEND_URL` (e.g. `http://localhost:5000`).

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/              # App Router pages and layouts
│   ├── layout.js     # Root layout
│   ├── page.js       # Home page
│   ├── globals.css   # Global styles
│   └── not-found.js  # 404 page
├── components/       # React components
│   └── ui/          # Reusable UI components
├── lib/             # Utility functions and helpers
├── hooks/           # Custom React hooks
└── styles/          # Additional stylesheets
```

## Features

- ✅ Next.js 14+ with App Router
- ✅ Tailwind CSS for styling
- ✅ ESLint configuration
- ✅ Professional folder structure
- ✅ Responsive design ready
- ✅ Dark mode support

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

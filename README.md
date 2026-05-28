
# FitFusion

FitFusion is a production-oriented AI wardrobe and outfit recommendation app built with Next.js 15, TypeScript, Tailwind CSS, Clerk, MongoDB/Mongoose, Cloudinary, and OpenAI.

## Features

- Premium dark fashion-tech landing page
- Clerk authentication screens and middleware
- Digital wardrobe CRUD with Cloudinary upload route
- AI clothing analysis with deterministic local fallback
- Outfit recommendation engine with color, style, weather, and occasion scoring
- AI stylist chatbot route with wardrobe context
- Outfit calendar, community feed, pricing, admin, profile, and dashboard screens
- MongoDB schemas for users, clothing, outfits, posts, comments, subscriptions, saved outfits, and notifications
- API routes for upload, wardrobe, AI generation, chat, posts, likes, comments, outfits, and subscriptions

## Getting Started

```bash
npm.cmd install
cp .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
MONGODB_URI=
CLOUDINARY_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
OPENAI_API_KEY=
WEATHER_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The app includes local fallbacks for AI analysis and outfit generation, so it can render without `OPENAI_API_KEY`. Database-backed routes require `MONGODB_URI`, and upload requires Cloudinary credentials.

## Architecture

```text
src/
  app/              App Router pages
  ai/               OpenAI adapters and outfit generation
  components/       Reusable UI shells and product components
  lib/              MongoDB, Cloudinary, API helpers, fashion scoring
  models/           Mongoose schemas
  pages/api/        API routes
  styles/           Global Tailwind styles
```

## API Routes

- `POST /api/upload`
- `GET, POST /api/wardrobe`
- `GET, PATCH, DELETE /api/wardrobe/:id`
- `POST /api/ai/analyze`
- `POST /api/ai/generate-outfit`
- `POST /api/ai/chat`
- `GET, POST /api/outfits`
- `GET, POST /api/posts`
- `POST /api/posts/:id/like`
- `GET, POST /api/comments`
- `GET, POST /api/subscriptions`

## Deployment

1. Create a MongoDB Atlas database and set `MONGODB_URI`.
2. Create a Clerk app and set the publishable and secret keys.
3. Create a Cloudinary account and set either `CLOUDINARY_URL` or the split credentials.
4. Add `OPENAI_API_KEY` for model-backed styling and image analysis.
5. Import the repository into Vercel and add the same environment variables.
6. Deploy with the default Next.js build command: `npm run build`.

## Production Notes

- Add Stripe or Clerk Billing webhooks for real subscription state.
- Add a weather provider implementation behind `WEATHER_API_KEY`.
- Move upload validation to stricter MIME and size allowlists for public launch.
- Add moderation automation and admin role checks before exposing admin routes.
=======
# fitfusion
Wardrobe

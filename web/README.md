# Gradely browser app

The browser app uses plain HTML, CSS, and JavaScript with Supabase email/password authentication. Academic workspace data is stored in Supabase Postgres and protected by row-level security. The existing C++ console app continues to use its separate local SQLite database.

## One-time Supabase setup

1. In your Supabase project, open **SQL Editor** and run [`supabase/schema.sql`](../supabase/schema.sql).
2. In **Project Settings → API**, copy the project URL and the **publishable** key.
3. Add them to the ignored `.env` file in the repository root, using the names in [`.env.example`](../.env.example). Do not use a `service_role` or secret key in this app.
4. In **Authentication → URL Configuration**, add `http://127.0.0.1:8080` as a redirect URL for email confirmation. Email confirmation can be enabled or disabled in your Supabase Auth settings.

The publishable key is meant to be used by a browser and is returned by the local server to the app. It is not an admin secret. Row-level security in `schema.sql` ensures that each signed-in user can read and change only their own workspace.

## Deploy to Vercel

1. Import the repository with the **repository root** as the Vercel project root.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in **Project Settings → Environment Variables** for each environment you deploy.
3. Deploy. [`vercel.json`](../vercel.json) installs the root dependencies with `npm ci`, builds the Supabase browser bundle into `web/`, serves that directory as the static site, and Vercel exposes [`api/config.js`](../api/config.js) at `/api/config`.

The local `.env` file is git-ignored and is not uploaded to Vercel; set the variables in the Vercel dashboard. The API route returns JSON even when configuration is missing, so the browser displays a setup error instead of trying to parse Vercel's HTML error page as JSON.

## Run it

1. Use Node.js 22.x, as configured for the Supabase SDK and Vercel runtime.
2. From the repository root, run `npm install` once.
3. From the repository root, run `node web\server.js`.
4. Open [http://127.0.0.1:8080](http://127.0.0.1:8080), create an account, and add your first course.

Use the same email and password on another device to access the same cloud workspace. If this browser has data from the earlier local version, Gradely asks before moving it to a new Supabase account, then removes that old browser copy only after the cloud save succeeds. If the account already has cloud data, the old local copy is left untouched and can be removed from **My profile**.

Supabase Auth keeps a browser session so the app can remember that you are signed in; course, attendance, task, and note data are stored in Supabase, not as app data in local storage.

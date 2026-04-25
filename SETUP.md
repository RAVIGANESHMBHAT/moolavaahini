# Moolavaahini – Setup Guide

Step-by-step instructions to run this project locally and deploy to production.

---

## Prerequisites

### 1. Install Node.js

Install Node.js v20 or higher.

**Option A – Official installer:**
1. Visit https://nodejs.org
2. Download the LTS version
3. Run the installer

**Option B – Using nvm (recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # or ~/.zshrc on macOS
nvm install 20
nvm use 20
```

Verify:
```bash
node -v   # should print v20.x.x
npm -v    # should print 10.x.x
```

---

## 2. Clone and install dependencies

```bash
git clone <your-repo-url> moolavaahini
cd moolavaahini
npm install
```

---

## 3. Create a Supabase project

1. Go to https://supabase.com and sign in (or create a free account).
2. Click **New project**.
3. Fill in:
   - **Name:** moolavaahini (or any name)
   - **Database password:** choose a strong password (save it!)
   - **Region:** pick the closest to your users
4. Click **Create new project** and wait ~2 minutes.

---

## 4. Set up the database

### Run migrations

In your Supabase project, go to **SQL Editor** (left sidebar).

Run each migration file in order:

**Step 1 – Schema (tables + triggers)**
- Open `supabase/migrations/00001_schema.sql`
- Paste the entire contents into the SQL Editor
- Click **Run**

**Step 2 – Row Level Security**
- Open `supabase/migrations/00002_rls.sql`
- Paste the entire contents into the SQL Editor
- Click **Run**

**Step 3 – Seed data (communities + categories)**
- Open `supabase/migrations/00003_seed.sql`
- Paste the entire contents into the SQL Editor
- Click **Run**

**Step 4 – Translation cache table**
- Open `supabase/migrations/00004_translations.sql`
- Paste the entire contents into the SQL Editor
- Click **Run**

**Step 5 – Image upload tracking table**
- Open `supabase/migrations/00005_image_uploads.sql`
- Paste the entire contents into the SQL Editor
- Click **Run**

---

## 5. Configure Google Authentication

1. In Supabase, go to **Authentication → Providers**.
2. Find **Google** and enable it.
3. You'll need Google OAuth credentials:

### Get Google OAuth credentials

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create credentials → OAuth 2.0 Client ID**.
5. Application type: **Web application**
6. Add **Authorized redirect URIs:**
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   (Replace `<your-supabase-project-ref>` with your project reference from Supabase settings)
7. Click **Create** and copy the **Client ID** and **Client Secret**.

### Enter credentials in Supabase

Back in Supabase Authentication → Providers → Google:
- Paste **Client ID** and **Client Secret**
- Click **Save**

---

## 6. Configure environment variables

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # Anthropic (for AI content translation)
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Where to find these values

In your Supabase project:
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Never expose it in client-side code or commit it to version control.

---

## 7. Run the app locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 8. Make yourself an admin

After signing in for the first time:

1. Go to **Supabase → Table Editor → profiles**
2. Find your user row
3. Change the `role` column from `user` to `admin`
4. Save

Now you have admin access at http://localhost:3000/admin.

---

## 9. Configure Supabase Storage (for image uploads)

1. In Supabase, go to **Storage**.
2. Click **New bucket**.
3. Name it `post-images`.
4. Check **Public bucket** (so uploaded images are publicly accessible).
5. Click **Create bucket**.

To add an upload policy:
1. Click on the `post-images` bucket.
2. Go to **Policies**.
3. Add a policy: allow `INSERT` for authenticated users.

---

## 10. Set up orphaned image cleanup (optional but recommended)

A daily cleanup job deletes images that were uploaded but never saved to a post (e.g. user closed the tab mid-edit, or removed an image before saving). It runs as a Supabase Edge Function triggered by GitHub Actions.

### Deploy the Edge Function

1. Install the Supabase CLI if you haven't: https://supabase.com/docs/guides/cli
2. Link your project:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
3. Deploy the function:
   ```bash
   supabase functions deploy cleanup-orphaned-images
   ```
4. Set the required secrets on the function:
   ```bash
   # Generate a random secret (keep it, you'll need it for GitHub too)
   openssl rand -hex 32

   supabase secrets set CLEANUP_SECRET=<your-random-secret>
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available inside Edge Functions — no need to set them manually.

### Add GitHub Actions secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `SUPABASE_EDGE_FUNCTION_URL` | `https://<your-project-ref>.supabase.co/functions/v1` |
| `CLEANUP_SECRET` | The same random secret you set above |

The workflow at `.github/workflows/cleanup-images.yml` runs daily at 2 AM UTC. You can also trigger it manually from the **Actions** tab.

---

## 11. Deploy to Vercel

### Prerequisites
- A [Vercel](https://vercel.com) account
- The project pushed to a GitHub/GitLab/Bitbucket repository

### Steps

1. Go to https://vercel.com/new
2. Import your repository.
3. On the **Configure Project** page, add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**.

### After deployment

Update Google OAuth to include your Vercel domain in **Authorized redirect URIs**:
```
https://your-app.vercel.app/auth/callback
```

Also update the **Site URL** in Supabase:
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## Project Structure Reference

```
src/
├── actions/          # Server Actions (mutations)
│   ├── auth.actions.ts
│   ├── post.actions.ts
│   ├── review.actions.ts
│   └── profile.actions.ts
├── app/              # Next.js App Router pages
│   ├── [community]/  # Community + category pages
│   ├── admin/        # Admin panel
│   ├── auth/         # Sign-in + OAuth callback
│   ├── dashboard/    # User's own posts
│   ├── posts/        # View + create posts
│   └── search/       # Search page
├── components/
│   ├── admin/        # ReviewQueue, ReviewActions
│   ├── auth/         # GoogleSignInButton, UserMenu
│   ├── editor/       # MarkdownEditor, PostForm
│   ├── layout/       # Navbar, Sidebar, Footer
│   ├── posts/        # PostCard, PostList, PostDetail, SearchBar
│   └── ui/           # Button, Badge, Card, Input, Select, Textarea, Modal
├── lib/
│   ├── supabase/     # client.ts, server.ts, admin.ts
│   ├── auth.ts       # getSession, requireAuth
│   ├── roles.ts      # getUserRole, requireRole, isAdmin
│   └── utils.ts      # cn, slugify, formatDate
└── types/
    └── index.ts      # TypeScript types mirroring DB schema
```

---

## Key commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Roles explained

| Role | Permissions |
|---|---|
| `user` | Read published content only |
| `contributor` | Create drafts, submit for review, approve/reject posts |
| `admin` | All contributor permissions + manage users and roles |

Assign roles via Supabase Table Editor (profiles table) or by using the `updateUserRole` server action from within the admin panel.

---

## Troubleshooting

**"Invalid Redirect URI" on Google sign-in**
→ Ensure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL.

**"RLS policy violation" errors**
→ Your user's role in the `profiles` table may not match what the action requires. Check the `role` column.

**Posts don't appear after approval**
→ Check that `published_at` was set during approval. The `approvePost` action sets this automatically.

**Markdown editor doesn't render**
→ The editor requires client-side JavaScript. Ensure it's loaded in a `'use client'` component and not disabled by browser extensions.

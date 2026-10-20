# Job Search Tracker — deployment

Responsive static website with optional Supabase cloud synchronization.

## 1. GitHub (private)
Create a **private** repository named `job-search-tracker` at https://github.com/new .
Upload `index.html`, `cloud.js`, `config.js`, `schema.sql`, and `vercel.json` to the repository root.

## 2. Supabase
1. Create a project at https://supabase.com/dashboard .
2. Open SQL Editor and run `schema.sql`.
3. In Project Settings → API, copy the **Project URL** and **publishable/anon** key (NOT the secret/service_role key).
4. Put those two values into `config.js`.
5. In Authentication → URL Configuration, set the Site URL to your Vercel URL, and add that URL to Redirect URLs.
6. For a private personal app, restrict signups/authorized users in Supabase Auth settings. Do not rely on a private GitHub repo to protect a public website.

## 3. Vercel
1. Sign in to https://vercel.com with GitHub.
2. Add New → Project → Import `job-search-tracker`.
3. Choose **Other** framework, root directory `/`, no build command, and deploy.
4. Return to Supabase and configure the exact Vercel URL in Auth URL settings.

## 4. Use
- Open the Vercel URL and click **Cloud account** (bottom-right).
- Enter your email to receive a magic sign-in link.
- On first login, the app uploads your current local data. On other devices it loads the cloud workspace.
- Export JSON backups regularly.

## Important
- Local mode remains functional without Supabase.
- `config.js` may contain a public/publishable key, never a service_role or secret key.
- Supabase Row Level Security ensures authenticated users can only read and modify their own workspace.
- Data is synchronized at the workspace level; simultaneous edits on multiple devices are last-write-wins.
- This is a lightweight personal tracker, not a hardened enterprise application.
- Net salary calculations are approximations, not Belgian payroll advice.

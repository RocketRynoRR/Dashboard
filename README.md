# Team Links Dashboard

A static GitHub Pages dashboard backed by Supabase. Staff can sign in to view saved business links, and admins can manage links from `admin.html`.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase-schema.sql`.
4. In Supabase Auth, create your first admin user.
5. Add admin emails to `business_dashboard_admin_users`:

```sql
insert into public.business_dashboard_admin_users (email)
values ('you@yourbusiness.com');
```

6. Open `supabase-config.js`.
7. Confirm your Supabase project URL and publishable key are correct.
8. Confirm `isConfigured` is `true`.

If you already ran the schema before folders were added, run this small migration in Supabase SQL Editor:

```sql
alter table public.business_dashboard_links
add column if not exists folder text not null default 'General';
```

If you already ran the schema before user settings were added, run the latest `supabase-schema.sql` again. It creates `business_dashboard_user_settings`, which stores each user's light/dark mode preference.

## Staff User Creation

The admin page can create staff logins, but this requires a Supabase Edge Function because browser code must never contain the service role key.

Deploy `supabase/functions/create-staff-user/index.ts` as an Edge Function named `create-staff-user`, then set these function secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Disable JWT verification for this function in Supabase. The browser needs CORS preflight requests to reach the function, and the function code already verifies the signed-in admin session before creating any users.

After it is deployed, admins can create staff emails and temporary passwords from `admin.html`. The same function also powers the staff list and remove buttons, so redeploy it whenever `supabase/functions/create-staff-user/index.ts` changes.

## Pages

- `index.html` is the staff dashboard.
- `admin.html` is the admin editor.
- `settings.html` is the user settings page.

The admin page is protected by Supabase Auth and row level security. Any logged-in staff member can read visible links, but only emails listed in `business_dashboard_admin_users` can add or edit links.

## Opening Apps

Dashboard links can open installed apps only when the app supports a URL protocol. Examples include `mailto:`, `slack://`, `msteams://`, and Zoom meeting links. Browsers do not allow a GitHub Pages website to launch arbitrary local `.exe` files directly.

## Host On GitHub Pages

1. Create a new GitHub repository.
2. Upload these files.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to **Deploy from a branch**.
5. Choose your main branch and the root folder.

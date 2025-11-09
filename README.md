# Trip.com Ticket Monitor Frontend

Vue 3 + Vite app untuk Cloudflare Pages.

- Login via `/api/login` (Pages Function, baca `user.json` dari repo `alhamidbook/server` memakai GITHUB_PAT).
- Dashboard menampilkan tiket dari Worker backend (`/api/tickets` di URL Worker).

File penting:
- `wrangler.toml` — konfigurasi Cloudflare Pages (di repo frontend ini).
- `functions/api/login.js` — endpoint login.
- `src/` — aplikasi Vue (Login + Dashboard + TicketTable).

Set di Cloudflare Pages:
- Build command: `npm run build`
- Output dir: `dist`
- Environment Variable: `GITHUB_PAT` (PAT GitHub dengan akses read ke `alhamidbook/server`).

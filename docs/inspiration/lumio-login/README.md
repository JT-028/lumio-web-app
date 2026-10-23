# Lumio Login UI

Responsive Lumio login page built with HTML, Tailwind CSS, TypeScript, and Vite. Includes the cropped Lumi hero art at `public/assets/lumi-hero.png`, show/hide password, required-field validation, and placeholder account recovery/social sign-in actions.

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```

For a production build, run `npm run build` and then `npm run preview`.

**Authentication note:** This is a front-end prototype. It does not authenticate or send credentials anywhere. Connect the form, password reset, account creation, and Google OAuth actions to your real authentication provider before production use.

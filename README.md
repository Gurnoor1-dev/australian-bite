# Australian Bite Hub

A restaurant ordering and operations web application built with TanStack Start, React, Vite and TypeScript.

## Requirements
- Node.js 20 or newer recommended
- npm

## Run locally
```bash
git clone https://github.com/Gurnoor1-dev/australian-bite.git
cd australian-bite
npm install
npm run dev
```

Open the local URL printed by the terminal. Configure the required database, authentication, payment, and service URLs using local environment variables as referenced by the code. Never commit real credentials.

## Build and preview
```bash
npm run build
npm run preview
```

## Deploy from a terminal
```bash
npm install -g vercel
vercel
vercel --prod
```

## Deploy on Vercel
1. Import this repository into Vercel.
2. Confirm the TanStack Start framework and build settings are detected correctly.
3. Set the install command to `npm install` and build command to `npm run build` unless the project configuration requires different values.
4. Add all production environment variables in Vercel Project Settings.
5. Deploy a preview and test checkout, order creation, authentication, and staff workflows before promoting to production.

## Payments and security
Only use provider-approved server-side payment integrations. Do not put payment secrets or service-role keys in browser code or commit them to Git.
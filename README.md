# Formula7777 Site

Minimal React + Vite mint page for the Formula7777 collection.

## RPC setup

The site supports a custom Sepolia RPC URL for read operations.

1. Copy `.env.example` to `.env`
2. Set:

```bash
VITE_SEPOLIA_RPC_URL=
```

If `VITE_SEPOLIA_RPC_URL` is set, the site uses it first for Sepolia reads.
If it is empty, the site falls back to a public Sepolia RPC.

Wallet writes still go through the connected wallet (for example MetaMask).

## Build

Run the production build from the `site` folder:

```bash
npm install
npm run build
```

Vite outputs the production build to:

```bash
dist
```

## Vercel Deployment

The app is ready to deploy from the `/site` directory.

Recommended Vercel settings:

- Framework Preset: `Vite`
- Root Directory: `site`
- Build Command: `npm run build`
- Output Directory: `dist`

Required environment variables for Vercel:

```bash
VITE_SEPOLIA_RPC_URL=
```

Deployment flow:

1. Import the repository into Vercel
2. Set the project Root Directory to `site`
3. Add `VITE_SEPOLIA_RPC_URL` in the Vercel environment variable settings
4. Deploy

Notes:

- The site reads Sepolia contract data through `VITE_SEPOLIA_RPC_URL`
- Wallet writes still happen through the connected wallet in the browser
- No contract, generator, or metadata changes are required for deployment

# Formula7777 Site

Minimal React + Vite mint page for the Formula7777 collection.

## RPC setup

The site targets Robinhood Chain mainnet and supports a custom RPC URL for read operations.

1. Copy `.env.example` to `.env`
2. Set:

```bash
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com/
VITE_ROBINHOOD_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

Set `VITE_ROBINHOOD_CONTRACT_ADDRESS` to the deployed Formula7777 contract address after deployment.
If `VITE_ROBINHOOD_RPC_URL` is empty, the site falls back to the official Robinhood Chain RPC.

Wallet writes still go through the connected wallet (for example MetaMask).

## Robinhood Chain testnet

Mainnet remains the default. To explicitly activate testnet, set:

```bash
VITE_NETWORK=robinhood-testnet
VITE_ROBINHOOD_TESTNET_RPC_URL=https://rpc.testnet.chain.robinhood.com/
VITE_ROBINHOOD_TESTNET_CONTRACT_ADDRESS=
```

The testnet chain ID is `46630`. Leaving its contract address empty or set to the zero address keeps contract reads and minting gated off.

For the base-URI admin command, set `ROBINHOOD_NETWORK=robinhood-testnet`, `ROBINHOOD_TESTNET_RPC_URL`, and `ROBINHOOD_TESTNET_CONTRACT_ADDRESS`. The script checks chain ID `46630` before submitting.

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
VITE_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com/
VITE_ROBINHOOD_CONTRACT_ADDRESS=
```

Deployment flow:

1. Import the repository into Vercel
2. Set the project Root Directory to `site`
3. Add `VITE_ROBINHOOD_RPC_URL` and `VITE_ROBINHOOD_CONTRACT_ADDRESS` in the Vercel environment variable settings
4. Deploy

Notes:

- The site reads Robinhood Chain contract data through `VITE_ROBINHOOD_RPC_URL`
- Wallet writes still happen through the connected wallet in the browser
- No contract, generator, or metadata changes are required for deployment

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient } from "@tanstack/react-query";
import { createConfig, http, injected } from "wagmi";
import { defineChain } from "viem";

export const ROBINHOOD_RPC_URL = "https://rpc.mainnet.chain.robinhood.com/";
export const ROBINHOOD_EXPLORER_URL = "https://robinhoodchain.blockscout.com";
export const ROBINHOOD_TESTNET_RPC_URL = "https://rpc.testnet.chain.robinhood.com/";
export const ROBINHOOD_TESTNET_EXPLORER_URL = "https://explorer.testnet.chain.robinhood.com";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  network: "robinhood-chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ROBINHOOD_RPC_URL] },
    public: { http: [ROBINHOOD_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Blockscout",
      url: ROBINHOOD_EXPLORER_URL,
    },
  },
});

export const robinhoodTestnetChain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  network: "robinhood-chain-testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ROBINHOOD_TESTNET_RPC_URL] },
    public: { http: [ROBINHOOD_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: ROBINHOOD_TESTNET_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const ROBINHOOD_CONTRACT_ADDRESS_PLACEHOLDER = "0x0000000000000000000000000000000000000000";
export const IS_ROBINHOOD_TESTNET = import.meta.env.VITE_NETWORK?.trim() === "robinhood-testnet";
export const FORMULA7777_CONTRACT_ADDRESS =
  (IS_ROBINHOOD_TESTNET
    ? import.meta.env.VITE_ROBINHOOD_TESTNET_CONTRACT_ADDRESS?.trim()
    : import.meta.env.VITE_ROBINHOOD_CONTRACT_ADDRESS?.trim()) || ROBINHOOD_CONTRACT_ADDRESS_PLACEHOLDER;
export const HAS_ROBINHOOD_DEPLOYMENT =
  FORMULA7777_CONTRACT_ADDRESS !== ROBINHOOD_CONTRACT_ADDRESS_PLACEHOLDER;
export const TARGET_CHAIN = IS_ROBINHOOD_TESTNET ? robinhoodTestnetChain : robinhoodChain;
export const CUSTOM_ROBINHOOD_RPC_URL =
  (IS_ROBINHOOD_TESTNET
    ? import.meta.env.VITE_ROBINHOOD_TESTNET_RPC_URL?.trim()
    : import.meta.env.VITE_ROBINHOOD_RPC_URL?.trim()) || "";
export const HAS_CUSTOM_ROBINHOOD_RPC_URL = Boolean(CUSTOM_ROBINHOOD_RPC_URL);
export const DEFAULT_ROBINHOOD_RPC_URL = IS_ROBINHOOD_TESTNET
  ? ROBINHOOD_TESTNET_RPC_URL
  : ROBINHOOD_RPC_URL;
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID?.trim() || "";
export const HAS_REOWN_PROJECT_ID = Boolean(REOWN_PROJECT_ID);
export const queryClient = new QueryClient();

export const FORMULA7777_ABI = [
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "currentMintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintedByWallet",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quoteMintPrice",
    stateMutability: "view",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
];

const appNetworks = [TARGET_CHAIN];
const rpcUrl = CUSTOM_ROBINHOOD_RPC_URL || DEFAULT_ROBINHOOD_RPC_URL;
const transports = {
  [TARGET_CHAIN.id]: http(rpcUrl),
};

const metadata = {
  name: "Formula7777",
  description: "Formula7777 NFT mint",
  url: "https://formula7777.xyz",
  icons: ["https://formula7777.xyz/sample-formula.png"],
};

const appKitOptions = {
  networks: appNetworks,
  projectId: REOWN_PROJECT_ID,
  metadata,
  defaultNetwork: TARGET_CHAIN,
  enableNetworkSwitch: true,
  enableReconnect: true,
  enableWalletGuide: false,
  allWallets: "SHOW",
  features: {
    analytics: false,
    email: false,
    socials: [],
    swaps: false,
    onramp: false,
    connectMethodsOrder: ["wallet"],
    legalCheckbox: false,
  },
  themeMode: "dark",
};

const appKitKey = "__FORMULA7777_APPKIT__";

const wagmiAdapter = HAS_REOWN_PROJECT_ID
  ? new WagmiAdapter({
      networks: appNetworks,
      projectId: REOWN_PROJECT_ID,
      transports,
      ssr: false,
    })
  : null;

export const formulaConfig = wagmiAdapter
  ? wagmiAdapter.wagmiConfig
  : createConfig({
      chains: appNetworks,
      connectors: [
        injected({
          shimDisconnect: true,
        }),
      ],
      transports,
      ssr: false,
    });

export const appKitModal = HAS_REOWN_PROJECT_ID
  ? (globalThis[appKitKey] ||= createAppKit({
      ...appKitOptions,
      adapters: [wagmiAdapter],
    }))
  : null;

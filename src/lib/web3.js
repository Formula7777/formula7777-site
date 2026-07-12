import { configureChains, createConfig } from "wagmi";
import { defineChain } from "viem";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";

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

const providers = [];

if (HAS_CUSTOM_ROBINHOOD_RPC_URL) {
  providers.push(
    jsonRpcProvider({
      rpc: () => ({
        http: CUSTOM_ROBINHOOD_RPC_URL,
      }),
    }),
  );
}

providers.push(
  jsonRpcProvider({
    rpc: () => ({
      http: DEFAULT_ROBINHOOD_RPC_URL,
    }),
  }),
);

providers.push(publicProvider());

const { chains, publicClient, webSocketPublicClient } = configureChains([TARGET_CHAIN], providers);

export const formulaConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

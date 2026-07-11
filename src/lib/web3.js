import { configureChains, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";

export const FORMULA7777_CONTRACT_ADDRESS = "0xdbaDfa0d84A5b2Bc04e0a64c70878Bdaa8a74741";
export const TARGET_CHAIN = sepolia;
export const CUSTOM_SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() || "";
export const HAS_CUSTOM_SEPOLIA_RPC_URL = Boolean(CUSTOM_SEPOLIA_RPC_URL);
export const DEFAULT_SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

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

if (HAS_CUSTOM_SEPOLIA_RPC_URL) {
  providers.push(
    jsonRpcProvider({
      rpc: () => ({
        http: CUSTOM_SEPOLIA_RPC_URL,
      }),
    }),
  );
}

providers.push(
  jsonRpcProvider({
    rpc: () => ({
      http: DEFAULT_SEPOLIA_RPC_URL,
    }),
  }),
);

providers.push(publicProvider());

const { chains, publicClient, webSocketPublicClient } = configureChains([sepolia], providers);

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

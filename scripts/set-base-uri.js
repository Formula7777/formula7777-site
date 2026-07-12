import { createPublicClient, createWalletClient, defineChain, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MAINNET_RPC_URL = "https://rpc.mainnet.chain.robinhood.com/";
const TESTNET_RPC_URL = "https://rpc.testnet.chain.robinhood.com/";
const BASE_URI = "https://raw.githubusercontent.com/Formula7777/formula7777-assets/main/metadata/";
const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  network: "robinhood-chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [MAINNET_RPC_URL] },
    public: { http: [MAINNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});
const robinhoodTestnetChain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  network: "robinhood-chain-testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [TESTNET_RPC_URL] },
    public: { http: [TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});
const ABI = [
  {
    type: "function",
    name: "setBaseURI",
    stateMutability: "nonpayable",
    inputs: [{ name: "newBaseURI", type: "string" }],
    outputs: [],
  },
];

function getNetworkConfig() {
  const networkName = process.env.ROBINHOOD_NETWORK?.trim() || process.env.VITE_NETWORK?.trim() || "robinhood-mainnet";

  if (networkName === "robinhood-testnet") {
    const rpcUrl =
      process.env.ROBINHOOD_TESTNET_RPC_URL?.trim() ||
      process.env.VITE_ROBINHOOD_TESTNET_RPC_URL?.trim() ||
      "";
    const contractAddress =
      process.env.ROBINHOOD_TESTNET_CONTRACT_ADDRESS?.trim() ||
      process.env.VITE_ROBINHOOD_TESTNET_CONTRACT_ADDRESS?.trim() ||
      "";

    if (!rpcUrl) {
      throw new Error("ROBINHOOD_TESTNET_RPC_URL is required for Robinhood Chain testnet.");
    }

    return { chain: robinhoodTestnetChain, contractAddress, expectedChainId: 46630, rpcUrl };
  }

  if (networkName !== "robinhood-mainnet") {
    throw new Error(`Unsupported ROBINHOOD_NETWORK: ${networkName}`);
  }

  return {
    chain: robinhoodChain,
    contractAddress:
      process.env.ROBINHOOD_CONTRACT_ADDRESS?.trim() ||
      process.env.VITE_ROBINHOOD_CONTRACT_ADDRESS?.trim() ||
      "",
    expectedChainId: 4663,
    rpcUrl: process.env.ROBINHOOD_RPC_URL?.trim() || process.env.VITE_ROBINHOOD_RPC_URL?.trim() || MAINNET_RPC_URL,
  };
}

function getContractAddress(configured, expectedChainId) {

  if (!configured || configured === "0x0000000000000000000000000000000000000000") {
    const variableName = expectedChainId === 46630 ? "ROBINHOOD_TESTNET_CONTRACT_ADDRESS" : "ROBINHOOD_CONTRACT_ADDRESS";
    throw new Error(`${variableName} is required for the selected network.`);
  }

  return getAddress(configured);
}

function getOwnerAccount(expectedChainId) {
  const privateKey =
    process.env.OWNER_PRIVATE_KEY?.trim() ||
    (expectedChainId === 46630 ? process.env.TESTNET_PRIVATE_KEY?.trim() : process.env.PRIVATE_KEY?.trim()) ||
    "";

  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY is required in the environment.");
  }

  const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return privateKeyToAccount(normalizedKey);
}

async function main() {
  const { chain, contractAddress: configuredAddress, expectedChainId, rpcUrl } = getNetworkConfig();
  const contractAddress = getContractAddress(configuredAddress, expectedChainId);
  const account = getOwnerAccount(expectedChainId);

  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== expectedChainId) {
    throw new Error(`Refusing to set base URI: expected chain ID ${expectedChainId}, received ${actualChainId}.`);
  }

  process.stdout.write(`Chain ID: ${actualChainId}\n`);
  process.stdout.write(`Using owner wallet: ${account.address}\n`);
  process.stdout.write(`Contract: ${contractAddress}\n`);
  process.stdout.write(`Base URI: ${BASE_URI}\n`);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: ABI,
    functionName: "setBaseURI",
    args: [BASE_URI],
    account,
  });

  process.stdout.write(`Transaction hash: ${hash}\n`);
  process.stdout.write("Waiting for confirmation...\n");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  process.stdout.write(`Confirmation status: ${receipt.status}\n`);
  process.stdout.write(`Block number: ${receipt.blockNumber}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.shortMessage || error?.message || String(error)}\n`);
  process.exit(1);
});

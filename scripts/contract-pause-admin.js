import { createPublicClient, createWalletClient, defineChain, getAddress, http, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const NETWORKS = {
  "robinhood-mainnet": {
    chainId: 4663,
    contractAddressVariable: "ROBINHOOD_CONTRACT_ADDRESS",
    explorerUrl: "https://robinhoodchain.blockscout.com",
    name: "Robinhood Chain",
    privateKeyVariable: "PRIVATE_KEY",
    rpcUrlVariable: "ROBINHOOD_RPC_URL",
    testnet: false,
  },
  "robinhood-testnet": {
    chainId: 46630,
    contractAddressVariable: "ROBINHOOD_TESTNET_CONTRACT_ADDRESS",
    explorerUrl: "https://explorer.testnet.chain.robinhood.com",
    name: "Robinhood Chain Testnet",
    privateKeyVariable: "TESTNET_PRIVATE_KEY",
    rpcUrlVariable: "ROBINHOOD_TESTNET_RPC_URL",
    testnet: true,
  },
};

const ABI = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
];

function requireEnvironment() {
  const networkName = process.env.ROBINHOOD_NETWORK?.trim() || "";
  const network = NETWORKS[networkName];

  if (!network) {
    throw new Error("ROBINHOOD_NETWORK must be exactly robinhood-mainnet or robinhood-testnet.");
  }

  const rpcUrl = process.env[network.rpcUrlVariable]?.trim() || "";
  const configuredAddress = process.env[network.contractAddressVariable]?.trim() || "";
  const privateKey = process.env.OWNER_PRIVATE_KEY?.trim() || process.env[network.privateKeyVariable]?.trim() || "";

  if (!rpcUrl) {
    throw new Error(`${network.rpcUrlVariable} is required.`);
  }

  if (!configuredAddress) {
    throw new Error(`${network.contractAddressVariable} is required.`);
  }

  const contractAddress = getAddress(configuredAddress);
  if (contractAddress === zeroAddress) {
    throw new Error(`${network.contractAddressVariable} must not be the zero address.`);
  }

  if (!privateKey) {
    throw new Error(`${network.privateKeyVariable} or OWNER_PRIVATE_KEY is required.`);
  }

  const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(normalizedKey);
  const chain = defineChain({
    id: network.chainId,
    name: network.name,
    network: networkName,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: { name: `${network.name} Explorer`, url: network.explorerUrl },
    },
    testnet: network.testnet,
  });

  return { account, chain, contractAddress, network, networkName, rpcUrl };
}

export async function runPauseAdmin(action) {
  if (action !== "pause" && action !== "unpause") {
    throw new Error(`Unsupported pause admin action: ${action}`);
  }

  const { account, chain, contractAddress, network, networkName, rpcUrl } = requireEnvironment();
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ account, chain, transport });

  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== network.chainId) {
    throw new Error(`Refusing to ${action}: expected chain ID ${network.chainId}, received ${actualChainId}.`);
  }

  const [contractOwner, isPaused] = await Promise.all([
    publicClient.readContract({ address: contractAddress, abi: ABI, functionName: "owner" }),
    publicClient.readContract({ address: contractAddress, abi: ABI, functionName: "paused" }),
  ]);

  process.stdout.write(`Network: ${networkName}\n`);
  process.stdout.write(`Chain ID: ${actualChainId}\n`);
  process.stdout.write(`Owner wallet address: ${account.address}\n`);
  process.stdout.write(`Contract address: ${contractAddress}\n`);
  process.stdout.write(`Current paused state: ${isPaused}\n`);

  if (getAddress(contractOwner) !== getAddress(account.address)) {
    throw new Error(`Caller is not the contract owner. On-chain owner: ${contractOwner}`);
  }

  if (action === "pause" && isPaused) {
    throw new Error("Contract is already paused.");
  }

  if (action === "unpause" && !isPaused) {
    throw new Error("Contract is already unpaused.");
  }

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: ABI,
    functionName: action,
    account,
  });

  process.stdout.write(`Transaction hash: ${hash}\n`);
  process.stdout.write("Waiting for confirmation...\n");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`${action} transaction failed with status: ${receipt.status}`);
  }

  const finalPausedState = await publicClient.readContract({
    address: contractAddress,
    abi: ABI,
    functionName: "paused",
  });

  const expectedFinalState = action === "pause";
  if (finalPausedState !== expectedFinalState) {
    throw new Error(`Unexpected final paused state after ${action}: ${finalPausedState}`);
  }

  process.stdout.write(`Final paused state: ${finalPausedState}\n`);
}

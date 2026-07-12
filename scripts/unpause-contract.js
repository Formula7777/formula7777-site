import { createPublicClient, createWalletClient, defineChain, getAddress, http, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const EXPECTED_NETWORK = "robinhood-testnet";
const EXPECTED_CHAIN_ID = 46630;
const TESTNET_EXPLORER_URL = "https://explorer.testnet.chain.robinhood.com";

const robinhoodTestnetChain = defineChain({
  id: EXPECTED_CHAIN_ID,
  name: "Robinhood Chain Testnet",
  network: EXPECTED_NETWORK,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com/"] },
    public: { http: ["https://rpc.testnet.chain.robinhood.com/"] },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Testnet Explorer", url: TESTNET_EXPLORER_URL },
  },
  testnet: true,
});

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
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
];

function requireEnvironment() {
  const network = process.env.ROBINHOOD_NETWORK?.trim() || "";
  const rpcUrl = process.env.ROBINHOOD_TESTNET_RPC_URL?.trim() || "";
  const configuredAddress = process.env.ROBINHOOD_TESTNET_CONTRACT_ADDRESS?.trim() || "";
  const privateKey = process.env.OWNER_PRIVATE_KEY?.trim() || process.env.TESTNET_PRIVATE_KEY?.trim() || "";

  if (network !== EXPECTED_NETWORK) {
    throw new Error(`ROBINHOOD_NETWORK must be exactly ${EXPECTED_NETWORK}.`);
  }

  if (!rpcUrl) {
    throw new Error("ROBINHOOD_TESTNET_RPC_URL is required.");
  }

  if (!configuredAddress) {
    throw new Error("ROBINHOOD_TESTNET_CONTRACT_ADDRESS is required.");
  }

  const contractAddress = getAddress(configuredAddress);
  if (contractAddress === zeroAddress) {
    throw new Error("ROBINHOOD_TESTNET_CONTRACT_ADDRESS must not be the zero address.");
  }

  if (!privateKey) {
    throw new Error("TESTNET_PRIVATE_KEY or OWNER_PRIVATE_KEY is required.");
  }

  const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return { account: privateKeyToAccount(normalizedKey), contractAddress, rpcUrl };
}

async function main() {
  const { account, contractAddress, rpcUrl } = requireEnvironment();
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain: robinhoodTestnetChain, transport });
  const walletClient = createWalletClient({ account, chain: robinhoodTestnetChain, transport });

  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Refusing to unpause: expected chain ID ${EXPECTED_CHAIN_ID}, received ${actualChainId}.`);
  }

  const [contractOwner, isPaused] = await Promise.all([
    publicClient.readContract({ address: contractAddress, abi: ABI, functionName: "owner" }),
    publicClient.readContract({ address: contractAddress, abi: ABI, functionName: "paused" }),
  ]);

  process.stdout.write(`Owner wallet address: ${account.address}\n`);
  process.stdout.write(`Contract address: ${contractAddress}\n`);
  process.stdout.write(`Current paused state: ${isPaused}\n`);

  if (getAddress(contractOwner) !== getAddress(account.address)) {
    throw new Error(`Caller is not the contract owner. On-chain owner: ${contractOwner}`);
  }

  if (!isPaused) {
    throw new Error("Contract is already unpaused.");
  }

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: ABI,
    functionName: "unpause",
    account,
  });

  process.stdout.write(`Transaction hash: ${hash}\n`);
  process.stdout.write("Waiting for confirmation...\n");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Unpause transaction failed with status: ${receipt.status}`);
  }

  const finalPausedState = await publicClient.readContract({
    address: contractAddress,
    abi: ABI,
    functionName: "paused",
  });

  process.stdout.write(`Final paused state: ${finalPausedState}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.shortMessage || error?.message || String(error)}\n`);
  process.exit(1);
});

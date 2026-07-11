import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const CONTRACT_ADDRESS = "0xdbaDfa0d84A5b2Bc04e0a64c70878Bdaa8a74741";
const BASE_URI = "https://raw.githubusercontent.com/Formula7777/formula7777-assets/main/metadata/";
const ABI = [
  {
    type: "function",
    name: "setBaseURI",
    stateMutability: "nonpayable",
    inputs: [{ name: "newBaseURI", type: "string" }],
    outputs: [],
  },
];

function getRpcUrl() {
  const configured = process.env.VITE_SEPOLIA_RPC_URL?.trim() || process.env.SEPOLIA_RPC_URL?.trim() || "";
  return configured || "https://ethereum-sepolia-rpc.publicnode.com";
}

function getOwnerAccount() {
  const privateKey = process.env.OWNER_PRIVATE_KEY?.trim() || process.env.PRIVATE_KEY?.trim() || "";

  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY is required in the environment.");
  }

  const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return privateKeyToAccount(normalizedKey);
}

async function main() {
  const rpcUrl = getRpcUrl();
  const account = getOwnerAccount();

  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport,
  });

  process.stdout.write(`Using owner wallet: ${account.address}\n`);
  process.stdout.write(`Contract: ${CONTRACT_ADDRESS}\n`);
  process.stdout.write(`Base URI: ${BASE_URI}\n`);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
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

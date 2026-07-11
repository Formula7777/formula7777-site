import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="glow-button rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-neon/50 hover:bg-white/10"
      >
        {shortenAddress(address)}
      </button>
    );
  }

  return (
      <button
        type="button"
        disabled={!connector || isPending}
        onClick={() => connect({ connector })}
        className="glow-button rounded-full border border-neon/30 bg-neon/10 px-4 py-2 text-sm text-neon transition hover:bg-neon/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>
  );
}

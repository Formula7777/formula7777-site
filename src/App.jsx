import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";
import {
  useBalance,
  useChainId,
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectWalletButton } from "./components/ConnectWalletButton";
import { CurvePreview } from "./components/CurvePreview";
import { PreviewStrip } from "./components/PreviewStrip";
import { SUPPLY, calculatePrice, clampMinted, formatEth } from "./lib/mintCurve";
import {
  DEFAULT_ROBINHOOD_RPC_URL,
  FORMULA7777_ABI,
  FORMULA7777_CONTRACT_ADDRESS,
  HAS_CUSTOM_ROBINHOOD_RPC_URL,
  HAS_ROBINHOOD_DEPLOYMENT,
  TARGET_CHAIN,
} from "./lib/web3";

const OFFICIAL_LINKS = [
  {
    label: "X / Twitter",
    headerLabel: "Formula7777 on X",
    iconSrc: "/x-logo.svg",
    href: "https://x.com/Formula7777x",
  },
  {
    label: "OpenSea",
    headerLabel: "Formula7777 on OpenSea",
    iconSrc: "/opensea-logo.svg",
    href: "https://opensea.io/collection/formula7777",
  },
  {
    label: "Contract",
    shortLabel: "Contract",
    href: "https://robinhoodchain.blockscout.com/address/0x1400a00F58Ab6420A497c764213d1b4F3fA934e9",
  },
];

const HEADER_LINKS = OFFICIAL_LINKS.slice(0, 2);

function normalizeRpcError(error, fallbackLabel) {
  const message = error?.shortMessage || error?.message || "";

  if (!message) {
    return fallbackLabel;
  }

  if (message.includes("HTTP request failed")) {
    return HAS_CUSTOM_ROBINHOOD_RPC_URL
      ? "Your configured Robinhood Chain RPC URL is unreachable. Check VITE_ROBINHOOD_RPC_URL."
      : `Robinhood Chain RPC is unreachable. Set VITE_ROBINHOOD_RPC_URL in site/.env or try again later. Fallback RPC: ${DEFAULT_ROBINHOOD_RPC_URL}`;
  }

  if (message.includes("network changed")) {
    return "Wallet network changed. Reconnect on Robinhood Chain.";
  }

  return message;
}

function getNestedErrorValue(error, key) {
  let current = error;
  while (current) {
    if (current[key] !== undefined) {
      return current[key];
    }

    current = current.cause || current.details;
  }

  return undefined;
}

function getErrorText(error, fallbackLabel) {
  const message =
    error?.shortMessage ||
    error?.message ||
    error?.details ||
    (typeof error === "string" ? error : "") ||
    fallbackLabel;

  return String(message)
    .replace(/^error:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isWalletRejectionError(error) {
  const code = getNestedErrorValue(error, "code");
  const name = getNestedErrorValue(error, "name");
  const text = getErrorText(error, "").toLowerCase();

  return (
    code === 4001 ||
    code === "4001" ||
    code === "ACTION_REJECTED" ||
    name === "UserRejectedRequestError" ||
    name === "UserRejectedRequestErrorType" ||
    text.includes("user rejected") ||
    text.includes("user denied") ||
    text.includes("request rejected") ||
    text.includes("action rejected")
  );
}

function getMintErrorMessage(error, fallbackLabel = "Mint failed.") {
  if (isWalletRejectionError(error)) {
    return "Transaction rejected by user.";
  }

  return getErrorText(error, fallbackLabel);
}

export default function App() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const { switchChain, isPending: switchingNetwork, error: switchNetworkError } = useSwitchChain();
  const [statusMessage, setStatusMessage] = useState(
    HAS_ROBINHOOD_DEPLOYMENT
      ? "Connected to the live Robinhood Chain contract."
      : "Robinhood Chain deployment is pending.",
  );
  const [quantity, setQuantity] = useState(1);
  const [submittedQuantity, setSubmittedQuantity] = useState(1);
  const [mintPanelError, setMintPanelError] = useState(null);

  const isOnRobinhood = chainId === TARGET_CHAIN.id;

  const {
    data: totalSupplyData,
    isLoading: loadingSupply,
    isError: supplyReadError,
    error: supplyError,
    refetch: refetchSupply,
  } = useReadContract({
    address: FORMULA7777_CONTRACT_ADDRESS,
    abi: FORMULA7777_ABI,
    functionName: "totalSupply",
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: HAS_ROBINHOOD_DEPLOYMENT,
      refetchInterval: 12000,
    },
  });

  const {
    data: currentMintPriceData,
    isLoading: loadingPrice,
    isError: priceReadError,
    error: priceError,
    refetch: refetchPrice,
  } = useReadContract({
    address: FORMULA7777_CONTRACT_ADDRESS,
    abi: FORMULA7777_ABI,
    functionName: "currentMintPrice",
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: HAS_ROBINHOOD_DEPLOYMENT,
      refetchInterval: 12000,
    },
  });

  const {
    data: quotedMintPriceData,
    isLoading: loadingQuote,
    isError: quoteReadError,
    error: quoteError,
    refetch: refetchQuote,
  } = useReadContract({
    address: FORMULA7777_CONTRACT_ADDRESS,
    abi: FORMULA7777_ABI,
    functionName: "quoteMintPrice",
    args: [BigInt(quantity)],
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: HAS_ROBINHOOD_DEPLOYMENT && quantity >= 1 && quantity <= 7,
      refetchInterval: 12000,
    },
  });

  const {
    data: mintedByWalletData,
    isLoading: loadingWalletMints,
    isError: walletMintsReadError,
    error: walletMintsError,
    refetch: refetchWalletMints,
  } = useReadContract({
    address: FORMULA7777_CONTRACT_ADDRESS,
    abi: FORMULA7777_ABI,
    functionName: "mintedByWallet",
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: Boolean(HAS_ROBINHOOD_DEPLOYMENT && address && isConnected && isOnRobinhood),
      refetchInterval: 12000,
    },
  });

  const {
    data: balanceData,
    isLoading: loadingBalance,
  } = useBalance({
    address,
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: Boolean(address && isConnected && isOnRobinhood),
      refetchInterval: 12000,
    },
  });

  const mintedSupply = clampMinted(Number(totalSupplyData ?? 0n));
  const mintedByYou = Number(mintedByWalletData ?? 0n);
  const remainingWalletLimit = Math.max(0, 7 - mintedByYou);
  const remainingSupply = Math.max(0, SUPPLY - mintedSupply);
  const maxMintable = Math.max(0, Math.min(7, remainingWalletLimit, remainingSupply));
  const currentPrice = currentMintPriceData ? Number(formatEther(currentMintPriceData)) : calculatePrice(mintedSupply);
  const totalPrice = quotedMintPriceData ? Number(formatEther(quotedMintPriceData)) : currentPrice * quantity;
  const bufferedMintValue = quotedMintPriceData
    ? quotedMintPriceData + (quotedMintPriceData + 99n) / 100n
    : undefined;
  const nextPrice = useMemo(
    () => calculatePrice(Math.min(mintedSupply + quantity, SUPPLY)),
    [mintedSupply, quantity],
  );

  const {
    writeContractAsync,
    data: mintTxHash,
    error: mintWriteError,
    isError: mintWriteFailed,
    isPending: writingMint,
  } = useWriteContract();
  const {
    isLoading: txPending,
    isSuccess: txSuccess,
    isError: txFailed,
  } = useWaitForTransactionReceipt({
    hash: mintTxHash,
    chainId: TARGET_CHAIN.id,
    query: {
      enabled: Boolean(mintTxHash),
    },
  });

  const insufficientFunds = Boolean(
    isConnected &&
      isOnRobinhood &&
      quotedMintPriceData &&
      balanceData?.value !== undefined &&
      balanceData.value < bufferedMintValue,
  );

  const contractErrorMessage =
    (supplyError ? normalizeRpcError(supplyError, "Failed to read total supply") : null) ||
    (priceError ? normalizeRpcError(priceError, "Failed to read current mint price") : null) ||
    (quoteError ? normalizeRpcError(quoteError, "Failed to quote total mint price") : null) ||
    (walletMintsError ? normalizeRpcError(walletMintsError, "Failed to read wallet mint count") : null) ||
    mintPanelError ||
    null;

  const mintDisabledReason = useMemo(() => {
    if (!isConnected) {
      return "Connect wallet first";
    }

    if (!HAS_ROBINHOOD_DEPLOYMENT) {
      return "Robinhood Chain deployment pending";
    }

    if (!isOnRobinhood) {
      return "Switch to Robinhood Chain";
    }

    if (loadingSupply) {
      return "Loading contract data";
    }

    if (loadingPrice) {
      return "Loading price";
    }

    if (loadingQuote) {
      return "Loading total price";
    }

    if (loadingBalance) {
      return "Checking Robinhood Chain ETH";
    }

    if (loadingWalletMints) {
      return "Loading wallet mint count";
    }

    if (writingMint || txPending) {
      return "Transaction pending";
    }

    if (mintedSupply >= SUPPLY) {
      return "Sold out";
    }

    if (supplyReadError) {
      return normalizeRpcError(supplyError, "Failed to read total supply");
    }

    if (priceReadError) {
      return normalizeRpcError(priceError, "Failed to read current mint price");
    }

    if (quoteReadError) {
      return normalizeRpcError(quoteError, "Failed to quote total mint price");
    }

    if (walletMintsReadError) {
      return normalizeRpcError(walletMintsError, "Failed to read wallet mint count");
    }

    if (!quotedMintPriceData) {
      return "Loading total price";
    }

    if (maxMintable === 0 && mintedByYou >= 7) {
      return "Mint limit reached (7 / 7)";
    }

    if (maxMintable === 0 && mintedSupply >= SUPPLY) {
      return "Sold out";
    }

    if (quantity < 1 || quantity > maxMintable) {
      return "Selected quantity is unavailable";
    }

    if (insufficientFunds) {
      return "Insufficient Robinhood Chain ETH";
    }

    if (mintWriteFailed) {
      return getMintErrorMessage(mintWriteError, "Mint write failed");
    }

    if (!writeContractAsync) {
      return "Wallet provider not ready for contract write";
    }

    return null;
  }, [
    isConnected,
    isOnRobinhood,
    loadingSupply,
    loadingPrice,
    loadingBalance,
    loadingWalletMints,
    writingMint,
    txPending,
    mintedSupply,
    mintedByYou,
    supplyReadError,
    priceReadError,
    quoteReadError,
    walletMintsReadError,
    supplyError,
    priceError,
    quoteError,
    walletMintsError,
    insufficientFunds,
    mintWriteFailed,
    mintWriteError,
    quotedMintPriceData,
    maxMintable,
    quantity,
    writeContractAsync,
  ]);

  useEffect(() => {
    if (maxMintable === 0) {
      setQuantity(1);
      return;
    }

    if (quantity > maxMintable) {
      setQuantity(maxMintable);
    }
  }, [maxMintable, quantity]);

  useEffect(() => {
    if (!isConnected) {
      setStatusMessage("Connect a wallet to mint on Robinhood Chain.");
      return;
    }

    if (!HAS_ROBINHOOD_DEPLOYMENT) {
      setStatusMessage("Robinhood Chain deployment is pending.");
      return;
    }

    if (!isOnRobinhood) {
      setStatusMessage("Wrong network. Switch to Robinhood Chain to mint.");
      return;
    }

    if (mintDisabledReason && mintDisabledReason !== "Transaction pending") {
      setStatusMessage(mintDisabledReason);
      return;
    }

    if (!txPending && !txSuccess) {
      setStatusMessage("Ready to mint on Robinhood Chain.");
    }
  }, [isConnected, isOnRobinhood, txPending, txSuccess, mintDisabledReason]);

  useEffect(() => {
    if (!txSuccess) {
      return;
    }

    setMintPanelError(null);
    Promise.all([refetchSupply(), refetchPrice(), refetchWalletMints(), refetchQuote()]).then(() => {
      setStatusMessage(
        `Mint successful. ${submittedQuantity} Formula${submittedQuantity > 1 ? "s have" : " has"} been created.`,
      );
    });
  }, [txSuccess, submittedQuantity, refetchSupply, refetchPrice, refetchWalletMints, refetchQuote]);

  useEffect(() => {
    setMintPanelError(null);
  }, [address, isConnected]);

  useEffect(() => {
    if (txFailed) {
      setStatusMessage("Transaction failed or was dropped.");
    }
  }, [txFailed]);

  useEffect(() => {
    if (switchNetworkError) {
      setStatusMessage(
        switchNetworkError?.shortMessage ||
          switchNetworkError?.message ||
          "Automatic network switching is unavailable. Switch to Robinhood Chain in your wallet.",
      );
    }
  }, [switchNetworkError]);

  useEffect(() => {
    if (supplyError) {
      console.error("Formula7777 totalSupply read failed:", supplyError);
    }
  }, [supplyError]);

  useEffect(() => {
    if (priceError) {
      console.error("Formula7777 currentMintPrice read failed:", priceError);
    }
  }, [priceError]);

  useEffect(() => {
    if (quoteError) {
      console.error("Formula7777 quoteMintPrice read failed:", quoteError);
    }
  }, [quoteError]);

  useEffect(() => {
    if (walletMintsError) {
      console.error("Formula7777 mintedByWallet read failed:", walletMintsError);
    }
  }, [walletMintsError]);

  useEffect(() => {
    if (mintWriteError) {
      console.error("Formula7777 mint write failed:", mintWriteError);
    }
  }, [mintWriteError]);

  async function handleMint() {
    if (!writeContractAsync) {
      setStatusMessage(mintDisabledReason || "Mint unavailable");
      return;
    }

    setMintPanelError(null);
    setSubmittedQuantity(quantity);
    setStatusMessage("Confirm the transaction in your wallet...");

    try {
      await writeContractAsync({
        address: FORMULA7777_CONTRACT_ADDRESS,
        abi: FORMULA7777_ABI,
        functionName: "mint",
        chainId: TARGET_CHAIN.id,
        args: [BigInt(quantity)],
        value: bufferedMintValue,
      });
      setStatusMessage("Transaction submitted. Waiting for confirmation...");
    } catch (error) {
      const message = getMintErrorMessage(error);
      setMintPanelError(message);
      setStatusMessage(message);
    }
  }

  const mintDisabled =
    Boolean(mintDisabledReason);

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-slate-100">
      <div className="ambient-shell pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="ambient-particles" />
        <div className="ambient-noise" />
        <div className="ambient-scanlines" />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="reveal mb-8 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
          <div className="min-w-0 text-xs uppercase tracking-[0.22em] text-slate-300 sm:text-sm sm:tracking-[0.32em]">Formula7777</div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <nav className="flex items-center gap-2" aria-label="Official Formula7777 links">
              {HEADER_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.headerLabel}
                  title={link.label}
                  className="glow-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/5 text-xs font-semibold uppercase text-slate-200 transition hover:border-neon/40 hover:bg-neon/10 hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon/40 focus:ring-offset-2 focus:ring-offset-ink sm:h-10 sm:w-10"
                >
                  <img src={link.iconSrc} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                </a>
              ))}
            </nav>
            <ConnectWalletButton />
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="min-w-0 space-y-8">
            <div className="reveal reveal-delay-1 space-y-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Robinhood Chain NFT mint</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Formula7777
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                Generated from the Formula7777 mint curve.
                <br />
                Each token evolves mathematically from its position on the curve.
              </p>
            </div>

            <div className="reveal reveal-delay-2 min-w-0 overflow-hidden rounded-3xl border border-line bg-panel/80 p-4 shadow-glow premium-panel sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mint panel</p>
                  <p className="mt-2 text-3xl text-white">{loadingSupply ? "Loading..." : `${mintedSupply} / ${SUPPLY}`}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Minted by you: {isConnected ? (loadingWalletMints ? "Loading..." : `${mintedByYou} / 7`) : "- / 7"}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Up to 7 Formulas per transaction</p>
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 rounded-2xl border border-white/6 bg-black/20 p-4">
                  <label htmlFor="mint-quantity" className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Quantity
                  </label>
                  <select
                    id="mint-quantity"
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    disabled={maxMintable === 0 || txPending || writingMint}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none transition focus:border-neon/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Array.from({ length: Math.max(maxMintable, 1) }, (_, index) => index + 1).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/6 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Price</div>
                  <div className="mt-2 break-words text-xl text-neon sm:text-2xl">{formatEth(totalPrice)}</div>
                  <div className="mt-2 text-xs text-slate-500">Current single mint: {formatEth(currentPrice)}</div>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/6 bg-black/20 p-4 md:col-span-2 xl:col-span-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Next Price</div>
                  <div className="mt-2 break-words text-xl text-blue sm:text-2xl">{formatEth(nextPrice)}</div>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">Each Formula is priced sequentially by the curve.</p>

              {isConnected && !isOnRobinhood ? (
                <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                  <div className="font-medium">Wrong network detected.</div>
                  <div className="mt-1 text-amber-200/80">Formula7777 minting targets Robinhood Chain only.</div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!switchChain) {
                        setStatusMessage("Automatic network switching is unavailable. Switch to Robinhood Chain in your wallet.");
                        return;
                      }

                      switchChain({ chainId: TARGET_CHAIN.id });
                    }}
                    disabled={!switchChain || switchingNetwork}
                    className="mt-3 rounded-full border border-amber-300/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-amber-100 transition hover:bg-amber-200/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {switchingNetwork ? "Switching..." : "Switch to Robinhood Chain"}
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleMint}
                disabled={mintDisabled}
                className="glow-button mt-6 w-full rounded-2xl border border-neon/30 bg-neon/10 px-5 py-4 text-sm uppercase tracking-[0.26em] text-neon transition hover:bg-neon/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {txPending ? "Mint Pending..." : mintedSupply >= SUPPLY ? "Sold Out" : `Mint ${quantity} Formula${quantity > 1 ? "s" : ""}`}
              </button>

              <p className="mt-3 text-sm text-slate-500">{statusMessage}</p>
              {mintDisabledReason && !txPending && mintDisabledReason !== statusMessage ? (
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-600">
                  Reason: {mintDisabledReason}
                </p>
              ) : null}
              {contractErrorMessage && contractErrorMessage !== statusMessage ? (
                <p className="mt-2 break-words text-xs text-rose-300/80">
                  {contractErrorMessage}
                </p>
              ) : null}
              {mintTxHash ? (
                <p className="mt-2 break-all text-xs text-slate-600">
                  Tx: {mintTxHash}
                </p>
              ) : null}
            </div>

            <div className="reveal reveal-delay-3 min-w-0 rounded-3xl border border-line bg-panel/80 p-5 shadow-glow premium-panel sm:p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Mint Formula</div>
              <p className="mt-3 max-w-full overflow-x-auto text-base leading-7 text-white sm:text-2xl">
                price(x) = 0.0007777 × (1 + x / 7777)<sup>5</sup>
              </p>
            </div>
          </section>

          <aside className="min-w-0 space-y-6">
            <div className="reveal reveal-delay-2 rounded-3xl border border-line bg-panel/80 p-6 shadow-glow premium-panel">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Notes</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                <li>Supply is fixed at 7777.</li>
                <li>You can mint between 1 and 7 Formulas in a single transaction.</li>
                <li>Each Formula is priced sequentially by the curve.</li>
                <li>Live reads and minting target Robinhood Chain mainnet.</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/6 pt-4 text-sm">
                {OFFICIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 transition hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon/40 focus:ring-offset-2 focus:ring-offset-panel"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="reveal reveal-delay-3 rounded-3xl border border-line bg-panel/80 p-5 shadow-glow premium-panel">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Collection Stats</div>
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-600">Supply</span>
                  <span className="text-sm text-white">7777</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-600">Chain</span>
                  <span className="text-sm text-white">Robinhood Chain</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-600">Pricing</span>
                  <span className="text-sm text-white">Sequential curve</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-600">Wallet Cap</span>
                  <span className="text-sm text-white">7</span>
                </div>
              </div>
            </div>

            <div className="reveal reveal-delay-4">
              <CurvePreview mintedSupply={mintedSupply} />
            </div>
          </aside>
        </main>

        <div className="mt-8">
          <PreviewStrip />
        </div>
      </div>
    </div>
  );
}

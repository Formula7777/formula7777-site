export const SUPPLY = 7777;
export const BASE_PRICE = 0.0007777;

export function clampMinted(value) {
  return Math.max(0, Math.min(SUPPLY, Number(value) || 0));
}

export function calculatePrice(minted) {
  const x = clampMinted(minted);
  return BASE_PRICE * (1 + x / SUPPLY) ** 5;
}

export function formatEth(value) {
  return `${value.toFixed(6)} ETH`;
}

export function buildCurvePoints(pointCount = 28) {
  return Array.from({ length: pointCount }, (_, index) => {
    const minted = Math.round((index / (pointCount - 1)) * SUPPLY);
    const price = calculatePrice(minted);
    return { minted, price };
  });
}

const IMAGE_BASE = "https://raw.githubusercontent.com/Formula7777/formula7777-assets/main/images";

const GALLERY_ROWS = [
  [1, 7, 14, 33, 77, 144, 256, 377, 512, 777, 1024, 1444],
  [2048, 2333, 2777, 3003, 4096, 4444, 5120, 6144, 6666, 7007, 7331, 7777],
];

function imageUrl(tokenId) {
  return `${IMAGE_BASE}/${tokenId}.png`;
}

function FormulaCard({ tokenId, compact = false }) {
  return (
    <div
      className={`formula-card group relative shrink-0 overflow-hidden rounded-[1.35rem] border border-white/8 bg-white/[0.03] transition duration-500 hover:z-10 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-neon/20 ${
        compact ? "w-[4.9rem] sm:w-[5.7rem]" : "w-[5.6rem] sm:w-[6.4rem]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(117,247,195,0.14),transparent_44%)] opacity-60 transition duration-500 group-hover:opacity-90" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="formula-glitch absolute inset-x-0 top-3 h-px bg-neon/60" />
        <div className="formula-glitch absolute inset-x-0 bottom-4 h-px bg-blue/50" />
      </div>
      <img
        src={imageUrl(tokenId)}
        alt="Formula artwork"
        className="aspect-square w-full object-cover saturate-[1.05] transition duration-500 group-hover:saturate-[1.2]"
        loading="lazy"
      />
    </div>
  );
}

function GalleryTrack({ tokenIds, reverse = false }) {
  const loopIds = [...tokenIds, ...tokenIds];

  return (
    <div className="formula-marquee group overflow-hidden">
      <div className={`formula-track ${reverse ? "formula-track-reverse" : ""}`}>
        {loopIds.map((tokenId, index) => (
          <FormulaCard key={`${tokenId}-${index}`} tokenId={tokenId} compact />
        ))}
      </div>
    </div>
  );
}

export function FormulaGallery() {
  return (
    <div className="space-y-3 overflow-hidden rounded-[1.8rem] border border-line bg-panel/72 p-4 shadow-glow">
      <div className="flex items-center justify-between gap-4 text-[0.65rem] uppercase tracking-[0.24em] text-slate-500">
        <span>Formula Signals</span>
        <span className="whitespace-nowrap text-slate-600">Collection Flow</span>
      </div>
      <GalleryTrack tokenIds={GALLERY_ROWS[0]} />
      <GalleryTrack tokenIds={GALLERY_ROWS[1]} reverse />
    </div>
  );
}

export function FormulaPreviewCluster() {
  const featured = [777, 2048, 4096];

  return (
    <div className="grid grid-cols-3 gap-3">
      {featured.map((tokenId) => (
        <div
          key={tokenId}
          className="formula-card group relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-white/[0.03]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,210,255,0.16),transparent_46%)] opacity-75" />
          <img
            src={imageUrl(tokenId)}
            alt="Formula artwork"
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ))}
    </div>
  );
}

const IMAGE_BASE = "https://raw.githubusercontent.com/Formula7777/formula7777-assets/main/images";

const PREVIEW_TOKENS = [7, 33, 77, 144, 377, 777, 1444, 2333, 4096, 6144];

function imageUrl(tokenId) {
  return `${IMAGE_BASE}/${tokenId}.png`;
}

export function PreviewStrip() {
  return (
    <section className="reveal reveal-delay-4 overflow-hidden rounded-3xl border border-line bg-panel/80 p-5 shadow-glow premium-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview Signals</h2>
        <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600">Collection sample</div>
      </div>

      <div className="preview-marquee">
        <div className="preview-track">
          {[...PREVIEW_TOKENS, ...PREVIEW_TOKENS].map((tokenId, index) => (
            <div
              key={`${tokenId}-${index}`}
              className="preview-signal-card h-[10.5rem] w-[10.5rem] shrink-0 overflow-hidden rounded-[1.35rem] border border-white/8 bg-black/20 sm:h-[11.5rem] sm:w-[11.5rem] lg:h-[12.5rem] lg:w-[12.5rem]"
            >
              <img
                src={imageUrl(tokenId)}
                alt="Formula artwork"
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

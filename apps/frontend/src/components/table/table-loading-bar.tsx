export function TableLoadingBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-card z-50 overflow-x-clip overflow-y-visible">
      <div
        className="h-full absolute w-[40%]"
        style={{
          animation: 'gradient-slide 4s ease-in-out infinite',
        }}
      >
        {/* Core gradient layer */}
        <div
          className="h-full w-full absolute"
          style={{
            background: `linear-gradient(
                  90deg,
                   transparent 0%,
                    oklch(from var(--brand-primary) calc(l/1.2) c h) 35%,
                     oklch(from var(--brand-primary) calc(l/1.1) c h) 50%,
                      oklch(from var(--brand-primary) calc(l/1.2) c h) 65%,
                       transparent 100%)`,
          }}
        >
          {/* Halo effect layer */}
          <div
            id="halo"
            className="-left-2 -right-2 w-full h-1 top-2 z-10 blur-md absolute"
            style={{
              background: `linear-gradient(90deg,
                   transparent 0%,
                    oklch(from var(--brand-primary) l c h / 0.4) 40%,
                    oklch(from var(--brand-primary) l c h / 0.6) 60%,
                    oklch(from var(--brand-primary) l c h / 0.4) 90%,
                    transparent 100%)`,
              boxShadow:
                '0 0 12px 4px oklch(from var(--brand-primary) calc(l/3) c h)',
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes gradient-slide {
          0% {
            left: -50%;
          }
          100% {
            left: 110%;
          }
        }
      `}</style>
    </div>
  );
}


import { memo, useEffect, useState } from "react";

const DEFAULT_LINKS = [
  { label: "Explore", href: "/#explore" },
  { label: "Career paths", href: "/careers" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "My roadmap", href: "/roadmap" },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 44 44" fill="none" className="h-10 w-10 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="pathfinder-mark" x1="5" y1="4" x2="38" y2="40">
          <stop stopColor="#A5B4FC" />
          <stop offset="1" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="42" rx="14" fill="#17152B" stroke="#A5B4FC" strokeOpacity=".22" />
      <circle cx="22" cy="22" r="12" stroke="url(#pathfinder-mark)" strokeWidth="1.2" strokeDasharray="2 3" />
      <ellipse cx="22" cy="22" rx="16" ry="6.5" transform="rotate(-38 22 22)" stroke="url(#pathfinder-mark)" strokeWidth="1.5" />
      <path d="M17 27L27 15L25 24L17 27Z" fill="url(#pathfinder-mark)" />
      <circle cx="33" cy="10" r="2" fill="#C4B5FD" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">
      <path d="M5.5 14.5L14 6M6 6H14V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      {open ? (
        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Navbar({
  links = DEFAULT_LINKS,
  activePath,
  ctaLabel = "Find my path",
  ctaHref = "/dashboard",
  brandHref = "/",
  onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleNavigation(event, href) {
    // Keep the browser from requesting /careers or /roadmap directly.
    if (onNavigate) {
      event.preventDefault();
      setMenuOpen(false);
      onNavigate(href);
      return;
    }
    

    // Without a handler, allow normal links to work.
    setMenuOpen(false);
  }

  function isActive(href) {
    if (activePath) {
      const normalize = (value) => value.split("#")[0] || "/";
      return normalize(activePath) === normalize(href);
    }

    if (typeof window === "undefined") return false;

    const linkUrl = new URL(href, window.location.origin);

    return (
      linkUrl.pathname === window.location.pathname &&
      linkUrl.hash === "" &&
      linkUrl.pathname !== "/"
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#080914]/90 text-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" aria-hidden="true" />

      <nav className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10" aria-label="Main navigation">
        <a
          href={brandHref}
          onClick={(event) => handleNavigation(event, brandHref)}
          className="group flex shrink-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          aria-label="PathFinder AI home"
        >
          <span className="transition-transform duration-300 group-hover:rotate-6">
            <BrandMark />
          </span>
          <span className="flex flex-col">
            <span className="text-[17px] font-semibold tracking-[-0.055em] text-white sm:text-lg">
              PathFinder <span className="text-indigo-300">AI</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">
              Explore your potential
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavigation(event, link.href)}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 xl:px-4 ${
                  active
                    ? "bg-indigo-400/[0.12] text-indigo-200"
                    : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent" />
                )}
              </a>
            );
          })}
        </div>

        <div className="hidden items-center lg:flex">
          <a
            href={ctaHref}
            onClick={(event) => handleNavigation(event, ctaHref)}
            className="group inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-4 py-2.5 text-[13px] font-semibold text-indigo-100 shadow-[0_0_24px_rgba(99,102,241,0.07)] transition duration-200 hover:border-indigo-300/50 hover:from-indigo-500/30 hover:to-violet-500/30 hover:shadow-[0_0_28px_rgba(99,102,241,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {ctaLabel}
            <ArrowUpRight />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-navigation" className="absolute inset-x-0 top-full border-b border-white/[0.08] bg-[#0A0B19] shadow-2xl shadow-black/40 lg:hidden">
          <div className="mx-auto max-w-7xl px-5 pb-6 pt-3 sm:px-8">
            <div className="mb-3 flex items-center gap-2 px-3 py-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
              Navigation
            </div>

            <div className="space-y-1">
              {links.map((link) => {
                const active = isActive(link.href);

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(event) => handleNavigation(event, link.href)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm transition ${
                      active
                        ? "border border-indigo-300/15 bg-indigo-400/[0.10] text-indigo-200"
                        : "border border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {link.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />}
                  </a>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <a
                href={ctaHref}
                onClick={(event) => handleNavigation(event, ctaHref)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/25 bg-gradient-to-r from-indigo-500/25 to-violet-500/25 px-4 py-3.5 text-sm font-semibold text-indigo-100 transition hover:from-indigo-500/35 hover:to-violet-500/35"
              >
                {ctaLabel}
                <ArrowUpRight />
              </a>
              <p className="mt-4 text-center text-[11px] text-slate-600">
                Your future isn't one destination.
                <br />
                Find the path that fits you.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default memo(Navbar);

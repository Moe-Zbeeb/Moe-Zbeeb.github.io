import React, { useState, useEffect } from 'react';

const links = [
  { href: '#overview', label: 'Overview' },
  { href: '#materials', label: 'Materials' },
  { href: '#team', label: 'Team' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center">
          <img src="./background/aub_logo.png" alt="AUB" className="h-14 w-auto object-contain" />
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/90 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden md:inline-flex">
          <a
            href="#overview"
            className="rounded-full bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#751711]"
          >
            Register
          </a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

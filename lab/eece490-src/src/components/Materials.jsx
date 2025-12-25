import React from 'react';
import materials from '../data/materials.js';

function LinkItem({ href, label }) {
  if (!href) {
    return <span className="text-[var(--text-muted)]">{label}</span>;
  }
  return (
    <a
      href={href}
      className="text-white/70 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/60"
    >
      {label}
    </a>
  );
}

function Materials() {
  return (
    <section id="materials" className="section-padding bg-section">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Materials</p>
          <h2 className="text-3xl font-semibold md:text-4xl text-[var(--text-primary)]">Course content</h2>
          <p className="text-base text-[var(--text-secondary)]">MIT-style list with Notes and Deck links.</p>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((module) => (
            <div key={module.title} className="space-y-2">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#27D1D1] leading-snug">{module.title}</h3>
                {module.typeLabel && (
                  <p className="text-sm text-[var(--text-muted)]">{module.typeLabel}</p>
                )}
              </div>
              <div className="mt-1 flex gap-6 text-sm font-semibold">
                <LinkItem href={module.notesUrl} label="Notes" />
                <LinkItem href={module.deckUrl} label="Deck" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Materials;

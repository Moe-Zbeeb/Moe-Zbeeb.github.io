import React from 'react';

function Overview() {
  return (
    <section id="overview" className="section-padding bg-section">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6 text-left">
            <div className="text-center md:text-left space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Description</p>
              <h2 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">Description</h2>
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)] md:text-lg">
              EECE490-690 Machine Learning, a graduate-level course covering theoretical foundations and practical applications of machine learning algorithms.
            </p>
            <div className="space-y-4 text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
              <p>
                The course emphasizes hands-on experience with real-world datasets and modern ML frameworks, progressing from basic statistical methods to advanced deep learning and transformer architectures.
              </p>
              <p>
                Students build intuition, implement models, and evaluate systems across applied domains.
              </p>
            </div>
            <div className="space-y-1 text-sm text-[var(--text-muted)] md:text-base">
              <p><strong>Last Updated:</strong> August 2024</p>
              <p><strong>Version:</strong> 1.0</p>
              <p><strong>License:</strong> Academic Use Only</p>
            </div>
          </div>

          <div className="space-y-6 text-center md:text-left">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Time and Location</p>
              <h2 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">Time and Location</h2>
            </div>
            <div className="space-y-2 text-[var(--text-primary)]">
              <p className="text-lg font-semibold">Fall 2025</p>
              <p className="text-lg font-semibold">EECE 490</p>
              <p className="text-base text-[var(--text-secondary)]">American University of Beirut</p>
              <p className="text-base text-[var(--text-secondary)]">Maroun Semaan Faculty of Engineering</p>
              <p className="text-base font-semibold text-[var(--accent-secondary)]">Lectures, hands-on sessions, and applied projects</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Overview;

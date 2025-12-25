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
              An <span className="text-[var(--accent-secondary)]">efficient and rigorous course</span> designed to teach you the fundamentals of machine learning as clearly as possible.
            </p>
            <div className="space-y-4 text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
              <p>
                EECE 490 is AUB’s introductory course on machine learning methods with applications across data analysis, computer vision, language modeling, and real-world decision systems. Students will develop a solid theoretical foundation, practical implementation skills, and the ability to critically evaluate machine learning models in applied settings.
              </p>
              <p>
                The course emphasizes mathematical intuition, algorithmic understanding, and hands-on experience using modern tools. Topics progress from foundational concepts to more advanced models, concluding with applied projects that connect theory to practice.
              </p>
              <p>
                Prerequisites include basic calculus and linear algebra. Prior experience with Python is helpful but not required.
              </p>
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

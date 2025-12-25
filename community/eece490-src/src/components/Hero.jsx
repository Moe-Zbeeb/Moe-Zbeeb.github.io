import React, { useEffect, useState } from 'react';

function Hero({ backgrounds = [], interval = 7000 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const applications = [
    'computer vision',
    'natural language processing',
    'healthcare',
    'finance',
    'robotics',
    'cybersecurity',
  ];
  const [appIndex, setAppIndex] = useState(0);

  useEffect(() => {
    if (backgrounds.length <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % backgrounds.length);
    }, interval);
    return () => clearInterval(id);
  }, [backgrounds.length, interval]);

  useEffect(() => {
    const id = setInterval(() => {
      setAppIndex((prev) => (prev + 1) % applications.length);
    }, 2000);
    return () => clearInterval(id);
  }, [applications.length]);

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-page"
    >
      <div className="absolute inset-0">
        {backgrounds.map((bg, i) => (
          <div
            key={bg}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-in-out brightness-110 contrast-105 saturate-110 ${
              i === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#11192b]/55 via-[#11192b]/25 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-28 pb-20 md:flex-row md:items-center md:gap-12 md:px-12">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">EECE 490</p>
            <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl">
              Introduction to
              <br />
              Machine Learning
            </h1>
            <p className="max-w-2xl text-lg font-semibold text-[var(--text-secondary)] md:text-xl">
              AUB&apos;s introductory course on machine learning methods with applications in{' '}
              <span
                key={applications[appIndex]}
                className="rotate-word inline-flex min-w-[17ch] items-center justify-center whitespace-nowrap rounded-full bg-[rgba(140,29,24,0.22)] px-4 py-1 text-[var(--text-primary)] shadow-[0_10px_28px_rgba(140,29,24,0.28)] ring-1 ring-[rgba(255,255,255,0.18)] backdrop-blur-sm"
              >
                {applications[appIndex]}
              </span>
            </p>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Start your journey today — The world is moving.</p>
          </div>

          <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="#overview"
              className="rounded-full bg-[var(--accent-primary)] px-6 py-4 text-center text-base font-semibold text-white shadow-[0_12px_30px_rgba(140,29,24,0.35)] transition hover:-translate-y-0.5 hover:bg-[#751711]"
            >
              <div>Current AUB</div>
              <div className="text-sm font-normal text-[var(--text-secondary)]">AUB Students only</div>
            </a>
            <a
              href="#materials"
              className="rounded-full border border-white/20 px-6 py-4 text-center text-base font-semibold text-[var(--text-secondary)] transition hover:-translate-y-0.5 hover:border-white/40 hover:text-[var(--text-primary)]"
            >
              <div>Everyone</div>
              <div className="text-sm font-normal text-[var(--text-secondary)]">All: Public and AUB students</div>
            </a>
          </div>
        </div>

        <div className="flex-1"></div>
      </div>
    </section>
  );
}

export default Hero;

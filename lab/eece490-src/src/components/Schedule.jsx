import React from 'react';

function Button({ href, label, disabled }) {
  const base = 'flex-1 rounded-full px-4 py-2 text-sm font-semibold text-center transition';
  if (disabled) {
    return <span className={`${base} cursor-not-allowed bg-white/10 text-aub-offwhite/40`}>{label}</span>;
  }
  return (
    <a
      href={href}
      className={`${base} bg-white/15 text-aub-offwhite hover:bg-aub-beige hover:text-aub-navy`}
    >
      {label}
    </a>
  );
}

function ScheduleCard({ lecture }) {
  const notesDisabled = !lecture.notesLink;
  const deckDisabled = !lecture.deckLink;
  return (
    <div className="group flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-aub-beige/60 hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl" aria-hidden>
        {lecture.icon}
      </div>
      <h3 className="text-lg font-semibold text-aub-offwhite">{lecture.title}</h3>
      <div className="flex w-full gap-3">
        <Button href={lecture.notesLink || '#'} label="Notes" disabled={notesDisabled} />
        <Button href={lecture.deckLink || '#'} label="Deck" disabled={deckDisabled} />
      </div>
    </div>
  );
}

function Schedule({ lectures = [] }) {
  return (
    <section id="schedule" className="section-padding bg-[#0e1016]">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-aub-beige">Schedule</p>
          <h2 className="text-3xl font-semibold md:text-4xl">Learning arc</h2>
          <p className="max-w-3xl text-base text-aub-offwhite/80">
            A five-day intensive that builds from fundamentals to deployment, with space for
            reflection and mentoring. Each session pairs lecture time with studio-style labs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <ScheduleCard key={lecture.title} lecture={lecture} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Schedule;

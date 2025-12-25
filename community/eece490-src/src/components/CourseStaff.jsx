import React from 'react';
import team from '../data/team.js';

function Avatar({ name, image, size = 'lg' }) {
  const sizes = {
    lg: 'h-44 w-44 md:h-52 md:w-52',
    sm: 'h-14 w-14',
  };
  const cls = sizes[size] || sizes.lg;

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${cls} rounded-full object-cover object-top ring-4 ring-white/80 shadow-[0_0_0_10px_rgba(255,255,255,0.06)]`}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${cls} rounded-full bg-white/10 text-[var(--text-primary)] ring-2 ring-white/50 flex items-center justify-center text-lg font-semibold`}
    >
      {initials}
    </div>
  );
}

function CourseStaff() {
  const instructor = team[0];
  const assistants = team.slice(1);

  return (
    <section id="team" className="section-padding bg-section">
      <div className="mx-auto max-w-6xl space-y-10 px-6 text-center">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-secondary)]">Team</p>
          <h2 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">Course Staff</h2>
          <p className="text-base text-[var(--text-secondary)]">
            Meet the people supporting the course throughout the semester.
          </p>
        </div>

        {instructor && (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-center">
            <Avatar name={instructor.name} image={instructor.image} size="lg" />
            <div className="space-y-2 text-left">
              <div>
                <h3 className="text-2xl font-semibold text-[var(--text-primary)]">{instructor.name}</h3>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">Course Instructor</p>
              </div>
              {instructor.email && (
                <p className="text-sm text-[var(--text-secondary)]">Email: {instructor.email}</p>
              )}
              {instructor.officeHours && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Office hours: {instructor.officeHours}
                </p>
              )}
              <a
                href="https://ammarmohanna.ai/"
                className="text-sm font-semibold text-[var(--accent-secondary)] underline underline-offset-4 decoration-white/20 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                Personal website
              </a>
            </div>
          </div>
        )}

        {assistants.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Assistants</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {assistants.map((ta, idx) => (
                <div key={ta.name} className="flex flex-col items-center gap-3 text-center">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{ta.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{idx === 0 ? ta.role : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CourseStaff;

import React, { useState } from 'react';

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left text-lg font-semibold text-[var(--text-primary)] underline decoration-white/30 underline-offset-4 transition hover:decoration-white/70 focus:outline-none"
      >
        {question}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
        aria-hidden={!isOpen}
      >
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {answer}
        </p>
      </div>
    </div>
  );
}

function FAQ({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  const placeholders = Array.from({ length: 6 }, (_, i) => ({
    question: `Coming soon ${i + 1}`,
    answer: 'Additional information will be added here.',
  }));

  const shouldPad = items.length < 10;
  const combined = shouldPad ? [...items, ...placeholders] : items;

  return (
    <section id="faq" className="section-padding bg-section">
      <div className="mx-auto max-w-5xl space-y-10 px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-semibold text-[var(--text-primary)] md:text-5xl">Frequently Asked Questions</h2>
          <p className="text-sm text-[var(--text-secondary)]">Contact: introtodeeplearning-staff@mit.edu</p>
        </div>

        <div className="grid grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-2">
          {combined.map((item, idx) => (
            <FAQItem
              key={`${item.question}-${idx}`}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;

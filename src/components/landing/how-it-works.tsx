const STEPS = [
  {
    number: '01',
    title: 'Choose Your Event',
    description: 'Select wedding, birthday, or community event to get started.',
  },
  {
    number: '02',
    title: 'Tell Us the Details',
    description:
      'Enter the date, location, guest count, budget, and your preferences through a guided wizard.',
  },
  {
    number: '03',
    title: 'Get Your Plan',
    description:
      'Receive a complete event plan with budget breakdown, timeline, vendor checklist, and creative ideas.',
  },
  {
    number: '04',
    title: 'Refine & Adapt',
    description:
      'Adjust anything — budget, guest count, priorities — and watch the plan update in real time.',
  },
] as const;

/**
 * How-it-works section — four-step process walkthrough.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e2a4a]">
            How Eventura AI works
          </h2>
          <p className="mt-3 text-[#1e2a4a]/60 max-w-lg mx-auto">
            From first idea to polished plan in four simple steps.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (hidden on first, hidden on mobile) */}
              {i > 0 && (
                <div
                  aria-hidden
                  className="hidden lg:block absolute top-6 -left-4 w-8 border-t-2 border-dashed border-[#e8735a]/30"
                />
              )}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8735a] text-white text-sm font-bold shadow-sm">
                {step.number}
              </div>
              <h3 className="mt-5 text-base font-semibold text-[#1e2a4a]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#1e2a4a]/60 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'The vegetables arrived fresh, the quantities were clear, and I did not have to spend my Saturday morning in traffic or moving between market stalls.',
    name: 'Amaka N.',
    role: 'Household customer · Garki',
    initials: 'AN',
  },
  {
    quote:
      'I sent a full restaurant list in the morning and received a well-packed order the same day. The updates made the whole market run easy to follow.',
    name: 'Chinedu O.',
    role: 'Food vendor · Wuse',
    initials: 'CO',
  },
  {
    quote:
      'Being able to add custom items alongside regular groceries is very useful. The shopper called to confirm the exact quality I wanted before buying.',
    name: 'Zainab M.',
    role: 'Working professional · Maitama',
    initials: 'ZM',
  },
];

export function TestimonialsSection() {
  const featured = TESTIMONIALS[0];

  return (
    <section id="testimonials" className="overflow-hidden border-b border-[#F1EADF] bg-[#FFFCF7] text-[#1C1917]">
      <div className="mx-auto max-w-[1200px] px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-extrabold text-[#B45309]">
            <span className="h-px w-8 bg-[#B45309]" aria-hidden="true" />
            Testimonials
            <span className="h-px w-8 bg-[#B45309]" aria-hidden="true" />
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#14221B] sm:text-3xl">
            Hear what Abuja customers say
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#57534E]">
            Fresh market sourcing, useful updates, and dependable delivery—straight from people we
            shop for across the FCT.
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-3xl pb-6 pt-4 sm:mt-9 sm:pb-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-[82%] rotate-[-2deg] rounded-2xl border-t-[6px] border-[#E8BE55] bg-white shadow-[0_18px_50px_-38px_rgba(28,25,23,0.4)] sm:inset-x-16"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-6 h-[84%] rotate-[2deg] rounded-2xl border-t-[6px] border-[#F4D58A] bg-white shadow-[0_18px_50px_-38px_rgba(28,25,23,0.4)] sm:inset-x-10"
          />

          <article className="relative rounded-2xl border border-[#F1EADF] border-t-[7px] border-t-[#FFAA0D] bg-white px-6 py-7 shadow-[0_28px_70px_-42px_rgba(28,25,23,0.55)] sm:px-9 sm:py-8">
            <Quote className="h-9 w-9 fill-[#FFF3D6] text-[#B45309]" aria-hidden="true" />
            <blockquote className="mt-3 font-display text-lg font-semibold leading-relaxed text-[#3F3A34] sm:text-2xl">
              “{featured.quote}”
            </blockquote>

            <div className="mt-6 flex flex-col gap-3 border-t border-[#F1EADF] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[#1C1917] font-display text-sm font-extrabold text-[#FFAA0D]">
                  {featured.initials}
                </span>
                <div>
                  <p className="font-extrabold">{featured.name}</p>
                  <p className="mt-0.5 text-xs text-[#78716C]">{featured.role}</p>
                </div>
              </div>
              <div className="flex gap-1 text-[#F2A900]" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
            </div>
          </article>
        </div>

        <div className="mx-auto grid max-w-3xl gap-3 md:grid-cols-2">
          {TESTIMONIALS.slice(1).map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-2xl border border-[#F1EADF] bg-white p-5 shadow-[0_18px_45px_-38px_rgba(28,25,23,0.5)]"
            >
              <div className="flex gap-1 text-[#F2A900]" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-[#57534E]">
                “{testimonial.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3D6] font-display text-xs font-extrabold text-[#8B5A00]">
                  {testimonial.initials}
                </span>
                <div>
                  <p className="text-sm font-extrabold">{testimonial.name}</p>
                  <p className="text-xs text-[#78716C]">{testimonial.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

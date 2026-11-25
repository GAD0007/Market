import { useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

const BUSINESS_PLAN_ITEMS = [
  {
    number: '01',
    question: 'What is MarketMadeEasyAbj?',
    title: 'Apo Hub to Every Abuja Doorstep',
    content: (
      <p>
        Operating from Apo, Abuja FCT, MarketMadeEasyAbj helps residents conveniently buy groceries
        and foodstuffs from local markets. Orders come in through the website or WhatsApp, and our
        three-bike launch fleet handles sourcing and doorstep delivery.
      </p>
    ),
  },
  {
    number: '02',
    question: 'What problem does the business solve?',
    title: 'No Traffic, No Market Stress',
    content: (
      <p>
        Abuja residents face demanding work schedules, peak-hour road congestion, and crowded
        markets. MarketMadeEasyAbj acts as a trusted personal market assistant—purchasing everything
        customers need cleanly, quickly, and reliably.
      </p>
    ),
  },
  {
    number: '03',
    question: 'What services does MarketMadeEasyAbj offer?',
    title: 'End-to-End Market Runs',
    content: (
      <ul>
        <li>Grocery and foodstuff shopping, including rice, beans, produce, and meat.</li>
        <li>Market sourcing for the best available price and quality.</li>
        <li>Sealed doorstep bike delivery across Abuja FCT.</li>
        <li>Same-day dispatch or scheduled delivery windows.</li>
      </ul>
    ),
  },
  {
    number: '04',
    question: 'Who is the service designed for?',
    title: 'Who We Serve Across Abuja FCT',
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <strong>Working Professionals</strong>
          <p>Order during office hours and receive fresh foodstuffs at home the same evening.</p>
        </div>
        <div>
          <strong>Families &amp; Households</strong>
          <p>Weekly or monthly restocks covering rice, beans, tubers, oils, and meats.</p>
        </div>
        <div>
          <strong>Restaurants &amp; Food Vendors</strong>
          <p>Consistent early-morning sourcing of fresh peppers, tomatoes, and proteins.</p>
        </div>
        <div>
          <strong>Elderly &amp; Busy Individuals</strong>
          <p>Safe doorstep delivery without the stress of navigating busy market stalls.</p>
        </div>
      </div>
    ),
  }
];

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1C1917]';

export function BusinessPlanSection() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  return (
    <section id="business-plan" className="border-b border-[#F1EADF] bg-white text-[#1C1917]">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#B45309]">
              <span className="h-px w-8 bg-[#B45309]" aria-hidden="true" />
              Popular questions
              <span className="h-px w-8 bg-[#B45309]" aria-hidden="true" />
            </p>
            <h2 className="mt-1.5 max-w-[540px] font-display text-2xl font-bold tracking-tight text-[#14221B] sm:text-3xl [text-wrap:balance]">
              Discover frequently asked questions from our customers
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#57534E]">
              Learn how MarketMadeEasyAbj operates, who we serve, and how we make everyday market
              shopping easier from our Apo hub.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://wa.me/2348144791463"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[#FFAA0D] px-5 text-sm font-extrabold text-[#1C1917] transition hover:bg-[#F59E00] ${FOCUS}`}
              >
                Get in touch
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="mailto:ojimbaejike@gmail.com?subject=MarketMadeEasyAbj%20Enquiry"
                className={`inline-flex min-h-[46px] items-center rounded-lg border border-[#DDD6CA] px-5 text-sm font-bold transition hover:bg-[#F7F3EA] ${FOCUS}`}
              >
                Send an email
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7 lg:pt-6">
              {BUSINESS_PLAN_ITEMS.map((item, index) => {
                const isOpen = openItem === index;
                const panelId = `business-plan-panel-${index}`;
                const buttonId = `business-plan-button-${index}`;

                return (
                  <article
                    key={item.number}
                    className="overflow-hidden"
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenItem(isOpen ? null : index)}
                        className={`flex min-h-[62px] w-full items-center gap-4 rounded-lg px-5 py-3.5 text-left shadow-[0_10px_28px_-22px_rgba(28,25,23,0.45)] transition sm:px-6 ${FOCUS} ${
                          isOpen
                            ? 'bg-[#1C1917] text-white'
                            : 'bg-[#F1F0ED] text-[#1C1917] hover:bg-[#E8E5DF]'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-bold ${
                            isOpen ? 'text-[#FFAA0D]' : 'text-[#B45309]'
                          }`}
                        >
                          {item.number}
                        </span>
                        <span className="flex-1 text-[15px] font-extrabold leading-snug sm:text-base">
                          {item.question}
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#FFAA0D]' : 'text-[#1C1917]'
                            }`}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </h3>

                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="mx-2 mt-3 border-l-4 border-[#FFAA0D] bg-[#FFFCF7] px-5 pb-6 pt-7 shadow-[0_18px_36px_-32px_rgba(28,25,23,0.5)] sm:ml-5 sm:px-6 sm:pt-8"
                      >
                        <p className="mb-2 font-display text-xl font-extrabold">{item.title}</p>
                        <div className="space-y-3 text-[15px] leading-relaxed text-[#4F4A43] [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em] [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-[#FFAA0D] [&_strong]:font-bold [&_strong]:text-[#1C1917]">
                          {item.content}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

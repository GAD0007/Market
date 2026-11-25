import type { ReactNode } from 'react';
import { BUSINESS_TEL_HREF } from '../data/marketData';
import type { AppView } from './Navbar';

interface Props {
  onNavigate: (view: AppView, sectionId?: string) => void;
  onOpenBag: () => void;
  whatsappNumber: string;
  whatsappDisplay: string;
}

const linkClass = 'text-white/85 transition hover:text-[#FFAA0D]';

export function SiteFooter({
  onNavigate,
  onOpenBag,
  whatsappNumber,
  whatsappDisplay,
}: Props) {
  return (
    <footer className="bg-[#14221B] text-white">
      <div className="mx-auto max-w-[1200px] px-4 pb-7 pt-12 sm:px-6 sm:pb-8 sm:pt-14 lg:px-8 lg:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <button type="button" onClick={() => onNavigate('storefront', 'top')} className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
              <span className="h-4 w-4 rounded-full bg-[#DC2626]" aria-hidden="true" />
              <span>MarketMadeEasy<span className="text-[#FFAA0D]">Abj</span></span>
            </button>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
              Fresh Abuja market shopping, carefully sourced and delivered from our Apo hub to your doorstep.
            </p>
            <p className="mt-4 text-sm text-white/60">Apo Dispatch Office, Abuja FCT, Nigeria</p>
          </div>

          <FooterGroup title="Shop" label="Footer shop links">
            <button type="button" onClick={() => onNavigate('storefront', 'top')} className={linkClass}>Home</button>
            <button type="button" onClick={() => onNavigate('storefront', 'catalog')} className={linkClass}>Market Catalog</button>
            <button type="button" onClick={() => onNavigate('storefront', 'cameras')} className={linkClass}>Live Markets</button>
            <button type="button" onClick={onOpenBag} className={linkClass}>Market Bag</button>
          </FooterGroup>

          <FooterGroup title="Services" label="Footer service links">
            <button type="button" onClick={() => onNavigate('storefront', 'coverage')} className={linkClass}>Coverage &amp; Fees</button>
            <button type="button" onClick={() => onNavigate('tracking')} className={linkClass}>Track Order</button>
            <button type="button" onClick={() => onNavigate('storefront', 'business-plan')} className={linkClass}>Business Plan</button>
            <button type="button" onClick={() => onNavigate('storefront', 'testimonials')} className={linkClass}>Testimonials</button>
          </FooterGroup>

          <FooterGroup title="Account &amp; Support" label="Footer account and support links">
            <button type="button" onClick={() => onNavigate('customer')} className={linkClass}>Customer Dashboard</button>
            <button type="button" onClick={() => onNavigate('admin')} className={linkClass}>Admin Dashboard</button>
            <a href={BUSINESS_TEL_HREF} className={linkClass}>Call {whatsappDisplay}</a>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp Orders</a>
          </FooterGroup>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MarketMadeEasyAbj. All rights reserved.</p>
          <p>Fresh markets. Easy ordering. Abuja delivery.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFAA0D]">{title}</h2>
      <nav aria-label={label} className="mt-4 flex flex-col items-start gap-3 text-sm">{children}</nav>
    </div>
  );
}

import { ArrowRight, Bike, CalendarClock, MapPin, MessageCircle, Play, Video } from 'lucide-react';
import heroImg from '../assets/images/hero_abuja_market_1794668231758.jpg';
import { BUSINESS_PHONE_DISPLAY, WHATSAPP_BUSINESS_NUMBER } from '../data/marketData';

const ITEMS = [
  { icon: MapPin, label: 'Dispatch Office', value: 'Apo, Abuja FCT', note: 'Central hub for rapid FCT routing' },
  { icon: Bike, label: 'Active Bike Fleet', value: '3 Delivery Bikes', note: 'Dedicated corridors across Abuja' },
  { icon: CalendarClock, label: 'Delivery Options', value: 'Same-Day & Scheduled', note: 'Website & WhatsApp ordering' },
];
const BOWLS = [
  { origin: '30% 35%', pos: 'right-0 top-[6%] lg:top-[5%]' },
  { origin: '58% 58%', pos: 'right-0 top-[40%] lg:top-[36%]' },
  { origin: '85% 72%', pos: 'bottom-[4%] right-[6%] lg:bottom-auto lg:right-[11%] lg:top-[68%]' },
];
interface Props { onOpenBag: () => void; onJumpToCatalog: () => void; onJumpToCameras?: () => void; whatsappNumber?: string; whatsappDisplay?: string }

export function MarketHero({ onJumpToCatalog, onJumpToCameras, whatsappNumber = WHATSAPP_BUSINESS_NUMBER, whatsappDisplay = BUSINESS_PHONE_DISPLAY }: Props) {
  return <section id="top" className="bg-[#FFFCF7]">
    <div className="relative overflow-hidden">
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[68%] text-[#FFAA0D] lg:block"><path d="M24 0 H100 V95 Q80 100 58 98 C38 96 36 72 32 50 C29 32 24 16 24 0 Z" fill="currentColor" /></svg>
      <div className="relative mx-auto max-w-[1200px] px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#E08A00]"><span className="h-0.5 w-6 rounded-full bg-[#FFAA0D]" aria-hidden="true" />Abuja market delivery</p>
            <h1 className="mt-4 max-w-[620px] font-display text-[clamp(1.875rem,8.2vw,3.5rem)] font-extrabold leading-[1.14] tracking-[-0.035em] text-[#1C1917] [text-wrap:balance]">Fresh From Abuja Markets. <span className="text-[#F5A000]">Delivered to Your Door.</span></h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#57534E] sm:text-base">Skip the Abuja traffic and market stress. Send your foodstuff list on our website or WhatsApp. Our Apo shoppers hand-pick quality rice, beans, produce and meat, and our dispatch bikes deliver straight to your estate.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={onJumpToCatalog} className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FFAA0D] px-6 text-sm font-bold text-[#1C1917] shadow-[0_10px_24px_-10px_rgba(245,160,0,0.9)] transition-all hover:bg-[#F59E00] active:scale-[0.98]">Build Market List<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></button>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-[#1C1917] bg-transparent px-6 text-sm font-bold text-[#1C1917] transition-colors hover:bg-[#1C1917] hover:text-white active:scale-[0.98]"><MessageCircle className="h-4 w-4" aria-hidden="true" />Order via WhatsApp</a>
            </div>
            <p className="mt-5 text-sm text-[#57534E]">Call / WhatsApp{' '}<a href={`tel:+${whatsappNumber}`} className="font-mono font-semibold tabular-nums text-[#1C1917] hover:underline">{whatsappDisplay}</a></p>
          </div>

          <div className="relative h-[400px] sm:h-[470px] lg:col-span-7 lg:h-[540px]">
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-8 rounded-[2.5rem] bg-[#FFAA0D] lg:hidden" />
            <div className="absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[10px] border-white shadow-[0_40px_70px_-30px_rgba(120,70,0,0.65)] sm:h-[350px] sm:w-[350px] lg:left-[1%] lg:h-[470px] lg:w-[470px] lg:translate-x-0">
              <img src={heroImg} alt="Fresh Nigerian market foodstuffs including tomatoes, peppers, yams, beans, rice and plantains" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            {BOWLS.map((b, i) => <div key={i} aria-hidden="true" className={`absolute h-14 w-14 overflow-hidden rounded-full border-[5px] border-[#1C1917] bg-[#1C1917] shadow-xl sm:h-16 sm:w-16 lg:h-[100px] lg:w-[100px] lg:border-[6px] ${b.pos}`}><img src={heroImg} alt="" className="h-full w-full object-cover" style={{ transform: 'scale(2.6)', transformOrigin: b.origin }} /></div>)}
            {onJumpToCameras && <button type="button" onClick={onJumpToCameras} className="absolute bottom-3 left-1 inline-flex items-center gap-2.5 rounded-2xl bg-white py-2 pl-2 pr-4 text-left shadow-xl transition hover:-translate-y-0.5 sm:left-4 lg:-left-2 lg:bottom-[7%]">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626] text-white"><Video className="h-4 w-4" aria-hidden="true" /><span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-[#DC2626] bg-white" /></span></span>
              <span className="leading-tight"><span className="block text-xs font-bold text-[#1C1917]">Watch live market cams</span><span className="block text-[11px] text-[#57534E]">Apo · Garki · Wuse</span></span><Play className="h-3 w-3 fill-[#1C1917] text-[#1C1917]" aria-hidden="true" />
            </button>}
          </div>
        </div>
      </div>
    </div>
    <div className="relative z-10 mx-auto hidden max-w-[1200px] px-4 pb-14 sm:px-6 lg:-mt-14 lg:block lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#1C1917] text-white shadow-[0_40px_80px_-30px_rgba(28,25,23,0.7)]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#FFAA0D]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-12">
          <div className="p-6 sm:p-8 lg:col-span-5 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FFAA0D]">Service charge</p>
            <p className="mt-3 font-mono text-3xl font-bold tabular-nums sm:text-4xl">₦2,500<span className="mx-2 text-white/30">–</span>₦12,500</p>
            <p className="mt-2 text-sm text-white/60">Depends on your Abuja location.</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:col-span-7 lg:border-l lg:border-t-0">
            {ITEMS.map(({ icon: Icon, label, value, note }) => <div key={label} className="group flex flex-col p-6 transition-colors hover:bg-white/[0.04] sm:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFAA0D] text-[#1C1917] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-5 text-xs font-medium text-white/50">{label}</p><p className="mt-1 font-display text-lg font-bold leading-tight">{value}</p>
              <p className="mt-2 text-xs leading-snug text-white/50">{note}</p>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

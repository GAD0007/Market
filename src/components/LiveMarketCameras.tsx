import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronDown, MapPin, Minus, Plus, Video } from 'lucide-react';
import { User } from '../lib/auth';
import { ABUJA_MARKET_HUBS, DEFAULT_ABUJA_CAMERA_CHANNELS, MARKET_PRODUCTS, formatNaira } from '../data/marketData';
import { CameraSession, CustomSpottedItem } from '../lib/marketFirestore';
import { CustomMarketItem } from './MarketCatalog';

interface Props {
  user: User | null; liveFirestoreSessions: CameraSession[]; quantities: Record<string, number>;
  customItems: CustomMarketItem[]; onUpdateQuantity: (id: string, delta: number) => void;
  onPickCustomCameraItem: (item: CustomSpottedItem) => void; onUpdateCustomQty: (id: string, delta: number) => void;
  onOpenCameraSession: (session: CameraSession) => void; onOpenLogin: () => void;
  onOpenBag?: () => void; whatsappNumber: string; whatsappDisplay: string; variant?: 'storefront' | 'dashboard';
}
interface CameraFeed { session: CameraSession; stallSection: string; stallImage: string }

export function LiveMarketCameras({ user, liveFirestoreSessions, quantities, customItems, onUpdateQuantity, onPickCustomCameraItem, onUpdateCustomQty, onOpenCameraSession, onOpenLogin, onOpenBag, whatsappNumber, whatsappDisplay, variant = 'storefront' }: Props) {
  const [filter, setFilter] = useState('all');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const defaultPanelOpened = useRef(false);

  const feeds = useMemo<CameraFeed[]>(() => {
    const active = liveFirestoreSessions.filter(s => s.status === 'live').map(session => {
      const hub = ABUJA_MARKET_HUBS.find(h => session.marketLocation.toLowerCase().includes(h.name.split(' ')[0].toLowerCase())) || ABUJA_MARKET_HUBS[0];
      return { session, stallSection: `Live shopper feed · ${session.marketLocation}`, stallImage: hub.stallImage };
    });
    const locations = new Set(active.map(feed => feed.session.marketLocation.toLowerCase()));
    const showcases = DEFAULT_ABUJA_CAMERA_CHANNELS.filter(p => !locations.has(p.marketLocation.toLowerCase())).map(preset => ({
      session: { id: preset.id, shopperId: preset.shopperId, shopperName: preset.shopperName, shopperRole: preset.shopperRole, marketLocation: preset.marketLocation, title: preset.title, status: 'live' as const, featuredProductIds: preset.featuredProductIds, customSpottedItems: preset.customSpottedItems, createdByUid: 'system' },
      stallSection: preset.stallSection, stallImage: preset.stallImage,
    }));
    return [...active, ...showcases];
  }, [liveFirestoreSessions]);

  const visible = filter === 'all' ? feeds : feeds.filter(feed => feed.session.marketLocation.toLowerCase().includes(filter));
  useEffect(() => {
    if (!defaultPanelOpened.current && feeds.length > 0) {
      setOpenIds(new Set([feeds[0].session.id]));
      defaultPanelOpened.current = true;
    }
  }, [feeds]);
  const bagCount = Object.values(quantities).reduce((sum, qty) => sum + qty, 0) + customItems.reduce((sum, item) => sum + item.quantity, 0);
  const bagTotal = MARKET_PRODUCTS.reduce((sum, product) => sum + product.priceNgn * (quantities[product.id] || 0), 0) + customItems.reduce((sum, item) => sum + item.estimatedPriceNgn * item.quantity, 0);
  const toggle = (id: string) => setOpenIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const customInBag = (name: string) => customItems.find(item => item.name.toLowerCase() === name.toLowerCase());
  const wrapper = variant === 'storefront' ? 'border-b border-[#F1EADF] bg-[#FFFCF7]' : 'bg-transparent';
  const container = variant === 'storefront' ? 'mx-auto flex max-w-[1200px] flex-col gap-9 px-4 py-14 sm:px-6 sm:py-[72px] lg:px-8' : 'flex flex-col gap-8';

  return <section id="cameras" className={`${wrapper} text-[#1C1917]`}><div className={container}>
    <div className="flex flex-wrap items-end justify-between gap-7">
      <div className="flex min-w-0 flex-1 basis-[420px] flex-col items-start gap-4">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-[#F1EADF] bg-white px-3.5 py-1.5 text-[13px] font-bold"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DC2626] opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#DC2626]" /></span>{feeds.length} cameras live <span className="font-medium text-[#57534E]">Abuja FCT</span></span>
        <h2 className="max-w-[760px] font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.04] tracking-tight [text-wrap:balance]">See live items inside Abuja markets before you buy</h2>
        <p className="max-w-[600px] text-[17px] leading-relaxed text-[#57534E]">Browse active market camera sessions across Apo, Garki, Wuse, Dei-Dei and Utako. Inspect fresh foodstuffs and add items straight to your Market Bag.</p>
      </div>
      <div className="flex flex-col items-start gap-2.5">
        <div className="flex flex-wrap gap-3">
          {!user && <button type="button" onClick={onOpenLogin} className="min-h-[52px] rounded-full border-2 border-[#1C1917] px-6 text-[15px] font-bold hover:bg-[#1C1917] hover:text-white">Sign In for Live Video Call</button>}
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello MarketMadeEasyAbj, I want to request a live market camera check in Abuja.')}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-[#1C1917] px-[26px] text-[15px] font-bold text-white hover:bg-black"><Camera className="h-[18px] w-[18px]" />Request Stall Check</a>
        </div>
        <span className="text-[13px] text-[#57534E]">Or call <span className="font-mono font-semibold text-[#1C1917]">{whatsappDisplay}</span></span>
      </div>
    </div>

    {bagCount > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#1C1917] py-3.5 pl-6 pr-4 text-white"><div className="flex flex-wrap items-baseline gap-x-4"><span className="text-sm text-white/80">{bagCount} {bagCount === 1 ? 'item' : 'items'} in your Market Bag</span><span className="font-mono text-xl font-bold">{formatNaira(bagTotal)}</span></div>{onOpenBag && <button type="button" onClick={onOpenBag} className="min-h-[44px] rounded-full bg-[#FFAA0D] px-5 text-sm font-extrabold text-[#1C1917]">View Market Bag</button>}</div>}

    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-extrabold">Markets on camera</h3><p className="text-[13px] text-[#57534E]">Pick a market or open panels to compare stalls.</p></div>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button onClick={() => setFilter('all')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === 'all' ? 'bg-[#1C1917] text-white' : 'border border-[#F1EADF] bg-white'}`}>All Markets ({feeds.length})</button>
        {ABUJA_MARKET_HUBS.map(hub => { const key = hub.name.split(' ')[0].toLowerCase(); return <button key={hub.id} onClick={() => setFilter(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === key ? 'bg-[#1C1917] text-white' : 'border border-[#F1EADF] bg-white'}`}>{hub.name}</button>; })}
      </div>
    </div>

    <div className="flex flex-col gap-4">{visible.map((feed, index) => {
      const { session } = feed; const open = openIds.has(session.id);
      const products = MARKET_PRODUCTS.filter(product => session.featuredProductIds.includes(product.id));
      const itemCount = products.length + session.customSpottedItems.length;
      const inBag = products.reduce((sum, p) => sum + (quantities[p.id] || 0), 0) + session.customSpottedItems.reduce((sum, item) => sum + (customInBag(item.name)?.quantity || 0), 0);
      return <article key={session.id} className={`overflow-hidden rounded-[2rem] border bg-white ${open ? 'border-[#1C1917] shadow-[0_28px_56px_-36px_rgba(28,25,23,0.45)]' : 'border-[#F1EADF]'}`}>
        <button type="button" onClick={() => toggle(session.id)} aria-expanded={open} className="group flex w-full flex-col text-left sm:flex-row">
          <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:min-h-[190px] sm:w-64 lg:w-80"><img src={feed.stallImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" /><span className="absolute left-3 top-3 rounded-full bg-[#DC2626] px-2.5 py-1 text-[11px] font-extrabold text-white">● LIVE</span><span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] font-semibold text-white">CAM {String(index + 1).padStart(2, '0')}</span></span>
          <span className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:p-6"><span><span className="font-display text-xl font-extrabold sm:text-2xl">{session.marketLocation}</span><span className="mt-1 flex items-center gap-1.5 text-sm text-[#57534E]"><MapPin className="h-3.5 w-3.5" />{feed.stallSection}</span><span className="mt-1 block truncate text-sm text-[#57534E]">{products.slice(0, 3).map(p => p.name).join(', ')}{itemCount > 3 ? ` +${itemCount - 3} more` : ''}</span></span><span className="flex flex-wrap items-center justify-between gap-3"><span className="flex gap-2"><span className="rounded-full bg-[#FFF3D6] px-3 py-1.5 font-mono text-xs font-bold">{itemCount} items</span>{inBag > 0 && <span className="rounded-full bg-[#FFAA0D] px-3 py-1.5 text-xs font-extrabold">{inBag} in bag</span>}</span><span className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-bold ${open ? 'bg-[#1C1917] text-white' : 'bg-[#FFF3D6]'}`}>{open ? 'Close' : 'View products'}<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></span></span></span>
        </button>
        {open && <div className="border-t border-[#F1EADF] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-extrabold">{session.title}</h3><p className="mt-1 text-[13px] text-[#57534E]">{session.shopperRole}: {session.shopperName} · {itemCount} live items visible</p></div><button type="button" onClick={() => user ? onOpenCameraSession(session) : onOpenLogin()} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#1C1917] px-[22px] text-sm font-extrabold text-white"><Video className="h-[18px] w-[18px]" />Open Market Camera</button></div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-4">
            {products.map(product => { const qty = quantities[product.id] || 0; return <li key={product.id} className={`flex flex-col overflow-hidden rounded-3xl border bg-white ${qty ? 'border-[#FFAA0D] shadow-[0_0_0_3px_rgba(255,170,13,0.35)]' : 'border-[#F1EADF]'}`}><div className="aspect-square overflow-hidden"><img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" /></div><div className="flex flex-1 flex-col gap-3 p-3.5"><div><h4 className="text-[15px] font-bold leading-snug">{product.name}</h4><p className="text-[13px] text-[#57534E]">{product.unit}</p>{qty > 0 && <p className="text-xs font-bold text-[#15803D]">{qty} in bag · {formatNaira(qty * product.priceNgn)}</p>}</div><div className="mt-auto flex items-center justify-between gap-2"><span className="font-mono font-bold">{formatNaira(product.priceNgn)}</span>{qty ? <div className="inline-flex items-center rounded-full bg-[#1C1917] p-[3px] text-white"><button onClick={() => onUpdateQuantity(product.id, -1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><Minus className="h-4 w-4" /></button><span className="min-w-[28px] text-center font-mono font-bold">{qty}</span><button onClick={() => onUpdateQuantity(product.id, 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFAA0D] text-[#1C1917]"><Plus className="h-4 w-4" /></button></div> : <button onClick={() => onUpdateQuantity(product.id, 1)} className="min-h-[44px] rounded-full bg-[#FFAA0D] px-[18px] text-sm font-extrabold"><Plus className="mr-1 inline h-3.5 w-3.5" />Add</button>}</div></div></li>; })}
            {session.customSpottedItems.map(item => { const existing = customInBag(item.name); return <li key={item.id} className={`flex min-h-[220px] flex-col justify-end rounded-3xl border p-4 ${existing ? 'border-[#FFAA0D] bg-[#FFF3D6]' : 'border-[#F1EADF] bg-gradient-to-br from-[#F7D8B0] to-[#E59A45]'}`}><h4 className="font-bold">{item.name}</h4><p className="text-sm text-[#57534E]">{item.unit}</p><div className="mt-3 flex items-center justify-between"><span className="font-mono font-bold">{item.priceNgn ? formatNaira(item.priceNgn) : 'Market price'}</span>{existing ? <div className="inline-flex items-center rounded-full bg-[#1C1917] p-1 text-white"><button onClick={() => onUpdateCustomQty(existing.id, -1)} className="h-9 w-9">−</button><span className="w-6 text-center">{existing.quantity}</span><button onClick={() => onUpdateCustomQty(existing.id, 1)} className="h-9 w-9 rounded-full bg-[#FFAA0D] text-[#1C1917]">+</button></div> : <button onClick={() => onPickCustomCameraItem(item)} className="min-h-[44px] rounded-full bg-[#FFAA0D] px-4 font-bold">+ Add</button>}</div></li>; })}
          </ul>
        </div>}
      </article>;
    })}</div>
  </div></section>;
}

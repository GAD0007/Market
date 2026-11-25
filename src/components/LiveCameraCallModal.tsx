import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, MessageCircle, Plus, ShoppingBag, X } from 'lucide-react';
import { User } from '../lib/auth';
import { BUSINESS_PHONE_DISPLAY, MARKET_PRODUCTS, WHATSAPP_BUSINESS_NUMBER, formatNaira } from '../data/marketData';
import { CameraSession, CustomSpottedItem, VideoCallDoc } from '../lib/marketFirestore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  mode: 'customer' | 'shopper';
  session: CameraSession;
  incomingCall?: VideoCallDoc | null;
  onPickCatalogItem: (productId: string) => void;
  onPickCustomCameraItem: (item: CustomSpottedItem) => void;
  onOpenBag: () => void;
  bagCount: number;
  whatsappNumber?: string;
  whatsappDisplay?: string;
}

export function LiveCameraCallModal({
  isOpen,
  onClose,
  mode,
  session,
  onPickCatalogItem,
  onPickCustomCameraItem,
  onOpenBag,
  bagCount,
  whatsappNumber = WHATSAPP_BUSINESS_NUMBER,
  whatsappDisplay = BUSINESS_PHONE_DISPLAY,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  if (!isOpen) return null;

  async function startPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === 'shopper' ? { facingMode: { ideal: 'environment' } } : true,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setNotice('Camera preview is active. Remote calling will be enabled with the realtime server.');
    } catch {
      setNotice('Camera permission was blocked. You can still select items or contact the shopper on WhatsApp.');
    }
  }

  function pick(label: string, action: () => void) {
    action();
    setPicked((items) => [...items, label]);
  }

  const featured = MARKET_PRODUCTS.filter((product) => session.featuredProductIds.includes(product.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[1px]" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#E7E5E4] p-4">
          <div>
            <p className="text-xs font-semibold text-[#DC2626]">{session.marketLocation}</p>
            <h2 className="font-display text-xl font-bold text-[#14221B]">{session.title}</h2>
            <p className="text-xs text-[#52525B]">Hosted by {session.shopperName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F4F4F0]" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_1fr]">
          <section>
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[#14221B] text-white">
              <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraActive ? '' : 'hidden'}`} />
              {!cameraActive && <CameraOff className="h-12 w-12 text-white/60" />}
            </div>
            <button onClick={startPreview} className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#14221B] px-4 py-2 text-sm font-semibold text-white">
              <Camera className="h-4 w-4" /> Start camera preview
            </button>
            {notice && <p className="mt-3 rounded-lg bg-[#F4F4F0] p-3 text-xs text-[#52525B]">{notice}</p>}
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#15803D] hover:underline">
              <MessageCircle className="h-4 w-4" /> Contact live desk ({whatsappDisplay})
            </a>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[#14221B]">Items on this session</h3>
              <button onClick={onOpenBag} className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626]"><ShoppingBag className="h-4 w-4" /> Bag ({bagCount})</button>
            </div>
            <div className="mt-3 space-y-2">
              {featured.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#E7E5E4] p-3">
                  <div><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-[#52525B]">{formatNaira(product.priceNgn)} · {product.unit}</p></div>
                  {mode === 'customer' && <button onClick={() => pick(product.name, () => onPickCatalogItem(product.id))} className="rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white"><Plus className="inline h-3.5 w-3.5" /> Add</button>}
                </div>
              ))}
              {session.customSpottedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#E7E5E4] p-3">
                  <div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-[#52525B]">{item.priceNgn ? formatNaira(item.priceNgn) : 'Market price'} · {item.unit}</p></div>
                  {mode === 'customer' && <button onClick={() => pick(item.name, () => onPickCustomCameraItem(item))} className="rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white"><Plus className="inline h-3.5 w-3.5" /> Add</button>}
                </div>
              ))}
              {!featured.length && !session.customSpottedItems.length && <p className="rounded-lg bg-[#F4F4F0] p-4 text-xs text-[#52525B]">No items have been tagged yet.</p>}
            </div>
            {picked.length > 0 && <p className="mt-3 text-xs text-[#52525B]"><Check className="mr-1 inline h-4 w-4 text-[#15803D]" /> Added: {picked.join(', ')}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

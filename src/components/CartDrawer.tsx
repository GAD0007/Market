import { useEffect, useMemo, useState, FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ListChecks,
  MessageCircle,
  Minus,
  Plus,
  Receipt,
  Trash2,
  X,
} from 'lucide-react';
import { User } from '../lib/auth';
import {
  ABUJA_DISTRICTS,
  BUSINESS_TEL_HREF,
  MARKET_PRODUCTS,
  formatNaira,
} from '../data/marketData';
import {
  ShoppingListLineItem,
  createMarketOrder,
  createShoppingList,
  getUserPrivateProfile,
} from '../lib/marketFirestore';
import { CustomMarketItem } from './MarketCatalog';

export interface OrderReceipt {
  orderId: string;
  createdAt: string;
  customerName: string;
  phone: string;
  districtName: string;
  assignedBike: string;
  address: string;
  scheduleType: 'Same-Day Dispatch' | 'Scheduled Delivery';
  scheduleSlot: string;
  itemsSummary: { name: string; unit: string; quantity: number; lineTotalNgn: number }[];
  subtotalNgn: number;
  serviceChargeNgn?: number;
  serviceFeeNgn?: number;
  deliveryFeeNgn?: number;
  totalNgn: number;
  notes: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenLogin: () => void;
  whatsappNumber: string;
  whatsappDisplay: string;
  quantities: Record<string, number>;
  onUpdateQuantity: (productId: string, delta: number) => void;
  customItems: CustomMarketItem[];
  onUpdateCustomQty: (id: string, delta: number) => void;
  onRemoveCustomItem: (id: string) => void;
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  onConfirmOrder: (receipt: OrderReceipt) => void;
  recentReceipts: OrderReceipt[];
  onTrackOrder: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  user,
  onOpenLogin,
  whatsappNumber,
  whatsappDisplay,
  quantities,
  onUpdateQuantity,
  customItems,
  onUpdateCustomQty,
  onRemoveCustomItem,
  selectedDistrictId,
  onSelectDistrict,
  onConfirmOrder,
  recentReceipts,
  onTrackOrder,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [listSavedNotice, setListSavedNotice] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;
    getUserPrivateProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setCustomerName((prev) => prev || profile.fullName);
          setPhone((prev) => prev || profile.phone);
          setAddress((prev) => prev || profile.defaultAddress);
        } else if (user.displayName) {
          setCustomerName((prev) => prev || user.displayName || '');
        }
      })
      .catch(() => {});
  }, [user, isOpen]);
  const [scheduleType, setScheduleType] = useState<'Same-Day Dispatch' | 'Scheduled Delivery'>(
    'Same-Day Dispatch'
  );
  const [scheduleSlot, setScheduleSlot] = useState('Afternoon (12:00 PM – 3:00 PM)');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<'bag' | 'receipts'>('bag');
  const [latestConfirmed, setLatestConfirmed] = useState<OrderReceipt | null>(null);

  const catalogLines = useMemo(() => {
    return MARKET_PRODUCTS.filter((p) => (quantities[p.id] || 0) > 0).map((p) => {
      const qty = quantities[p.id];
      return {
        id: p.id,
        name: p.name,
        unit: p.unit,
        unitPriceNgn: p.priceNgn,
        quantity: qty,
        lineTotalNgn: p.priceNgn * qty,
      };
    });
  }, [quantities]);

  const subtotalNgn = useMemo(() => {
    const catalogSum = catalogLines.reduce((acc, item) => acc + item.lineTotalNgn, 0);
    const customSum = customItems.reduce(
      (acc, item) => acc + item.estimatedPriceNgn * item.quantity,
      0
    );
    return catalogSum + customSum;
  }, [catalogLines, customItems]);

  const totalItemCount =
    catalogLines.reduce((acc, item) => acc + item.quantity, 0) +
    customItems.reduce((acc, item) => acc + item.quantity, 0);

  const district =
    ABUJA_DISTRICTS.find((d) => d.id === selectedDistrictId) || ABUJA_DISTRICTS[0];
  const serviceChargeNgn = totalItemCount > 0 ? district.serviceChargeNgn : 0;
  const grandTotalNgn = subtotalNgn + serviceChargeNgn;

  const whatsappMessage = useMemo(() => {
    const lines: string[] = [
      'Hello MarketMadeEasyAbj (Apo Hub), I would like to place an order:',
      '',
      '*ITEMS:*',
    ];
    catalogLines.forEach((item) => {
      lines.push(
        `- ${item.quantity}x ${item.name} (${item.unit}) — ${formatNaira(item.lineTotalNgn)}`
      );
    });
    customItems.forEach((item) => {
      const est =
        item.estimatedPriceNgn > 0
          ? formatNaira(item.estimatedPriceNgn * item.quantity)
          : 'Market Price';
      lines.push(`- ${item.quantity}x ${item.name} (${item.unit}) — Est. ${est}`);
    });
    lines.push('');
    lines.push(`*DELIVERY DETAILS:*`);
    lines.push(`District: ${district.name} (${district.assignedBike})`);
    lines.push(`Address: ${address.trim() || 'To be shared'}`);
    lines.push(`Schedule: ${scheduleType} (${scheduleSlot})`);
    lines.push(`Customer: ${customerName.trim() || 'Abuja Customer'} · ${phone.trim() || 'Phone pending'}`);
    if (notes.trim()) {
      lines.push(`Notes: ${notes.trim()}`);
    }
    lines.push('');
    lines.push(`*FEE BREAKDOWN:*`);
    lines.push(`Foodstuffs Est.: ${formatNaira(subtotalNgn)}`);
    lines.push(`Service Charge (${district.name} · ${district.assignedBike}): ${formatNaira(serviceChargeNgn)}`);
    lines.push(`*Total Estimated: ${formatNaira(grandTotalNgn)}*`);
    return lines.join('\n');
  }, [
    catalogLines,
    customItems,
    district,
    address,
    scheduleType,
    scheduleSlot,
    customerName,
    phone,
    notes,
    subtotalNgn,
    serviceChargeNgn,
    grandTotalNgn,
  ]);

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  async function handleCopyWhatsAppMessage() {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      setCopiedMsg(false);
    }
  }

  async function handleSaveList() {
    if (!user) {
      onOpenLogin();
      return;
    }
    const items: ShoppingListLineItem[] = [
      ...catalogLines.map((i) => ({
        productId: i.id,
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        priceNgn: i.unitPriceNgn,
        isCustom: false,
      })),
      ...customItems.map((i) => ({
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        priceNgn: i.estimatedPriceNgn,
        isCustom: true,
      })),
    ];
    if (items.length === 0) return;
    await createShoppingList(
      user.uid,
      `${district.name} Market List`,
      district.id,
      items
    );
    setListSavedNotice(true);
    setTimeout(() => setListSavedNotice(false), 2500);
  }

  async function handlePlaceOrderSubmit(e: FormEvent) {
    e.preventDefault();
    if (totalItemCount === 0 || isSavingOrder) return;

    setIsSavingOrder(true);
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `MB-${orderNum}`;

    try {
      if (user) {
        const lineItems: ShoppingListLineItem[] = [
          ...catalogLines.map((i) => ({
            productId: i.id,
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            priceNgn: i.unitPriceNgn,
            isCustom: false,
          })),
          ...customItems.map((i) => ({
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            priceNgn: i.estimatedPriceNgn,
            isCustom: true,
          })),
        ];
        await createMarketOrder(user.uid, {
          orderCode,
          customerName: customerName.trim() || user.displayName || 'Abuja Customer',
          phone: phone.trim() || '08000000000',
          districtId: district.id,
          districtName: district.name,
          assignedBike: district.assignedBike,
          address: address.trim() || `${district.name}, Abuja FCT`,
          scheduleType,
          scheduleSlot,
          items: lineItems,
          subtotalNgn,
          serviceChargeNgn,
          totalNgn: grandTotalNgn,
          notes: notes.trim(),
        });
      }

      const receipt: OrderReceipt = {
        orderId: orderCode,
        createdAt: new Date().toLocaleString('en-NG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        customerName: customerName.trim() || user?.displayName || 'Abuja Customer',
        phone: phone.trim() || 'Not provided',
        districtName: district.name,
        assignedBike: district.assignedBike,
        address: address.trim() || `${district.name}, Abuja FCT`,
        scheduleType,
        scheduleSlot,
        itemsSummary: [
          ...catalogLines.map((i) => ({
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            lineTotalNgn: i.lineTotalNgn,
          })),
          ...customItems.map((i) => ({
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            lineTotalNgn: i.estimatedPriceNgn * i.quantity,
          })),
        ],
        subtotalNgn,
        serviceChargeNgn,
        totalNgn: grandTotalNgn,
        notes: notes.trim(),
      };

      onConfirmOrder(receipt);
      setLatestConfirmed(receipt);
    } finally {
      setIsSavingOrder(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Market Bag and Checkout"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-[#14221B]">Market Bag</h2>
            <div className="flex items-center gap-1 rounded-lg bg-[#F4F4F0] p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('bag');
                  setLatestConfirmed(null);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeTab === 'bag'
                    ? 'bg-white text-[#14221B] shadow-xs'
                    : 'text-[#52525B] hover:text-[#14221B]'
                }`}
              >
                Current ({totalItemCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeTab === 'receipts'
                    ? 'bg-white text-[#14221B] shadow-xs'
                    : 'text-[#52525B] hover:text-[#14221B]'
                }`}
              >
                Receipts ({recentReceipts.length})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Market Bag"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#52525B] transition-colors hover:bg-[#F4F4F0] hover:text-[#14221B]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'receipts' ? (
            recentReceipts.length === 0 ? (
              <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-8 text-center">
                <Receipt className="mx-auto h-8 w-8 text-[#71717A]" aria-hidden="true" />
                <p className="mt-3 font-display text-base font-semibold text-[#14221B]">
                  No confirmed receipts yet
                </p>
                <p className="mt-1 text-xs text-[#52525B]">
                  Orders you confirm on this device will appear here for easy tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReceipts.map((rec) => (
                  <div
                    key={rec.orderId}
                    className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#15803D]">
                        Order #{rec.orderId} · Confirmed
                      </span>
                      <span className="text-xs text-[#71717A]">{rec.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#14221B]">
                      {rec.districtName} ({rec.assignedBike})
                    </p>
                    <p className="text-xs text-[#52525B]">
                      {rec.address} · {rec.scheduleType}
                    </p>
                    <div className="mt-3 border-t border-[#E7E5E4] pt-2.5 text-xs text-[#52525B]">
                      {rec.itemsSummary.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono tabular-nums">
                            {item.lineTotalNgn > 0 ? formatNaira(item.lineTotalNgn) : 'Market Price'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#E7E5E4] pt-2.5">
                      <span className="text-xs font-medium text-[#52525B]">Total w/ Fees</span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#14221B]">
                        {formatNaira(rec.totalNgn)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onTrackOrder();
                      }}
                      className="mt-3 min-h-[38px] w-full rounded-lg bg-[#DC2626] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                    >
                      Track Live Dispatch
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : latestConfirmed ? (
            <div className="rounded-xl border border-[#15803D]/30 bg-[#F0FDF4]/60 p-5">
              <div className="flex items-center gap-2 text-[#15803D]">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs font-semibold">
                  Order #{latestConfirmed.orderId} Confirmed — Assigned to{' '}
                  {latestConfirmed.assignedBike}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold text-[#14221B]">
                Your Apo market shopper has received your list
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#52525B]">
                Dispatching from Apo Office to {latestConfirmed.address} (
                {latestConfirmed.districtName}). Schedule: {latestConfirmed.scheduleType} ·{' '}
                {latestConfirmed.scheduleSlot}.
              </p>

              <div className="mt-4 rounded-lg border border-[#E7E5E4] bg-white p-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-[#52525B]">Estimated Foodstuffs</span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(latestConfirmed.subtotalNgn)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#52525B]">
                    Service Charge ({latestConfirmed.districtName})
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(
                      latestConfirmed.serviceChargeNgn ??
                        (latestConfirmed.serviceFeeNgn || 0) +
                          (latestConfirmed.deliveryFeeNgn || 0)
                    )}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#E7E5E4] pt-2 text-sm font-semibold text-[#14221B]">
                  <span>Total Estimated</span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(latestConfirmed.totalNgn)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLatestConfirmed(null);
                    onClose();
                    onTrackOrder();
                  }}
                  className="min-h-[42px] w-full rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                >
                  Track Live Dispatch from Apo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('receipts')}
                  className="min-h-[42px] w-full rounded-lg bg-[#14221B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#273830]"
                >
                  View Saved Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setLatestConfirmed(null)}
                  className="min-h-[40px] w-full rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 text-xs font-semibold text-[#14221B] transition-colors hover:bg-[#F5F5F4]"
                >
                  Start Another Order
                </button>
              </div>
            </div>
          ) : totalItemCount === 0 ? (
            <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-8 text-center">
              <p className="font-display text-base font-semibold text-[#14221B]">
                Your Market Bag is empty
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#52525B]">
                Add rice, beans, vegetables, meat, or custom market items from the catalog to
                calculate your Apo dispatch fees and place your order.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                >
                  Browse Foodstuffs
                </button>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[#52525B]">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#DC2626] hover:underline"
                  >
                    WhatsApp {whatsappDisplay}
                  </a>
                  <span aria-hidden="true">·</span>
                  <a href={BUSINESS_TEL_HREF} className="font-mono tabular-nums hover:underline">
                    Call {whatsappDisplay}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handlePlaceOrderSubmit} className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-[#52525B]">
                  Selected Items
                </h3>
                <div className="mt-2 divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-[#FAFAF8]">
                  {catalogLines.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#14221B]">{item.name}</p>
                        <p className="text-xs text-[#71717A]">
                          {item.unit} · {formatNaira(item.unitPriceNgn)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#D6D3D1] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center text-[#52525B] hover:text-[#14221B]"
                          >
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </button>
                          <span className="min-w-[24px] text-center font-mono text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center text-[#52525B] hover:text-[#14221B]"
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="w-20 text-right font-mono text-xs font-semibold tabular-nums text-[#14221B]">
                          {formatNaira(item.lineTotalNgn)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#14221B]">{item.name}</p>
                        <p className="text-xs text-[#71717A]">
                          Custom · {item.unit}{' '}
                          {item.estimatedPriceNgn > 0
                            ? `· Est. ${formatNaira(item.estimatedPriceNgn)}`
                            : '· Market Price'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#D6D3D1] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateCustomQty(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center text-[#52525B]"
                          >
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </button>
                          <span className="min-w-[24px] text-center font-mono text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCustomQty(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center text-[#52525B]"
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveCustomItem(item.id)}
                          aria-label={`Delete ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#52525B]">
                  Abuja Delivery Details
                </h3>

                <div>
                  <label
                    htmlFor="checkout-district"
                    className="block text-xs font-medium text-[#52525B]"
                  >
                    Abuja FCT District
                  </label>
                  <select
                    id="checkout-district"
                    value={district.id}
                    onChange={(e) => onSelectDistrict(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                  >
                    {ABUJA_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {formatNaira(d.serviceChargeNgn)} ({d.assignedBike})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#52525B]">Delivery Schedule</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(['Same-Day Dispatch', 'Scheduled Delivery'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setScheduleType(mode)}
                        className={`min-h-[40px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          scheduleType === mode
                            ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                            : 'border-[#D6D3D1] bg-white text-[#52525B]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-slot" className="block text-xs font-medium text-[#52525B]">
                    Preferred Time Window
                  </label>
                  <select
                    id="checkout-slot"
                    value={scheduleSlot}
                    onChange={(e) => setScheduleSlot(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                  >
                    <option>Morning (8:30 AM – 11:30 AM)</option>
                    <option>Afternoon (12:00 PM – 3:00 PM)</option>
                    <option>Evening (4:00 PM – 7:00 PM)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-xs font-medium text-[#52525B]"
                    >
                      Your Name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Chinedu Okafor"
                      className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="block text-xs font-medium text-[#52525B]"
                    >
                      Phone / WhatsApp Number
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0803 123 4567"
                      className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-address"
                    className="block text-xs font-medium text-[#52525B]"
                  >
                    Estate / Street Address in {district.name}
                  </label>
                  <input
                    id="customer-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House number, street, estate gate or landmark"
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="market-notes" className="block text-xs font-medium text-[#52525B]">
                    Market Sourcing Notes (Optional)
                  </label>
                  <textarea
                    id="market-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Firm tomatoes, cut chicken into 8 pieces, call at estate gate"
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#15803D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-4 text-sm">
                <div className="flex justify-between py-1 text-xs text-[#52525B]">
                  <span>Foodstuffs Subtotal</span>
                  <span className="font-mono font-medium tabular-nums text-[#14221B]">
                    {formatNaira(subtotalNgn)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-xs text-[#52525B]">
                  <span>
                    Service Charge ({district.name} · {district.assignedBike})
                  </span>
                  <span className="font-mono font-medium tabular-nums text-[#14221B]">
                    {formatNaira(serviceChargeNgn)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#E7E5E4] pt-2.5 text-base font-bold text-[#14221B]">
                  <span>Total Estimated</span>
                  <span className="font-mono tabular-nums">{formatNaira(grandTotalNgn)}</span>
                </div>
              </div>

              <div className="space-y-2.5 pb-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Send Order on WhatsApp ({whatsappDisplay})</span>
                </a>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMessage}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-[#D6D3D1] bg-white px-2.5 py-2 text-xs font-semibold text-[#14221B] transition-colors hover:bg-[#F5F5F4]"
                  >
                    {copiedMsg ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
                        <span>Copy List</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveList}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-[#D6D3D1] bg-white px-2.5 py-2 text-xs font-semibold text-[#14221B] transition-colors hover:bg-[#F5F5F4]"
                  >
                    <ListChecks className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
                    <span>{listSavedNotice ? 'Saved!' : 'Save List'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingOrder}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#14221B] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#273830] disabled:opacity-50"
                  >
                    {isSavingOrder ? 'Saving...' : 'Confirm Order'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

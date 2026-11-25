import { useMemo, useState } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBasket,
  Store,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { User } from '../lib/auth';
import { ABUJA_DISTRICTS, BIKE_FLEET, formatNaira } from '../data/marketData';
import {
  FirestoreMarketOrder,
  OrderStatus,
  cancelCustomerOrder,
} from '../lib/marketFirestore';
import { OrderReceipt } from './CartDrawer';

interface OrderTrackingProps {
  user: User | null;
  orders: FirestoreMarketOrder[];
  isLoadingOrders?: boolean;
  recentReceipts: OrderReceipt[];
  whatsappNumber: string;
  whatsappDisplay: string;
  onOpenLogin: () => void;
  onOpenBag: () => void;
  onBrowseCatalog?: () => void;
}

interface UnifiedTrackableOrder {
  id: string;
  source: 'firestore' | 'local';
  orderCode: string;
  customerName: string;
  phone: string;
  districtId?: string;
  districtName: string;
  assignedBike: string;
  assignedShopperName: string;
  address: string;
  scheduleType: 'Same-Day Dispatch' | 'Scheduled Delivery';
  scheduleSlot: string;
  items: { name: string; unit: string; quantity: number; lineTotalNgn: number }[];
  subtotalNgn: number;
  serviceChargeNgn: number;
  totalNgn: number;
  notes: string;
  status: OrderStatus;
  timestampLabel: string;
}

interface DispatchStageDef {
  key: Exclude<OrderStatus, 'cancelled'>;
  stepNumber: string;
  title: string;
  locationLabel: string;
  description: string;
}

const DISPATCH_STAGES: DispatchStageDef[] = [
  {
    key: 'pending_sourcing',
    stepNumber: '01',
    title: 'Order Logged at Apo Desk',
    locationLabel: 'MarketMadeEasyAbj Office, Apo Abuja',
    description:
      'Your shopping list is queued at our Apo dispatch desk and matched to a Market Boy or Girl.',
  },
  {
    key: 'sourcing_in_market',
    stepNumber: '02',
    title: 'Shopper Buying in Market',
    locationLabel: 'Apo, Garki & Wuse Markets',
    description:
      'Your assigned shopper is hand-picking fresh foodstuffs, verifying quality, and packing crates.',
  },
  {
    key: 'out_for_delivery',
    stepNumber: '03',
    title: 'Dispatched from Apo Hub',
    locationLabel: 'En Route via Abuja Bike Corridor',
    description:
      'Your rider has departed Apo with your packed foodstuffs and is heading directly to your gate.',
  },
  {
    key: 'delivered',
    stepNumber: '04',
    title: 'Delivered to Doorstep',
    locationLabel: 'Customer Estate / Street Address',
    description:
      'Order handed over at your Abuja delivery address. Thank you for shopping with MarketMadeEasyAbj.',
  },
];

const STATUS_DISPLAY: Record<OrderStatus, { label: string; summary: string }> = {
  pending_sourcing: {
    label: 'Pending Sourcing',
    summary: 'Waiting for Apo shopper assignment',
  },
  sourcing_in_market: {
    label: 'Shopper Buying in Market',
    summary: 'Actively sourcing foodstuffs in Abuja market',
  },
  out_for_delivery: {
    label: 'Out for Bike Delivery',
    summary: 'Rider dispatched from Apo Market hub',
  },
  delivered: {
    label: 'Delivered',
    summary: 'Completed at Abuja doorstep',
  },
  cancelled: {
    label: 'Cancelled',
    summary: 'Order cancelled prior to market sourcing',
  },
};

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending_sourcing':
      return 0;
    case 'sourcing_in_market':
      return 1;
    case 'out_for_delivery':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
      return -1;
  }
}

export function OrderTracking({
  user,
  orders,
  isLoadingOrders = false,
  recentReceipts,
  whatsappNumber,
  whatsappDisplay,
  onOpenLogin,
  onOpenBag,
  onBrowseCatalog,
}: OrderTrackingProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showAllItems, setShowAllItems] = useState<boolean>(false);

  const trackableOrders = useMemo<UnifiedTrackableOrder[]>(() => {
    const liveMapped: UnifiedTrackableOrder[] = orders.map((order) => ({
      id: `fs-${order.id}`,
      source: 'firestore',
      orderCode: order.orderCode,
      customerName: order.customerName,
      phone: order.phone,
      districtId: order.districtId,
      districtName: order.districtName,
      assignedBike: order.assignedBike,
      assignedShopperName: order.assignedShopperName,
      address: order.address,
      scheduleType: order.scheduleType,
      scheduleSlot: order.scheduleSlot,
      items: order.items.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        lineTotalNgn: item.priceNgn * item.quantity,
      })),
      subtotalNgn: order.subtotalNgn,
      serviceChargeNgn: order.serviceChargeNgn,
      totalNgn: order.totalNgn,
      notes: order.notes,
      status: order.status,
      timestampLabel: order.updatedAt?.toDate
        ? order.updatedAt.toDate().toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : order.createdAt?.toDate
          ? order.createdAt.toDate().toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'Just now',
    }));

    const liveCodes = new Set(liveMapped.map((o) => o.orderCode));

    const localMapped: UnifiedTrackableOrder[] = recentReceipts
      .filter((r) => !liveCodes.has(r.orderId))
      .map((rec) => ({
        id: `local-${rec.orderId}`,
        source: 'local',
        orderCode: rec.orderId,
        customerName: rec.customerName,
        phone: rec.phone,
        districtName: rec.districtName,
        assignedBike: rec.assignedBike,
        assignedShopperName: 'Apo Desk (Local Receipt)',
        address: rec.address,
        scheduleType: rec.scheduleType,
        scheduleSlot: rec.scheduleSlot,
        items: rec.itemsSummary,
        subtotalNgn: rec.subtotalNgn,
        serviceChargeNgn:
          rec.serviceChargeNgn ??
          (rec.serviceFeeNgn || 0) + (rec.deliveryFeeNgn || 0),
        totalNgn: rec.totalNgn,
        notes: rec.notes,
        status: 'pending_sourcing',
        timestampLabel: rec.createdAt,
      }));

    return [...liveMapped, ...localMapped];
  }, [orders, recentReceipts]);

  const activeOrder = useMemo(() => {
    if (trackableOrders.length === 0) return null;
    if (selectedOrderId) {
      const found = trackableOrders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    // Default to the newest non-delivered, non-cancelled order first, or newest overall
    return (
      trackableOrders.find(
        (o) => o.status !== 'delivered' && o.status !== 'cancelled'
      ) || trackableOrders[0]
    );
  }, [trackableOrders, selectedOrderId]);

  const matchedDistrict = useMemo(() => {
    if (!activeOrder) return ABUJA_DISTRICTS[0];
    return (
      ABUJA_DISTRICTS.find(
        (d) =>
          d.id === activeOrder.districtId ||
          d.name.toLowerCase() === activeOrder.districtName.toLowerCase()
      ) || ABUJA_DISTRICTS[0]
    );
  }, [activeOrder]);

  const matchedBike = useMemo(() => {
    if (!activeOrder) return BIKE_FLEET[0];
    return (
      BIKE_FLEET.find((b) => b.bikeId === activeOrder.assignedBike) || BIKE_FLEET[0]
    );
  }, [activeOrder]);

  async function handleCancelOrder(firestoreDocId: string) {
    setCancellingId(firestoreDocId);
    setCancelError(null);
    try {
      await cancelCustomerOrder(firestoreDocId);
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? 'Could not cancel this order. Please contact Apo Dispatch on WhatsApp.'
          : 'Cancellation failed.'
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoadingOrders && trackableOrders.length === 0) {
    return (
      <div className="rounded-xl border border-[#E7E5E4] bg-white p-8">
        <p className="font-display text-base font-semibold text-[#14221B]">
          Loading your live Abuja dispatch status...
        </p>
        <p className="mt-1 text-xs text-[#52525B]">
          Syncing order progress with the Apo Dispatch Desk.
        </p>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="rounded-xl border border-[#E7E5E4] bg-white p-8 text-center">
        <Bike className="mx-auto h-9 w-9 text-[#DC2626]" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-bold text-[#14221B]">
          No active Abuja market order to track
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#52525B]">
          Place an order from your Market Bag to track live sourcing in Apo Market and watch
          Bike 01–03 dispatch progress to your estate.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!user && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 text-xs font-semibold text-[#14221B] whitespace-nowrap shrink-0 transition-colors hover:bg-[#FAFAF8]"
            >
              <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign In for Live Order History</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBrowseCatalog || onOpenBag}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#B91C1C]"
          >
            <ShoppingBasket className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Build Market Order</span>
          </button>
        </div>
      </div>
    );
  }

  const stageIndex = getStageIndex(activeOrder.status);
  const progressPercent =
    activeOrder.status === 'cancelled'
      ? 0
      : Math.round(((stageIndex + 1) / DISPATCH_STAGES.length) * 100);
  const rawFirestoreId = activeOrder.id.startsWith('fs-')
    ? activeOrder.id.slice(3)
    : null;
  const visibleItems = showAllItems
    ? activeOrder.items
    : activeOrder.items.slice(0, 5);

  const whatsappStatusHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello MarketMadeEasyAbj Apo Hub, I am checking live dispatch progress for Order #${activeOrder.orderCode} (${activeOrder.districtName} · ${activeOrder.assignedBike}).`
  )}`;

  return (
    <div className="space-y-6">
      {trackableOrders.length > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-[#52525B]">
            Tracking {trackableOrders.length} orders <span aria-hidden="true">·</span> Select an
            order
          </p>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white p-1">
            {trackableOrders.slice(0, 5).map((ord) => {
              const selected = ord.id === activeOrder.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(ord.id);
                    setShowAllItems(false);
                  }}
                  className={`min-h-[36px] rounded-md px-3 py-1.5 font-mono text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    selected
                      ? 'bg-[#14221B] text-white'
                      : 'text-[#52525B] hover:bg-[#FAFAF8] hover:text-[#14221B]'
                  }`}
                >
                  #{ord.orderCode}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeOrder.source === 'local' && !user && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-white p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-[#14221B]">
              Viewing local device receipt for #{activeOrder.orderCode}
            </p>
            <p className="mt-0.5 text-xs text-[#52525B]">
              Sign in with Google before placing an order to receive real-time shopper &amp; rider
              updates from the Apo Dispatch Board.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="min-h-[38px] rounded-lg bg-[#DC2626] px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#B91C1C]"
          >
            Sign In
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[#E7E5E4] bg-white p-6">
        {/* Top Summary Header */}
        <div className="flex flex-col gap-4 border-b border-[#E7E5E4] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
              <span className="font-mono font-semibold text-[#14221B]">
                Order #{activeOrder.orderCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeOrder.source === 'firestore' ? 'Live Apo Dispatch Sync' : 'Device Receipt'}</span>
              <span aria-hidden="true">·</span>
              <span>Updated {activeOrder.timestampLabel}</span>
            </div>

            <div className="mt-2 flex items-center gap-2.5">
              {activeOrder.status === 'cancelled' ? (
                <XCircle className="h-6 w-6 shrink-0 text-[#DC2626]" aria-hidden="true" />
              ) : activeOrder.status === 'delivered' ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-[#15803D]" aria-hidden="true" />
              ) : activeOrder.status === 'out_for_delivery' ? (
                <Bike className="h-6 w-6 shrink-0 text-[#DC2626]" aria-hidden="true" />
              ) : (
                <Store className="h-6 w-6 shrink-0 text-[#DC2626]" aria-hidden="true" />
              )}
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#14221B]">
                {STATUS_DISPLAY[activeOrder.status].label}
              </h2>
            </div>

            <p className="mt-1 text-sm text-[#52525B]">
              {STATUS_DISPLAY[activeOrder.status].summary} <span aria-hidden="true">·</span>{' '}
              Destination: <strong className="font-semibold text-[#14221B]">{activeOrder.districtName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={whatsappStatusHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#B91C1C]"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>WhatsApp Apo Desk</span>
            </a>

            <a
              href={`tel:+${whatsappNumber}`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 font-mono text-xs font-semibold tabular-nums text-[#14221B] whitespace-nowrap shrink-0 transition-colors hover:bg-[#FAFAF8]"
            >
              <Phone className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
              <span>{whatsappDisplay}</span>
            </a>

            {rawFirestoreId && activeOrder.status === 'pending_sourcing' && (
              <button
                type="button"
                disabled={cancellingId === rawFirestoreId}
                onClick={() => handleCancelOrder(rawFirestoreId)}
                className="min-h-[40px] rounded-lg border border-[#E7E5E4] bg-white px-3.5 py-2 text-xs font-semibold text-[#52525B] whitespace-nowrap shrink-0 transition-colors hover:border-[#DC2626] hover:text-[#DC2626] disabled:opacity-50"
              >
                {cancellingId === rawFirestoreId ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {cancelError && (
          <p className="mt-3 text-xs font-medium text-[#DC2626]">{cancelError}</p>
        )}

        {/* Dispatch Progress Bar & 4-Step Apo-to-Doorstep Tracker */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#14221B]">
              Apo Market Dispatch Progress
            </span>
            <span className="font-mono font-semibold tabular-nums text-[#52525B]">
              {activeOrder.status === 'cancelled'
                ? 'Cancelled'
                : `Stage ${stageIndex + 1} of ${DISPATCH_STAGES.length} (${progressPercent}%)`}
            </span>
          </div>

          <div
            className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#F4F4F0]"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Order dispatch progress from Apo market"
          >
            <div
              className={`h-full transition-all duration-300 ${
                activeOrder.status === 'delivered'
                  ? 'bg-[#15803D]'
                  : activeOrder.status === 'cancelled'
                    ? 'bg-[#71717A]'
                    : 'bg-[#DC2626]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {DISPATCH_STAGES.map((stage, index) => {
              const isCancelled = activeOrder.status === 'cancelled';
              const isCompleted = !isCancelled && stageIndex > index;
              const isCurrent = !isCancelled && stageIndex === index;
              const isDeliveredFinal =
                activeOrder.status === 'delivered' && index === DISPATCH_STAGES.length - 1;

              return (
                <li
                  key={stage.key}
                  className={`rounded-xl border p-4 transition-colors ${
                    isCurrent
                      ? isDeliveredFinal
                        ? 'border-[#15803D] bg-[#F0FDF4]/50'
                        : 'border-[#DC2626] bg-[#FEF2F2]/40'
                      : isCompleted
                        ? 'border-[#15803D]/30 bg-[#FAFAF8]'
                        : 'border-[#E7E5E4] bg-[#FAFAF8]/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        isCurrent
                          ? isDeliveredFinal
                            ? 'text-[#15803D]'
                            : 'text-[#DC2626]'
                          : isCompleted
                            ? 'text-[#15803D]'
                            : 'text-[#71717A]'
                      }`}
                    >
                      {stage.stepNumber} ·{' '}
                      {isCompleted || isDeliveredFinal
                        ? 'Done'
                        : isCurrent
                          ? 'Active'
                          : 'Queued'}
                    </span>

                    {isCompleted || isDeliveredFinal ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-[#15803D]"
                        aria-hidden="true"
                      />
                    ) : isCurrent ? (
                      <Clock
                        className="h-4 w-4 shrink-0 text-[#DC2626]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Package
                        className="h-4 w-4 shrink-0 text-[#71717A]"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <p className="mt-2 font-display text-sm font-bold text-[#14221B]">
                    {stage.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#52525B]">
                    {stage.locationLabel}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#52525B]">
                    {stage.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Apo Market Route & Rider Telemetry Grid */}
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#E7E5E4] bg-[#E7E5E4] sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-[#FAFAF8] p-4">
            <p className="text-xs font-medium text-[#52525B]">Origin Market Hub</p>
            <p className="mt-1 font-display text-sm font-bold text-[#14221B]">
              Apo Main Hub, Abuja
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-[#71717A]">
              {matchedDistrict.distanceFromApoKm} km route to {activeOrder.districtName}
            </p>
          </div>

          <div className="bg-[#FAFAF8] p-4">
            <p className="text-xs font-medium text-[#52525B]">Assigned Dispatch Bike</p>
            <p className="mt-1 font-mono text-sm font-bold text-[#14221B]">
              {activeOrder.assignedBike}
            </p>
            <p className="mt-1 text-xs text-[#71717A]">{matchedBike.label}</p>
          </div>

          <div className="bg-[#FAFAF8] p-4">
            <p className="text-xs font-medium text-[#52525B]">Market Boy / Girl</p>
            <p className="mt-1 font-display text-sm font-bold text-[#14221B]">
              {activeOrder.assignedShopperName}
            </p>
            <p className="mt-1 text-xs text-[#71717A]">
              {activeOrder.scheduleType}
            </p>
          </div>

          <div className="bg-[#FAFAF8] p-4">
            <p className="text-xs font-medium text-[#52525B]">Estimated Window</p>
            <p className="mt-1 font-mono text-sm font-bold tabular-nums text-[#14221B]">
              {matchedDistrict.etaWindow}
            </p>
            <p className="mt-1 truncate text-xs text-[#71717A]">
              {activeOrder.scheduleSlot}
            </p>
          </div>
        </div>

        {/* Bottom Split: Delivery Destination & Itemized Basket */}
        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[#E7E5E4] pt-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-[#14221B]">
              <MapPin className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
              <span>Delivery Drop-Off</span>
            </h3>
            <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF8] p-4 text-xs">
              <p className="font-semibold text-[#14221B]">{activeOrder.customerName}</p>
              <p className="mt-0.5 font-mono tabular-nums text-[#52525B]">
                {activeOrder.phone}
              </p>
              <p className="mt-2 leading-relaxed text-[#14221B]">
                {activeOrder.address}
              </p>
              <p className="mt-1 text-[#52525B]">
                District: {activeOrder.districtName} <span aria-hidden="true">·</span>{' '}
                {matchedBike.capacityNote}
              </p>
              {activeOrder.notes && (
                <p className="mt-2 border-t border-[#E7E5E4] pt-2 text-[#52525B]">
                  Shopper Note: {activeOrder.notes}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#14221B]">
                Foodstuffs &amp; Fee Breakdown ({activeOrder.items.length} items)
              </h3>
              {activeOrder.items.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllItems((prev) => !prev)}
                  className="text-xs font-semibold text-[#DC2626] hover:underline"
                >
                  {showAllItems
                    ? 'Show fewer'
                    : `Show all ${activeOrder.items.length} items`}
                </button>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E5E4] bg-[#FAFAF8]">
              <div className="divide-y divide-[#E7E5E4]">
                {visibleItems.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[#14221B]">
                        {item.quantity}x {item.name}
                      </span>{' '}
                      <span className="text-[#71717A]">({item.unit})</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums text-[#14221B]">
                      {item.lineTotalNgn > 0
                        ? formatNaira(item.lineTotalNgn)
                        : 'Market Price'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t border-[#E7E5E4] bg-white px-4 py-3 text-xs">
                <div className="flex justify-between text-[#52525B]">
                  <span>Foodstuffs Subtotal</span>
                  <span className="font-mono tabular-nums text-[#14221B]">
                    {formatNaira(activeOrder.subtotalNgn)}
                  </span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>
                    Service Charge ({activeOrder.districtName} · {activeOrder.assignedBike})
                  </span>
                  <span className="font-mono tabular-nums text-[#14221B]">
                    {formatNaira(activeOrder.serviceChargeNgn)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E7E5E4] pt-2 text-sm font-bold text-[#14221B]">
                  <span>Total Estimated</span>
                  <span className="font-mono tabular-nums">
                    {formatNaira(activeOrder.totalNgn)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

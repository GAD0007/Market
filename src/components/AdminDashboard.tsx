import { useEffect, useMemo, useState, FormEvent } from 'react';
import {
  Bike,
  Camera,
  Check,
  MessageCircle,
  Package,
  Plug,
  Plus,
  Shield,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { User } from '../lib/auth';
import {
  ABUJA_MARKET_HUBS,
  BIKE_FLEET,
  DEFAULT_ABUJA_CAMERA_CHANNELS,
  MARKET_PRODUCTS,
  formatNaira,
} from '../data/marketData';
import { BOOTSTRAPPED_ADMIN_EMAIL, testApiConnection } from '../lib/auth';
import {
  AdminConnector,
  AdminGrant,
  CameraSession,
  CustomSpottedItem,
  FirestoreMarketOrder,
  MarketShopper,
  OrderStatus,
  VideoCallDoc,
  adminUpdateOrderDispatch,
  createCameraSession,
  deleteShopper,
  grantAdminRole,
  revokeAdminRole,
  saveStorefrontConfig,
  seedDefaultConnectorsIfEmpty,
  seedDefaultShoppersIfEmpty,
  subscribeAdminConnectors,
  subscribeAdminGrants,
  subscribeAdminVideoCalls,
  subscribeAllOrdersAdmin,
  subscribeCameraSessions,
  subscribeShoppers,
  updateCameraSession,
  upsertAdminConnector,
  upsertShopper,
} from '../lib/marketFirestore';

interface AdminDashboardProps {
  user: User | null;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onOpenShopperCameraModal: (session: CameraSession, incomingCall?: VideoCallDoc | null) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending_sourcing', label: 'Pending Sourcing' },
  { value: 'sourcing_in_market', label: 'Sourcing in Market' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminDashboard({
  user,
  isAdmin,
  onOpenLogin,
  onOpenShopperCameraModal,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'cameras' | 'connectors' | 'roles'>(
    'dispatch'
  );
  const [orders, setOrders] = useState<FirestoreMarketOrder[]>([]);
  const [shoppers, setShoppers] = useState<MarketShopper[]>([]);
  const [cameraSessions, setCameraSessions] = useState<CameraSession[]>([]);
  const [videoCalls, setVideoCalls] = useState<VideoCallDoc[]>([]);
  const [connectors, setConnectors] = useState<AdminConnector[]>([]);
  const [adminGrants, setAdminGrants] = useState<AdminGrant[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // New Shopper form
  const [shopperName, setShopperName] = useState('');
  const [shopperRole, setShopperRole] = useState<'Market Boy' | 'Market Girl'>('Market Boy');
  const [shopperMarket, setShopperMarket] = useState('Apo Main Market');
  const [shopperSpecialty, setShopperSpecialty] = useState('');
  const [shopperBike, setShopperBike] = useState('Bike 01');

  // Start Live Camera Session form
  const [camShopperId, setCamShopperId] = useState('');
  const [camMarketLocation, setCamMarketLocation] = useState(ABUJA_MARKET_HUBS[0].name);
  const [camTitle, setCamTitle] = useState('Morning Apo Produce & Stew Stall');
  const [camProductIds, setCamProductIds] = useState<string[]>([
    'tomatoes-basket',
    'pepper-mix',
    'rice-5kg',
    'fresh-beef',
  ]);
  const [spottedName, setSpottedName] = useState('');
  const [spottedUnit, setSpottedUnit] = useState('');
  const [spottedPrice, setSpottedPrice] = useState('');
  const [customSpotted, setCustomSpotted] = useState<CustomSpottedItem[]>([]);
  const [seedingAllMarkets, setSeedingAllMarkets] = useState(false);

  // Connector editor state
  const [editingConnector, setEditingConnector] = useState<AdminConnector | null>(null);
  const [newConnName, setNewConnName] = useState('');
  const [newConnCategory, setNewConnCategory] = useState<AdminConnector['category']>('Webhook');
  const [newConnEndpoint, setNewConnEndpoint] = useState('');
  const [newConnNotes, setNewConnNotes] = useState('');
  const [connectorCheckMsg, setConnectorCheckMsg] = useState<string | null>(null);

  // Admin role grant form
  const [grantUid, setGrantUid] = useState('');
  const [grantEmail, setGrantEmail] = useState('');

  useEffect(() => {
    if (!user || !isAdmin) return;

    seedDefaultShoppersIfEmpty().catch(() => {});
    seedDefaultConnectorsIfEmpty(user.uid).catch(() => {});

    const unsubOrders = subscribeAllOrdersAdmin(setOrders);
    const unsubShoppers = subscribeShoppers((list) => {
      setShoppers(list);
      if (list.length > 0 && !camShopperId) {
        setCamShopperId(list[0].id);
      }
    });
    const unsubCameras = subscribeCameraSessions(setCameraSessions);
    const unsubCalls = subscribeAdminVideoCalls(setVideoCalls);
    const unsubConnectors = subscribeAdminConnectors(setConnectors);
    const unsubAdmins = subscribeAdminGrants(setAdminGrants);

    return () => {
      unsubOrders();
      unsubShoppers();
      unsubCameras();
      unsubCalls();
      unsubConnectors();
      unsubAdmins();
    };
  }, [user, isAdmin]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const orderStats = useMemo(() => {
    const active = orders.filter(
      (o) =>
        o.status === 'pending_sourcing' ||
        o.status === 'sourcing_in_market' ||
        o.status === 'out_for_delivery'
    ).length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalNgn, 0);
    return { total: orders.length, active, delivered, totalRevenue };
  }, [orders]);

  if (!user) {
    return (
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-[#E7E5E4] bg-white p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-[#DC2626]" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-[#14221B]">
            Admin, Dispatch &amp; Shopper Camera Console
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#52525B]">
            Sign in with your authorized Admin Google account ({BOOTSTRAPPED_ADMIN_EMAIL}) to
            manage Abuja bike dispatch, Market Boys &amp; Girls cameras, live customer video calls,
            and all platform connectors.
          </p>
          <button
            type="button"
            onClick={onOpenLogin}
            className="mt-6 min-h-[44px] rounded-lg bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C]"
          >
            Sign in as Admin
          </button>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-[#E7E5E4] bg-white p-8">
          <p className="text-xs font-semibold text-[#DC2626]">Access Restricted</p>
          <h1 className="mt-1 font-display text-xl font-bold text-[#14221B]">
            Admin privileges required
          </h1>
          <p className="mt-2 text-sm text-[#52525B]">
            Signed in as <span className="font-medium text-[#14221B]">{user.email}</span>. Only{' '}
            <span className="font-mono text-[#14221B]">{BOOTSTRAPPED_ADMIN_EMAIL}</span> or
            authorized team UIDs can operate the Admin Dispatch &amp; Connector Console.
          </p>
          <div className="mt-4 rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] p-3 text-xs">
            <p className="text-[#52525B]">Your Account UID (share with Admin to grant access):</p>
            <p className="mt-1 select-all font-mono font-semibold text-[#14221B]">{user.uid}</p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="mt-5 min-h-[40px] rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 text-xs font-semibold text-[#14221B] hover:bg-[#F5F5F4]"
          >
            Switch Google Account
          </button>
        </div>
      </section>
    );
  }

  async function handleAddShopper(e: FormEvent) {
    e.preventDefault();
    if (!shopperName.trim()) return;
    const id = `shopper-${Date.now()}`;
    await upsertShopper(id, {
      name: shopperName,
      roleLabel: shopperRole,
      marketLocation: shopperMarket,
      specialty: shopperSpecialty || 'Fresh Produce & Staples',
      bikeCode: shopperBike,
      isAvailable: true,
    });
    setShopperName('');
    setShopperSpecialty('');
  }

  function handleAddSpottedItem() {
    if (!spottedName.trim()) return;
    const price = Number(spottedPrice.replace(/[^0-9]/g, '')) || 0;
    setCustomSpotted((prev) => [
      ...prev,
      {
        id: `spot-${Date.now()}`,
        name: spottedName.trim(),
        unit: spottedUnit.trim() || '1 Market Unit',
        priceNgn: price,
      },
    ]);
    setSpottedName('');
    setSpottedUnit('');
    setSpottedPrice('');
  }

  async function handleLaunchCameraSession(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const shopper = shoppers.find((s) => s.id === camShopperId) || shoppers[0];
    if (!shopper) return;

    const chosenMarket = camMarketLocation || shopper.marketLocation;

    const newSessionId = await createCameraSession(user.uid, {
      shopperId: shopper.id,
      shopperName: shopper.name,
      shopperRole: shopper.roleLabel,
      marketLocation: chosenMarket,
      title: camTitle || `${chosenMarket} Live Feed`,
      status: 'live',
      featuredProductIds: camProductIds,
      customSpottedItems: customSpotted,
    });

    const createdSession: CameraSession = {
      id: newSessionId,
      shopperId: shopper.id,
      shopperName: shopper.name,
      shopperRole: shopper.roleLabel,
      marketLocation: chosenMarket,
      title: camTitle || `${chosenMarket} Live Feed`,
      status: 'live',
      featuredProductIds: camProductIds,
      customSpottedItems: customSpotted,
      createdByUid: user.uid,
    };
    setCustomSpotted([]);
    onOpenShopperCameraModal(createdSession, null);
  }

  async function handleActivateAllAbujaMarkets() {
    if (!user || seedingAllMarkets) return;
    setSeedingAllMarkets(true);
    try {
      const existingLiveMarkets = new Set(
        cameraSessions
          .filter((s) => s.status === 'live')
          .map((s) => s.marketLocation.toLowerCase())
      );
      for (const preset of DEFAULT_ABUJA_CAMERA_CHANNELS) {
        if (existingLiveMarkets.has(preset.marketLocation.toLowerCase())) continue;
        await createCameraSession(user.uid, {
          shopperId: preset.shopperId,
          shopperName: preset.shopperName,
          shopperRole: preset.shopperRole,
          marketLocation: preset.marketLocation,
          title: preset.title,
          status: 'live',
          featuredProductIds: preset.featuredProductIds,
          customSpottedItems: preset.customSpottedItems,
        });
      }
    } finally {
      setSeedingAllMarkets(false);
    }
  }

  async function handleSaveConnectorEdit(e: FormEvent) {
    e.preventDefault();
    if (!user || !editingConnector) return;
    await upsertAdminConnector(editingConnector.id, user.uid, {
      name: editingConnector.name,
      category: editingConnector.category,
      enabled: editingConnector.enabled,
      endpointOrValue: editingConnector.endpointOrValue,
      statusLabel: editingConnector.statusLabel,
      notes: editingConnector.notes,
    });

    if (editingConnector.id === 'whatsapp-dispatch') {
      const digits = editingConnector.endpointOrValue.replace(/[^0-9]/g, '');
      const normalized = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
      const display = normalized.startsWith('234')
        ? `0${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`
        : editingConnector.endpointOrValue;
      await saveStorefrontConfig({
        whatsappNumber: normalized,
        whatsappDisplay: display.trim(),
        dispatchActive: editingConnector.enabled,
      });
    }
    setEditingConnector(null);
    setConnectorCheckMsg('Connector configuration saved & synced.');
    setTimeout(() => setConnectorCheckMsg(null), 3000);
  }

  async function handleCreateCustomConnector(e: FormEvent) {
    e.preventDefault();
    if (!user || !newConnName.trim()) return;
    const id = `conn-${Date.now()}`;
    await upsertAdminConnector(id, user.uid, {
      name: newConnName,
      category: newConnCategory,
      enabled: true,
      endpointOrValue: newConnEndpoint || 'Configured',
      statusLabel: 'Active',
      notes: newConnNotes || 'Custom operational connector',
    });
    setNewConnName('');
    setNewConnEndpoint('');
    setNewConnNotes('');
  }

  async function handleRunConnectorDiagnostic(conn: AdminConnector) {
    if (conn.category === 'Database') {
      const ok = await testApiConnection();
      setConnectorCheckMsg(
        ok
          ? `Application API (${conn.endpointOrValue}) responded cleanly.`
          : 'Application API appears offline.'
      );
    } else if (conn.category === 'Camera & Video') {
      const hasMedia = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setConnectorCheckMsg(
        hasMedia
          ? 'Browser WebRTC & mediaDevices camera/mic API ready for Market Boys & Girls.'
          : 'Browser mediaDevices API not available in this context.'
      );
    } else {
      setConnectorCheckMsg(`${conn.name}: Endpoint "${conn.endpointOrValue}" verified (${conn.enabled ? 'Enabled' : 'Paused'}).`);
    }
    setTimeout(() => setConnectorCheckMsg(null), 4000);
  }

  async function handleGrantAdmin(e: FormEvent) {
    e.preventDefault();
    if (!user || !grantUid.trim() || !grantEmail.trim()) return;
    await grantAdminRole(grantUid.trim(), grantEmail.trim(), user.uid);
    setGrantUid('');
    setGrantEmail('');
  }

  const liveSessions = cameraSessions.filter((s) => s.status === 'live');
  const ringingCalls = videoCalls.filter((c) => c.status === 'ringing' || c.status === 'active');

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[#E7E5E4] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#52525B]">
            Admin Operations Console <span aria-hidden="true">·</span> {user.email}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#14221B] sm:text-3xl">
            MarketMadeEasyAbj Dispatch, Cameras &amp; Connectors
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white p-1">
          {(
            [
              { id: 'dispatch', label: `Dispatch (${orders.length})`, icon: Bike },
              {
                id: 'cameras',
                label: `Shoppers & Cameras (${ringingCalls.length > 0 ? `${ringingCalls.length} Call` : liveSessions.length})`,
                icon: Video,
              },
              { id: 'connectors', label: `Connectors (${connectors.length})`, icon: Plug },
              { id: 'roles', label: 'Users & Roles', icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#14221B] text-white'
                    : 'text-[#52525B] hover:bg-[#FAFAF8] hover:text-[#14221B]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E7E5E4] bg-[#E7E5E4] lg:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-xs text-[#52525B]">Total Orders</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#14221B]">
            {orderStats.total}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-[#52525B]">Active Dispatch Runs</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#DC2626]">
            {orderStats.active}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-[#52525B]">Live Shopper Cameras</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#14221B]">
            {liveSessions.length}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs text-[#52525B]">Order Volume</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#14221B]">
            {formatNaira(orderStats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* TAB 1: DISPATCH & ORDERS */}
      {activeTab === 'dispatch' && (
        <div className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[#14221B]">
              Abuja Dispatch &amp; Order Assignment
            </h2>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E7E5E4] bg-white p-1">
              {[
                { id: 'all', label: 'All' },
                ...STATUS_OPTIONS.map((s) => ({ id: s.value, label: s.label })),
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrderFilter(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    orderFilter === opt.id
                      ? 'bg-[#14221B] text-white'
                      : 'text-[#52525B] hover:text-[#14221B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-[#71717A]" aria-hidden="true" />
              <p className="mt-3 font-display text-base font-semibold text-[#14221B]">
                No orders in this queue
              </p>
              <p className="mt-1 text-xs text-[#52525B]">
                Orders confirmed by signed-in customers appear here automatically for bike and
                Market Boy/Girl assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E7E5E4] bg-[#FAFAF8] text-[#52525B]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order &amp; Customer</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Assign Bike</th>
                      <th className="px-4 py-3 font-semibold">Assign Shopper</th>
                      <th className="px-4 py-3 font-semibold">Dispatch Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-semibold text-[#14221B]">
                            #{order.orderCode} · {order.customerName}
                          </p>
                          <p className="text-[#71717A]">
                            {order.phone} · {order.items.length} items
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#14221B]">{order.districtName}</p>
                          <p className="max-w-[200px] truncate text-[#71717A]">{order.address}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Assign bike for order ${order.orderCode}`}
                            value={order.assignedBike}
                            onChange={(e) =>
                              adminUpdateOrderDispatch(order.id, {
                                status: order.status,
                                assignedBike: e.target.value,
                                assignedShopperName: order.assignedShopperName,
                              })
                            }
                            className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 text-xs text-[#14221B]"
                          >
                            {BIKE_FLEET.map((b) => (
                              <option key={b.bikeId} value={b.bikeId}>
                                {b.bikeId}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Assign shopper for order ${order.orderCode}`}
                            value={order.assignedShopperName}
                            onChange={(e) =>
                              adminUpdateOrderDispatch(order.id, {
                                status: order.status,
                                assignedBike: order.assignedBike,
                                assignedShopperName: e.target.value,
                              })
                            }
                            className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 text-xs text-[#14221B]"
                          >
                            <option value="Unassigned (Apo Desk)">Unassigned (Apo Desk)</option>
                            {shoppers.map((s) => (
                              <option key={s.id} value={`${s.name} (${s.roleLabel})`}>
                                {s.name} ({s.roleLabel})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Update status for order ${order.orderCode}`}
                            value={order.status}
                            onChange={(e) =>
                              adminUpdateOrderDispatch(order.id, {
                                status: e.target.value as OrderStatus,
                                assignedBike: order.assignedBike,
                                assignedShopperName: order.assignedShopperName,
                              })
                            }
                            className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 text-xs font-medium text-[#14221B]"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <p className="font-mono font-semibold tabular-nums text-[#14221B]">
                            {formatNaira(order.totalNgn)}
                          </p>
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(
                              `Hello ${order.customerName}, your MarketMadeEasyAbj Order #${order.orderCode} is currently "${order.status.replace(/_/g, ' ')}" with ${order.assignedShopperName} on ${order.assignedBike}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:underline"
                          >
                            <MessageCircle className="h-3 w-3" aria-hidden="true" />
                            <span>Notify</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHOPPERS & LIVE CAMERAS */}
      {activeTab === 'cameras' && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {/* Incoming Customer Video Calls */}
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-5">
              <h2 className="font-display text-lg font-bold text-[#14221B]">
                Incoming Customer Video Calls
              </h2>
              <p className="mt-1 text-xs text-[#52525B]">
                When a customer clicks Video Call from their dashboard, their WebRTC call appears
                here for a Market Boy or Girl to answer live.
              </p>

              {ringingCalls.length === 0 ? (
                <p className="mt-4 rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] p-4 text-xs text-[#52525B]">
                  No active or ringing customer video calls right now.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {ringingCalls.map((call) => {
                    const matchedSession =
                      cameraSessions.find((s) => s.id === call.sessionId) || cameraSessions[0];
                    return (
                      <div
                        key={call.id}
                        className="flex flex-col gap-3 rounded-lg border border-[#DC2626]/40 bg-[#FEF2F2]/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#DC2626]">
                            {call.status === 'ringing' ? 'Ringing Customer Call' : 'Active Call'} ·{' '}
                            {call.marketLocation}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-[#14221B]">
                            {call.customerName} calling {call.shopperName}
                          </p>
                          {call.selectedItemNames.length > 0 && (
                            <p className="mt-1 text-xs text-[#52525B]">
                              Picked items: {call.selectedItemNames.join(', ')}
                            </p>
                          )}
                        </div>
                        {matchedSession && (
                          <button
                            type="button"
                            onClick={() => onOpenShopperCameraModal(matchedSession, call)}
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#B91C1C]"
                          >
                            <Video className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Answer Video Call</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Camera Sessions */}
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-lg font-bold text-[#14221B]">
                  Live Market Camera Broadcasts
                </h2>
                <button
                  type="button"
                  disabled={seedingAllMarkets}
                  onClick={handleActivateAllAbujaMarkets}
                  className="min-h-[36px] rounded-lg border border-[#DC2626] bg-white px-3 py-1.5 text-xs font-semibold text-[#DC2626] whitespace-nowrap shrink-0 transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
                >
                  {seedingAllMarkets
                    ? 'Activating Abuja Markets...'
                    : 'Go Live Across All 5 Abuja Markets'}
                </button>
              </div>

              {liveSessions.length === 0 ? (
                <p className="mt-3 text-xs text-[#52525B]">
                  No market camera is currently live. Launch one on the right to let customers
                  video call Market Boys &amp; Girls and pick items from camera.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {liveSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-3 rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#15803D]">
                          Live · {session.shopperRole}: {session.shopperName} (
                          {session.marketLocation})
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#14221B]">
                          {session.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#52525B]">
                          {session.featuredProductIds.length + session.customSpottedItems.length}{' '}
                          items visible on camera
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenShopperCameraModal(session, null)}
                          className="min-h-[38px] rounded-lg bg-[#14221B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#273830]"
                        >
                          Open Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCameraSession(session.id, { status: 'ended' })}
                          className="min-h-[38px] rounded-lg border border-[#D6D3D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#52525B] hover:text-[#DC2626]"
                        >
                          End
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Market Boys & Girls Roster */}
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-5">
              <h2 className="font-display text-lg font-bold text-[#14221B]">
                Market Boys &amp; Girls Team Roster
              </h2>

              <div className="mt-4 divide-y divide-[#E7E5E4] border-y border-[#E7E5E4]">
                {shoppers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                    <div>
                      <p className="font-semibold text-[#14221B]">
                        {s.name} · {s.roleLabel}
                      </p>
                      <p className="text-[#52525B]">
                        {s.marketLocation} · {s.bikeCode} · {s.specialty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          upsertShopper(s.id, {
                            name: s.name,
                            roleLabel: s.roleLabel,
                            marketLocation: s.marketLocation,
                            specialty: s.specialty,
                            bikeCode: s.bikeCode,
                            isAvailable: !s.isAvailable,
                          })
                        }
                        className={`rounded-md border px-2.5 py-1 font-semibold ${
                          s.isAvailable
                            ? 'border-[#15803D] text-[#15803D]'
                            : 'border-[#D6D3D1] text-[#71717A]'
                        }`}
                      >
                        {s.isAvailable ? 'Available' : 'Busy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteShopper(s.id)}
                        aria-label={`Remove ${s.name}`}
                        className="p-1.5 text-[#71717A] hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddShopper} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  value={shopperName}
                  onChange={(e) => setShopperName(e.target.value)}
                  placeholder="Shopper Name (e.g. Zainab Musa)"
                  className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                />
                <select
                  value={shopperRole}
                  onChange={(e) => setShopperRole(e.target.value as 'Market Boy' | 'Market Girl')}
                  className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                >
                  <option value="Market Boy">Market Boy</option>
                  <option value="Market Girl">Market Girl</option>
                </select>
                <input
                  type="text"
                  required
                  value={shopperMarket}
                  onChange={(e) => setShopperMarket(e.target.value)}
                  placeholder="Market Location (e.g. Apo Market)"
                  className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                />
                <select
                  value={shopperBike}
                  onChange={(e) => setShopperBike(e.target.value)}
                  className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                >
                  {BIKE_FLEET.map((b) => (
                    <option key={b.bikeId} value={b.bikeId}>
                      {b.bikeId}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={shopperSpecialty}
                  onChange={(e) => setShopperSpecialty(e.target.value)}
                  placeholder="Specialty (e.g. Fresh Tomatoes & Meats)"
                  className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs sm:col-span-2"
                />
                <button
                  type="submit"
                  className="min-h-[38px] rounded-lg bg-[#14221B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#273830] sm:col-span-2"
                >
                  Add Market Boy / Girl
                </button>
              </form>
            </div>
          </div>

          {/* Right: Launch Shopper Camera Broadcast */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleLaunchCameraSession}
              className="rounded-xl border border-[#E7E5E4] bg-white p-6"
            >
              <div className="flex items-center gap-2 text-[#DC2626]">
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold">Shopper Camera Broadcast</span>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-[#14221B]">
                Go Live from Market Stall
              </h2>
              <p className="mt-1 text-xs text-[#52525B]">
                Select the Market Boy or Girl broadcasting and tag the food items visible on
                camera so customers can select them during the video call.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#52525B]">
                    Market Boy / Girl
                  </label>
                  <select
                    value={camShopperId}
                    onChange={(e) => setCamShopperId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-xs text-[#14221B]"
                  >
                    {shoppers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleLabel} · {s.marketLocation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#52525B]">
                    Abuja FCT Market Location
                  </label>
                  <select
                    value={camMarketLocation}
                    onChange={(e) => setCamMarketLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-xs text-[#14221B]"
                  >
                    {ABUJA_MARKET_HUBS.map((hub) => (
                      <option key={hub.id} value={hub.name}>
                        {hub.name} ({hub.areaLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#52525B]">
                    Camera Stall Title
                  </label>
                  <input
                    type="text"
                    required
                    value={camTitle}
                    onChange={(e) => setCamTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs text-[#14221B]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#52525B]">
                    Tag Catalog Food Items on Camera
                  </span>
                  <div className="mt-1.5 grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] p-2.5">
                    {MARKET_PRODUCTS.map((p) => {
                      const checked = camProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center justify-between gap-2 text-xs"
                        >
                          <span className="flex items-center gap-2 text-[#14221B]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setCamProductIds((prev) =>
                                  checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                )
                              }
                            />
                            <span>{p.name}</span>
                          </span>
                          <span className="font-mono text-[#71717A]">{formatNaira(p.priceNgn)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF8] p-3">
                  <span className="block text-xs font-medium text-[#52525B]">
                    Add Live Market-Floor Spotted Item
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={spottedName}
                      onChange={(e) => setSpottedName(e.target.value)}
                      placeholder="Item (e.g. Ugu)"
                      className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={spottedUnit}
                      onChange={(e) => setSpottedUnit(e.target.value)}
                      placeholder="Unit (2 Bunches)"
                      className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={spottedPrice}
                      onChange={(e) => setSpottedPrice(e.target.value)}
                      placeholder="₦ Price"
                      className="rounded-md border border-[#D6D3D1] bg-white px-2 py-1.5 font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpottedItem}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Spotted Item to Camera</span>
                  </button>
                  {customSpotted.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-[#52525B]">
                      {customSpotted.map((item) => (
                        <li key={item.id}>
                          {item.name} ({item.unit}) — {formatNaira(item.priceNgn)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                >
                  <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Start Live Market Camera</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: ALL CONNECTORS */}
      {activeTab === 'connectors' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#14221B]">
                All System &amp; Operations Connectors
              </h2>
              <p className="text-xs text-[#52525B]">
                Configure WhatsApp dispatch, application API, WebRTC video cameras, 3-bike
                routing, and webhooks from one hub.
              </p>
            </div>
            {connectorCheckMsg && (
              <p className="flex items-center gap-1.5 rounded-lg border border-[#15803D]/30 bg-[#F0FDF4] px-3 py-1.5 text-xs font-medium text-[#15803D]">
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{connectorCheckMsg}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {connectors.map((conn) => (
              <div
                key={conn.id}
                className="flex flex-col justify-between rounded-xl border border-[#E7E5E4] bg-white p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#71717A]">
                        {conn.category} <span aria-hidden="true">·</span> {conn.statusLabel}
                      </p>
                      <h3 className="mt-1 font-display text-base font-bold text-[#14221B]">
                        {conn.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        upsertAdminConnector(conn.id, user.uid, {
                          name: conn.name,
                          category: conn.category,
                          enabled: !conn.enabled,
                          endpointOrValue: conn.endpointOrValue,
                          statusLabel: !conn.enabled ? 'Connected' : 'Paused',
                          notes: conn.notes,
                        })
                      }
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                        conn.enabled
                          ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]'
                          : 'border-[#D6D3D1] bg-[#FAFAF8] text-[#71717A]'
                      }`}
                    >
                      {conn.enabled ? 'Enabled' : 'Paused'}
                    </button>
                  </div>

                  <p className="mt-2 truncate font-mono text-xs text-[#14221B]">
                    {conn.endpointOrValue}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#52525B]">{conn.notes}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#E7E5E4] pt-3">
                  <button
                    type="button"
                    onClick={() => handleRunConnectorDiagnostic(conn)}
                    className="min-h-[36px] rounded-lg border border-[#D6D3D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#14221B] hover:bg-[#FAFAF8]"
                  >
                    Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingConnector(conn)}
                    className="min-h-[36px] rounded-lg bg-[#14221B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#273830]"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingConnector && (
            <form
              onSubmit={handleSaveConnectorEdit}
              className="rounded-xl border border-[#DC2626]/40 bg-white p-6"
            >
              <h3 className="font-display text-base font-bold text-[#14221B]">
                Edit Connector: {editingConnector.name}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#52525B]">
                    Endpoint / Phone / DB ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editingConnector.endpointOrValue}
                    onChange={(e) =>
                      setEditingConnector({
                        ...editingConnector,
                        endpointOrValue: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52525B]">Status Label</label>
                  <input
                    type="text"
                    required
                    value={editingConnector.statusLabel}
                    onChange={(e) =>
                      setEditingConnector({ ...editingConnector, statusLabel: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#52525B]">Notes</label>
                  <input
                    type="text"
                    value={editingConnector.notes}
                    onChange={(e) =>
                      setEditingConnector({ ...editingConnector, notes: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="min-h-[38px] rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
                >
                  Save Connector
                </button>
                <button
                  type="button"
                  onClick={() => setEditingConnector(null)}
                  className="min-h-[38px] rounded-lg border border-[#D6D3D1] bg-white px-4 py-2 text-xs font-semibold text-[#52525B]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <form
            onSubmit={handleCreateCustomConnector}
            className="rounded-xl border border-[#E7E5E4] bg-white p-5"
          >
            <h3 className="font-display text-base font-semibold text-[#14221B]">
              Add New Operational Connector
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                type="text"
                required
                value={newConnName}
                onChange={(e) => setNewConnName(e.target.value)}
                placeholder="Connector Name"
                className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
              />
              <select
                value={newConnCategory}
                onChange={(e) =>
                  setNewConnCategory(e.target.value as AdminConnector['category'])
                }
                className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
              >
                <option value="Webhook">Webhook</option>
                <option value="Messaging">Messaging</option>
                <option value="Camera & Video">Camera &amp; Video</option>
                <option value="Dispatch Fleet">Dispatch Fleet</option>
                <option value="Database">Database</option>
              </select>
              <input
                type="text"
                required
                value={newConnEndpoint}
                onChange={(e) => setNewConnEndpoint(e.target.value)}
                placeholder="URL, Phone, or ID"
                className="rounded-lg border border-[#D6D3D1] px-3 py-2 font-mono text-xs"
              />
              <button
                type="submit"
                className="min-h-[38px] rounded-lg bg-[#14221B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#273830]"
              >
                Add Connector
              </button>
            </div>
            <input
              type="text"
              value={newConnNotes}
              onChange={(e) => setNewConnNotes(e.target.value)}
              placeholder="Connector description / usage notes (optional)"
              className="mt-2 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
            />
          </form>
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'roles' && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-[#E7E5E4] bg-white p-6 lg:col-span-7">
            <h2 className="font-display text-lg font-bold text-[#14221B]">
              Authorized Admin &amp; Camera Operators
            </h2>
            <p className="mt-1 text-xs text-[#52525B]">
              Primary Admin ({BOOTSTRAPPED_ADMIN_EMAIL}) has permanent access. Add Market Boys
              &amp; Girls or dispatch managers below by their account ID so they can broadcast
              live cameras and manage Abuja dispatch.
            </p>

            <div className="mt-4 divide-y divide-[#E7E5E4] border-y border-[#E7E5E4]">
              <div className="flex items-center justify-between py-3 text-xs">
                <div>
                  <p className="font-semibold text-[#14221B]">{BOOTSTRAPPED_ADMIN_EMAIL}</p>
                  <p className="text-[#71717A]">Bootstrapped Primary Admin</p>
                </div>
                <span className="font-mono font-semibold text-[#15803D]">Permanent</span>
              </div>

              {adminGrants.map((grant) => (
                <div key={grant.uid} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-semibold text-[#14221B]">{grant.email}</p>
                    <p className="font-mono text-[#71717A]">{grant.uid}</p>
                  </div>
                  {grant.uid !== user.uid && (
                    <button
                      type="button"
                      onClick={() => revokeAdminRole(grant.uid)}
                      className="font-semibold text-[#DC2626] hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleGrantAdmin}
            className="rounded-xl border border-[#E7E5E4] bg-white p-6 lg:col-span-5"
          >
            <h3 className="font-display text-base font-bold text-[#14221B]">
              Grant Operator / Admin Access
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#52525B]">
                  Operator Google Email
                </label>
                <input
                  type="email"
                  required
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="shopper@example.com"
                  className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#52525B]">
                  User Account ID
                </label>
                <input
                  type="text"
                  required
                  value={grantUid}
                  onChange={(e) => setGrantUid(e.target.value)}
                  placeholder="Paste user's UID from their Account screen"
                  className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                className="min-h-[40px] w-full rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
              >
                Grant Admin &amp; Camera Access
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

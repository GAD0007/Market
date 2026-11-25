import { useEffect, useState, FormEvent } from 'react';
import {
  Check,
  ListChecks,
  Package,
  Plus,
  Trash2,
  User as UserIcon,
  Video,
} from 'lucide-react';
import { User } from '../lib/auth';
import { ABUJA_DISTRICTS, MARKET_PRODUCTS, formatNaira } from '../data/marketData';
import {
  CameraSession,
  CustomSpottedItem,
  FirestoreMarketOrder,
  MarketShopper,
  SavedShoppingList,
  ShoppingListLineItem,
  cancelCustomerOrder,
  createShoppingList,
  deleteShoppingList,
  getUserPrivateProfile,
  saveUserPrivateProfile,
  subscribeShoppers,
  subscribeUserShoppingLists,
} from '../lib/marketFirestore';
import { OrderReceipt } from './CartDrawer';
import { LiveMarketCameras } from './LiveMarketCameras';
import { CustomMarketItem } from './MarketCatalog';
import { OrderTracking } from './OrderTracking';

interface CustomerDashboardProps {
  user: User | null;
  onOpenLogin: () => void;
  orders: FirestoreMarketOrder[];
  isLoadingOrders: boolean;
  recentReceipts: OrderReceipt[];
  liveCameraSessions: CameraSession[];
  quantities: Record<string, number>;
  customItems: CustomMarketItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onPickCustomCameraItem: (item: CustomSpottedItem) => void;
  onUpdateCustomQty: (id: string, delta: number) => void;
  selectedDistrictId: string;
  onSelectDistrict: (id: string) => void;
  onLoadShoppingList: (list: SavedShoppingList) => void;
  onStartVideoCall: (session: CameraSession) => void;
  onOpenBag: () => void;
  onBrowseCatalog: () => void;
  whatsappNumber: string;
  whatsappDisplay: string;
}

const ORDER_STATUS_LABELS: Record<FirestoreMarketOrder['status'], string> = {
  pending_sourcing: 'Pending Sourcing',
  sourcing_in_market: 'Shopper Buying in Market',
  out_for_delivery: 'Out for Bike Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function CustomerDashboard({
  user,
  onOpenLogin,
  orders,
  isLoadingOrders,
  recentReceipts,
  liveCameraSessions,
  quantities,
  customItems,
  onUpdateQuantity,
  onPickCustomCameraItem,
  onUpdateCustomQty,
  selectedDistrictId,
  onSelectDistrict,
  onLoadShoppingList,
  onStartVideoCall,
  onOpenBag,
  onBrowseCatalog,
  whatsappNumber,
  whatsappDisplay,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'cameras' | 'lists' | 'orders' | 'profile'>('cameras');
  const [lists, setLists] = useState<SavedShoppingList[]>([]);
  const [shoppers, setShoppers] = useState<MarketShopper[]>([]);

  // Save current bag as list
  const [newListTitle, setNewListTitle] = useState('');
  const [listSavedFeedback, setListSavedFeedback] = useState(false);

  // Private profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultDistrictId, setDefaultDistrictId] = useState(selectedDistrictId);
  const [defaultAddress, setDefaultAddress] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getUserPrivateProfile(user.uid)
      .then((profile) => {
        if (!active) return;
        if (profile) {
          setFullName(profile.fullName);
          setPhone(profile.phone);
          setDefaultDistrictId(profile.defaultDistrictId);
          setDefaultAddress(profile.defaultAddress);
          onSelectDistrict(profile.defaultDistrictId);
        } else {
          setFullName(user.displayName || '');
        }
      })
      .catch(() => {});

    const unsubLists = subscribeUserShoppingLists(user.uid, setLists);
    const unsubShoppers = subscribeShoppers(setShoppers);

    return () => {
      active = false;
      unsubLists();
      unsubShoppers();
    };
  }, [user]);

  if (!user) {
    return (
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-xl border border-[#E7E5E4] bg-white p-8 text-center">
          <UserIcon className="mx-auto h-10 w-10 text-[#DC2626]" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-[#14221B]">
            Customer Dashboard &amp; Live Market Video Calls
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#52525B]">
            Sign in with your Google account to save weekly Abuja shopping lists, track bike
            deliveries from Apo, and video call Market Boys &amp; Girls to pick food items directly
            from their cameras.
          </p>
          <button
            type="button"
            onClick={onOpenLogin}
            className="mt-6 min-h-[44px] rounded-lg bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C]"
          >
            Sign in to Customer Dashboard
          </button>
        </div>
      </section>
    );
  }

  const currentBagLineItems: ShoppingListLineItem[] = [
    ...MARKET_PRODUCTS.filter((p) => (quantities[p.id] || 0) > 0).map((p) => ({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      quantity: quantities[p.id],
      priceNgn: p.priceNgn,
      isCustom: false,
    })),
    ...customItems.map((c) => ({
      name: c.name,
      unit: c.unit,
      quantity: c.quantity,
      priceNgn: c.estimatedPriceNgn,
      isCustom: true,
    })),
  ];

  async function handleSaveCurrentBagAsList(e: FormEvent) {
    e.preventDefault();
    if (!user || currentBagLineItems.length === 0) return;
    await createShoppingList(
      user.uid,
      newListTitle || 'Weekly Abuja Market List',
      selectedDistrictId,
      currentBagLineItems
    );
    setNewListTitle('');
    setListSavedFeedback(true);
    setTimeout(() => setListSavedFeedback(false), 2500);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    await saveUserPrivateProfile(user.uid, {
      fullName,
      phone,
      defaultDistrictId,
      defaultAddress,
    });
    onSelectDistrict(defaultDistrictId);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[#E7E5E4] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#52525B]">
            Customer Dashboard <span aria-hidden="true">·</span> {user.email}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#14221B] sm:text-3xl">
            Welcome, {user.displayName || 'Abuja Shopper'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white p-1">
          {(
            [
              { id: 'cameras', label: 'Live Market Cameras', icon: Video },
              { id: 'lists', label: `Shopping Lists (${lists.length})`, icon: ListChecks },
              { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
              { id: 'profile', label: 'Delivery Profile', icon: UserIcon },
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

      {orders.some((o) => o.status !== 'delivered' && o.status !== 'cancelled') &&
        activeTab !== 'orders' && (
          <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-white p-4 sm:flex-row sm:items-center">
            {(() => {
              const liveActive = orders.find(
                (o) => o.status !== 'delivered' && o.status !== 'cancelled'
              )!;
              return (
                <>
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#DC2626]">
                      Active Order #{liveActive.orderCode} · {ORDER_STATUS_LABELS[liveActive.status]}
                    </p>
                    <p className="mt-0.5 text-xs text-[#52525B]">
                      {liveActive.districtName} ({liveActive.assignedBike}) · Shopper:{' '}
                      {liveActive.assignedShopperName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="min-h-[38px] rounded-lg bg-[#DC2626] px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#B91C1C]"
                  >
                    View Dispatch Progress
                  </button>
                </>
              );
            })()}
          </div>
        )}

      {activeTab === 'cameras' && (
        <div className="mt-8 space-y-8">
          <LiveMarketCameras
            user={user}
            liveFirestoreSessions={liveCameraSessions}
            quantities={quantities}
            customItems={customItems}
            onUpdateQuantity={onUpdateQuantity}
            onPickCustomCameraItem={onPickCustomCameraItem}
            onUpdateCustomQty={onUpdateCustomQty}
            onOpenCameraSession={onStartVideoCall}
            onOpenLogin={onOpenLogin}
            onOpenBag={onOpenBag}
            whatsappNumber={whatsappNumber}
            whatsappDisplay={whatsappDisplay}
            variant="dashboard"
          />

          {shoppers.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold text-[#14221B]">
                Market Boys &amp; Girls Roster
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {shoppers.map((s) => (
                  <div key={s.id} className="rounded-xl border border-[#E7E5E4] bg-white p-4">
                    <p className="text-xs font-medium text-[#71717A]">
                      {s.roleLabel} <span aria-hidden="true">·</span> {s.bikeCode}
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-[#14221B]">
                      {s.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#52525B]">{s.marketLocation}</p>
                    <p className="mt-1 text-xs text-[#71717A]">{s.specialty}</p>
                    <p
                      className={`mt-2 text-xs font-semibold ${
                        s.isAvailable ? 'text-[#15803D]' : 'text-[#71717A]'
                      }`}
                    >
                      {s.isAvailable ? 'Available on Market Floor' : 'Currently on Delivery'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lists' && (
        <div className="mt-8 space-y-6">
          <form
            onSubmit={handleSaveCurrentBagAsList}
            className="rounded-xl border border-[#E7E5E4] bg-white p-5"
          >
            <h2 className="font-display text-lg font-semibold text-[#14221B]">
              Save Current Market Bag as a Reusable List
            </h2>
            <p className="mt-1 text-xs text-[#52525B]">
              You currently have {currentBagLineItems.length} distinct item(s) in your Market Bag.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                required
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="e.g. Monthly Apo Household Restock"
                className="flex-1 rounded-lg border border-[#D6D3D1] bg-[#FAFAF8] px-3 py-2 text-sm text-[#14221B] focus:border-[#DC2626] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={currentBagLineItems.length === 0}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#B91C1C] disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save Shopping List</span>
              </button>
            </div>
            {listSavedFeedback && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#15803D]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Shopping list saved to your account.</span>
              </p>
            )}
          </form>

          {lists.length === 0 ? (
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-8 text-center">
              <p className="font-display text-base font-semibold text-[#14221B]">
                No saved shopping lists yet
              </p>
              <p className="mt-1 text-xs text-[#52525B]">
                Add items in the Catalog or via Live Camera, then save your bag above for 1-click
                re-ordering.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {lists.map((list) => {
                const estTotal = list.items.reduce(
                  (sum, i) => sum + i.priceNgn * i.quantity,
                  0
                );
                return (
                  <div
                    key={list.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E7E5E4] bg-white p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-[#14221B]">
                          {list.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => deleteShoppingList(list.id)}
                          aria-label={`Delete ${list.title}`}
                          className="rounded-md p-1.5 text-[#71717A] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-1 font-mono text-xs tabular-nums text-[#52525B]">
                        {list.items.length} items · Est. {formatNaira(estTotal)}
                      </p>
                      <ul className="mt-3 space-y-1 border-t border-[#E7E5E4] pt-2.5 text-xs text-[#52525B]">
                        {list.items.slice(0, 5).map((item, idx) => (
                          <li key={idx}>
                            {item.quantity}x {item.name} ({item.unit})
                          </li>
                        ))}
                        {list.items.length > 5 && (
                          <li className="text-[#71717A]">
                            +{list.items.length - 5} more items
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLoadShoppingList(list)}
                      className="mt-4 min-h-[40px] w-full rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
                    >
                      Load List into Market Bag
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="mt-8 space-y-8">
          <OrderTracking
            user={user}
            orders={orders}
            isLoadingOrders={isLoadingOrders}
            recentReceipts={recentReceipts}
            whatsappNumber={whatsappNumber}
            whatsappDisplay={whatsappDisplay}
            onOpenLogin={onOpenLogin}
            onOpenBag={onOpenBag}
            onBrowseCatalog={onBrowseCatalog}
          />

          {orders.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
              <div className="border-b border-[#E7E5E4] px-4 py-3">
                <h3 className="font-display text-sm font-bold text-[#14221B]">
                  All Account Orders ({orders.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E7E5E4] bg-[#FAFAF8] text-[#52525B]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Abuja Location &amp; Bike</th>
                      <th className="px-4 py-3 font-semibold">Shopper</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-semibold text-[#14221B]">
                            #{order.orderCode}
                          </p>
                          <p className="text-[#71717A]">{order.items.length} items</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#14221B]">{order.districtName}</p>
                          <p className="text-[#71717A]">
                            {order.assignedBike} · {order.address}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-[#52525B]">
                          {order.assignedShopperName}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#14221B]">
                          {ORDER_STATUS_LABELS[order.status]}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-[#14221B]">
                          {formatNaira(order.totalNgn)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                `Hello MarketMadeEasyAbj, checking status for Order #${order.orderCode} (${order.districtName}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#DC2626] hover:underline"
                            >
                              WhatsApp
                            </a>
                            {order.status === 'pending_sourcing' && (
                              <button
                                type="button"
                                onClick={() => cancelCustomerOrder(order.id)}
                                className="font-semibold text-[#71717A] hover:text-red-600"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
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

      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="mt-8 max-w-xl rounded-xl border border-[#E7E5E4] bg-white p-6"
        >
          <h2 className="font-display text-lg font-semibold text-[#14221B]">
            Saved Abuja Delivery Profile
          </h2>
          <p className="mt-1 text-xs text-[#52525B]">
            Stored privately on your account so checkout pre-fills your phone and estate address.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-[#52525B]">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#DC2626] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-medium text-[#52525B]">
                Phone / WhatsApp Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 123 4567"
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#DC2626] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-district" className="block text-xs font-medium text-[#52525B]">
                Default Abuja Location
              </label>
              <select
                id="prof-district"
                value={defaultDistrictId}
                onChange={(e) => setDefaultDistrictId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#DC2626] focus:outline-none"
              >
                {ABUJA_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {formatNaira(d.serviceChargeNgn)} ({d.assignedBike})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-addr" className="block text-xs font-medium text-[#52525B]">
                Default Estate / Street Address
              </label>
              <input
                id="prof-addr"
                type="text"
                required
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                placeholder="House number, street, estate gate"
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm text-[#14221B] focus:border-[#DC2626] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="min-h-[42px] rounded-lg bg-[#DC2626] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#B91C1C]"
            >
              Save Delivery Profile
            </button>

            {profileSaved && (
              <p className="text-xs font-medium text-[#15803D]">
                Delivery profile saved securely.
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

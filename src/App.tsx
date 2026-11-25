import { useEffect, useState } from 'react';
import { User } from './lib/auth';
import { AppView, Navbar } from './components/Navbar';
import { MarketHero } from './components/MarketHero';
import { CustomMarketItem, MarketCatalog } from './components/MarketCatalog';
import { CoverageAndFees } from './components/CoverageAndFees';
import { BusinessPlanSection } from './components/BusinessPlanSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CartDrawer, OrderReceipt } from './components/CartDrawer';
import { LoginModal } from './components/LoginModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LiveCameraCallModal } from './components/LiveCameraCallModal';
import { LiveMarketCameras } from './components/LiveMarketCameras';
import { OrderTracking } from './components/OrderTracking';
import { SiteFooter } from './components/SiteFooter';
import {
  ABUJA_DISTRICTS,
  BUSINESS_PHONE_DISPLAY,
  WHATSAPP_BUSINESS_NUMBER,
} from './data/marketData';
import { checkIsAdminUser, subscribeAuth, testApiConnection } from './lib/auth';
import {
  CameraSession,
  CustomSpottedItem,
  FirestoreMarketOrder,
  SavedShoppingList,
  VideoCallDoc,
  subscribeCustomerOrders,
  subscribeLiveCameraSessions,
  subscribeStorefrontConfig,
} from './lib/marketFirestore';

const RECEIPTS_STORAGE_KEY = 'market_boys_receipts_v1';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('storefront');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState(WHATSAPP_BUSINESS_NUMBER);
  const [whatsappDisplay, setWhatsappDisplay] = useState(BUSINESS_PHONE_DISPLAY);
  const [customerOrders, setCustomerOrders] = useState<FirestoreMarketOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [liveCameraSessions, setLiveCameraSessions] = useState<CameraSession[]>([]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<CustomMarketItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(ABUJA_DISTRICTS[0].id);
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Live Video Call modal state
  const [activeCallModal, setActiveCallModal] = useState<{
    mode: 'customer' | 'shopper';
    session: CameraSession;
    incomingCall?: VideoCallDoc | null;
  } | null>(null);

  const [recentReceipts, setRecentReceipts] = useState<OrderReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as OrderReceipt[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    testApiConnection().catch(() => {});

    let unsubOrders: (() => void) | null = null;

    const unsubAuth = subscribeAuth(async (firebaseUser) => {
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        setIsLoadingOrders(true);
        unsubOrders = subscribeCustomerOrders(firebaseUser.uid, (ordersList) => {
          setCustomerOrders(ordersList);
          setIsLoadingOrders(false);
        });
        const adminStatus = await checkIsAdminUser();
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
        setCustomerOrders([]);
        setIsLoadingOrders(false);
      }
    });

    const unsubConfig = subscribeStorefrontConfig((config) => {
      if (config && config.whatsappNumber) {
        setWhatsappNumber(config.whatsappNumber);
        setWhatsappDisplay(config.whatsappDisplay || BUSINESS_PHONE_DISPLAY);
      }
    });

    const unsubLiveCameras = subscribeLiveCameraSessions(setLiveCameraSessions);

    return () => {
      unsubAuth();
      unsubConfig();
      unsubLiveCameras();
      if (unsubOrders) unsubOrders();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(recentReceipts));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentReceipts]);

  const bagCount =
    Object.values(quantities).reduce((sum, q) => sum + q, 0) +
    customItems.reduce((sum, item) => sum + item.quantity, 0);

  function handleUpdateQuantity(productId: string, delta: number) {
    setQuantities((prev) => {
      const nextQty = Math.max(0, (prev[productId] || 0) + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: nextQty };
    });
  }

  function handleAddCustomItem(item: Omit<CustomMarketItem, 'id' | 'quantity'>) {
    setCustomItems((prev) => [
      ...prev,
      {
        ...item,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        quantity: 1,
      },
    ]);
  }

  function handlePickCustomCameraItem(spotted: CustomSpottedItem) {
    setCustomItems((prev) => {
      const existing = prev.find((i) => i.name.toLowerCase() === spotted.name.toLowerCase());
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `cam-${spotted.id}-${Date.now()}`,
          name: spotted.name,
          unit: spotted.unit,
          estimatedPriceNgn: spotted.priceNgn,
          quantity: 1,
        },
      ];
    });
  }

  function handleUpdateCustomQty(id: string, delta: number) {
    setCustomItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemoveCustomItem(id: string) {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleLoadShoppingList(list: SavedShoppingList) {
    const nextQuantities: Record<string, number> = {};
    const nextCustom: CustomMarketItem[] = [];

    list.items.forEach((item, idx) => {
      if (!item.isCustom && item.productId) {
        nextQuantities[item.productId] = (nextQuantities[item.productId] || 0) + item.quantity;
      } else {
        nextCustom.push({
          id: `list-${Date.now()}-${idx}`,
          name: item.name,
          unit: item.unit,
          estimatedPriceNgn: item.priceNgn,
          quantity: item.quantity,
        });
      }
    });

    setQuantities(nextQuantities);
    setCustomItems(nextCustom);
    if (list.districtId) {
      setSelectedDistrictId(list.districtId);
    }
    setIsBagOpen(true);
  }

  function handleConfirmOrder(receipt: OrderReceipt) {
    setRecentReceipts((prev) => [receipt, ...prev].slice(0, 15));
    setQuantities({});
    setCustomItems([]);
  }

  function handleNavigateView(view: AppView, sectionId?: string) {
    setActiveView(view);
    if (view === 'storefront' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleJumpToCatalog() {
    handleNavigateView('storefront', 'catalog');
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#14221B]">
      <Navbar
        bagCount={bagCount}
        onOpenBag={() => setIsBagOpen(true)}
        activeView={activeView}
        onNavigateView={handleNavigateView}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <main className={activeView === 'storefront' ? '' : 'pt-[68px]'}>
        {activeView === 'tracking' && (
          <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 border-b border-[#E7E5E4] pb-5">
              <p className="text-xs font-medium text-[#52525B]">
                Live Abuja Dispatch Tracker <span aria-hidden="true">·</span> Apo Office to Your
                Doorstep
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-[#14221B] sm:text-3xl">
                Track Your MarketMadeEasyAbj Order
              </h1>
            </div>

            <OrderTracking
              user={user}
              orders={customerOrders}
              isLoadingOrders={isLoadingOrders}
              recentReceipts={recentReceipts}
              whatsappNumber={whatsappNumber}
              whatsappDisplay={whatsappDisplay}
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenBag={() => setIsBagOpen(true)}
              onBrowseCatalog={handleJumpToCatalog}
            />
          </section>
        )}

        {activeView === 'customer' && (
          <CustomerDashboard
            user={user}
            onOpenLogin={() => setIsLoginOpen(true)}
            orders={customerOrders}
            isLoadingOrders={isLoadingOrders}
            recentReceipts={recentReceipts}
            liveCameraSessions={liveCameraSessions}
            quantities={quantities}
            customItems={customItems}
            onUpdateQuantity={handleUpdateQuantity}
            onPickCustomCameraItem={handlePickCustomCameraItem}
            onUpdateCustomQty={handleUpdateCustomQty}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={setSelectedDistrictId}
            onLoadShoppingList={handleLoadShoppingList}
            onStartVideoCall={(session) =>
              setActiveCallModal({ mode: 'customer', session, incomingCall: null })
            }
            onOpenBag={() => setIsBagOpen(true)}
            onBrowseCatalog={handleJumpToCatalog}
            whatsappNumber={whatsappNumber}
            whatsappDisplay={whatsappDisplay}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            user={user}
            isAdmin={isAdmin}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenShopperCameraModal={(session, incomingCall) =>
              setActiveCallModal({ mode: 'shopper', session, incomingCall })
            }
          />
        )}

        {activeView === 'storefront' && (
          <>
            <MarketHero
              onOpenBag={() => setIsBagOpen(true)}
              onJumpToCatalog={handleJumpToCatalog}
              onJumpToCameras={() => handleNavigateView('storefront', 'cameras')}
              whatsappNumber={whatsappNumber}
              whatsappDisplay={whatsappDisplay}
            />

            <LiveMarketCameras
              user={user}
              liveFirestoreSessions={liveCameraSessions}
              quantities={quantities}
              customItems={customItems}
              onUpdateQuantity={handleUpdateQuantity}
              onPickCustomCameraItem={handlePickCustomCameraItem}
              onUpdateCustomQty={handleUpdateCustomQty}
              onOpenCameraSession={(session) =>
                setActiveCallModal({ mode: 'customer', session, incomingCall: null })
              }
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenBag={() => setIsBagOpen(true)}
              whatsappNumber={whatsappNumber}
              whatsappDisplay={whatsappDisplay}
              variant="storefront"
            />

            <MarketCatalog
              quantities={quantities}
              onUpdateQuantity={handleUpdateQuantity}
              onAddCustomItem={handleAddCustomItem}
              customItemsCount={customItems.length}
              onOpenBag={() => setIsBagOpen(true)}
            />

            <CoverageAndFees
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={setSelectedDistrictId}
              onOpenBag={() => setIsBagOpen(true)}
            />

            <BusinessPlanSection />
            <TestimonialsSection />
          </>
        )}
      </main>

      <SiteFooter
        onNavigate={handleNavigateView}
        onOpenBag={() => setIsBagOpen(true)}
        whatsappNumber={whatsappNumber}
        whatsappDisplay={whatsappDisplay}
      />

      <CartDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        whatsappNumber={whatsappNumber}
        whatsappDisplay={whatsappDisplay}
        quantities={quantities}
        onUpdateQuantity={handleUpdateQuantity}
        customItems={customItems}
        onUpdateCustomQty={handleUpdateCustomQty}
        onRemoveCustomItem={handleRemoveCustomItem}
        selectedDistrictId={selectedDistrictId}
        onSelectDistrict={setSelectedDistrictId}
        onConfirmOrder={handleConfirmOrder}
        recentReceipts={recentReceipts}
        onTrackOrder={() => handleNavigateView('tracking')}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onOpenCustomerDashboard={() => handleNavigateView('customer')}
        onOpenAdminDashboard={() => handleNavigateView('admin')}
      />

      {activeCallModal && user && (
        <LiveCameraCallModal
          isOpen={Boolean(activeCallModal)}
          onClose={() => setActiveCallModal(null)}
          user={user}
          mode={activeCallModal.mode}
          session={activeCallModal.session}
          incomingCall={activeCallModal.incomingCall}
          onPickCatalogItem={(productId) => handleUpdateQuantity(productId, 1)}
          onPickCustomCameraItem={handlePickCustomCameraItem}
          onOpenBag={() => setIsBagOpen(true)}
          bagCount={bagCount}
          whatsappNumber={whatsappNumber}
          whatsappDisplay={whatsappDisplay}
        />
      )}
    </div>
  );
}

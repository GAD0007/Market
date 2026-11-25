import { FormEvent, useMemo, useState } from 'react';
import { LayoutGrid, Minus, Plus, Search, ShoppingBasket } from 'lucide-react';
import grainsImg from '../assets/images/cat_grains_staples_1794668232030.jpg';
import produceImg from '../assets/images/cat_fresh_produce_1794668232819.jpg';
import meatImg from '../assets/images/cat_proteins_meat_1794668233726.jpg';
import oilsImg from '../assets/images/cat_oils_spices_1794668234252.jpg';
import {
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  MarketCategory,
  MarketProduct,
  formatNaira,
} from '../data/marketData';

export interface CustomMarketItem {
  id: string;
  name: string;
  unit: string;
  estimatedPriceNgn: number;
  quantity: number;
}

interface MarketCatalogProps {
  quantities: Record<string, number>;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onAddCustomItem: (item: Omit<CustomMarketItem, 'id' | 'quantity'>) => void;
  customItemsCount: number;
  onOpenBag: () => void;
}

const CATEGORY_IMAGES: Partial<Record<MarketCategory, string>> = {
  'Grains & Staples': grainsImg,
  'Fresh Produce': produceImg,
  'Proteins & Meat': meatImg,
  'Oils & Spices': oilsImg,
};

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1C1917]';

export function MarketCatalog({
  quantities,
  onUpdateQuantity,
  onAddCustomItem,
  customItemsCount,
  onOpenBag,
}: MarketCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customAddedFeedback, setCustomAddedFeedback] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MARKET_PRODUCTS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All Items' || item.category === selectedCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.note.toLowerCase().includes(query) ||
        item.marketSource.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function handleCustomSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = customName.trim();
    if (!trimmedName) return;

    onAddCustomItem({
      name: trimmedName,
      unit: customUnit.trim() || '1 Market Unit',
      estimatedPriceNgn: Number(customPrice.replace(/[^0-9]/g, '')) || 0,
    });
    setCustomName('');
    setCustomUnit('');
    setCustomPrice('');
    setCustomAddedFeedback(true);
    setTimeout(() => setCustomAddedFeedback(false), 2500);
  }

  const field =
    'mt-1 w-full rounded-xl border border-[#E7E0D3] bg-white px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#1C1917] focus:outline-none';

  return (
    <section id="catalog" className="border-b border-[#F1EADF] bg-white text-[#1C1917]">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-[72px] lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B45309]">
            Market Catalog · Daily Abuja Prices
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-extrabold leading-[1.08] tracking-tight [text-wrap:balance]">
            Pick your foodstuffs &amp; groceries
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#57534E]">
            Add standard market staples below, or write in custom items so our shoppers can source
            everything on your list in one run.
          </p>
        </div>

        <div className="relative mx-auto mt-8 w-full max-w-md">
          <label htmlFor="catalog-search" className="sr-only">
            Search foodstuffs
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]"
            aria-hidden="true"
          />
          <input
            id="catalog-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search rice, beans, beef..."
            className="w-full rounded-full border border-[#E7E0D3] bg-[#FFFCF7] py-3 pl-11 pr-4 text-sm placeholder:text-[#78716C] focus:border-[#1C1917] focus:bg-white focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-[#FFAA0D] p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
        >
          {MARKET_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            const categoryImage = CATEGORY_IMAGES[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={active}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1.5 pr-4 text-sm font-bold transition-colors ${FOCUS} ${
                  active
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#1C1917] hover:bg-white/40'
                }`}
              >
                {categoryImage ? (
                  <img src={categoryImage} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1C1917] text-white">
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                {category}
              </button>
            );
          })}
        </div>

        {filteredProducts.length > 0 ? (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filteredProducts.map((product: MarketProduct) => {
              const quantity = quantities[product.id] || 0;
              const inBag = quantity > 0;
              const isMeat = product.category === 'Proteins & Meat';
              return (
                <li
                  key={product.id}
                  className={`flex min-w-0 flex-col rounded-2xl border bg-white p-2.5 transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(28,25,23,0.45)] sm:p-3 ${
                    inBag
                      ? 'border-[#FFAA0D] shadow-[0_0_0_3px_rgba(255,170,13,0.3)]'
                      : 'border-[#F1EADF] shadow-[0_2px_10px_-6px_rgba(28,25,23,0.2)]'
                  }`}
                >
                  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl bg-[#FFF3D6]">
                    {!failedImages[product.id] ? (
                      <img
                        src={product.image}
                        alt={`${product.name}, ${product.unit}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((current) => ({ ...current, [product.id]: true }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-[#78716C]">
                        <ShoppingBasket className="h-6 w-6" aria-hidden="true" />
                        <span>Photo coming soon</span>
                      </div>
                    )}
                    <span className="absolute left-2 top-2 max-w-[78%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#57534E] backdrop-blur-sm">
                      {product.unit}
                    </span>
                    <span
                      role="img"
                      aria-label={isMeat ? 'Meat or fish' : 'Plant based'}
                      title={isMeat ? 'Meat or fish' : 'Plant based'}
                      className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white ${
                        isMeat ? 'border-[#DC2626]' : 'border-[#15803D]'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isMeat ? 'bg-[#DC2626]' : 'bg-[#15803D]'
                        }`}
                      />
                    </span>
                  </div>

                  <div className="mt-3 flex flex-1 flex-col items-center px-1 text-center">
                    <h3 className="font-display text-[15px] font-bold leading-snug text-[#1C1917] [text-wrap:balance]">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#78716C]">{product.marketSource}</p>

                    <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 pt-3">
                      <span className="font-mono text-[15px] font-bold tabular-nums text-[#1C1917]">
                        {formatNaira(product.priceNgn)}
                      </span>
                      {inBag ? (
                        <div className="inline-flex items-center gap-0.5 rounded-full bg-[#1C1917] p-[3px] text-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            aria-label={`Remove one ${product.name}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-95 ${FOCUS}`}
                          >
                            <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                          </button>
                          <span
                            className="min-w-[28px] text-center font-mono text-sm font-bold tabular-nums"
                            aria-live="polite"
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, 1)}
                            aria-label={`Add one more ${product.name}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#FFAA0D] text-[#1C1917] transition hover:brightness-95 active:scale-95 ${FOCUS}`}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          aria-label={`Add ${product.name} to Market Bag`}
                          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#FFAA0D] px-4 text-[13px] font-extrabold text-[#1C1917] shadow-[0_6px_14px_-8px_rgba(255,170,13,0.9)] transition hover:brightness-95 active:scale-95 ${FOCUS}`}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                          <span className="sm:hidden">Add</span>
                          <span className="hidden sm:inline">Add to Bag</span>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[#E7E0D3] bg-[#FFFCF7] px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">Nothing matches “{searchQuery}”</p>
            <p className="mt-1 text-sm text-[#57534E]">
              Try another word, or add it as a custom item below.
            </p>
          </div>
        )}

        <form
          onSubmit={handleCustomSubmit}
          className="mt-12 rounded-3xl border border-[#F1EADF] bg-[#FFFCF7] p-5 sm:p-7"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-extrabold">Need an item not listed above?</h3>
              <p className="mt-1 text-sm text-[#57534E]">
                Add any specific foodstuff, vegetable, or bulk vendor item (e.g. Ugu leaves, Egusi,
                stockfish) to your basket.
              </p>
            </div>
            {customItemsCount > 0 && (
              <button
                type="button"
                onClick={onOpenBag}
                className="shrink-0 text-xs font-bold text-[#B45309] underline underline-offset-4"
              >
                View {customItemsCount} custom item{customItemsCount > 1 ? 's' : ''} in bag
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label htmlFor="custom-item-name" className="block text-xs font-bold text-[#57534E]">
                Item Name
              </label>
              <input
                id="custom-item-name"
                required
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="e.g. Ground Egusi or Fresh Ugu Leaves"
                className={field}
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="custom-item-unit" className="block text-xs font-bold text-[#57534E]">
                Quantity / Measure
              </label>
              <input
                id="custom-item-unit"
                type="text"
                value={customUnit}
                onChange={(event) => setCustomUnit(event.target.value)}
                placeholder="e.g. 2 Mudus / 3 Bunches"
                className={field}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="custom-item-price" className="block text-xs font-bold text-[#57534E]">
                Est. Budget (₦)
              </label>
              <input
                id="custom-item-price"
                type="text"
                inputMode="numeric"
                value={customPrice}
                onChange={(event) => setCustomPrice(event.target.value)}
                placeholder="e.g. 3500"
                className={`${field} font-mono tabular-nums`}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-[#1C1917] px-4 text-sm font-extrabold text-white transition hover:bg-black active:scale-[0.97] ${FOCUS}`}
              >
                Add Custom Item
              </button>
            </div>
          </div>
          {customAddedFeedback && (
            <p role="status" className="mt-3 text-sm font-bold text-[#15803D]">
              Added to your list.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

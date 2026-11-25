import heroMarketImg from '../assets/images/hero_abuja_market_1794668231758.jpg';
import grainsStaplesImg from '../assets/images/cat_grains_staples_1794668232030.jpg';
import freshProduceImg from '../assets/images/cat_fresh_produce_1794668232819.jpg';
import proteinsMeatImg from '../assets/images/cat_proteins_meat_1794668233726.jpg';
import oilsSpicesImg from '../assets/images/cat_oils_spices_1794668234252.jpg';

export type MarketCategory =
  | 'All Items'
  | 'Grains & Staples'
  | 'Fresh Produce'
  | 'Proteins & Meat'
  | 'Oils & Spices';

export interface MarketProduct {
  id: string;
  name: string;
  category: Exclude<MarketCategory, 'All Items'>;
  unit: string;
  priceNgn: number;
  marketSource: string;
  note: string;
  image: string;
}

export interface AbujaDistrict {
  id: string;
  name: string;
  distanceFromApoKm: number;
  serviceChargeNgn: number;
  assignedBike: string;
  etaWindow: string;
}

export interface BikeRoute {
  bikeId: string;
  label: string;
  hub: string;
  zones: string[];
  capacityNote: string;
}

export const WHATSAPP_BUSINESS_NUMBER = '2348144791463';
export const BUSINESS_PHONE_DISPLAY = '0814 479 1463';
export const BUSINESS_TEL_HREF = 'tel:+2348144791463';

export const HERO_IMAGE = heroMarketImg;

export const MARKET_CATEGORIES: MarketCategory[] = [
  'All Items',
  'Grains & Staples',
  'Fresh Produce',
  'Proteins & Meat',
  'Oils & Spices',
];

export const MARKET_PRODUCTS: MarketProduct[] = [
  {
    id: 'rice-5kg',
    name: 'Long-Grain Parboiled Rice',
    category: 'Grains & Staples',
    unit: '5kg Bag',
    priceNgn: 11500,
    marketSource: 'Apo & Garki Market',
    note: 'Clean, stone-free local & imported grade',
    image: grainsStaplesImg,
  },
  {
    id: 'honey-beans-mudu',
    name: 'Oloyin Honey Beans',
    category: 'Grains & Staples',
    unit: '1 Paint Bucket (~3.5kg)',
    priceNgn: 8200,
    marketSource: 'Wuse & Garki Market',
    note: 'Hand-picked sweet brown beans, weevil-free',
    image: grainsStaplesImg,
  },
  {
    id: 'yellow-garri',
    name: 'Ijebu / Yellow Garri',
    category: 'Grains & Staples',
    unit: '1 Paint Bucket (~3.5kg)',
    priceNgn: 3800,
    marketSource: 'Apo Market',
    note: 'Crispy, well-sieved fine dry grains',
    image: grainsStaplesImg,
  },
  {
    id: 'benue-yam',
    name: 'Fresh Benue Yam Tubers',
    category: 'Grains & Staples',
    unit: '3 Medium Tubers',
    priceNgn: 7500,
    marketSource: 'Apo Yam Shed',
    note: 'Firm, starchy tubers ideal for pounding or boiling',
    image: grainsStaplesImg,
  },
  {
    id: 'tomatoes-basket',
    name: 'Fresh Plum Tomatoes',
    category: 'Fresh Produce',
    unit: '1 Medium Paint Bucket',
    priceNgn: 4800,
    marketSource: 'Dei-Dei & Apo Market',
    note: 'Firm, ripe UTC-style stew tomatoes',
    image: freshProduceImg,
  },
  {
    id: 'pepper-mix',
    name: 'Tatase, Ata Rodo & Onions Mix',
    category: 'Fresh Produce',
    unit: '1 Stew Pack (~2kg)',
    priceNgn: 4200,
    marketSource: 'Apo Fresh Produce',
    note: 'Balanced red bell peppers, scotch bonnet & red onions',
    image: freshProduceImg,
  },
  {
    id: 'ripe-plantain',
    name: 'Yellow Ripe Plantains',
    category: 'Fresh Produce',
    unit: '1 Large Bunch (10–12 pcs)',
    priceNgn: 5000,
    marketSource: 'Garki Market',
    note: 'Naturally ripened, sweet and firm',
    image: freshProduceImg,
  },
  {
    id: 'fresh-beef',
    name: 'Fresh Lean Beef Cuts',
    category: 'Proteins & Meat',
    unit: '1kg Cut',
    priceNgn: 6800,
    marketSource: 'Apo Abattoir Cold Room',
    note: 'Morning-cut boneless stewing or grilling beef',
    image: proteinsMeatImg,
  },
  {
    id: 'whole-chicken',
    name: 'Dressed Whole Broiler Chicken',
    category: 'Proteins & Meat',
    unit: '1 Whole Bird (~1.8kg)',
    priceNgn: 8500,
    marketSource: 'Garki Poultry Section',
    note: 'Freshly dressed, cleaned, and chilled for dispatch',
    image: proteinsMeatImg,
  },
  {
    id: 'fresh-catfish',
    name: 'Fresh Point-and-Kill Catfish',
    category: 'Proteins & Meat',
    unit: '1 Large Fish (~1.2kg)',
    priceNgn: 5400,
    marketSource: 'Apo Fish Hub',
    note: 'Cleaned, cut into steaks, and packed on ice',
    image: proteinsMeatImg,
  },
  {
    id: 'farm-eggs',
    name: 'Large Farm Brown Eggs',
    category: 'Proteins & Meat',
    unit: '1 Crate (30 Eggs)',
    priceNgn: 5600,
    marketSource: 'Kuje & Apo Farms',
    note: 'Crack-checked and cushioned for bike transport',
    image: proteinsMeatImg,
  },
  {
    id: 'palm-oil',
    name: 'Pure Unadulterated Red Palm Oil',
    category: 'Oils & Spices',
    unit: '1.5 Litre Bottle',
    priceNgn: 3900,
    marketSource: 'Apo Market',
    note: 'Rich aroma, zero artificial dye',
    image: oilsSpicesImg,
  },
  {
    id: 'groundnut-oil',
    name: 'Refined Golden Vegetable Oil',
    category: 'Oils & Spices',
    unit: '2 Litre Bottle',
    priceNgn: 5800,
    marketSource: 'Wuse Wholesale',
    note: 'Light, cholesterol-free cooking oil',
    image: oilsSpicesImg,
  },
  {
    id: 'crayfish-spices',
    name: 'Dried Crayfish, Ginger & Garlic Bundle',
    category: 'Oils & Spices',
    unit: '1 Pantry Pack',
    priceNgn: 3400,
    marketSource: 'Garki Spice Row',
    note: 'Clean whole crayfish with fresh ginger and garlic',
    image: oilsSpicesImg,
  },
];

export const ABUJA_DISTRICTS: AbujaDistrict[] = [
  {
    id: 'apo-gudu',
    name: 'Apo & Gudu',
    distanceFromApoKm: 3,
    serviceChargeNgn: 2500,
    assignedBike: 'Bike 01',
    etaWindow: '45 – 75 mins',
  },
  {
    id: 'lokogoma',
    name: 'Lokogoma & Galadimawa',
    distanceFromApoKm: 6,
    serviceChargeNgn: 3500,
    assignedBike: 'Bike 03',
    etaWindow: '60 – 90 mins',
  },
  {
    id: 'garki',
    name: 'Garki I & II',
    distanceFromApoKm: 8,
    serviceChargeNgn: 4500,
    assignedBike: 'Bike 01',
    etaWindow: '60 – 90 mins',
  },
  {
    id: 'asokoro-guzape',
    name: 'Asokoro & Guzape',
    distanceFromApoKm: 10,
    serviceChargeNgn: 5500,
    assignedBike: 'Bike 01',
    etaWindow: '75 – 105 mins',
  },
  {
    id: 'wuse',
    name: 'Wuse I & II',
    distanceFromApoKm: 12,
    serviceChargeNgn: 6500,
    assignedBike: 'Bike 02',
    etaWindow: '75 – 110 mins',
  },
  {
    id: 'utako-jabi',
    name: 'Utako & Jabi',
    distanceFromApoKm: 14,
    serviceChargeNgn: 7500,
    assignedBike: 'Bike 02',
    etaWindow: '90 – 120 mins',
  },
  {
    id: 'maitama',
    name: 'Maitama',
    distanceFromApoKm: 15,
    serviceChargeNgn: 8500,
    assignedBike: 'Bike 02',
    etaWindow: '90 – 120 mins',
  },
  {
    id: 'lugbe',
    name: 'Lugbe & Airport Road',
    distanceFromApoKm: 18,
    serviceChargeNgn: 9500,
    assignedBike: 'Bike 03',
    etaWindow: '90 – 130 mins',
  },
  {
    id: 'gwarinpa',
    name: 'Gwarinpa & Life Camp',
    distanceFromApoKm: 21,
    serviceChargeNgn: 10500,
    assignedBike: 'Bike 03',
    etaWindow: '100 – 140 mins',
  },
  {
    id: 'kubwa',
    name: 'Kubwa',
    distanceFromApoKm: 28,
    serviceChargeNgn: 12500,
    assignedBike: 'Bike 03',
    etaWindow: '120 – 160 mins',
  },
];

export const BIKE_FLEET: BikeRoute[] = [
  {
    bikeId: 'Bike 01',
    label: 'South-Central Corridor',
    hub: 'Apo Main Hub',
    zones: ['Apo', 'Gudu', 'Garki I & II', 'Guzape', 'Asokoro'],
    capacityNote: 'Insulated produce crate + 35kg grain rack',
  },
  {
    bikeId: 'Bike 02',
    label: 'City Core Corridor',
    hub: 'Apo Main Hub',
    zones: ['Wuse I & II', 'Maitama', 'Utako', 'Jabi'],
    capacityNote: 'Chilled protein box + cushioned egg compartment',
  },
  {
    bikeId: 'Bike 03',
    label: 'Expressway & Estates Corridor',
    hub: 'Apo Main Hub',
    zones: ['Lokogoma', 'Galadimawa', 'Lugbe', 'Gwarinpa', 'Kubwa'],
    capacityNote: 'Heavy-load household & vendor carrier',
  },
];


export interface AbujaMarketHub {
  id: string;
  name: string;
  areaLabel: string;
  specialty: string;
  stallImage: string;
}

export const ABUJA_MARKET_HUBS: AbujaMarketHub[] = [
  {
    id: 'apo-market',
    name: 'Apo Main Market',
    areaLabel: 'Apo, Abuja FCT',
    specialty: 'Benue yams, parboiled rice, palm oil, abattoir beef & fresh catfish',
    stallImage: grainsStaplesImg,
  },
  {
    id: 'garki-market',
    name: 'Garki International Market',
    areaLabel: 'Garki II, Abuja FCT',
    specialty: 'Fresh tomatoes, tatase, plantains, whole dressed poultry & spices',
    stallImage: freshProduceImg,
  },
  {
    id: 'wuse-market',
    name: 'Wuse Market',
    areaLabel: 'Wuse Zone 5, Abuja FCT',
    specialty: 'Oloyin honey beans, lean beef cuts, catfish & wholesale cooking oils',
    stallImage: proteinsMeatImg,
  },
  {
    id: 'deidei-market',
    name: 'Dei-Dei International Market',
    areaLabel: 'Dei-Dei / Kubwa Road, Abuja FCT',
    specialty: 'Bulk plum tomatoes, red onions baskets, dry pepper & household grains',
    stallImage: freshProduceImg,
  },
  {
    id: 'utako-market',
    name: 'Utako Market',
    areaLabel: 'Utako District, Abuja FCT',
    specialty: 'Fresh Ugu greens, dried crayfish, farm brown eggs & stew bundles',
    stallImage: oilsSpicesImg,
  },
];

export interface MarketCameraChannelPreset {
  id: string;
  marketId: string;
  marketLocation: string;
  shopperId: string;
  shopperName: string;
  shopperRole: 'Market Boy' | 'Market Girl';
  title: string;
  stallSection: string;
  stallImage: string;
  featuredProductIds: string[];
  customSpottedItems: { id: string; name: string; unit: string; priceNgn: number }[];
}

export const DEFAULT_ABUJA_CAMERA_CHANNELS: MarketCameraChannelPreset[] = [
  {
    id: 'abuja-cam-apo',
    marketId: 'apo-market',
    marketLocation: 'Apo Main Market',
    shopperId: 'shopper-musa-apo',
    shopperName: 'Musa Ibrahim',
    shopperRole: 'Market Boy',
    title: 'Apo Yam Shed & Grains Stall Live Feed',
    stallSection: 'Line C · Grains, Yams & Palm Oil',
    stallImage: grainsStaplesImg,
    featuredProductIds: ['benue-yam', 'rice-5kg', 'yellow-garri', 'palm-oil'],
    customSpottedItems: [
      { id: 'spot-apo-egusi', name: 'Hand-Peeled White Egusi', unit: '1 Mudu', priceNgn: 4200 },
      { id: 'spot-apo-ogbono', name: 'Dry Ogbono Seeds', unit: '1/2 Mudu', priceNgn: 5500 },
    ],
  },
  {
    id: 'abuja-cam-garki',
    marketId: 'garki-market',
    marketLocation: 'Garki International Market',
    shopperId: 'shopper-fatima-garki',
    shopperName: 'Fatima Bello',
    shopperRole: 'Market Girl',
    title: 'Garki Fresh Produce & Poultry Section',
    stallSection: 'Gate 2 · Tomatoes, Plantains & Poultry',
    stallImage: freshProduceImg,
    featuredProductIds: ['tomatoes-basket', 'pepper-mix', 'ripe-plantain', 'whole-chicken'],
    customSpottedItems: [
      { id: 'spot-garki-ugu', name: 'Freshly Cut Ugu & Waterleaf', unit: '2 Large Bunches', priceNgn: 1800 },
    ],
  },
  {
    id: 'abuja-cam-wuse',
    marketId: 'wuse-market',
    marketLocation: 'Wuse Market',
    shopperId: 'shopper-chinedu-wuse',
    shopperName: 'Chinedu Eze',
    shopperRole: 'Market Boy',
    title: 'Wuse Cold Room, Beef & Catfish Hub',
    stallSection: 'Block B · Abattoir Meat & Live Fish',
    stallImage: proteinsMeatImg,
    featuredProductIds: ['fresh-beef', 'fresh-catfish', 'honey-beans-mudu', 'groundnut-oil'],
    customSpottedItems: [
      { id: 'spot-wuse-stockfish', name: 'Smoked Stockfish Head & Ears', unit: '1 Pack (~500g)', priceNgn: 6500 },
    ],
  },
  {
    id: 'abuja-cam-deidei',
    marketId: 'deidei-market',
    marketLocation: 'Dei-Dei International Market',
    shopperId: 'shopper-bala-deidei',
    shopperName: 'Bala Danjuma',
    shopperRole: 'Market Boy',
    title: 'Dei-Dei Bulk Tomato & Onion Shed',
    stallSection: 'Wholesale Shed 4 · Produce Baskets',
    stallImage: freshProduceImg,
    featuredProductIds: ['tomatoes-basket', 'pepper-mix', 'rice-5kg'],
    customSpottedItems: [
      { id: 'spot-deidei-onions', name: 'Sokoto Red Onions Basket', unit: '1 Paint Bucket', priceNgn: 4600 },
      { id: 'spot-deidei-ginger', name: 'Fresh Kaduna Ginger & Garlic', unit: '1kg Mixed', priceNgn: 2400 },
    ],
  },
  {
    id: 'abuja-cam-utako',
    marketId: 'utako-market',
    marketLocation: 'Utako Market',
    shopperId: 'shopper-amina-apo',
    shopperName: 'Amina Yusuf',
    shopperRole: 'Market Girl',
    title: 'Utako Spice Row, Eggs & Stew Market',
    stallSection: 'Stall 19 · Spices, Crayfish & Eggs',
    stallImage: oilsSpicesImg,
    featuredProductIds: ['crayfish-spices', 'farm-eggs', 'palm-oil', 'pepper-mix'],
    customSpottedItems: [
      { id: 'spot-utako-iru', name: 'Locust Beans (Dawadawa / Iru)', unit: '2 Wraps', priceNgn: 1200 },
    ],
  },
];

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

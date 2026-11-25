import { api, poll } from './http';

export type OrderStatus = 'pending_sourcing' | 'sourcing_in_market' | 'out_for_delivery' | 'delivered' | 'cancelled';
export interface ApiTimestamp { value: string; toDate(): Date; toMillis(): number }
export interface ShoppingListLineItem { productId?: string; name: string; unit: string; quantity: number; priceNgn: number; isCustom?: boolean }
export interface SavedShoppingList { id: string; ownerId: string; title: string; districtId: string; items: ShoppingListLineItem[]; createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }
export interface UserPrivateProfile { ownerId: string; fullName: string; phone: string; defaultDistrictId: string; defaultAddress: string; updatedAt?: ApiTimestamp | null }
export interface FirestoreMarketOrder { id: string; orderCode: string; ownerId: string; customerName: string; phone: string; districtId: string; districtName: string; assignedBike: string; assignedShopperName: string; address: string; scheduleType: 'Same-Day Dispatch' | 'Scheduled Delivery'; scheduleSlot: string; items: ShoppingListLineItem[]; subtotalNgn: number; serviceChargeNgn: number; totalNgn: number; notes: string; status: OrderStatus; paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed'; createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }
export interface MarketShopper { id: string; name: string; roleLabel: 'Market Boy' | 'Market Girl'; marketLocation: string; specialty: string; bikeCode: string; isAvailable: boolean; updatedAt?: ApiTimestamp | null }
export interface CustomSpottedItem { id: string; name: string; unit: string; priceNgn: number }
export interface CameraSession { id: string; shopperId: string; shopperName: string; shopperRole: 'Market Boy' | 'Market Girl'; marketLocation: string; title: string; status: 'live' | 'ended'; featuredProductIds: string[]; customSpottedItems: CustomSpottedItem[]; createdByUid: string; createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }
export interface VideoCallDoc { id: string; sessionId: string; shopperName: string; marketLocation: string; customerId: string; customerName: string; status: 'ringing' | 'active' | 'ended'; offerSdp: string; answerSdp: string; selectedItemNames: string[]; createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }
export interface AdminConnector { id: string; name: string; category: 'Messaging' | 'Camera & Video' | 'Dispatch Fleet' | 'Database' | 'Webhook'; enabled: boolean; endpointOrValue: string; statusLabel: string; notes: string; updatedByUid: string; updatedAt?: ApiTimestamp | null }
export interface StorefrontConfig { whatsappNumber: string; whatsappDisplay: string; dispatchActive: boolean; updatedAt?: ApiTimestamp | null }
export interface AdminGrant { uid: string; email: string; role: 'admin'; grantedAt?: ApiTimestamp | null; grantedBy: string }

function stamp(value?: string | null): ApiTimestamp | null { if (!value) return null; return { value, toDate: () => new Date(value), toMillis: () => new Date(value).getTime() }; }
function hydrate<T extends Record<string, unknown>>(row: T): T { return { ...row, createdAt: stamp(row.createdAt as string), updatedAt: stamp(row.updatedAt as string), grantedAt: stamp(row.grantedAt as string) }; }
async function list<T>(resource: string): Promise<T[]> { const result = await api<{ items: Record<string, unknown>[] }>(`/data/${resource}`); return result.items.map(hydrate) as T[]; }
function subscribe<T>(resource: string, callback: (items: T[]) => void) { return poll(() => list<T>(resource), callback); }
async function put<T>(resource: string, id: string | undefined, data: T) { return api<{ id: string }>(`/data/${resource}${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }); }
async function remove(resource: string, id: string) { await api(`/data/${resource}/${id}`, { method: 'DELETE' }); }

export function subscribeStorefrontConfig(onData: (config: StorefrontConfig | null) => void) { return poll(async () => (await list<StorefrontConfig>('storefront'))[0] || null, onData); }
export async function saveStorefrontConfig(config: Omit<StorefrontConfig, 'updatedAt'>) { await put('storefront', 'storefront', config); }
export async function getUserPrivateProfile(_uid: string) { return (await list<UserPrivateProfile>('profile'))[0] || null; }
export async function saveUserPrivateProfile(_uid: string, profile: Omit<UserPrivateProfile, 'ownerId' | 'updatedAt'>) { await put('profile', 'profile', profile); }
export function subscribeUserShoppingLists(_uid: string, onData: (items: SavedShoppingList[]) => void) { return subscribe('shopping-lists', onData); }
export async function createShoppingList(_uid: string, title: string, districtId: string, items: ShoppingListLineItem[]) { return (await put('shopping-lists', undefined, { title, districtId, items })).id; }
export async function deleteShoppingList(id: string) { await remove('shopping-lists', id); }
export function subscribeCustomerOrders(_uid: string, onData: (items: FirestoreMarketOrder[]) => void) { return subscribe('orders', onData); }
export function subscribeAllOrdersAdmin(onData: (items: FirestoreMarketOrder[]) => void) { return subscribe('admin-orders', onData); }
export async function createMarketOrder(_uid: string, order: Omit<FirestoreMarketOrder, 'id' | 'ownerId' | 'status' | 'assignedShopperName' | 'createdAt' | 'updatedAt'>) { return (await put('orders', undefined, order)).id; }
export async function cancelCustomerOrder(id: string) { await put('orders', id, { status: 'cancelled' }); }
export async function adminUpdateOrderDispatch(id: string, update: Partial<Pick<FirestoreMarketOrder, 'status' | 'assignedBike' | 'assignedShopperName'>>) { await put('admin-orders', id, update); }
export function subscribeShoppers(onData: (items: MarketShopper[]) => void) { return subscribe('shoppers', onData); }
export async function upsertShopper(id: string, shopper: Omit<MarketShopper, 'id' | 'updatedAt'>) { await put('shoppers', id, shopper); }
export async function deleteShopper(id: string) { await remove('shoppers', id); }
export async function seedDefaultShoppersIfEmpty() { await api('/seed/shoppers', { method: 'POST' }); }
export function subscribeLiveCameraSessions(onData: (items: CameraSession[]) => void) { return poll(async () => (await list<CameraSession>('camera-sessions')).filter((x) => x.status === 'live'), onData); }
export function subscribeCameraSessions(onData: (items: CameraSession[]) => void) { return subscribe('camera-sessions', onData); }
export async function createCameraSession(uid: string, data: Omit<CameraSession, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid'>) { return (await put('camera-sessions', undefined, { ...data, createdByUid: uid })).id; }
export async function updateCameraSession(id: string, update: Partial<Pick<CameraSession, 'status' | 'featuredProductIds' | 'customSpottedItems' | 'title'>>) { await put('camera-sessions', id, update); }
export function subscribeAdminVideoCalls(onData: (items: VideoCallDoc[]) => void) { return subscribe('admin-video-calls', onData); }
export function subscribeCustomerVideoCalls(_uid: string, onData: (items: VideoCallDoc[]) => void) { return subscribe('video-calls', onData); }
export function subscribeAdminConnectors(onData: (items: AdminConnector[]) => void) { return subscribe('connectors', onData); }
export async function upsertAdminConnector(id: string, _uid: string, connector: Omit<AdminConnector, 'id' | 'updatedByUid' | 'updatedAt'>) { await put('connectors', id, connector); }
export async function seedDefaultConnectorsIfEmpty(_uid: string) { await api('/seed/connectors', { method: 'POST' }); }
export function subscribeAdminGrants(onData: (items: AdminGrant[]) => void) { return subscribe('admin-grants', onData); }
export async function grantAdminRole(uid: string, email: string, _grantedBy: string) { await put('admin-grants', uid, { uid, email, role: 'admin' }); }
export async function revokeAdminRole(uid: string) { await remove('admin-grants', uid); }
export async function createVideoCall(data: Omit<VideoCallDoc, 'id' | 'createdAt' | 'updatedAt'>) { return (await put('video-calls', undefined, data)).id; }
export async function updateVideoCall(id: string, data: Partial<VideoCallDoc>) { await put('video-calls', id, data); }
export async function getVideoCall(id: string) { const result = await api<{ item: Record<string, unknown> }>(`/data/video-calls/${id}`); return hydrate(result.item) as unknown as VideoCallDoc; }
export async function addIceCandidate(callId: string, side: 'offer' | 'answer', candidate: RTCIceCandidateInit) { await api(`/calls/${callId}/candidates/${side}`, { method: 'POST', body: JSON.stringify(candidate) }); }
export async function getIceCandidates(callId: string, side: 'offer' | 'answer') { return (await api<{ items: RTCIceCandidateInit[] }>(`/calls/${callId}/candidates/${side}`)).items; }

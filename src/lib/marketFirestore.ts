import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query,
  serverTimestamp, setDoc, updateDoc, where, type DocumentData, type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type OrderStatus = 'pending_sourcing' | 'sourcing_in_market' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type ApiTimestamp = Timestamp;
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
export interface AdminGrant { uid: string; email: string; role: 'admin'; grantedAt?: ApiTimestamp | null; grantedBy: string; createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }

function row<T>(snapshot: { id: string; data(): DocumentData }): T { return { id: snapshot.id, ...snapshot.data() } as T; }
function newestFirst<T extends { createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }>(items: T[]) {
  return items.sort((a, b) => (b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0));
}
function subscribe<T extends { createdAt?: ApiTimestamp | null; updatedAt?: ApiTimestamp | null }>(collectionName: string, callback: (items: T[]) => void, ...constraints: QueryConstraint[]) {
  const source = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
  return onSnapshot(source, (snapshot) => callback(newestFirst(snapshot.docs.map((item) => row<T>(item)))), (error) => console.error(`Firestore ${collectionName} subscription failed`, error));
}

export function subscribeStorefrontConfig(onData: (config: StorefrontConfig | null) => void) { return onSnapshot(doc(db, 'storefront', 'config'), (snapshot) => onData(snapshot.exists() ? row<StorefrontConfig>(snapshot) : null), (error) => console.error('Storefront subscription failed', error)); }
export async function saveStorefrontConfig(config: Omit<StorefrontConfig, 'updatedAt'>) { await setDoc(doc(db, 'storefront', 'config'), { ...config, updatedAt: serverTimestamp() }, { merge: true }); }
export async function getUserPrivateProfile(uid: string) { const snapshot = await getDoc(doc(db, 'profiles', uid)); return snapshot.exists() ? row<UserPrivateProfile>(snapshot) : null; }
export async function saveUserPrivateProfile(uid: string, profile: Omit<UserPrivateProfile, 'ownerId' | 'updatedAt'>) { await setDoc(doc(db, 'profiles', uid), { ...profile, ownerId: uid, updatedAt: serverTimestamp() }, { merge: true }); }
export function subscribeUserShoppingLists(uid: string, onData: (items: SavedShoppingList[]) => void) { return subscribe<SavedShoppingList>('shoppingLists', onData, where('ownerId', '==', uid)); }
export async function createShoppingList(uid: string, title: string, districtId: string, items: ShoppingListLineItem[]) { const result = await addDoc(collection(db, 'shoppingLists'), { ownerId: uid, title, districtId, items, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return result.id; }
export async function deleteShoppingList(id: string) { await deleteDoc(doc(db, 'shoppingLists', id)); }
export function subscribeCustomerOrders(uid: string, onData: (items: FirestoreMarketOrder[]) => void) { return subscribe<FirestoreMarketOrder>('orders', onData, where('ownerId', '==', uid)); }
export function subscribeAllOrdersAdmin(onData: (items: FirestoreMarketOrder[]) => void) { return subscribe<FirestoreMarketOrder>('orders', onData); }
export async function createMarketOrder(uid: string, order: Omit<FirestoreMarketOrder, 'id' | 'ownerId' | 'status' | 'assignedShopperName' | 'createdAt' | 'updatedAt'>) { const result = await addDoc(collection(db, 'orders'), { ...order, ownerId: uid, status: 'pending_sourcing', assignedShopperName: '', paymentStatus: 'unpaid', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return result.id; }
export async function cancelCustomerOrder(id: string) { await updateDoc(doc(db, 'orders', id), { status: 'cancelled', updatedAt: serverTimestamp() }); }
export async function adminUpdateOrderDispatch(id: string, update: Partial<Pick<FirestoreMarketOrder, 'status' | 'assignedBike' | 'assignedShopperName'>>) { await updateDoc(doc(db, 'orders', id), { ...update, updatedAt: serverTimestamp() }); }
export function subscribeShoppers(onData: (items: MarketShopper[]) => void) { return subscribe<MarketShopper>('shoppers', onData); }
export async function upsertShopper(id: string, shopper: Omit<MarketShopper, 'id' | 'updatedAt'>) { await setDoc(doc(db, 'shoppers', id), { ...shopper, updatedAt: serverTimestamp() }, { merge: true }); }
export async function deleteShopper(id: string) { await deleteDoc(doc(db, 'shoppers', id)); }
export async function seedDefaultShoppersIfEmpty() {
  if (!(await getDocs(query(collection(db, 'shoppers'), limit(1)))).empty) return;
  await Promise.all([
    upsertShopper('shopper-apo-01', { name: 'Chinedu Okafor', roleLabel: 'Market Boy', marketLocation: 'Apo Main Market', specialty: 'Fresh Produce & Staples', bikeCode: 'Bike 01', isAvailable: true }),
    upsertShopper('shopper-wuse-01', { name: 'Zainab Musa', roleLabel: 'Market Girl', marketLocation: 'Wuse Market', specialty: 'Proteins & Spices', bikeCode: 'Bike 02', isAvailable: true }),
  ]);
}
export function subscribeLiveCameraSessions(onData: (items: CameraSession[]) => void) { return subscribe<CameraSession>('cameraSessions', onData, where('status', '==', 'live')); }
export function subscribeCameraSessions(onData: (items: CameraSession[]) => void) { return subscribe<CameraSession>('cameraSessions', onData); }
export async function createCameraSession(uid: string, data: Omit<CameraSession, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid'>) { const result = await addDoc(collection(db, 'cameraSessions'), { ...data, createdByUid: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return result.id; }
export async function updateCameraSession(id: string, update: Partial<Pick<CameraSession, 'status' | 'featuredProductIds' | 'customSpottedItems' | 'title'>>) { await updateDoc(doc(db, 'cameraSessions', id), { ...update, updatedAt: serverTimestamp() }); }
export function subscribeAdminVideoCalls(onData: (items: VideoCallDoc[]) => void) { return subscribe<VideoCallDoc>('videoCalls', onData); }
export function subscribeCustomerVideoCalls(uid: string, onData: (items: VideoCallDoc[]) => void) { return subscribe<VideoCallDoc>('videoCalls', onData, where('customerId', '==', uid)); }
export function subscribeAdminConnectors(onData: (items: AdminConnector[]) => void) { return subscribe<AdminConnector>('connectors', onData); }
export async function upsertAdminConnector(id: string, uid: string, connector: Omit<AdminConnector, 'id' | 'updatedByUid' | 'updatedAt'>) { await setDoc(doc(db, 'connectors', id), { ...connector, updatedByUid: uid, updatedAt: serverTimestamp() }, { merge: true }); }
export async function seedDefaultConnectorsIfEmpty(uid: string) { if ((await getDocs(query(collection(db, 'connectors'), limit(1)))).empty) await upsertAdminConnector('firebase-database', uid, { name: 'Firebase Firestore', category: 'Database', enabled: true, endpointOrValue: 'Cloud Firestore', statusLabel: 'Active', notes: 'Realtime application database' }); }
export function subscribeAdminGrants(onData: (items: AdminGrant[]) => void) { return subscribe<AdminGrant>('adminGrants', onData); }
export async function grantAdminRole(uid: string, email: string, grantedBy: string) { await setDoc(doc(db, 'adminGrants', uid), { uid, email: email.toLowerCase(), role: 'admin', grantedAt: serverTimestamp(), grantedBy }); }
export async function revokeAdminRole(uid: string) { await deleteDoc(doc(db, 'adminGrants', uid)); }
export async function createVideoCall(data: Omit<VideoCallDoc, 'id' | 'createdAt' | 'updatedAt'>) { const result = await addDoc(collection(db, 'videoCalls'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return result.id; }
export async function updateVideoCall(id: string, data: Partial<VideoCallDoc>) { const { id: _id, ...safeData } = data; await updateDoc(doc(db, 'videoCalls', id), { ...safeData, updatedAt: serverTimestamp() }); }
export async function getVideoCall(id: string) { const snapshot = await getDoc(doc(db, 'videoCalls', id)); if (!snapshot.exists()) throw new Error('Video call not found.'); return row<VideoCallDoc>(snapshot); }
export async function addIceCandidate(callId: string, side: 'offer' | 'answer', candidate: RTCIceCandidateInit) { await addDoc(collection(db, 'videoCalls', callId, `${side}Candidates`), { ...candidate, createdAt: serverTimestamp() }); }
export async function getIceCandidates(callId: string, side: 'offer' | 'answer') { const snapshot = await getDocs(collection(db, 'videoCalls', callId, `${side}Candidates`)); return snapshot.docs.map((item) => { const { createdAt: _createdAt, ...candidate } = item.data(); return candidate as RTCIceCandidateInit; }); }

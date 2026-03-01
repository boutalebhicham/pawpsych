import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (_db) return _db;

  let app;
  if (getApps().length) {
    app = getApps()[0];
  } else {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (sa) {
      const parsed: ServiceAccount = JSON.parse(sa);
      app = initializeApp({ credential: cert(parsed) });
    } else {
      // Firebase App Hosting provides default credentials automatically
      app = initializeApp();
    }
  }

  _db = getFirestore(app);
  return _db;
}

// Keep backward compat export but lazy
export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

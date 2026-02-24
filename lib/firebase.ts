import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// .env.local が設定されているかチェック
export const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  // 未設定時はダミー値でモジュール評価エラーを回避（実際の通信時にエラーになる）
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'not-configured',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'not-configured',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'not-configured',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'not-configured',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? 'not-configured',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

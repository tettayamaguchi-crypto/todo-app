'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import TodoApp from '@/components/TodoApp';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('ログインエラー:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Firebase の設定が必要です</h1>
          <p className="text-gray-500 text-sm mb-4">
            プロジェクトルートに <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> を作成し、Firebase の設定値を入力してください。
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 overflow-x-auto whitespace-pre">{`cp .env.local.example .env.local
# .env.local を編集して Firebase の値を入力`}</pre>
          <p className="text-gray-400 text-xs mt-3">
            詳しい手順は <code className="bg-gray-100 px-1 rounded">README.md</code> を参照してください。
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">やりたいことリスト</h1>
          <p className="text-gray-500 text-sm mb-8">期間を決めて、やりたいことを管理する</p>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-gray-700 text-sm font-medium"
          >
            <GoogleIcon />
            Google でログイン
          </button>
        </div>
      </div>
    );
  }

  return <TodoApp user={user} onSignOut={handleSignOut} />;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

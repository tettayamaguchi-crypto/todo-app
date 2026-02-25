'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import TodoApp from '@/components/TodoApp';

// アプリ内ブラウザの検知
function detectInAppBrowser(): string | null {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/Line\//i.test(ua)) return 'LINE';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Twitter/i.test(ua)) return 'Twitter';
  if (/MicroMessenger/i.test(ua)) return 'WeChat';
  if (/musical_ly|TikTok/i.test(ua)) return 'TikTok';
  if (/YJApp/i.test(ua)) return 'Yahoo';
  return null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInAppBrowser(detectInAppBrowser());

    console.log('[Auth] Firebase initialized, waiting for auth state...');
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log('[Auth] onAuthStateChanged:', u ? `logged in as ${u.email}` : 'not logged in');
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    console.log('[Auth] Login button clicked');
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      console.log('[Auth] Calling signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Auth] signInWithPopup success:', result.user.email);
    } catch (err: unknown) {
      console.error('[Auth] signInWithPopup error:', err);
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/unauthorized-domain') {
        setLoginError('このドメインはFirebaseの承認済みドメインに登録されていません。Firebase ConsoleでVercelのURLを追加してください。');
      } else if (code === 'auth/popup-blocked') {
        setLoginError('ポップアップがブロックされました。ブラウザのポップアップ許可設定を確認してください。');
      } else if (code === 'auth/popup-closed-by-user') {
        setLoginError(null);
      } else {
        setLoginError(`ログインに失敗しました（${code || 'unknown error'}）`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // 外部ブラウザで開く
  const openInBrowser = () => {
    const url = window.location.href.split('?')[0].split('#')[0];
    if (inAppBrowser === 'LINE') {
      // LINE専用パラメータ：デフォルトブラウザで開く
      window.location.href = url + '?openExternalBrowser=1';
    } else {
      window.open(url, '_blank');
    }
  };

  // URLをコピー
  const copyUrl = async () => {
    const url = window.location.href.split('?')[0].split('#')[0];
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API非対応の場合は何もしない
    }
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
    // アプリ内ブラウザの場合は専用画面を表示
    if (inAppBrowser) {
      const pageUrl = typeof window !== 'undefined'
        ? window.location.href.split('?')[0].split('#')[0]
        : '';

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-xs">
            <div className="text-4xl mb-4">🌐</div>
            <h1 className="text-lg font-semibold text-gray-800 mb-2">
              ブラウザで開いてください
            </h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {inAppBrowser}などのアプリ内ブラウザではGoogleログインが利用できません。
              下のボタンからブラウザで開いてください。
            </p>
            <button
              onClick={openInBrowser}
              className="w-full px-5 py-3 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mb-3"
            >
              {inAppBrowser === 'LINE' ? 'デフォルトブラウザで開く' : 'ブラウザで開く'}
            </button>
            {/* URLコピー（フォールバック） */}
            {pageUrl && (
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  うまく開けない場合はURLをコピーしてブラウザに貼り付けてください
                </p>
                <button
                  onClick={copyUrl}
                  className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? '✓ コピーしました' : 'URLをコピー'}
                </button>
                <p className="mt-2 text-xs text-gray-300 break-all">{pageUrl}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">やりたいことリスト</h1>
          <p className="text-gray-500 text-sm mb-8">期間を決めて、やりたいことを管理する</p>
          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-gray-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {isLoggingIn ? 'ログイン中...' : 'Google でログイン'}
          </button>
          {loginError && (
            <p className="mt-4 text-xs text-red-500 max-w-xs mx-auto">{loginError}</p>
          )}
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

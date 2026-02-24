# やりたいことリスト

期間を決めてやりたいことを管理する、シンプルなWebアプリ。

## 技術スタック

- **Next.js 14** (App Router) — フロントエンド
- **Firebase Auth** — Google ログイン
- **Firebase Firestore** — データ保存（ユーザーごと）
- **Tailwind CSS** — スタイリング
- **Vercel** — デプロイ（無料）

---

## セットアップ手順

### 1. Firebase プロジェクトを作成する

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」→ 任意の名前でプロジェクトを作成
3. Google アナリティクスは不要なのでオフで OK

### 2. Google 認証を有効にする

1. Firebase Console の左メニュー「Authentication」を開く
2. 「始める」→「Sign-in method」タブ
3. 「Google」を有効にして保存

### 3. Firestore データベースを作成する

1. 左メニュー「Firestore Database」を開く
2. 「データベースを作成」→「本番環境モード」で作成
3. リージョンは `asia-northeast1`（東京）を推奨

### 4. Firestore セキュリティルールを設定する

**方法 A：Firebase Console から設定（簡単）**

1. Firestore の「ルール」タブを開く
2. 以下のルールに書き換えて「公開」する

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/todos/{todoId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**方法 B：Firebase CLI で設定**

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # プロジェクトを選択
firebase deploy --only firestore:rules
```

### 5. Firebase の設定値を取得する

1. Firebase Console の「プロジェクトの設定」（歯車アイコン）を開く
2. 「マイアプリ」→「ウェブアプリを追加」
3. アプリ名を入力して登録（Firebase Hosting は不要）
4. 表示される `firebaseConfig` の各値をコピーする

### 6. ローカルで動かす

```bash
# このリポジトリをクローン
git clone <リポジトリURL>
cd todo-app

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local
```

`.env.local` を開いて Firebase の設定値を入力：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...:web:abc...
```

```bash
# 開発サーバーを起動
npm run dev
```

http://localhost:3000 で動作確認できます。

---

## Vercel にデプロイする

### 1. GitHub にプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### 2. Vercel に接続

1. [Vercel](https://vercel.com/) にアクセスし、GitHub アカウントでログイン
2. 「Add New Project」→ GitHub リポジトリを選択
3. Framework は自動で「Next.js」が検出される

### 3. 環境変数を設定

「Environment Variables」セクションで `.env.local` の内容を1つずつ追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | AIza... |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your-project-id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:123...:web:abc... |

### 4. Firebase の認証ドメインを追加

デプロイ後、Vercel から発行された URL（例: `your-app.vercel.app`）を Firebase に登録する必要があります。

1. Firebase Console「Authentication」→「設定」タブ
2. 「承認済みドメイン」に `your-app.vercel.app` を追加

### 5. デプロイ実行

「Deploy」をクリックするとビルドが始まります。完了後、発行された URL でアプリが使えます。

---

## 料金について

すべて無料枠で運用できます。

| サービス | 無料枠 |
|----------|--------|
| Firebase Auth | 制限なし |
| Firestore | 1GB ストレージ、50,000 読み取り/日 |
| Vercel | 個人利用は無料 |

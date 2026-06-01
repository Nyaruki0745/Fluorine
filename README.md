# 議論ボード

学校のイベント向けチーム議論システム。GitHub Issues風のUIで、プロジェクト・スレッド・サブスレッドを管理できます。

## 機能

- **プロジェクト管理**: コードを共有するだけでメンバーが参加可能
- **スレッド**: タイトル付き議題を作成、未解決/解決済みで管理
- **サブスレッド**: スレッド内にネスト1段のサブスレッドを作成可能
- **チャット**: スレッド内でリアルタイムチャット
- **権限管理**: 非ログインユーザーとログインメンバーの権限を細かく設定

---

## セットアップ手順

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `Fluorine`）して作成

### 2. Authentication の設定

1. Firebase Console → Authentication → 「始める」
2. 「メール/パスワード」を有効化して保存

### 3. Firestore の設定

1. Firebase Console → Firestore Database → 「データベースの作成」
2. 「本番環境モード」で開始
3. ロケーション: `asia-northeast1`（東京）を選択

### 4. Firestore セキュリティルールの設定

1. Firestore → 「ルール」タブ
2. `firestore.rules` の内容をコピーして貼り付けて公開

### 5. Firestore インデックスの設定

以下のコンポジットインデックスを作成してください（Firestore → インデックス → 複合）：

| コレクション | フィールド1 | フィールド2 | フィールド3 |
|---|---|---|---|
| threads | projectId (昇順) | parentId (昇順) | createdAt (昇順) |
| comments | threadId (昇順) | createdAt (昇順) |  |
| projects | ownerId (昇順) | createdAt (降順) |  |

### 6. Firebase 設定値の取得

1. Firebase Console → プロジェクトの設定（歯車アイコン）→ 全般
2. 「マイアプリ」→「</> ウェブ」でアプリを登録
3. `firebaseConfig` の値をコピー

### 7. ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/あなたのユーザー名/school-discussion.git
cd school-discussion

# 依存関係インストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local
# .env.local を編集してFirebaseの設定値を入力

# 開発サーバー起動
npm run dev
```

### 8. GitHub Pages へのデプロイ

1. GitHubリポジトリを作成してコードをプッシュ
2. リポジトリ → Settings → Secrets and variables → Actions
3. 以下のシークレットを追加:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Settings → Pages → Source: 「GitHub Actions」を選択
5. mainブランチにプッシュすると自動デプロイ

### 9. Firebase の Authorized domain 設定

1. Firebase Console → Authentication → Settings → 承認済みドメイン
2. GitHub PagesのURL（`あなたのユーザー名.github.io`）を追加

---

## 権限仕様

| 権限 | オーナー | メンバー（設定次第） | 非ログインユーザー（設定次第） |
|---|:---:|:---:|:---:|
| スレッド作成 | ✓ | 設定可 | 設定可 |
| コメント投稿 | ✓ | 設定可 | 設定可 |
| スレッド状態変更 | ✓ | 設定可 | 設定可 |
| メンバー管理 | ✓ | 設定可 | ✗ |
| プロジェクト設定 | ✓ | ✗ | ✗ |

※ スレッドの状態変更は、作成者本人は常に変更可能（権限設定に関わらず）

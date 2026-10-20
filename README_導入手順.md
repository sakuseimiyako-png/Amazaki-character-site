# 『物語之終幕』管理画面 v1.3 — 安全な導入手順

## 最初に読むこと

- この版は **公開済み v1.1 のキャラクタープロフィールを変更していません**。通常/覚醒の立ち絵および装飾画像は従来のままです。
- v1.3 の主な追加は `admin.html`、`admin.js`、`admin.css`、`safe-html.js`、`supabase-config.js` と、公開用 `app.js` の **異能道具・能力・使用技の記事読み込み**です。
- このZIPを **GitHub main に直接上書きしない**。正常版バックアップを維持し、`feature/supabase-admin-v13` などの別ブランチにアップロードして Vercel Preview でテストしてください。
- ユーザーのSupabaseに既に作成された `site_admins`、`site_entries`、`entry-images`、Storage RLS 4件を使います。追加SQLは通常不要です。

## STEP 1 — 接続情報を2か所だけ設定

1. ZIPを「すべて展開」する。
2. `supabase-config.js` をメモ帳またはVS Codeで開く。
3. Supabaseの **Project Settings → Data API → Project URL** をコピーし、`PASTE_SUPABASE_PROJECT_URL` に貼り付ける。`https://...supabase.co` 形式。
4. **Project Settings → API Keys → Publishable key** の `sb_publishable_...` をコピーし、`PASTE_PUBLISHABLE_KEY` に貼り付ける。
5. 保存する。**Secret key / service_role key / Database password / 管理者パスワードは絶対に書かない**。Publishable key は公開可能なキーだが、実際のアクセス可否はRLSで守る。

例（架空の値）：

```js
window.AMASAKI_SUPABASE = Object.freeze({
  url: 'https://exampleproject.supabase.co',
  publishableKey: 'sb_publishable_EXAMPLE_ONLY'
});
```

## STEP 2 — 別ブランチへアップロード

1. GitHub の `sakuseimiyako-png/Amazaki-character-site` を開く。
2. 左上の `main` ブランチボタンをクリック。`feature/supabase-admin-v13` と入力し **Create branch** で main から新規作成する。
3. **新ブランチを表示中であることを確認**。
4. `Add file` → `Upload files` で、ZIPの **中身全体** をドラッグしてアップロード（既存ファイルが上書き対象でも新ブランチなので問題ない）。
5. `Commit changes`。mainへの直接反映を避ける。
6. Vercelプロジェクトの Deployments からこのブランチの **Preview URL** を開く。Vercel設定で GitHub Preview deployments が有効である必要がある。

## STEP 3 — テスト

1. プレビューURL末尾に `/admin.html` を付ける。
2. Supabase Authentication に登録した **3つの管理者のうち1つ** でログイン。メールアドレスとパスワードは共有しない。
3. 編集画面で管理者になれているか確認。権限なしなら処理を止め、`site_admins` とRLSを見直す。
4. 初回は DB の記事が0件。ログイン後、画面最下部の **「元サイトの記事をDBへ初回取り込み」** を実行する。これは通常21件+能力10件+使用技10件、計41件＋公開モード判別用のシステム行1件を読み込む（内容は部分的に要約・未転記のまま）。既に1件でも入っていたら初回取り込みを止める。
5. 管理画面で異能道具などを1つ選び、画像/文章を編集し、公開状態で「記事を保存」。Preview の一般向けサイトへ戻り、**ログインせずに**反映されるか確認。
6. スマホでもメニュー・画像・文字を確認。**通常/覚醒の立ち絵とプロフィールが変わっていないことを確認**。
7. 保存前・保存後で「DB記事をJSON保存」。画像の実体はJSONに含まれないため、Storageから別途保管する。
8. 十分に検証してからプルリクエストをmainへマージ。Vercelの本番公開はmain更新によって行われる。

## API利用と公開設定

- `admin.html` は隠しページではなく **ログインによって保護される操作ページ**。UIの表示制限だけでなくSupabase RLSが書き込みを防ぐ。
- 一般閲覧者はログイン不要。Supabase `site_entries` では `published=true` の行だけ読める。
- **管理者のメールをGitHubの設定ファイルに書かない**。管理者の認可は `site_admins` に限定する。
- `entry-images` は Public bucket。画像はURLを知る誰でも読めるが、Storage RLSにより書き込みは管理者に限定する。
- 現在バケットのAllowed MIME Typesが **Any** になっているのが確認されている。Storage → `entry-images` → 設定/編集から `image/png`、`image/jpeg`、`image/webp` に限定することを推奨。ファイル上限20MBはそのままでよい。
- Supabase無料枠は稼働/容量/バックアップに制約がある。DBだけでなく画像の原本をPCと別の場所に保存すること。
- 初期移行時に `__AMASAKI_DB_READY__` という公開モード判別行を1件登録。これは画面に表示しないシステム行で、全記事を非公開にしてもクラウド表示に留まるためのもの。**この行をDBから消さないこと**。クラウドに記事がまだ1件もない間は元のJSONを表示する。
- 安全な完全ZIPバックアップ・原子的な全体復元・旧原文の全件転記は未完成。記事JSONは上書き・追加のみ（余分な記事は削除しない）。

## エラー時

- `Supabaseへの接続設定がまだです`：`supabase-config.js` 2か所未設定。
- `ログインできません`：メール/パスワードを確認。Authentication の `Confirm email` や状態も確認。
- `管理者権限がありません`：該当ユーザーのUIDが `site_admins` に登録されているか確認。
- 401/403：RLSまたはセッション期限の可能性。Secret keyを追加しない。
- 画像アップロード失敗：Storageポリシー4つ、Public bucket、画像形式、20MB制限を確認。
- 公開サイトが壊れた：mainは触らずPreviewだけなら影響なし。mainへの反映後ならGitHubの正常コミットへの復帰やVercelのRollbackで復旧。

## ファイルの役割

`index.html`/`styles.css`/`app.js` 公開サイト、`data/content.json` 初期データ、`assets/` 既存画像と動画、`admin.html`/`admin.css`/`admin.js` 管理画面、`safe-html.js` 装飾本文の厳格なHTML無害化、`supabase-config.js` 公開接続設定。

# 次のChatGPTへ — 物語之終幕 制作引き継ぎ v1.3

## ユーザー確定事項

- キャラサイト『物語之終幕』。主人公：天崎 恒／偽崎（山田 太郎）。元資料の通常・覚醒の説明を混同しない。
- 公開済みのv1.1はユーザーが5項目（ロード、スライド、メニュー、文章、覚醒切替）全て正常を確認し、GitHubのDownload ZIPでバックアップ済み。
- `CHARACTER PROFILE` は **今後変更しない**。先に作られたv1.2のプロフィール3択ギャラリーは **撤回**。元の通常立ち絵＋半透明装飾、覚醒立ち絵＋半透明装飾の4枚の組合せを維持。
- 管理編集するのは当面 **異能道具・能力・使用技** の記事名、本文、画像、追加/削除/順番/公開状態。画像は5:4。一般閲覧者ログイン不要。
- 全文のデータ初期転記は不完全。原文は昔のチャットにある。実装時は原文を正確に使い勝手に創作しない。
- 高品質な文章装飾・演出、JSON貼付による復旧と画像・動画を含むZIP完全復旧が最終目標。無料枠を優先する。

## サービス

- GitHub: `sakuseimiyako-png/Amazaki-character-site`。`main` は正常版の復帰ポイント。
- Vercel: GitHub main と連携済みで一般公開中。ログインしない人も閲覧可能。
- Supabase: Organization `Amasaki Archive`、Project `Amasaki-character-site`、Free、Singapore。
- Supabase SQLで `public.site_admins`, `public.site_entries` 作成済み。RLS：公開記事SELECT、管理者 CRUD。
- Supabase Auth users: ユーザー本人所有の3アカウント全てを `site_admins` に登録済み、`admin_count=3` と確認。メールアドレスを公開リポジトリに掲載しない。
- Auth Sign In/Providersで新規ユーザー登録OFFにした。
- Storage Public bucket: `entry-images`、20MB/file、MIME 現時点 Any。Storageオブジェクトの SELECT/INSERT/UPDATE/DELETE の管理者RLSポリシー4つ設定成功を画面で確認済み。
- API Keysの Publishable key を開いたところまで進んだ。**Secret / service_role は不要・禁止**。

## 今回生成したv1.3テスト実装

- ベースは元の **AMASAKI_DEPLOY_v1_1.zip**。以前のv1.2ギャラリーではない。
- `index.html`: 管理ログインリンクとscriptを追加、キャラプロフィールのHTML構造は不変。
- `app.js`: ユーザーが先に見ていた既存表示を保持し、公開済みクラウド記事があればSupabaseから異能道具・能力・使用技を描画する。
- `admin.html`/`admin.js`/`admin.css`: メール・パスワードでログイン→本人UIDを `site_admins` で照合→記事一覧・編集・保存・削除。文章装飾WYSIWYG（基本機能）と5:4画像中央トリミング（位置調整あり）、Storage WebPアップロード。初期ローカルデータを41行へ移植する操作あり。
- `safe-html.js`: 本文から危険なHTMLを取り除く。保存でも閲覧でも通す。
- `supabase-config.js`: Supabase Project URLと **Publishable key** をユーザーのPCで貼り付けてアップロードするテンプレート。secretを書かない。
- `README_導入手順.md`: testブランチ作成→設定→ZIP中身をupload→Vercel Preview→管理ログイン→DB取り込み→公開ページ確認の手順。
- 初回DB投入は実際のアカウント操作が必要。まだユーザーの環境へ一度もデプロイしていない。

## 重要な未完成・注意点

1. 既存記事に「詳細本文は元の会話を参照」などの省略がある。移植ツールはそれらをそのまま移すので、後で全文を手作業で正確に収録する。
2. 公開モード判別用のシステム行 `__AMASAKI_DB_READY__` を1件、初期登録時に作る。読者画面・管理記事一覧には表示しない。これをDBで手動削除した場合、全記事が非公開なら旧JSONへ戻る可能性がある。正式なsite_settings等への移行が今後の改善課題。
3. DBバックアップはJSON上書き・追加のみ。Storage画像の実体・全体アトミック復元・複数デバイス同期の確認は別作業。
4. 現在の画面はWYSIWYG基本装飾。Tiptap級の堅牢な拡張編集は次フェーズ。
5. 静的HTMLと公開可能なSupabaseキーなので、セキュリティは **必ずRLS** で担保する。キーを隠すだけでは権限制御にならない。
6. 公開前にブラウザから管理者3つのアカウントの権限をテスト、一般匿名で書込不可確認、スマホ/PC確認。

## 次のアクション

1. ZIPファイルをユーザーが保存し、2つの公開用接続情報だけをconfigに入力する（秘密鍵はチャットに送らせない）。
2. GitHubの別ブランチ（mainを維持）に配置、Vercel Previewで管理ログインテスト。
3. 画像・文章を少量テスト、JSONを書き出す。新規記事の表示とスマホの画面を確認。
4. 公開OKならPull Requestをmainへマージ。
5. その後、完全原文・バックアップ拡張・サムネイル等の調整。

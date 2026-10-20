# 次のチャッピーへ：物語之終幕 最終候補 v1.4 引き継ぎ

**これは今までの制作を継続するための優先仕様書。古いチャットの要約より、本ファイル・本人が直近で確定した要望・実ソースを優先する。**

## ユーザーの最新確定事項

- オリジナルキャラクター「天崎 恒／偽崎／山田太郎」のサイト『物語之終幕』。
- GitHub：`sakuseimiyako-png/Amazaki-character-site`。Vercelで一般公開。
- GitHub本番は`main`。管理画面のテストは`feature/supabase-admin-v13`。ユーザーは既に本番正常版ZIPバックアップを保持。
- Supabase Free プロジェクト：`Amasaki-character-site`、`Amasaki Archive`組織。`site_admins`に管理者3アカウント（個別メールは引き継ぎ文書やGitHubへハードコードしない）。`site_entries`・Storage `entry-images`あり。Storage画像の4ポリシーはSQL結果で確認済み。
- 閲覧者は **ログイン不要**。管理者のみ編集。URL `/admin.html` 自体は公開でも可だが、RLS必須。
- **CHARACTER PROFILEは触らない／通常・覚醒の立ち絵・半透明装飾画像を変更しない**。以前のv1.2画像切替要件は本人が撤回した。
- 編集したい本文は **異能道具・能力・使用技・WORLD ARCHIVE世界観・関係・都での歴史**。各項目で**編集・追加・削除・並べ替え・装飾・画像・公開設定**を可能にする。
- **プレビューは本物の公開ページのレイアウトを再利用し、保存前・非公開で確認できること。** PC・スマホ幅を切り替えられる。
- 画像は異能道具／能力／使用技 **5:4**、世界観／関係／歴史 **16:9**。
- できるだけ無料、高品質、事故防止とバックアップ重視。データ復旧の手順と引き継ぎ書を必ず残す。

## v1.4の変更点

- SQL `SQL_FIRST_RUN_v1_4.sql` で`site_entries.category`のcheckに`world/relation/history`を追加し、`site_section_state`テーブルとRLSを追加。既存のアカウントや記事を消さない。
- `admin.html/admin.css/admin.js`に6分類選択、世界観/関係/歴史のCRUD、16:9クロップ、本文の装飾、公開/下書き、公開レイアウトiframeプレビュー（PC/スマホ切替）、JSON backup v2（記事＋section state）。
- `app.js/styles.css`で世界観/関係/歴史のCloud読み込みと実際の表示、公開状態ごとの静的フォールバック制御、プレビューの未保存データ受信・差し込み表示。
- **プロフィールのindex.html／素材／`renderProfile()`はv1.3と同一。** 
- v1.3のログインシステムとPublishable key設定をそのまま使用。`supabase-config.js`にSecret key/service_roleを入れない。

## 最重要の導入順

1. **mainやv1.3テストブランチのZIP、および記事JSONを保存**。Storageの実体も別途保存。
2. `SQL_FIRST_RUN_v1_4.sql` をSupabase SQL Editorで実行し成功を確認（既存を消さない）。
3. 差分更新用`AMASAKI_v1_4_PATCH.zip`の `admin.html admin.js admin.css app.js styles.css` **5ファイルだけ**をGitHubの`feature/supabase-admin-v13`にアップロード・コミット。**`supabase-config.js`を上書きしない**。
4. Vercel Previewの`/admin.html`から既存管理者でログイン。未登録分類は「未登録の分類に元サイトの記事を取り込み」から移行。通常の本文全文は元の会話から未転記あり、勝手に創作しない。
5. WORLD ARCHIVE・関係・都の歴史、能力・道具・技の編集、プレビュー、下書き/公開、削除、RLS、匿名閲覧を検証後にのみmainへマージ。

## 重要な未完成/制約

- v1.4は作成・ローカル模擬テスト済みだが、**本人の本物のSupabase/Vercelでの最終テストと本番マージは未完了**。完成したと言い切らない。
- 管理JSONは画像パスを含むが、**Storageの画像実体と動画は含まない**。完全自動ZIPバックアップ・画像一括復元はまだ未実装。手動の3点バックアップを必須とする。
- `data/content.json`には設定全文が収録されていない（一部は要約・未転記）。原文に忠実に追記する。
- Previewで保存すると実際のSupabaseに書き込む。テストブランチと本番で同一DBの場合、**公開済みの記事変更は本番のDB内容に影響し得る**。まず未保存プレビューと下書きで検証。
- 旧v1.3の`__AMASAKI_DB_READY__`システム行がある場合は削除しない。v1.4は新しいsection stateを利用し、存在しても表示から除外する。

## 更新時の原則

ユーザーが許可していないプロフィール変更はしない。事前にバックアップ。人に見せる前にプレビュー。問題が起きたらmainをそのまま維持する。推測で設定を書き換えない。追加改善は差分として行い、引き継ぎ資料を更新する。

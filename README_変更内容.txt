変更内容（v1.4 表記修正）
・キャラクタープロフィールの英字表示：AMASAKI HISASHI → AMAZAKI KOU
・前回修正済みのヘッダー：AMAZAKI / ARCHIVE を維持
・変更対象：index.html の1ファイルのみ（文字列1か所だけ変更）

GitHubで反映する手順
1. 対象ブランチ（main / feature）を選ぶ
2. リポジトリ直下の index.html をこのファイルの中身に更新する
3. Commit changes を押す
4. Vercelの該当デプロイが Ready になったらプロフィール表記を確認

注意：v1.4の同じバージョンのindex.htmlを前提とする。ほかのファイルやSupabase設定を上書きしない。

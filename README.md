# noaa.jp（本体サイト）Cloudflare Pages セットアップ手順

LUCEのランディングページは、この本体サイトとは独立に `lp.noaa.jp`（別のPagesプロジェクト）
で運用します。この構成には含めていません。

## 構成
- `public/` サイト本体（いただいたzipの中身）
  - `public/admin/` お知らせ・ユーザーの声の編集画面（Decap CMS、今回追加）
  - `public/content/` 上の管理画面が編集するJSON（今回追加）
  - それ以外は、いただいたzipのままです
- `functions/api/contact.js` お問い合わせフォームの送信を受け取り、メール通知を送るPages Function（今回追加）
- `wrangler.toml` Cloudflareへの設定ファイル（今回追加）

## 1. Cloudflare Pagesでの設定
- ビルドコマンド：空欄のままでOK
- ビルド出力ディレクトリ：`public`

## 2. お問い合わせのメール通知（Resend経由）

`info@noaa.jp` は実際に使用中のメールアドレスのため、DNS・ドメイン移管を伴う
Cloudflare Email Routingは使わず、Resendという無料枠のあるメール送信サービスの
APIを直接呼び出す方式にしています。DNSやメールサーバーの設定には一切触れません。

1. https://resend.com/ でアカウントを作成（無料枠：1日100通・月3,000通まで）
2. 「API Keys」→「Create API Key」で、APIキーを発行する（権限は送信できればOK）
3. Cloudflare Pagesプロジェクトの「Settings」→「Environment variables」で、以下を追加
   - `RESEND_API_KEY` = 発行したAPIキー（種類は Secret / 暗号化 を選択）
4. `wrangler.toml` の環境変数はそのままでOK
   - `CONTACT_FROM_ADDRESS` は `onboarding@resend.dev`（Resendが用意している、
     ドメイン認証なしで使える送信元アドレス。noaa.jpのDNSに触れずに送信できます）
   - `CONTACT_TO_ADDRESS` は通知を受け取りたいアドレス（`info@noaa.jp`）
5. お問い合わせフォームから実際に送信し、`info@noaa.jp` に届くか確認する

※将来、送信元を `noreply@noaa.jp` のように自社ドメインにしたい場合は、
Resend側で数行のDNSレコード（SPF/DKIM）を追加する「ドメイン認証」が必要になります。
今回はそこまで求めていないため、`onboarding@resend.dev` のままにしています。

## 3. お問い合わせの蓄積・管理画面（/admin-inquiries/）

送信されたお問い合わせは、メール通知に加えてCloudflare D1（データベース）にも保存され、
専用の管理画面から一覧・ステータス管理ができます。

1. Cloudflareダッシュボードの「Workers & Pages」→「D1」→「Create database」で、
   データベース名 `noaa-inquiries` を作成する
2. 作成後に表示される「Database ID」を控え、`wrangler.toml` の
   `REPLACE_WITH_YOUR_D1_DATABASE_ID` をその値に書き換える
3. Pagesプロジェクトの「Settings」→「Functions」→「D1 database bindings」で、
   Variable name `DB` として、作成したデータベースを紐付ける
4. データベースにテーブルを作成する。ローカルに `wrangler` コマンドがあれば：
   ```
   npx wrangler d1 execute noaa-inquiries --remote --file=./schema.sql
   ```
   コマンドが使えない場合は、Cloudflareダッシュボードの D1 の「Console」タブから
   `schema.sql` の中身を直接貼り付けて実行してもOK
5. Pagesプロジェクトの「Settings」→「Environment variables」で、以下を追加
   - `ADMIN_PASSWORD` = 管理画面用の任意のパスワード（種類は Secret / 暗号化 を選択）
6. `実際のサイトURL/admin-inquiries/` にアクセスし、上記パスワードでログインできるか確認する

管理画面では、日時・氏名・連絡先・お住まい地域・メッセージが一覧表示され、
各行で「未対応／対応済み／クローズ」のステータス変更と、社内メモの記入・保存ができます。

## 4. お知らせ・ユーザーの声の管理画面（/admin/）

(a)/(b)の検討の結果、お知らせは content/news.json + 管理画面の方式で運用することになりました。
既存の40記事のメタデータは移行済みです。

管理画面（`/admin/`）にログインできるようにするには、GitHub側でOAuth Appの作成が必要です。

1. GitHubで https://github.com/settings/developers を開き、「New OAuth App」を作成
   - Application name: 任意（例: NOAA CMS）
   - Homepage URL: 実際のサイトURL（例: `https://noaa.jp`）
   - Authorization callback URL: `実際のサイトURL/api/callback`（例: `https://noaa.jp/api/callback`）
2. 作成後に表示される `Client ID` を控える。「Generate a new client secret」で `Client Secret` も発行して控える
3. Cloudflare PagesのプロジェクトSettings →「Environment variables」で、以下を追加
   - `GITHUB_CLIENT_ID` = 上記のClient ID
   - `GITHUB_CLIENT_SECRET` = 上記のClient Secret（暗号化を選択）
4. `public/admin/config.yml` の `base_url` を、`REPLACE_WITH_YOUR_SITE_DOMAIN` から実際のサイトURL
   （例: `https://noaa.jp`）に書き換える
5. 反映後、`実際のサイトURL/admin/` にアクセスし、「Login with GitHub」からログインできることを確認

認証用のコード（`functions/api/auth.js` / `functions/api/callback.js`）は、Pages Functionsとして
このリポジトリの中にすでに含まれているため、別途Workerを用意する必要はありません。

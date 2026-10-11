# NAGI 凪 — Privacy / プライバシー

更新日：2026-10-11

## 日本語

本アプリに登録、個人情報入力、メモ、広告はありません。言語だけをブラウザのlocalStorage（nagi.lang）へ保存します。自動停止時間・セッション状態は保存しません。

運営者がGoogle Analytics 4を有効にした場合（ビルド時にVITE_GA_IDを設定）、ページ閲覧、開始・停止操作、選択した自動停止時間がGoogleへ送信され、Cookie等が使われます。詳細は[Googleのポリシー](https://policies.google.com/technologies/partner-sites)を参照してください。測定IDを設定しない場合、解析スクリプトは読み込まれません。

旧版Stillの保存メモは、この版では読み取りも削除も行いません。同じURLで新版を利用する際、不要になった旧データはブラウザのサイトデータ削除機能で消せます。

Cloudflare等の配信事業者は、通常のサイト配信やセキュリティのためにIPアドレス・リクエスト情報等を処理する場合があります。アプリ自身の収集とは別です。

Wake LockとPiPはユーザーの開始操作で要求し、ブラウザとOSの判断に従います。端末の管理や監視からの不可視性を保証しません。

## English

NAGI has no accounts, personal-information forms, notes or advertising. Only the language preference is stored in localStorage as nagi.lang. Duration and session state are not persisted.

If the operator enables Google Analytics 4 (by setting VITE_GA_ID at build time), page views, start/stop actions and the chosen duration are sent to Google and cookies may be used. See [Google's policy](https://policies.google.com/technologies/partner-sites). Without a measurement ID, no analytics script is loaded.

Notes previously saved by Still are neither read nor deleted by this version. If you upgrade on the same origin, remove obsolete data through your browser’s site-data settings when desired.

Hosting providers such as Cloudflare may process IP addresses and request metadata for normal delivery and security. This is separate from collection by the app.

Wake Lock and PiP requests follow an explicit start action and remain subject to browser and OS restrictions. The app does not guarantee invisibility to device management or monitoring.

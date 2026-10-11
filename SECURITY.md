# HIRAKUのセキュリティ

## 方針

登録、広告、メモ入力、外部API、外部フォント、動画・音声、Service Workerはありません。解析はVITE_GA_ID設定時のみGoogle Analytics 4を読み込み、CSPでGoogleのドメインだけを許可します。言語設定のみ`nagi.lang`に保存します。自動停止時間とセッションは保存せず、リロード時の自動開始もしません。

旧Stillで明示保存したメモは本バージョンでは読み込み・編集・削除しません。不要になった旧データはブラウザのサイトデータ削除機能で消してください。共有PCで旧データが残っていないかは利用者側で確認できます。

## 対策

| 脅威 | 対策 |
|---|---|
| XSS | ユーザーHTML入力なし。Reactのテキスト描画。eval・innerHTML不使用 |
| 外部送信 | fetch/XHR/Beacon/WebSocket等なし。CSP connect-src 'none' |
| 外部コード | JS/CSS/画像は同一オリジン。外部CDNなし |
| インラインコード | unsafe-inline・unsafe-evalを許可しない。PiPも外部CSSリンク |
| クリックジャッキング | frame-ancestors 'none'とX-Frame-Options DENY |
| MIME誤認・リファラー | nosniff、no-referrer |
| 二重要求・停止後の復活 | コンテキストごとのpending・世代番号・期限確認 |
| 消し忘れ | 60分期限、PiP終了時停止、明確な小さい状態表示 |
| 無限再試行 | 非表示時は取得しない。拒否・解除後は再表示または明示開始で再試行 |
| 依存パッケージ | 固定バージョン・lockfile・npm audit |

## 権限・ヘッダー

Screen Wake LockとDocument PiPのみをユーザー操作に応じて要求します。カメラ・マイク・位置情報・画面共有・通知・クリップボード等は要求しません。

public/_headersのPermissions-Policyはscreen-wake-lockとpicture-in-pictureにselfを許可し、不要な強力機能を禁止します。CSPは同一オリジン資産だけ許可、接続・メディア・iframe・workerを禁止します。HTTPS／HSTS前提です。PiPとのWindow参照が必要なため、opener関係を切断する設定は追加していません。

静的構成検査済みですが、CloudflareでのHTTP応答・PiPへのCSP継承・ブラウザの施行は未検証です。開発サーバーでは本番ヘッダーは適用されません。

## 配信事業者・残るリスク

Cloudflare等はIPアドレス・リクエスト情報・通常ログを処理し得ます。運営者はWeb Analytics、Zaraz、広告等を追加しないでください。

Wake Lockは電力消費を増やし、自動ロック動作に影響し得ます。離席時は停止してください。企業管理や監視から隠す仕組み、在席偽装、ポリシー回避はありません。OSの実効性はAPIから確認できません。ブラウザやOSのクラッシュ時にJavaScript終了処理は保証されません。

脆弱性受付にはリポジトリ公開後にGitHub Private vulnerability reportingを設定できます。存在しない連絡先は掲載していません。監査結果はdocs/npm-audit.jsonを参照し、将来の未知の脆弱性がないことを意味しない点に留意してください。

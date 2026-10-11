# NAGI 凪 — 画面に、凪を。

Stillをシンプルに作り直したバージョン2です。名前は風が止み海が静まる「凪（なぎ）」から。時計・経過時間・カウントダウン・メモ・設定パネルを廃止し、操作を自動停止時間の選択と開始／停止に絞りました。

## 1. 使い方

1. 自動停止時間を選ぶ（15／30／60／90／120分／無期限、初期値60分）。
2. 「スリープ防止を開始」を押す。同じクリックで小さなPiPウィンドウが必ず開きます（PiP非対応環境では通常ページで要求）。
3. 終了するときは停止ボタン、またはPiPウィンドウの×を押します。

**選んだ時間で自動停止します（無期限は停止操作まで継続）。** 時計・残り時間表示はありません。時間は停止中に変更でき、保存されません。ブラウザはユーザー操作なしでPiPを開けないため、タブ切り替え時の自動PiPは実装できず、開始時に開きます。画面内に利用シーン（こんなときに）と使い方を表示しています。メイン側とPiP側の両方から停止できます。PiPを閉じた場合は、メイン側だけで続けずセッション全体を停止します。

## 2. デザイン

- 生成りの和紙色と墨、朱の落款風ロゴ、明朝体の見出し、縦書きの添え書き、静かな波線。画面下部に常に表示される、水平線・夕陽・水面の映りを描いた凪の情景（ダークモードでは月夜の海）。PiPにも同じ情景を小さく敷いています。映りはゆっくり揺らぎ、動きを減らす設定では静止します。
- PiPの要求サイズは**200×56px**（ブラウザの最小サイズに丸められる場合あり）。実際の最小サイズとウィンドウ枠はブラウザに依存します。
- PiPには凪の印・NAGIの名前・小さな点・■の停止ボタンと、背景に凪の情景を表示。画面共有で映っても機能名が見えないよう、状態の文言は読み上げ専用です。
- 点はアニメーションしません。状態が分かる程度の朱色で、動作中であることを隠しません。
- 配色はOSのライト／ダークに追従。配色メニューはありません。
- ヘッダーのJA／ENだけで言語変更。FAQ・ブラウザ情報・設定・「小さな作業スペース」等のメニューはありません。

会社の監視・管理からの不可視化、在席状態の偽装、ポリシー回避は実装していません。通常のWeb APIで表示維持を要求するだけです。

## 3. 技術構成

Vite / React / TypeScript / CSS。ランタイム依存はReactとReact DOMのみ。バックエンド、外部API、動画、音声、CDN、広告はありません。アクセス解析はGoogle Analytics 4に任意対応（`src/analytics.ts`）。`src/wake.ts`が各WindowのWake Lockを管理、`src/child.ts`がPiPを開閉、`src/model.ts`が言語・自動停止時間を管理します。辞書は`src/i18n.ts`です。

## 4. ローカル開発・ビルド

Node.js 24推奨。展開した`hiraku`フォルダで実行します。

```bash
npm ci
npm run dev
```

表示されたlocalhost URLを開きます。localhostなら対応ブラウザでWake Lock／PiPを利用できます。file://やLAN内IPのHTTPは対象外です。

```bash
npm run build
npm run preview
```

`dist/`が本番出力です。ZIPにもビルド済みdistを含めています。開発サーバーは0.0.0.0で待ち受けるため、ローカル専用にするならpackage.jsonの`--host 0.0.0.0`を削除してください。

## 5. テスト

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm audit
```

テストはjsdomでAPIを模擬します。実ブラウザやOSでのスリープ抑制を検証したことにはなりません。[TESTING.md](TESTING.md)を参照。

## 6. GitHubへのアップロード

空のリポジトリをGitHubで作成し、以下のURLを自分のものに変更します。

```bash
git init -b main
git add .
git commit -m "Add NAGI"
git remote add origin https://github.com/YOUR_NAME/nagi.git
git push -u origin main
```

既存リポジトリの場合はsrc・public・各設定・ドキュメントを新版に置き換えてcommit／pushします。旧ソースへファイルを重ねるより、必要なリポジトリ設定を残したうえで内容を置き換える方が不要な旧ファイルを残しません。node_modulesとdistは.gitignoreで除外しています。package-lock.jsonは含めます。認証情報はソースに書きません。

## 7. Cloudflare Pages

Git連携で公開し、以下を設定してください。

| 設定 | 値 |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | package.jsonのある場所。リポジトリ直下なら空欄 |
| Node.js | `24`（必要なら環境変数NODE_VERSION） |

`public/_headers`はdistへコピーされます。

**Workers（Workers Builds）で作成した場合**：デプロイコマンドが`npx wrangler deploy`になります。同梱の`wrangler.jsonc`が`dist`を静的アセットとして配信するため、そのまま動きます（`_headers`も適用されます）。

### Google Analytics 4

1. GA4でプロパティとWebデータストリームを作成し、測定ID（`G-XXXXXXX`）を控える。
2. Pagesなら Settings → Environment variables、Workersなら Settings → Build → **Build variables and secrets** に `VITE_GA_ID=G-XXXXXXX` を追加し、再デプロイ（ビルド時に埋め込まれるため、実行時の Variables では効きません）。ローカルでは`.env`に同じ行を書きます（`.env.example`参照）。
3. 未設定ならgtag.jsは読み込まれません。CSPは`_headers`でGoogleのドメインのみ許可済み。

送信イベント：ページビュー、`wake_start`（`minutes`：0は無期限、`pip`：1/0）、`wake_stop`。PiPウィンドウ内では計測しません。公開前に[PRIVACY.md](PRIVACY.md)の記載を確認してください。Zaraz等の他のスクリプト注入はCSPに合わないため有効にしないでください。本番ヘッダーの施行は公開後に確認します。Vite dev／previewは_headersを適用しません。

参考：[Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) / [Headers](https://developers.cloudflare.com/pages/configuration/headers/)。アプリに課金機能はありません。ホスティングの無料枠・制限は事業者の条件に従います。

## 8. 対応環境

[COMPATIBILITY.md](COMPATIBILITY.md)参照。Document PiP対応環境ではPiPを優先します。未対応またはオープン失敗時は通常ページで要求を試みます。通常ポップアップ機能は廃止しました。

Windows／Macの各ブラウザ、PiPの実寸・実際の表示状態、OSでのスリープ抑制は未検証です。

## 9. 技術上の制限

- PiPの存在ではなく、PiP自身のnavigatorから取得したSentinelの状態を使用。
- PiPで取得成功するまでメイン側の既存要求を保持し、成功後に移管。
- PiP内で拒否／解除された場合、表示中のメインページで要求できることがあります。
- 非表示Documentでは取得しません。拒否／解除時に無限再試行せず、表示復帰か停止→開始で再試行。
- 「要求中」はAPI側の取得を示し、OS動作の保証ではありません。
- 自動停止期限はDate.nowに基づき、メインとPiPから1秒周期で確認。JSが凍結した場合は復帰時に停止し、厳密な停止時刻は保証しません。
- 手動スリープ、ふたを閉じる操作、企業ポリシー、画面ロックやCPU稼働は保証・回避しません。
- メインページ終了／遷移、PiPの×、停止操作、期限到達で停止。再読み込みで自動開始しません。

## 10. プライバシーとセキュリティ

言語のみ`nagi.lang`へ保存（旧`hiraku.lang`も読み込み）。メモ機能はなく、他の状態は永続化しません。旧Stillの保存メモは勝手に削除・読み込みしません。同じURLで更新した場合に旧データを消すには、ブラウザ設定からサイトデータを削除してください。

個人情報送信はしていません。GA4はVITE_GA_ID設定時のみ有効です。配信事業者が通常の配信・セキュリティログを処理し得ます。詳細は[PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md)。

## 11. 既知の制限

実機・モバイル表示・スクリーンリーダー・本番CSP継承は未検証。サイズ指定はブラウザに調整されることがあります。自動停止はJSの実行機会に依存します。名称の商標・ドメイン空き状況は確認していません。

## 12. 検証用ページと改善案

`/probe/`には各WindowのAPIを独立して調べる開発用ページを残しています。通常画面からはリンクせず、動画・通信・ログ保存は使いません。今後は実機テスト表とアクセシビリティ確認を充実させ、操作メニューを増やさず改善します。

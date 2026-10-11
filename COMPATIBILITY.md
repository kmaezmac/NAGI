# HIRAKU — 互換性と検証結果

調査日：2026-10-10。**以下の「API対応」は公式資料の記載であり、本アプリの実機テスト結果ではありません。** 実行時はUA文字列を使わず、APIの存在、安全なコンテキスト、実際の取得結果、表示状態で判断します。

| 環境 | Screen Wake Lock | Document PiP | 本アプリの実機確認 | PiP内取得・他アプリ作業中維持 | OS消灯／スリープ抑制 |
|---|---|---|---|---|---|
| Windows + Chrome | 提供あり | 116以降・デスクトップ | 未検証 | 未検証 | 未検証 |
| Windows + Edge | Chromium系で提供 | 116以降（Chrome公式対応表） | 未検証 | 未検証 | 未検証 |
| Windows + Firefox | 126以降 | **151以降・デスクトップ** | 未検証 | 未検証 | 未検証 |
| macOS + Chrome | 提供あり | 116以降・デスクトップ | 未検証 | 未検証 | 未検証 |
| macOS + Safari | 16.4以降 | 調査資料では未対応 | 未検証 | 対応確認なし | 未検証 |
| macOS + Firefox | 126以降 | **151以降・デスクトップ** | 未検証 | 未検証 | 未検証 |
| OperaなどChromium系 | ビルド・設定ごとに検出 | ビルド・設定ごとに検出 | 未検証 | 未検証 | 未検証 |
| Android / iOS等 | API検出で判断 | デスクトップとの同等性を仮定しない | 未検証 | 未検証 | 未検証 |

旧版FirefoxやESRでは151未満でPiPが利用できない場合があります。OS・ブラウザの更新、企業管理、ユーザー設定、省電力状態によって取得は拒否され得ます。

## 採用する順序

1. Document PiPが開け、PiP自身のnavigatorで取得成功 → PiP側を要求元にする。
2. PiP側が拒否・未対応・解除 → 表示中のメイン側で要求する。
3. Document PiPがない → 通常ページでWake Lockを提供。
4. Wake Lockもなければ制限を表示して開始ボタンを無効化。通常ポップアップは提供しません。

## 証拠の段階

| 表示・観測 | 分かること | 分からないこと |
|---|---|---|
| APIあり | APIプロパティ・メソッドが存在する | 取得許可、取得後の維持 |
| Sentinel保持／要求中 | requestが解決し、released=falseのSentinelを保持 | OSが要求を実際に適用したか |
| releaseイベント | 当該Sentinelが解除された | OS／ブラウザ内部の詳細な理由 |
| Documentがvisible | ブラウザが可視状態と判定 | 将来の可視性、CPU継続稼働 |
| 実機の画面が指定時間後も点灯 | 記録した設定でその試行に成功 | 全条件・全端末での成功 |

## 最小検証と判断

`public/probe/`はメインとPiPのAPI呼び出しを独立して確認するページです。React portal内で実行しているだけではPiPのDocumentに要求したことにならないため、**必ずpipWindow.navigator.wakeLock**を使います。

本開発環境では対応するGUIブラウザ操作が利用できず、実PiPを使った最小検証は実施できませんでした。WindowとSentinelを模擬した自動テストでは、PiP優先、mainへの切り替え、非表示の取得禁止、非同期競合、pagehide処理を確認しています。これを実機成功と扱いません。

## 公式参照

- [W3C Screen Wake Lock（2026-09-29 Working Draft）](https://www.w3.org/TR/screen-wake-lock/)
- [WICG Document Picture-in-Picture仕様](https://wicg.github.io/document-picture-in-picture/)
- [Chrome公式 Document PiP・互換性表示](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)
- [Firefox 126開発者向けリリースノート](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)
- [Firefox 151開発者向けリリースノート](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151)
- [Firefox 151公式リリースノート](https://www.firefox.com/firefox/151.0/releasenotes/)
- [Apple Safari 16.4リリースノート](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)

API仕様は更新中のものを含みます。固定のブラウザ名による許可／禁止リストは実装していません。

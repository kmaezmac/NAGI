# HIRAKU v2 実装記録

## UIの削減

時計、ストップウォッチ、カウントダウン、メモ、テーマ選択、時間選択、FAQ、通常ポップアップ、診断パネルを削除。言語ボタン、PiPチェック、開始／停止、短い状態表示だけを提供します。

PiP要求サイズは240×110px。ブラウザ枠や最小サイズは制御しません。点は点滅せず、Sentinelがあれば控えめな朱色。偽装タイトルやOSのUIを模した表示は行いません。

## 起動・終了

開始クリックでmodel.startWake()を同期的に呼び、続けてrequestWindowを呼びます。メインのWake Lock完了をawaitしないので、PiPのユーザーアクティベーションを保持します。

非同期requestWindow中も停止を受け付け、世代を無効化。遅れて開いたウィンドウは閉じます。PiPが開けなければメイン側の要求を継続し、エラーを表示。停止後の古い失敗は表示しません。

PiP内の取得を優先。取得失敗・予期せぬ解除時は表示中のmainを試します。PiPウィンドウ自体を閉じた場合は、先にwake.stop()を呼んでからdetachし、メインへの不要な再取得を防ぎます。

60分の固定期限をDate.nowで管理。mainとPiPの1秒周期、およびvisibilitychangeで確認します。期限切れはロックだけでなくPiPも閉じます。JS凍結時は復帰時の処理になるため、厳密な停止保証はありません。

## セキュリティ・検証

元のWakeCoordinatorの競合制御とCSPを維持。永続化は言語のみ。旧メモは破壊しません。React portalで同じ状態を両ウィンドウへ描画し、同一オリジンのCSSを使います。

自動テストはWindowとSentinelの模擬であり、実PiP・OSのスリープや可視状態を確認するものではありません。GUIブラウザ操作が利用できず、実機・スクリーンショット確認は未実施です。

## 参照仕様

- https://www.w3.org/TR/screen-wake-lock/
- https://wicg.github.io/document-picture-in-picture/
- https://developer.chrome.com/docs/web-platform/document-picture-in-picture
- https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151
- https://developers.cloudflare.com/pages/configuration/headers/

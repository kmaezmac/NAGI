const en = {
  title: 'Let your screen rest, awake.', subtitle: 'Still as a windless sea — only as long as you need.', start: 'Keep awake', stop: 'Stop',
  useTitle: 'For moments like these', use1: 'Keeping slides or documents on screen during an online meeting or screen share.', use2: 'Watching a long export, render, build or large upload finish.', use3: 'Leaving a dashboard, log or monitor view up on a desk or wall display.', use4: 'Reading a long manual or spec while working with your hands elsewhere.',
  howTitle: 'How it works', how1: 'Pick a duration and start. A small PiP window opens.', how2: 'The PiP window floats above other tabs and apps, keeping the screen awake while you work elsewhere.', how3: 'Stop from the PiP window or this page. Closing the PiP window also stops.', howNote: 'Browsers do not allow PiP to open by itself when you switch tabs, so it opens when you press start.',
  idle: 'Ready', active: 'Wake lock requested', pending: 'Requesting…', waiting: 'Waiting for visibility', failed: 'Request not active',
  duration: 'Auto stop', minutes: '{n} min', unlimited: 'No limit', limit: 'Stops automatically after {n} minutes.', limitNone: 'Runs until you stop it.', note: 'Your device decides whether the request is applied.',
  pipUnavailable: 'PiP is unavailable in this browser. Keep this page visible.', pipFailed: 'PiP could not open. Using this page where possible. Stop and start to retry.',
  released: 'The browser released or declined a request. Stop and start to retry.',
  unsupported: 'Screen Wake Lock is unavailable. Use HTTPS and a supported browser.',
  storageError: 'The language preference could not be saved in this browser.',
  language: 'Language', skip: 'Skip to controls',
  stoppingFailed: 'Release could not be confirmed. Close this page.',
} as const;
export type TextKey = keyof typeof en;
const ja: Record<TextKey, string> = {
  title: '画面に、凪を。', subtitle: '風のない海のように、必要な間だけ静かに保ちます。', start: 'スリープ防止を開始', stop: '停止する',
  useTitle: 'こんなときに', use1: 'オンライン会議や画面共有で、資料を表示したまま話したいとき。', use2: '動画の書き出しやビルド、大きなファイルのアップロード完了を待つとき。', use3: 'ダッシュボードやログ、監視画面を出しっぱなしにしておきたいとき。', use4: 'マニュアルや仕様書を開いたまま、手元の作業を進めたいとき。',
  howTitle: '使い方', how1: '時間を選んで開始すると、小さなPiPウィンドウが開きます。', how2: 'PiPは他のタブやアプリの上に浮かび続け、別の作業中も画面をスリープさせません。', how3: '停止はPiPかこのページのボタンから。PiPを閉じても停止します。', howNote: 'ブラウザの制限により、タブ切り替え時にPiPを自動で開くことはできません。そのため開始と同時に開きます。',
  idle: '待機中', active: 'スリープ防止を要求中', pending: '取得を試みています', waiting: 'ページの再表示を待機中', failed: '現在、要求できていません',
  duration: '自動停止', minutes: '{n}分', unlimited: '無期限', limit: '{n}分で自動停止します。', limitNone: '停止するまで続けます。', note: '実際の動作はOS・ブラウザの判断に従います。',
  pipUnavailable: 'このブラウザではPiPを使えません。このページを表示したままご利用ください。', pipFailed: 'PiPを開けませんでした。可能な場合はこのページで要求を続けます。再試行は一度停止してから開始してください。',
  released: 'ブラウザが要求を解除・拒否しました。再試行する場合は一度停止してから開始してください。',
  unsupported: 'Screen Wake Lockを利用できません。HTTPSと対応ブラウザでご利用ください。',
  storageError: 'ブラウザの保存領域にアクセスできず、言語設定を保存できません。',
  language: '表示言語', skip: '操作へ移動',
  stoppingFailed: '解除を確認できません。ページを閉じてください。',
};
export const dictionary = { ja, en };

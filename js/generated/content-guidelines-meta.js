"use strict";
/* AUTO-GENERATED from design/content-guidelines.json. */
const CONTENT_META={
  "locale": {
    "default": "ja-JP",
    "fallback": "en",
    "policy": "Meaningとtask outcomeをlocale間で一致させる。語順、長さ、plural、日付、数値を英語から直訳せずlocaleごとに自然な文として設計する。"
  },
  "voice": [
    {
      "id": "clear",
      "attribute": "明快",
      "means": "最初に結論または必要なactionを置き、具体的な名詞と動詞を使う。",
      "avoid": "曖昧な代名詞、technical jargon、不要な前置き。"
    },
    {
      "id": "calm",
      "attribute": "落ち着き",
      "means": "成功でもerrorでも事実と次のstepを同じ温度で伝える。",
      "avoid": "大げさな称賛、過剰な謝罪、冗談、恐怖をあおる表現。"
    },
    {
      "id": "respectful",
      "attribute": "尊重",
      "means": "利用者を責めず、選択とcontrolを明示し、inclusiveな語彙を使う。",
      "avoid": "能力や知識の決めつけ、命令的な威圧、難易度の断定。"
    },
    {
      "id": "precise",
      "attribute": "正確",
      "means": "対象、結果、制約、期間、取消可否を必要な範囲で明示する。",
      "avoid": "成功を保証する表現、根拠のないcertainty、generic status。"
    }
  ]
};
const CONTENT_RULES=[
  {
    "id": "user-task-first",
    "category": "voice",
    "appliesTo": "Heading、description、onboarding、help",
    "rule": "Systemの内部都合ではなく、利用者のtaskと対象から書き始める。",
    "rationale": "読む前に自分に必要な内容か判断できるようにするため。",
    "do": [
      "通知を受け取るチャンネルを選択",
      "プロジェクトへのメンバーアクセスを管理"
    ],
    "dont": [
      "Webhook configuration",
      "User management module"
    ]
  },
  {
    "id": "front-load-and-scan",
    "category": "voice",
    "appliesTo": "UI text、heading、table、notification",
    "rule": "結論、対象、actionを先に置き、1文1目的を基本にする。",
    "rationale": "全文を読まなくてもscanで判断でき、翻訳もしやすくするため。",
    "do": [
      "API keyの期限が切れました。新しいkeyを作成してください。"
    ],
    "dont": [
      "処理を続行しようとしたところ、使用中のAPI keyに関する問題が見つかりました。"
    ]
  },
  {
    "id": "canonical-terminology",
    "category": "voice",
    "appliesTo": "Navigation、action、status、docs、contract",
    "rule": "1 conceptに1つのcanonical termを使い、同じflow内で言い換えない。",
    "rationale": "人間、翻訳、検索、AIが同じ対象を識別できるようにするため。",
    "do": [
      "作成 → 作成しました",
      "公開 → 公開しました"
    ],
    "dont": [
      "作成 → 追加しました",
      "公開 → リリース完了"
    ]
  },
  {
    "id": "plain-specific-language",
    "category": "voice",
    "appliesTo": "全UI copy",
    "rule": "短く一般的な語を使い、必要なtechnical termは定義またはcontextを付ける。",
    "rationale": "専門知識、認知負荷、翻訳品質への依存を減らすため。",
    "do": [
      "write権限を追加",
      "もう一度読み込む"
    ],
    "dont": [
      "権限スコープを適切にreconfigure",
      "再度イニシャライズ"
    ]
  },
  {
    "id": "action-label-outcome",
    "category": "actions",
    "appliesTo": "Button、menu item、link、command",
    "rule": "Action labelは動詞と必要な対象で結果を予測できるようにする。Contextで対象が明白なら短縮できる。",
    "rationale": "実行前に結果を理解し、同じ画面のactionを区別できるようにするため。",
    "do": [
      "変更を保存",
      "メンバーを招待",
      "再試行"
    ],
    "dont": [
      "OK",
      "Submit",
      "実行"
    ]
  },
  {
    "id": "destructive-label-exact",
    "category": "actions",
    "appliesTo": "Danger button、confirmation、menu item",
    "rule": "破壊的actionは対象と操作を同じ語で明示し、genericな確認語に置き換えない。",
    "rationale": "誤操作を減らし、confirmation前後の意味を一致させるため。",
    "do": [
      "プロジェクトを削除",
      "API keyを失効"
    ],
    "dont": [
      "はい",
      "続行",
      "確定"
    ]
  },
  {
    "id": "cancel-means-no-change",
    "category": "actions",
    "appliesTo": "Dialog、form、flow",
    "rule": "取消で変更を保存しない場合は「キャンセル」を使い、戻る/閉じる/後で行うと混同しない。",
    "rationale": "Navigationとdata mutationの結果を予測可能にするため。",
    "do": [
      "キャンセル",
      "保存せず閉じる"
    ],
    "dont": [
      "戻る",
      "閉じる"
    ]
  },
  {
    "id": "error-problem-and-recovery",
    "category": "states",
    "appliesTo": "Validation、service error、permission error",
    "rule": "何が起きたか、どこか、利用者ができる修正または次のstepを具体的に示す。",
    "rationale": "Errorから自力で回復でき、責任の所在を誤認しないようにするため。",
    "do": [
      "メールアドレスに@を含めてください。",
      "プロジェクトを保存できませんでした。接続を確認して再試行してください。"
    ],
    "dont": [
      "エラーが発生しました。",
      "不正な値です。",
      "あなたの入力が間違っています。"
    ]
  },
  {
    "id": "success-confirm-result",
    "category": "states",
    "appliesTo": "Toast、banner、inline status",
    "rule": "完了が画面変化だけでは分かりにくい場合に、対象と完了結果を過去形で伝える。",
    "rationale": "Task completionを確認でき、同じactionの再実行を防ぐため。",
    "do": [
      "プロジェクトを作成しました。",
      "変更を保存しました。"
    ],
    "dont": [
      "成功!",
      "操作が正常に完了しました。"
    ]
  },
  {
    "id": "empty-state-next-step",
    "category": "states",
    "appliesTo": "Empty state、zero result、first use",
    "rule": "何がないか、なぜ見えるか、可能な次のstepをcontextに応じて示す。",
    "rationale": "System failureとempty resultを区別し、taskを開始または条件修正できるようにするため。",
    "do": [
      "プロジェクトはまだありません。最初のプロジェクトを作成してください。",
      "条件に一致するIssueはありません。フィルターを変更してください。"
    ],
    "dont": [
      "データがありません。",
      "ここには何もありません。"
    ]
  },
  {
    "id": "confirmation-consequence",
    "category": "states",
    "appliesTo": "Confirmation dialog、high-impact action",
    "rule": "Titleにactionと対象、bodyに直接の結果と取消可否、primary actionに同じ動詞を使う。",
    "rationale": "確認画面を読んだ時点で影響範囲と安全な選択を判断できるようにするため。",
    "do": [
      "「Meridian Docs」を削除 / 関連dataも削除され、取り消せません / Projectを削除"
    ],
    "dont": [
      "本当によろしいですか? / はい"
    ]
  },
  {
    "id": "loading-object-and-progress",
    "category": "states",
    "appliesTo": "Spinner、progress、long-running task",
    "rule": "必要な場合は何を処理中かを現在進行で示し、既知ならprogressまたは残りstepを伝える。",
    "rationale": "停止と進行を区別し、待つか中断するか判断できるようにするため。",
    "do": [
      "Repositoryを解析中",
      "3 / 5 filesをupload中"
    ],
    "dont": [
      "Loading...",
      "処理中"
    ]
  },
  {
    "id": "permission-explain-path",
    "category": "states",
    "appliesTo": "Permission、disabled action、plan restriction",
    "rule": "実行できない理由と、権限request、owner連絡、plan変更など可能な経路を示す。",
    "rationale": "行き止まりと責任の押し付けを避けるため。",
    "do": [
      "プロジェクトを削除する権限がありません。オーナーに権限を依頼してください。"
    ],
    "dont": [
      "Forbidden",
      "この操作はできません。"
    ]
  },
  {
    "id": "visible-label-required",
    "category": "forms",
    "appliesTo": "Input、select、textarea、search",
    "rule": "Labelは常時表示し、placeholderは短い入力例または補足だけに使う。",
    "rationale": "入力後も要件を確認でき、translationやspeech inputでfieldを識別するため。",
    "do": [
      "ラベル: メールアドレス / 入力例: name@example.com"
    ],
    "dont": [
      "Placeholderだけで Email address (必須)"
    ]
  },
  {
    "id": "instructions-before-input",
    "category": "forms",
    "appliesTo": "Format、constraint、required、sensitive input",
    "rule": "利用者が入力を始める前に必要なformat、範囲、用途を示す。",
    "rationale": "Submit後のerrorと再入力を減らすため。",
    "do": [
      "8文字以上。英字と数字を含めてください。"
    ],
    "dont": [
      "Passwordが条件を満たしません。"
    ]
  },
  {
    "id": "punctuation-by-container",
    "category": "format",
    "appliesTo": "Label、button、heading、body、message",
    "rule": "短いlabel/button/headingには句点を付けず、複数文や完全な説明文にはlocaleの句読点を使う。",
    "rationale": "Containerの役割と読み上げの区切りを一貫させるため。",
    "do": [
      "変更を保存",
      "変更を保存しました。次の画面へ進めます。"
    ],
    "dont": [
      "変更を保存。",
      "保存しました 次へ進めます"
    ]
  },
  {
    "id": "localized-number-date-time",
    "category": "format",
    "appliesTo": "Number、currency、unit、date、time、relative time",
    "rule": "Intl相当のlocale-aware formatterを使い、曖昧な日付を避け、relative timeには必要に応じてabsolute valueを補う。",
    "rationale": "Localeごとの桁、currency、calendar、timezoneの誤読を防ぐため。",
    "do": [
      "2026年7月13日 14:30 JST",
      "5分前 (14:30)"
    ],
    "dont": [
      "07/13/26",
      "5 mins ago"
    ]
  },
  {
    "id": "no-string-concatenation",
    "category": "localization",
    "appliesTo": "Translated UI string、count、name insertion",
    "rule": "Sentenceをfragment連結せず、placeholderを含む完全なmessage単位で翻訳する。",
    "rationale": "語順、助詞、plural、genderがlocaleで変わっても自然な文を作るため。",
    "do": [
      "{count}件のIssueを選択しました"
    ],
    "dont": [
      "count + '件の' + item + 'を選択' "
    ]
  },
  {
    "id": "flexible-content-length",
    "category": "localization",
    "appliesTo": "Button、tab、navigation、table、dialog",
    "rule": "Text lengthを固定前提にせず、wrap、reflow、overflow policyをcomponent contractに持たせる。",
    "rationale": "翻訳で長くなるlabelや日本語の折返しでもcontentを失わないため。",
    "do": [
      "Button labelを必要に応じてwrapしcontainerを広げる"
    ],
    "dont": [
      "固定widthでellipsisしaction名を隠す"
    ]
  },
  {
    "id": "descriptive-accessible-label",
    "category": "accessibility",
    "appliesTo": "Link、icon button、image alt、heading",
    "rule": "文脈外でも目的を特定できるvisible/accessibility labelを使い、visible labelをaccessible nameに含める。",
    "rationale": "Link list、voice control、screen readerで対象を識別するため。",
    "do": [
      "Billing設定を開く",
      "通知を閉じる"
    ],
    "dont": [
      "こちら",
      "詳細",
      "閉じる"
    ]
  },
  {
    "id": "ai-disclosure-and-scope",
    "category": "ai",
    "appliesTo": "AI action、generated content、agent status",
    "rule": "AIを使う場所、できること、主要な制約をtaskの前またはoutput近傍で明示する。",
    "rationale": "人間作成と誤認させず、適切な期待と利用判断を作るため。",
    "do": [
      "AIが要約しました。内容を確認してから共有してください。"
    ],
    "dont": [
      "専門家が確認済み",
      "必ず正しい回答です"
    ]
  },
  {
    "id": "ai-uncertainty-and-recovery",
    "category": "ai",
    "appliesTo": "AI output、recommendation、automation",
    "rule": "Uncertaintyや失敗可能性をriskに応じて示し、review、edit、retry、undo、non-AI fallbackを提供する。",
    "rationale": "Automation biasと不可逆な誤操作を減らし、人が最終controlを保つため。",
    "do": [
      "候補として生成しました。差分を確認して適用してください。"
    ],
    "dont": [
      "最適な設定を自動で適用しました。"
    ]
  },
  {
    "id": "ai-data-transparency",
    "category": "ai",
    "appliesTo": "Prompt、upload、personal data、server model",
    "rule": "送信するdata、用途、保存、training利用、第三者共有をaction前に簡潔かつ具体的に示す。",
    "rationale": "利用者がdata共有を理解して選択できるようにするため。",
    "do": [
      "選択したファイルを要約のためサーバーへ送信します。学習には使用しません。"
    ],
    "dont": [
      "続行すると規約に同意したものとみなします。"
    ]
  }
];
const CONTENT_PATTERNS=[
  {
    "id": "error",
    "requiredParts": [
      "対象または場所",
      "問題",
      "修正方法または次のstep"
    ],
    "example": "API keyの期限が切れました。新しいkeyを作成してください。",
    "avoid": "エラーが発生しました。"
  },
  {
    "id": "success",
    "requiredParts": [
      "対象",
      "完了したaction"
    ],
    "example": "プロジェクトを作成しました。",
    "avoid": "操作が正常に完了しました。"
  },
  {
    "id": "empty",
    "requiredParts": [
      "ない対象",
      "理由またはcontext",
      "次のstep"
    ],
    "example": "条件に一致するIssueはありません。フィルターを変更してください。",
    "avoid": "データがありません。"
  },
  {
    "id": "confirmation",
    "requiredParts": [
      "actionと対象",
      "直接の結果",
      "取消可否",
      "同じ動詞のprimary label"
    ],
    "example": "「Meridian Docs」を削除します。関連dataも削除され、取り消せません。",
    "avoid": "本当によろしいですか?"
  },
  {
    "id": "loading",
    "requiredParts": [
      "処理中の対象",
      "既知ならprogressまたは残りstep"
    ],
    "example": "Repositoryを解析中 (2 / 4)",
    "avoid": "Loading..."
  },
  {
    "id": "permission",
    "requiredParts": [
      "実行できないaction",
      "理由",
      "利用可能な経路"
    ],
    "example": "プロジェクトを削除する権限がありません。オーナーに権限を依頼してください。",
    "avoid": "Forbidden"
  },
  {
    "id": "ai-output",
    "requiredParts": [
      "AI利用の明示",
      "必要なreviewまたは制約",
      "edit/retry/undoの選択"
    ],
    "example": "AIが変更案を生成しました。差分を確認してから適用してください。",
    "avoid": "最適な変更を作成しました。"
  }
];
const CONTENT_TERMS=[
  {
    "concept": "project",
    "ja": "プロジェクト",
    "en": "Project",
    "avoid": [
      "案件",
      "Project",
      "ワークスペース"
    ]
  },
  {
    "concept": "workspace",
    "ja": "ワークスペース",
    "en": "Workspace",
    "avoid": [
      "作業領域",
      "Workspace",
      "プロジェクト"
    ]
  },
  {
    "concept": "member",
    "ja": "メンバー",
    "en": "Member",
    "avoid": [
      "Member",
      "User",
      "利用者"
    ]
  },
  {
    "concept": "settings",
    "ja": "設定",
    "en": "Settings",
    "avoid": [
      "環境設定",
      "Preferences"
    ]
  },
  {
    "concept": "create",
    "ja": "作成",
    "en": "Create",
    "avoid": [
      "新規",
      "追加"
    ]
  },
  {
    "concept": "delete",
    "ja": "削除",
    "en": "Delete",
    "avoid": [
      "消去",
      "Remove"
    ]
  },
  {
    "concept": "remove",
    "ja": "外す",
    "en": "Remove",
    "avoid": [
      "削除"
    ]
  },
  {
    "concept": "save",
    "ja": "保存",
    "en": "Save",
    "avoid": [
      "適用",
      "確定"
    ]
  },
  {
    "concept": "cancel",
    "ja": "キャンセル",
    "en": "Cancel",
    "avoid": [
      "戻る",
      "閉じる"
    ]
  },
  {
    "concept": "retry",
    "ja": "再試行",
    "en": "Retry",
    "avoid": [
      "再実行",
      "もう一度"
    ]
  },
  {
    "concept": "issue",
    "ja": "Issue",
    "en": "Issue",
    "avoid": [
      "Task",
      "Ticket"
    ]
  },
  {
    "concept": "ai-generated",
    "ja": "AIが生成",
    "en": "Generated by AI",
    "avoid": [
      "自動作成",
      "Smart"
    ]
  }
];
const CONTENT_QUALITY_GATES=[
  {
    "id": "task-clarity",
    "checks": [
      "対象とactionが明確",
      "1 concept 1 term",
      "generic label/messageがない",
      "resultと取消可否が分かる"
    ]
  },
  {
    "id": "state-completeness",
    "checks": [
      "Loading、empty、error、success、permissionを定義",
      "Errorにrecoveryがある",
      "Inputを不必要に消さない"
    ]
  },
  {
    "id": "accessibility-language",
    "checks": [
      "Visible labelがaccessible nameに含まれる",
      "Link/icon labelが文脈外でも特定可能",
      "色やiconだけで意味を伝えない"
    ]
  },
  {
    "id": "localization-readiness",
    "checks": [
      "String fragmentを連結しない",
      "Locale-aware number/date formatter",
      "Text expansionとwrap",
      "翻訳対象外termを管理"
    ]
  },
  {
    "id": "ai-transparency",
    "checks": [
      "AI利用を明示",
      "Capabilityとlimitationを伝える",
      "Review/edit/retry/undoを提供",
      "Data useをaction前に説明"
    ]
  }
];

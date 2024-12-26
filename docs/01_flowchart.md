## アプリケーション上位フローチャート

---

### 1. ログイン・認証

```mermaid

sequenceDiagram
    participant 管理UI
    participant APIサーバ
    管理UI->>APIサーバ: (1) ログイン・認証要求 (email, password)
    APIサーバ-->>管理UI: JWT発行 (認証成功時)

```

- 管理UIからAPIサーバへ **メールアドレス(`email`)とパスワード** を送信し、認証を要求します。
- APIサーバは送信された `email` と `password` を検証し、認証に成功すればJWTを発行して管理UIに返します。

---

### 2. トップページ表示・メニュー選択

```mermaid
sequenceDiagram
    participant 管理UI
    管理UI->>管理UI: (2) トップページ表示、メニュー選択

```

- 認証後、管理UIはトップページを表示し、ユーザーはメニューから操作を選択します。

---

### 3. 会員登録画面へ遷移

```mermaid
sequenceDiagram
    participant 管理UI
    管理UI->>管理UI: (3)「会員登録」画面へ遷移

```

- ユーザーが会員管理機能から「会員登録」画面へ遷移します。

---

### 4. 会員登録処理

```mermaid
sequenceDiagram
    participant 管理UI
    participant APIサーバ
    管理UI->>APIサーバ: (4)「登録」ボタン押下 -> /members POST
    APIサーバ->>APIサーバ: 入力検証 (class-validator)
    APIサーバ->>APIサーバ: 組織整合性チェック (introducer_id, ...)
    APIサーバ->>MySQL: DB登録 (members, member_positions)
    APIサーバ-->>管理UI: 登録完了レスポンス

```

- 管理UIで入力された会員情報がAPIサーバへ送信されます。
- APIサーバは入力検証と組織整合性チェックを行い、問題がなければDBに会員情報を登録します。
- 登録完了後、レスポンスを管理UIへ返します。

---

### 5. 会員登録完了表示

```mermaid
sequenceDiagram
    participant 管理UI
    管理UI->>管理UI: (5) 結果表示「会員ID:xxx登録完了」

```

- 管理UIは登録完了メッセージを表示します。

---

### 6. 会員検索処理

```mermaid
sequenceDiagram
    participant 管理UI
    participant APIサーバ
    管理UI->>管理UI: 会員検索画面へ遷移
    管理UI->>APIサーバ: (6) 検索条件入力 -> GET /members?query=...
    APIサーバ->>MySQL: DB検索 (members, member_positions)
    APIサーバ-->>管理UI: 検索結果リストJSON
    管理UI->>管理UI: 検索結果表示

```

- ユーザーが会員検索画面で検索条件を入力し、APIサーバへ検索リクエストを送信します。
- APIサーバはDBを検索し、結果をJSON形式で管理UIへ返します。
- 管理UIは検索結果を表示します。

---

### 7. 会員詳細情報閲覧

```mermaid
sequenceDiagram
    participant 管理UI
    participant APIサーバ
    管理UI->>管理UI: (7) 対象会員選択し詳細閲覧
    管理UI->>APIサーバ: 基本情報タブ: GET /members/{id}
    APIサーバ->>MySQL: DB照会
    APIサーバ-->>管理UI: 会員基本情報
    管理UI->>APIサーバ: 組織図タブ: 組織API呼出
    APIサーバ->>MySQL: DB照会 (organization_relationships)
    APIサーバ-->>管理UI: 組織図データ
    管理UI->>APIサーバ: 購入履歴タブ: GET /orders?member_id=...
    APIサーバ->>MySQL: DB照会 (orders)
    APIサーバ-->>管理UI: 購入履歴データ
    管理UI->>APIサーバ: 報酬履歴タブ: GET /member_commissions?member_id=...
    APIサーバ->>MySQL: DB照会 (member_commissions)
    APIサーバ-->>管理UI: 報酬履歴データ
    管理UI->>管理UI: 詳細情報表示完了

```

- ユーザーが検索結果から対象会員を選択し、詳細情報を閲覧します。
- 管理UIは必要な情報を各APIエンドポイントから取得し、タブごとに表示します。

---

### 8. 報酬計算処理

```mermaid
sequenceDiagram
    participant 管理UI
    participant APIサーバ
    participant MySQL
    管理UI->>管理UI: (8) 報酬計算期間選択→「計算実行」ボタン
    管理UI->>APIサーバ: POST /commissions/calculate?period_id=...
    APIサーバ->>MySQL: 組織構造取得 (organization_relationships)
    APIサーバ->>MySQL: 売上取得 (orders)
    APIサーバ->>APIサーバ: 各報酬プラン適用 (commission_plans)
    APIサーバ->>MySQL: 結果をINSERT (member_commissions, commission_details)
    APIサーバ-->>管理UI: 計算完了レスポンス
    管理UI->>管理UI: 計算結果一覧表示

```

- 管理者が報酬計算期間を選択し、計算を実行します。
- APIサーバは組織構造、売上情報を取得し、設定された報酬プランに基づいて計算を行い、

## ポイント

1. **認証フロー**: ログイン時にユーザー情報を検証し、JWTを発行。その後のAPIアクセス時にJWTヘッダを検証。(ステップ1)
2. **会員登録フロー**: ユーザが管理画面で会員情報を入力→APIサーバで組織整合性チェック→DB登録。(ステップ3, 4)
3. **会員検索・参照フロー**: 検索条件をフロントで入力→APIでDB検索→結果一覧表示→詳細画面へ遷移して各種タブ情報を別々のAPIで取得。(ステップ6, 7)
4. **報酬計算フロー**: 計算期間を選択→バックエンドで報酬ロジック実行→計算結果をDBへ→フロントで結果一覧表示・CSV出力。(ステップ8, 9)
5. **返金・クーリングオフ対応フロー**: 対象注文指定→バックエンドで返金登録＆報酬差戻し計算→結果をフロントへ返し表示。(ステップ10)
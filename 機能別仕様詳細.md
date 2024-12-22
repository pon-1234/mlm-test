## 1. 会員管理モジュール

### 1.1 会員登録機能

**概要**：新規会員を登録する機能。

**対応画面**：管理画面「会員登録」フォーム

**対応API**：`POST /members`

### 入力項目

| 項目名 | 型 | 必須 | 検証/制約 | 画面表示 | 入力例 |
| --- | --- | --- | --- | --- | --- |
| 氏名(name) | string | 必須 | 1〜100文字 | テキスト | "山田 太郎" |
| メールアドレス(email) | string | 任意 | Email形式, 200文字以内 | テキスト | "[taro@example.com](mailto:taro@example.com)" |
| 電話番号(phone) | string | 任意 | 数字・ハイフン許容、50文字以内 | テキスト | "03-1234-5678" |
| 郵便番号(postal_code) | string | 必須 | 半角英数字,20文字以内 | テキスト | "100-0001" |
| 住所1(address_line1) | string | 必須 | 1〜255文字 | テキスト | "東京都千代田区..." |
| 住所2(address_line2) | string | 任意 | 0〜255文字 | テキスト |  |
| 市区町村(city) | string | 必須 | 1〜100文字 | テキスト | "千代田区" |
| 都道府県(state_province) | string | 必須 | 1〜100文字 | セレクト | "東京都" |
| 国(country) | string | 必須 | 1〜100文字 | テキスト | "日本" |
| 契約締結日(contract_date) | date | 必須 | YYYY-MM-DD形式 | 日付選択 | "2024-01-01" |
| 紹介者ID(introducer_id) | number | 必須 | DB上に存在するmember_id, 自分自身や循環不可 | テキスト/検索 | "10001" |
| 活動開始シーズン(start_season) | string | 必須 | 定義済フォーマット(例: "2024Q1") | セレクト | "2024Q1" |
| 契約プラン(contract_plan) | string | 必須 | プラン定義済マスタテーブル参照 | セレクト | "standard" |
| 振込先口座情報(bank_xxx) | 複数項目 | 必須 | 銀行名、支店名、口座種別、口座番号、名義必須 | テキスト | "三菱UFJ", "本店", ... |

### 処理フロー（バックエンド）

1. リクエスト受領（`POST /members`）
2. `class-validator`による基本入力バリデーション
3. 組織整合性チェック：
    - introducer_idが存在するか確認
    - organization_relationshipsテーブルを参照し、循環参照がないかチェック
4. 会員データ `members`テーブルへINSERT
5. 住所データ `member_addresses`、振込先 `member_bank_accounts`、配置情報 `member_positions`をINSERT
6. organization_relationshipsテーブルに (parent_member_id = introducer_id, child_member_id = 新member_id, depth=1) を追加
7. 成功レスポンス（新規member_id返却）

### エラーハンドリング

- バリデーションエラー（400 Bad Request）
フロントでエラー表示：「必須項目が未入力です」「メールアドレス形式不正」等
- 整合性エラー（紹介者ループ検出など）（400 Bad Request）
エラーメッセージ：「紹介者構造が不正です。再確認してください。」
- DBエラー（500 Internal Server Error）
一般的なサーバエラー表示

### DBアクセス例

- `SELECT * FROM members WHERE member_id = :introducer_id;`
- `SELECT * FROM organization_relationships WHERE parent_member_id = :introducer_id;`
    
    (ループ検知は再帰的なチェックロジック実装)
    
- INSERT文：
    - `INSERT INTO members (...) VALUES (...);`
    - `INSERT INTO member_positions (...) VALUES (...);`
    - `INSERT INTO member_addresses (...) VALUES (...);`
    - `INSERT INTO member_bank_accounts (...) VALUES (...);`
    - `INSERT INTO organization_relationships (parent_member_id, child_member_id, depth) VALUES (:introducer_id, :new_member_id, 1);`

---

### 1.2 会員検索機能

**概要**：複数条件（ID、氏名、紹介者ID、住所、契約日など）での会員検索

**対応画面**：管理画面「会員検索」

**対応API**：`GET /members?query=...`

### 入力条件例

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| 会員ID(member_id) | number | 任意 | 部分一致検索不可、完全一致 |
| 氏名(name) | string | 任意 | 部分一致検索 |
| 紹介者ID(introducer_id) | number | 任意 | 完全一致 |
| 都道府県(state_province) | string | 任意 | 完全一致または部分一致 |
| 契約日(from/to) | date | 任意 | 日付範囲検索 |

### 処理フロー（バックエンド）

1. クエリパラメータを受け取る
2. パラメータに応じて動的なWHERE句生成
3. `members`テーブルと`member_positions`や`member_addresses`をJOINして検索
4. 結果をJSONで返す（最大件数、ページネーション対応）

### エラーハンドリング

- 入力フォーマットエラー（400 Bad Request）
- DB接続障害（500 Internal Server Error）

---

### 1.3 組織整合性チェック機能

**概要**：新規登録・組織異動時に無限ループや不整合を検出

**想定ユースケース**：
1. 会員登録時：新規会員の紹介者構造が循環しないことを確認
2. 組織異動時：異動先の構造が循環を作らないことを確認

**対応API例**：
- 会員登録時：`POST /members`
- 組織異動時：`PUT /organization/move`

### 処理フロー

#### 新規会員登録時のチェック
1. introducer_idの存在確認
2. organization_relationshipsテーブルを使用し、introducer_idから上位方向へ辿って循環がないか確認
   ```sql
   -- 再帰CTEを使用した例
   WITH RECURSIVE upline AS (
     SELECT parent_member_id, child_member_id, depth, ARRAY[child_member_id] as path
     FROM organization_relationships
     WHERE child_member_id = :introducer_id
     UNION ALL
     SELECT r.parent_member_id, r.child_member_id, r.depth,
            path || r.child_member_id
     FROM organization_relationships r
     INNER JOIN upline u ON u.parent_member_id = r.child_member_id
     WHERE NOT r.child_member_id = ANY(path)
   )
   SELECT * FROM upline;
   ```

#### 組織異動時のチェック
1. 異動元会員の下位ツリーを取得
2. 異動先が下位ツリーに含まれていないか確認
   ```sql
   -- closure tableを使用した例
   SELECT COUNT(*) 
   FROM organization_relationships 
   WHERE parent_member_id = :source_member_id 
   AND child_member_id = :target_member_id;
   ```

### エラーハンドリング

#### エラーケースと応答
1. 循環構造検出時
   - ステータスコード：400 Bad Request
   - エラーメッセージ：「紹介構造��循環しています。指定された紹介者構造を確認してください。」
   - レスポンス例：
     ```json
     {
       "error": "CIRCULAR_REFERENCE",
       "message": "紹介構造が循環しています",
       "details": {
         "detected_path": ["1001", "1002", "1003", "1001"]
       }
     }
     ```

2. 系列違い混在時
   - ステータスコード：400 Bad Request
   - エラーメッセージ：「異なる系列間での組織変更はできません」
   - レスポンス例：
     ```json
     {
       "error": "INVALID_ORGANIZATION_STRUCTURE",
       "message": "異なる系列間での組織変更はできません",
       "details": {
         "source_tree": "A系列",
         "target_tree": "B系列"
       }
     }
     ```

### パフォーマンス考慮事項

1. organization_relationshipsテーブルのインデックス最適化
   - (parent_member_id, child_member_id)の複合インデックス
   - depthカラムのインデックス（階層検索の高速化）

2. 大規模組織対応
   - 再帰クエリの深さ制限設定
   - closure tableパターンでの事前計算活用
   - キャッシュ戦略の検討（Redis等でのツリー構造キャッシュ）

3. バッチ処理での整合性チェック
   - 夜間バッチで全組織構造の整合性を検証
   - 問題検出時は管理者へ通知

---

## 2. 組織図機能

### 2.1 組織図表示機能

**概要**：D3.js等で階層構造を可視化

**対応画面**：管理画面「組織図表示」タブ

**対応API**：`GET /organization/tree?root_member_id=...`

### 処理フロー

1. `root_member_id`を取得し、`organization_relationships`テーブルからツリー構造データ生成
2. 結果をJSON (子ノードを配列で持つツリー形式)で返す
3. フロントでD3.jsに渡し、可視化描画

### エラーハンドリング

- 対象会員未存在時：404エラー
- データ量膨大時：ページングや一部階層のみ取得など工夫

---

## 3. 報酬計算モジュール

### 3.1 報酬計算前チェック機能

**概要**：計算開始前に不整合（非アクティブ会員、循環構造）を検知

**対応画面**：管理画面「報酬計算」ボタン押下時

**対応API**：`POST /commissions/check?period_id=...`

### 処理フロー

1. `period_id`を指定して、その期間内アクティブ会員リスト、対象売上データ取得
2. `organization_relationships`をチェックして、循環的な関係がないか確認
3. 問題なければ"OK"、問題ありならエラーリストを返却

### エラーハンドリング

- 不整合検出時：200 OKだがレスポンスでエラーリスト（「会員IDxxxが不正構造です」など）

---

### 3.2 報酬計算処理

**概要**：指定期間の売上、組織構造、報酬プランに基づき報酬を計算

**対応画面**：管理画面「報酬計算開始」

**対応API**：`POST /commissions/calculate?period_id=...`

### 処理フロー

1. `period_id`を受け、`orders`から対象期間内売上データ取得
2. `organization_relationships`を参照し、各会員のアップライン・ダウンライン構造取得
3. `commission_plans`で定義されるロジックを適用（ユニレベル: N世代上まで報酬、バイナリ: 左右バランス計算など）
4. 各会員の`member_commissions`レコードと`commission_details`をINSERT
5. 成功レスポンスを返す

### エラーハンドリング

- データ不整合時: 400エラー
- 計算ロジック内部エラー時：500エラー

---

### 3.3 返金・クーリングオフ時の報酬再調整機能

**概要**：返金発生時、過去報酬を再計算し、差分を反映

**対応画面**：管理画面「返金処理」フォーム

**対応API**：
- 返金登録：`POST /refunds`
- 報酬再計算：`POST /refunds/{refund_id}/recalculate_commissions`

### 処理フロー

#### 1. 返金情報の登録
1. 注文情報と返金内容を受け取る
   - 対象注文ID
   - 返金対象商品と数量（部分返金の場合）
   - 返金理由（クーリングオフ/返品/その他）
2. `refunds`テーブルに返金ヘッダを登録
3. `refund_line_items`に返金対象商品の明細を登録

#### 2. 報酬再計算処理
1. 返金タイプの判定
   - 全額返金（クーリングオフ等）の場合：該当注文の全commission_detailsを無効化
   - 部分返金の場合：返金額に応じた比例配分で再計算

2. 部分返金時の計算例：
   ```sql
   -- 返金による報酬減額の計算
   SELECT 
     cd.commission_id,
     cd.amount * (r.refund_amount / o.total_amount) as deduction_amount
   FROM commission_details cd
   JOIN orders o ON cd.order_id = o.order_id
   JOIN refunds r ON r.order_id = o.order_id
   WHERE r.refund_id = :refund_id;
   ```

3. 報酬の調整処理
   - 未払い報酬の場合：
     - `commission_details`の該当レコードを更新
     - `member_commissions`の合計額を再計算
   - 支払済み報酬の場合：
     - `adjustments`テーブルに負の調整金を登録
     ```sql
     INSERT INTO adjustments (
       member_id, period_id, amount, reason, 
       refund_id, order_id
     ) VALUES (
       :member_id, :period_id, 
       -:deduction_amount, 
       'refund_adjustment',
       :refund_id, :order_id
     );
     ```

4. 上位者への影響反映
   - organization_relationshipsを使用して影響を受ける上位者を特定
   - 各上位の報酬も同様の計算ロジックで調整

### エラーハンドリング

1. バリデーションエラー（400 Bad Request）
   - 返金額が注文金額を超過
   - 返金対象商品の数量が注文数量を超過
   - レスポンス例：
     ```json
     {
       "error": "INVALID_REFUND_AMOUNT",
       "message": "返金額が注文金額を超過しています",
       "details": {
         "order_amount": 10000,
         "refund_amount": 12000
       }
     }
     ```

2. 報酬計算エラー（500 Internal Server Error）
   - 報酬計算中の予期せぬエラー
   - レスポンス例：
     ```json
     {
       "error": "COMMISSION_CALCULATION_ERROR",
       "message": "報酬の再計算中にエラーが発生しました",
       "details": {
         "commission_id": "1234",
         "error_detail": "..."
       }
     }
     ```

### パフォーマンス考慮事項

1. トランザクション管理
   - 返金登録から報酬再計算までを単一トランザクションで処理
   - 大規模な再計算が必要な場合はバックグラウンドジョブ化

2. インデックス最適化
   - `commission_details`の(order_id)インデックス
   - `adjustments`の(member_id, period_id)複合インデックス

3. 監視とログ
   - 返金処理と報酬再計算の実行時間監視
   - 調整金発生履歴の詳細なログ記録

---

## 4. 調整金モジュール

### 4.1 調整金登録機能

**概要**：特定会員へ報酬加減算を登録

**対応画面**：管理画面「調整金登録」

**対応API**：`POST /adjustments`

### 入力例

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| period_id | number | 必須 | 対象報酬期間ID |
| member_id | number | 必須 | 会員ID |
| amount | decimal(10,2) | 必須 | 調整金額（+/-） |
| reason | string | 任意 | 調整理由（キャンペーンなど） |

### 処理フロー

1. 入力検証
2. `adjustments`テーブルINSERT
3. 報酬表示時にこのadjustmentsを加味して合計報酬を算出

---

## 5. 商品管理モジュール

### 5.1 商品登録・編集機能

**概要**：商品マスタの新規登録・更新

**対応画面**：管理画面「商品マスタ編集」

**対応API**：`POST /products`, `PUT /products/{id}`

### 処理フロー

1. 入力(商品名、コード、価格等)を受け、バリデーション
2. 新規登録時はINSERT、更新時はUPDATE
3. 成功レスポンス返却

---

## 6. データ入出力（インポート/エクスポート）

### 6.1 調整金データインポート

**概要**：CSVファイルをアップロードして複数会員分の調整金を一括登録

**対応画面**：管理画面��調整金一括インポート」

**対応API**：`POST /imports/adjustments`

### 処理フロー

1. CSVファイル受領し、サーバ側でパース
2. 各行をバリデーション後、`adjustments`へINSERT
3. `import_logs`へログ記録
4. 結果レスポンス（登録件数、エラー件数）返却

---

## 7. 権限管理・監査ログ

### 7.1 権限管理（ロール付与）

**概要**：ユーザにロールを割り当て、操作権限を制御

**対応画面**：システム管理画面「ユーザロール設定」

**対応API**：`POST /user_roles`

### 処理フロー

1. 管理者がユーザIDとロールIDを指定
2. `user_roles`へINSERT
3. 以降API認証時にロールチェック

---

### 7.2 監査ログ記録

**概要**：会員情報更新、組織変更多発時に監査ログ記録

**フロー**：各APIでDB更新成功後、`audit_logs`へINSERT（user_id, action, target_table, target_id, timestamp）

---

## 8. サポート問い合わせ履歴

### 8.1 問い合わせ履歴参照機能

**概要**：会員からの問い合わせと運営対応履歴参照

**対応画面**：管理画面「お問い合わせ履歴」タブ

**対応API**：`GET /support_tickets?member_id=...`, `GET /support_ticket_messages?ticket_id=...`

### 処理フロー

1. `support_tickets`から該当会員の問い合わせ一覧取得
2. `support_ticket_messages`からメッセージ一覧取得
3. JSONで返却、フロント表示

---

## 9. 報酬履歴・調整履歴参照機能

**概要**：特定会員の報酬履歴、調整金履歴を参照

**対応画面**：会員詳細の「報酬履歴タブ」、「調整金履歴タブ」

**対応API**：`GET /member_commissions?member_id=...`, `GET /adjustments?member_id=...`

### 処理フロー

1. 会員IDを条件に`member_commissions`、`commission_details`を参照
2. JSON返却、フロントテーブル表示

---

## 10. PDF/CSV出力機能

### 10.1 報酬支払調書PDF出力機能

**概要**：計算済み報酬を会員別PDF化

**対応画面**：管理画面「報酬支払調書出力」ボタン

**対応API**：`GET /reports/payout_slip?member_id=...&period_id=...`

### 処理フロー

1. `member_commissions`と`adjustments`、`commission_details`取得
2. テンプレートレンダリング（pdfkit等使用）
3. PDFストリームを返却
4. フロントでダウンロード

---
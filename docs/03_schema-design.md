# スキーマ設計書

## 1. 会員関連テーブル

### 1.1 `members` (会員基本情報)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| member_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 会員ID（主キー） |
| contract_date | DATE | NO |  | 契約締結日 |
| name | VARCHAR(100) | NO |  | 氏名 |
| email | VARCHAR(200) | YES | NULL | メールアドレス（ログインに必須の場合はNOT NULL + UNIQUE） |
| phone | VARCHAR(50) | YES | NULL | 電話番号 |
| active_status | ENUM('active','inactive','pending','suspended') | NO | 'active' | 活動状態 |
| deleted_at | DATETIME | YES | NULL | 論理削除日時(論理削除運用時) |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

インデックス例：

- PK: member_id
- emailにユニークインデックス(optional)

### 1.2 `member_addresses` (会員住所情報)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| address_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 住所ID |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID(members) |
| postal_code | VARCHAR(20) | NO |  | 郵便番号 |
| address_line1 | VARCHAR(255) | NO |  | 住所1 |
| address_line2 | VARCHAR(255) | YES | NULL | 住所2 |
| city | VARCHAR(100) | NO |  | 市区町村 |
| state_province | VARCHAR(100) | NO |  | 都道府県 |
| country | VARCHAR(100) | NO |  | 国名 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 1.3 `member_bank_accounts` (会員の振込先口座情報)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| bank_account_id(PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 振込先ID |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID(members) |
| bank_name | VARCHAR(100) | NO |  | 銀行名 |
| branch_name | VARCHAR(100) | NO |  | 支店名 |
| account_type | ENUM('savings','checking') | NO | 'savings' | 口座種別(例：普通預金= 'savings') |
| account_number | VARCHAR(50) | NO |  | 口座番号 |
| account_holder | VARCHAR(100) | NO |  | 口座名義 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 1.4 `member_positions` (組織ツリー内の配置情報)

**変更点**：

- 紹介者ID（introducer_id）のみを保持し、上位系統は`organization_relationships`で管理。
- `member_id`と`start_season`の複合一意制約を検討。

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| position_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | ポジションID |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID（members） |
| introducer_id (FK) | BIGINT UNSIGNED | NO |  | 紹介者ID（members.member_id） |
| start_season | VARCHAR(50) | NO |  | 活動開始シーズン |
| contract_plan | VARCHAR(100) | NO |  | 契約プラン種別 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

インデックス例：

- UNIQUE KEY (member_id, start_season) → 同一会員・同一シーズンに複数ポジション不可

### 1.5 `organization_relationships`（上下関係ツリー管理）

**変更点**：

- depthは残し、パフォーマンス向上のために使用。
- 大規模組織でのパフォーマンス課題に備え、(parent_member_id, child_member_id)にINDEX付与。

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| rel_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 関係レ��ードID |
| parent_member_id(FK) | BIGINT UNSIGNED | NO |  | 上位会員ID |
| child_member_id(FK) | BIGINT UNSIGNED | NO |  | 下位会員ID |
| depth | INT | NO |  | 親から子までの階層深度 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

インデックス例：

- INDEX(parent_member_id, child_member_id)
- 必要に応じてparent_member_idのみのインデックス

---

## 2. 商品・購入関連

### 2.1 `products` (商品マスタ)

**変更点**：

- 在庫管理用の`stock_quantity`を追加
- カテゴリ分け用の`category_id`を追加（`product_categories`テーブル別途作成想定）

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| product_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 商品ID |
| product_code | VARCHAR(100) | NO |  | 商品コード（ユニーク可） |
| product_name | VARCHAR(200) | NO |  | 商品名 |
| category_id (FK) | INT UNSIGNED | YES | NULL | カテゴリID(product_categories参照) |
| description | TEXT | YES | NULL | 説明文 |
| price | DECIMAL(10,2) | NO | 0.00 | 基本価格 |
| stock_quantity | INT UNSIGNED | NO | 0 | 在庫数 |
| is_active | TINYINT | NO | 1 | 販売中フラグ |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 2.2 `orders` (注文ヘッダ)

**変更点**：

- order_number（ユーザ表示用注文番号）追加
- payment_methodカラム追加

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| order_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 注文ID |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 購入会員ID(members) |
| order_number | VARCHAR(50) | NO |  | 外部表示用注文番号（ユニーク） |
| order_date | DATETIME | NO | CURRENT_TIMESTAMP | 注文日 |
| total_amount | DECIMAL(10,2) | NO | 0.00 | 合計金額 |
| status | ENUM('pending','paid','shipped','completed','canceled') | NO | 'pending' | 注文状態 |
| payment_method | ENUM('credit_card','bank_transfer','paypal','cod') | NO | 'credit_card' | 支払方法 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

インデックス例：

- UNIQUE(order_number)

### 2.3 `order_items` (注文明細)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| order_item_id(PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 注文明細ID |
| order_id (FK) | BIGINT UNSIGNED | NO |  | 注文ID(orders) |
| product_id (FK) | BIGINT UNSIGNED | NO |  | 商品ID(products) |
| quantity | INT UNSIGNED | NO | 1 | 注文数量 |
| unit_price | DECIMAL(10,2) | NO | 0.00 | 単価 |
| line_total | DECIMAL(10,2) | NO | 0.00 | 明細合計 |

### 2.4 `shipments` (出荷情報)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| shipment_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 出荷ID |
| order_id (FK) | BIGINT UNSIGNED | NO |  | 対象注文ID(orders) |
| tracking_number | VARCHAR(100) | YES | NULL | 送り状番号 |
| shipped_date | DATETIME | YES | NULL | 出荷日 |
| status | ENUM('pending','shipped','delivered','returned') | NO | 'pending' | 出荷状況 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

### 2.5 `refunds` (返金情報)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| refund_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 返金ID |
| order_id (FK) | BIGINT UNSIGNED | NO |  | 対象注文ID(orders) |
| refund_date | DATETIME | NO | CURRENT_TIMESTAMP | 返金発生日 |
| refund_amount | DECIMAL(10,2) | NO | 0.00 | 返金額 |
| reason | VARCHAR(255) | YES | NULL | 返金理由 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

### 2.6 `refund_line_items` (返金明細)

| ��ラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| refund_line_item_id(PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 返金明細ID |
| refund_id (FK) | BIGINT UNSIGNED | NO |  | 返金ID(refunds) |
| order_item_id (FK) | BIGINT UNSIGNED | NO |  | 注文明細ID(order_items) |
| refund_quantity | INT UNSIGNED | NO | 0 | 返金対象数量 |
| refund_line_amount | DECIMAL(10,2) | NO | 0.00 | 行ごとの返金額 |

---

## 3. 報酬計算関連

### 3.1 `commission_plans` (報酬プラン定義)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| plan_id (PK) | INT UNSIGNED | NO | AUTO_INCREMENT | 報酬プランID |
| plan_name | VARCHAR(100) | NO |  | プラン名(ユニレベル,バイナリ等) |
| description | TEXT | YES | NULL | 説明 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

（詳細パラメータは別テーブル `commission_rules`で管理検討可）

### 3.2 `commission_periods` (計算対象期間)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| period_id (PK) | INT UNSIGNED | NO | AUTO_INCREMENT | 計算期間ID |
| start_date | DATE | NO |  | 開始日 |
| end_date | DATE | NO |  | 終了日 |
| status | ENUM('open','closed') | NO | 'open' | 計算状態 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 3.3 `member_commissions` (会員別報酬)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| commission_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 会員報酬ID |
| period_id (FK) | INT UNSIGNED | NO |  | 対象期間ID(commission_periods) |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID(members) |
| total_commission | DECIMAL(10,2) | NO | 0.00 | 合計報酬額 |
| calculated_at | DATETIME | NO | CURRENT_TIMESTAMP | 計算日時 |

### 3.4 `commission_details` (報酬明細)

**変更点**：

- commission_rule_idを追加想定（commission_rules参照）
- bonus_typeはENUMで管理、またはcommission_rulesで定義

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| detail_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 報酬明細ID |
| commission_id (FK) | BIGINT UNSIGNED | NO |  | 会員報酬ID(member_commissions) |
| source_member_id (FK) | BIGINT UNSIGNED | NO |  | 報酬発生元会員ID |
| order_id (FK) | BIGINT UNSIGNED | YES | NULL | 報酬発生元注文ID |
| commission_rule_id (FK) | INT UNSIGNED | YES | NULL | 報酬ロジック参照ID(commission_rules) |
| bonus_type | ENUM('unilevel','binary','leader','other') | NO | 'unilevel' | ボーナス種別 |
| amount | DECIMAL(10,2) | NO | 0.00 | 明細額 |

### 3.5 `adjustments` (調整金)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| adjustment_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 調整ID |
| period_id (FK) | INT UNSIGNED | NO |  | 対象期間ID |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID(members) |
| amount | DECIMAL(10,2) | NO | 0.00 | 調整金額(正または負) |
| reason | VARCHAR(255) | YES | NULL | 調整理由 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

### 3.6 `payout_batches` (振込実行バッチ)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| batch_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 振込バッチID |
| period_id (FK) | INT UNSIGNED | NO |  | 対象期間ID |
| payout_date | DATETIME | NO | CURRENT_TIMESTAMP | 振込日 |

### 3.7 `payout_details` (バッチ内個別振込明細)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| payout_detail_id(PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 振込明細ID |
| batch_id (FK) | BIGINT UNSIGNED | NO |  | 振込バッチID(payout_batches) |
| member_id (FK) | BIGINT UNSIGNED | NO |  | 会員ID |
| payout_amount | DECIMAL(10,2) | NO | 0.00 | 振込額 |

---

## 4. データ入出力ログ

### 4.1 `import_logs`

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| import_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | インポートログID |
| file_name | VARCHAR(255) | NO |  | インポートファイル名 |
| import_type | VARCHAR(50) | NO |  | データ種別(adjustment,shipmentなど) |
| processed_at | DATETIME | NO | CURRENT_TIMESTAMP | 処理日時 |

### 4.2 `export_logs`

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| export_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | エクスポートログID |
| file_name | VARCHAR(255) | NO |  | 出力ファイル名 |
| export_type | VARCHAR(50) | NO |  | データ種別(members,orders等) |
| exported_at | DATETIME | NO | CURRENT_TIMESTAMP | 出力日時 |

---

## 5. システム管理

### 5.1 `users` (管理用ユーザ)

**変更点**：

- password_salt追加
- last_login_at追加

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| user_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | システムユーザID |
| username | VARCHAR(100) | NO |  | ユーザ名(一意) |
| password_hash | VARCHAR(255) | NO |  | パスワードハッシュ |
| password_salt | VARCHAR(255) | NO |  | パスワードソルト |
| last_login_at | DATETIME | YES | NULL | 最終ログイン日時 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 5.2 `roles` (ロール定義)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| role_id (PK) | INT UNSIGNED | NO | AUTO_INCREMENT | ロールID |
| role_name | VARCHAR(100) | NO |  | ロール名 |

### 5.3 `user_roles` (ユーザ-ロール紐づけ)

| カラム名 | 型 | NULL許可 | 説明 |
| --- | --- | --- | --- |
| user_id (FK, PK) | BIGINT UNSIGNED | NO | ユーザID(users) |
| role_id (FK, PK) | INT UNSIGNED | NO | ロールID(roles) |

### 5.4 `audit_logs` (操作監査ログ)

**変更点**：

- old_value, new_valueを追加し変更内容追跡可能に

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| audit_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 監査ログID |
| user_id (FK) | BIGINT UNSIGNED | YES | NULL | 実��ユーザID(users) NULL=システム |
| action | VARCHAR(255) | NO |  | アクション名(INSERT_MEMBER等) |
| target_table | VARCHAR(100) | YES | NULL | 対象テーブル名 |
| target_id | BIGINT UNSIGNED | YES | NULL | 対象レコードID |
| old_value | TEXT | YES | NULL | 変更前データ(JSON等) |
| new_value | TEXT | YES | NULL | 変更後データ(JSON等) |
| description | TEXT | YES | NULL | 詳細説明 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 実行日時 |

---

## 6. サポート対応履歴

### 6.1 `support_tickets` (お問い合わせ)

**変更点**：

- priority(優���度)追加
- assigned_user_id(担当者)追加

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| ticket_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | 問い合わせID |
| member_id (FK) | BIGINT UNSIGNED | YES | NULL | 会員ID |
| subject | VARCHAR(255) | NO |  | 件名 |
| status | ENUM('open','closed','pending','resolved') | NO | 'open' | ステータス |
| priority | ENUM('low','medium','high','urgent') | NO | 'medium' | 優先度 |
| assigned_user_id (FK) | BIGINT UNSIGNED | YES | NULL | 担当ユーザID(users) |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新日時 |

### 6.2 `support_ticket_messages` (問い合わせメッセージ)

| カラム名 | 型 | NULL許可 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| message_id (PK) | BIGINT UNSIGNED | NO | AUTO_INCREMENT | メッセージID |
| ticket_id (FK) | BIGINT UNSIGNED | NO |  | 問い合わせID |
| sender_type | ENUM('member','staff') | NO | 'member' | 送信者種別 |
| message_content | TEXT | NO |  | メッセージ内容 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

---

## 関連性まとめ

- `members` 1 - N `member_addresses`
- `members` 1 - N `member_bank_accounts`
- `members` 1 - 1 `member_positions`（1シーズン1ポジションをユニーク制約で担保）
- `organization_relationships`で多階層上下関係を表現
- `members` 1 - N `orders`, `orders` 1 - N `order_items`
- `orders` 1 - N `shipments`
- `orders` 1 - N `refunds`、`refunds` 1 - N `refund_line_items`
- `commission_periods` 1 - N `member_commissions`、`member_commissions` 1 - N `commission_details`
- `commission_periods` 1 - N `adjustments`
- `payout_batches` 1 - N `payout_details`
- `users` 1 - N `audit_logs`（user_id NULL可）
- `support_tickets` 1 - N `support_ticket_messages`

---
# 技術スタック仕様書

## 1. 全体構成

- **フロントエンド**:
    - **admin-frontend（管理者・オペレータ向け）**:
        - 使用技術: React + Next.js + TypeScript
        - UIコンポーネント: Material UI (MUI)
        - 認証: JWT (管理者ロール)
        - 機能: CSV出力（papaparse）、PDFプレビュー（react-pdf）、組織図表示（D3.js）
    - **user-frontend（将来の会員向け）**:
        - 使用技術: React + Next.js + TypeScript
        - UIライブラリ: Material UI (MUI)
        - 認証: JWT（会員ロール）
        - 会員自身が報酬・購入履歴参照、問い合わせ状況確認可能
- **バックエンド**:
    - 使用技術: Node.js(LTS) + TypeScript + Express.js
    - DB: MySQL8.0 + TypeORM
    - 認証: Passport + passport-jwt
    - バリデーション: class-validator（DTOクラスを定義し、リクエストハンドラ内で明示的にバリデーション実行）
    （必要に応じて`express-validator`も検討可能）
    - API仕様化: Swagger (OpenAPI)（swagger-jsdoc + swagger-ui-express）
    - 構成: `src/`配下に members, orders, commissions, products, support, admin など機能別にディレクトリ分割。
    ルーティングレイヤー、コントローラー層、サービス層、リポジトリ層のアーキテクチャを明示し、ExpressのRouterを使用して機能単位のモジュール分割を行う。
    - ロギング: Winston + JSON構造化ログ
    - モニタリング/APM: Datadog (将来的導入想定)

## 2. バックエンド技術詳細

- 言語/ランタイム: TypeScript + Node.js (LTS)
- フレームワーク: Express.js
    - **DIについて**: NestJSのようなDIコンテナは標準ではないため、
        - `tsyringe`や`inversify`などのDIコンテナライブラリを導入し、
        コントローラやサービスクラスに依存性注入できる仕組みを採用することを検討。
    - **設定管理**: `dotenv`で環境変数管理、`config`パッケージによる設定ファイル分離検討。
    - **ルーティング構成**: 各機能ごとに`routes/`ディレクトリ配下に`members.route.ts`などを用意し、エンドポイント定義。コントローラ層とサービス層をクラスベースで分離。
- DBアクセス: TypeORM (MySQL対応, Migration利用)
- 認証・認可: Passport + passport-jwtによるJWT認証
- バリデーション:
    - DTOクラス + class-validator を利用。リクエスト受取時にDTOインスタンス生成し、`validate()`でバリデーション実施。
    - もしくは `express-validator` を中間ウェアとして利用することも可能。
- テスト: Jest + supertest
    - Expressアプリを起動せずにsupertestでAPIエンドポイントテスト
    - サービス層は単体テスト、リポジトリ層はDBモックを用いてテスト
- セキュリティ: helmet (セキュリティヘッダ), CORS設定
    - 必要時CSRF対応（フロントの要件によって導入）
- ログ・監査: `audit_logs`テーブルで操作記録, Winstonでログ出力
- PDF生成（サーバサイド）: PDFKitで報酬明細や支払調書生成

## 3. フロントエンド技術詳細

- 言語: TypeScript
- フレームワーク: Next.js (SSR/SSG対応)
- UIライブラリ: Material UI (MUI)
- 状態管理: react-query (APIフェッチ最適化)
- グラフ・組織図表示: D3.js
- CSV出力: papaparse
- PDFプレビュー: react-pdf（バックエンド生成PDF取得）
- スタイリング: MUI標準テーマカスタマイズ（Emotionベース）

## 4. インフラ・デプロイ

- コンテナ化: Docker
- オーケストレーション: AWS ECS(Fargate)想定
- DBホスティング: AWS RDS for MySQL
- CI/CD: GitHub Actionsでビルド・テスト・デプロイ
- CDN: CloudFrontでフロントエンド配信
- LB: ALB (Application Load Balancer)でバックエンド負荷分散

## 5. セキュリティ・監査

- Webセキュリティ: helmet、CORS設定
- 監査ログ: `audit_logs`テーブルに操作ユーザID・日時・操作内容記録

## 6. 将来拡張性

- RBACガード: Passportストラテジやカスタムミドルウェアで権限ロジック拡張可能
- user-frontendへのブランド対応、レスポンシブ対応容易
- 外部システム連携: ExpressミドルウェアやAPI Gatewayを介した拡張容易
- APM（Datadog）、OpenTelemetryでの可観測性強化が可能
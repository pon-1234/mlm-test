project-root/
├─ apps/
│  ├─ admin-frontend/          # 管理者向けフロントエンド(Next.js + React)
│  │  ├─ src/
│  │  │  ├─ pages/ 
│  │  │  ├─ components/
│  │  │  ├─ services/
│  │  │  ├─ ...
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ next.config.js
│  │
│  ├─ user-frontend/           # 将来のエンドユーザー(会員)向けフロントエンド
│  │  ├─ src/
│  │  │  ├─ pages/ 
│  │  │  ├─ components/
│  │  │  ├─ services/
│  │  │  ├─ ...
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ next.config.js
│  │
│  └─ backend/                 # 共通バックエンドAPIサーバ(NestJS)
│     ├─ src/
│     │  ├─ app.module.ts
│     │  ├─ main.ts
│     │  ├─ modules/
│     │  │  ├─ auth/           # 認証モジュール(管理者・会員用)
│     │  │  ├─ members/        # 会員情報管理、エンドユーザー用ロジック
│     │  │  ├─ organization/   # 組織管理ロジック
│     │  │  ├─ commissions/    # 報酬計算ロジック（会員向けデータ参照も）
│     │  │  ├─ products/       # 商品管理（会員/管理者双方参照可能）
│     │  │  ├─ orders/         # 会員向け注文、管理者用オーダー管理
│     │  │  ├─ admin/          # 管理者専用機能モジュール(APIエンドポイント分離)
│     │  │  ├─ support/        # サポート機能(会員・管理者両視点)
│     │  │  └─ ...
│     │  ├─ database/
│     │  │  ├─ entities/
│     │  │  ├─ migrations/
│     │  │  └─ seed/
│     │  ├─ common/
│     │  ├─ config/
│     │  ├─ filters/
│     │  ├─ guards/
│     │  └─ ...
│     ├─ test/
│     ├─ package.json
│     └─ tsconfig.json
│
├─ docs/                       # ドキュメント群
│  ├─ specification/
│  ├─ design/
│  ├─ architecture/
│  ├─ api/                     # Swagger/OpenAPI定義
│  └─ README.md
│
├─ config/                     # 共通環境設定ファイル（envファイル）
│  ├─ .env.development
│  ├─ .env.staging
│  ├─ .env.production
│  └─ ...
│
├─ docker/
│  ├─ Dockerfile.backend
│  ├─ Dockerfile.admin-frontend
│  ├─ Dockerfile.user-frontend
│  ├─ docker-compose.yml
│  └─ ...
│
├─ scripts/
│  ├─ build-backend.sh
│  ├─ build-admin-frontend.sh
│  ├─ build-user-frontend.sh
│  └─ deploy.sh
│
├─ .github/ or .gitlab/
│  └─ workflows/
│     ├─ ci.yaml
│     ├─ cd.yaml
│     └─ ...
│
└─ README.md
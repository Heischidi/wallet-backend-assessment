# 💳 Wallet System — Microservice Backend Assessment

A production-quality, microservice-based wallet system built with **NestJS**, **gRPC**, **Prisma ORM**, and **PostgreSQL** in a monorepo architecture.

---

## Architecture Overview

```
backend-assessment/
├── apps/
│   ├── user-service/      # gRPC microservice — port 5001
│   └── wallet-service/    # gRPC microservice — port 5002
├── packages/
│   ├── proto/             # Shared .proto definitions
│   └── prisma/            # Shared Prisma schema + migrations
├── docs/
│   ├── grpcurl-examples.md
│   └── test-client.js
├── docker-compose.yml
└── README.md
```

### Inter-Service Communication

```
[gRPC Client]
     │
     ▼
Wallet Service (port 5002)
     │  CreateWallet calls User Service
     │  to verify user exists
     ▼
User Service (port 5001)
     │
     ▼
PostgreSQL (port 5432)
```

---

## Tech Stack

| Layer              | Technology                                |
|--------------------|-------------------------------------------|
| Framework          | NestJS 10 (monorepo)                      |
| Transport          | gRPC (`@grpc/grpc-js`, `@grpc/proto-loader`) |
| ORM                | Prisma 5                                  |
| Database           | PostgreSQL 15                             |
| Validation         | `class-validator` + `class-transformer`   |
| Logging            | `nestjs-pino` (structured JSON logs)      |
| Containerization   | Docker + Docker Compose                   |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** 15 (local install **or** Docker — see below)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd backend-assessment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wallet_db"
USER_SERVICE_URL="localhost:5001"
NODE_ENV=development
```

### 4. Start PostgreSQL

**Option A — Docker (recommended, no PostgreSQL install needed):**
```bash
docker-compose up -d
```

**Option B — Local PostgreSQL:**
Make sure PostgreSQL is running and update `DATABASE_URL` in `.env` accordingly.

### 5. Run Prisma migrations

```bash
npm run migrate
# Prisma will prompt for a migration name — type: "init"
```

### 6. Generate Prisma client

```bash
npm run generate
```

---

## Running the Services

Open **two separate terminals**:

**Terminal 1 — User Service:**
```bash
npm run start:user:dev
# 🚀 User Service is running on port 5001
```

**Terminal 2 — Wallet Service:**
```bash
npm run start:wallet:dev
# 💰 Wallet Service is running on port 5002
```

---

## Available Scripts

| Script                  | Description                              |
|-------------------------|------------------------------------------|
| `npm run start:user:dev`   | Start User Service in watch mode         |
| `npm run start:wallet:dev` | Start Wallet Service in watch mode       |
| `npm run build`            | Build both services for production       |
| `npm run migrate`          | Run Prisma migrations (dev)              |
| `npm run migrate:deploy`   | Run Prisma migrations (production)       |
| `npm run generate`         | Regenerate Prisma client                 |
| `npm run db:studio`        | Open Prisma Studio (GUI)                 |

---

## gRPC Endpoints

### User Service — `localhost:5001`

| Method        | Request                        | Response     |
|---------------|--------------------------------|--------------|
| `CreateUser`  | `{ email, name }`              | `UserResponse` |
| `GetUserById` | `{ id }`                       | `UserResponse` |

**UserResponse:**
```json
{ "id": "uuid", "email": "string", "name": "string", "createdAt": "ISO string" }
```

### Wallet Service — `localhost:5002`

| Method         | Request                        | Response       |
|----------------|--------------------------------|----------------|
| `CreateWallet` | `{ userId }`                   | `WalletResponse` |
| `GetWallet`    | `{ userId }`                   | `WalletResponse` |
| `CreditWallet` | `{ userId, amount }`           | `WalletResponse` |
| `DebitWallet`  | `{ userId, amount }`           | `WalletResponse` |

**WalletResponse:**
```json
{ "id": "uuid", "userId": "uuid", "balance": 0.00, "createdAt": "ISO string" }
```

---

## API Testing

### Option 1: Node.js Test Client (Recommended)

With both services running:
```bash
node docs/test-client.js
```

This runs a full integration test suite covering:
- ✅ Create user
- ✅ Get user by ID
- ✅ Create wallet (with User Service gRPC verification)
- ✅ Credit wallet
- ✅ Debit wallet
- ✅ Get wallet
- ✅ Error cases (duplicate user, user not found, wallet not found, insufficient balance)

### Option 2: grpcurl

Install `grpcurl` from https://github.com/fullstorydev/grpcurl/releases

```bash
# Create a user
grpcurl -plaintext \
  -proto packages/proto/user.proto \
  -d '{"email": "alice@example.com", "name": "Alice"}' \
  localhost:5001 user.UserService/CreateUser

# Create a wallet (replace <USER_ID> with ID from above)
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>"}' \
  localhost:5002 wallet.WalletService/CreateWallet

# Credit wallet
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>", "amount": 500}' \
  localhost:5002 wallet.WalletService/CreditWallet

# Debit wallet
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>", "amount": 150}' \
  localhost:5002 wallet.WalletService/DebitWallet

# Get wallet
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>"}' \
  localhost:5002 wallet.WalletService/GetWallet
```

See `docs/grpcurl-examples.md` for full error-case examples.

---

## Bonus Features Implemented

### ✅ Prisma Transactions
`DebitWallet` uses `prisma.$transaction` for atomic balance checking and deduction. This prevents race conditions where two concurrent debits could both pass the balance check.

```typescript
// wallet.service.ts
const updated = await this.prisma.$transaction(async (tx) => {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (Number(wallet.balance) < amount) throw new RpcException({ code: FAILED_PRECONDITION });
  return tx.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
});
```

### ✅ Input Validation (`class-validator`)
All DTOs use `class-validator` decorators. The `ValidationPipe` with `transform: true` is applied globally to both services.

### ✅ Error Handling
Proper gRPC status codes are returned:
| Scenario              | gRPC Code            |
|-----------------------|----------------------|
| User not found        | `NOT_FOUND`          |
| Wallet not found      | `NOT_FOUND`          |
| Email already exists  | `ALREADY_EXISTS`     |
| Wallet already exists | `ALREADY_EXISTS`     |
| Insufficient balance  | `FAILED_PRECONDITION`|
| Invalid input         | `INVALID_ARGUMENT`   |

### ✅ Structured Logging (`nestjs-pino`)
Both services use `nestjs-pino` for structured JSON logging. In development, logs are pretty-printed with timestamps and colors via `pino-pretty`.

---

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  wallet    Wallet?
}

model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @default(0) @db.Decimal(12, 2)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Project Structure (Detailed)

```
backend-assessment/
├── apps/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── main.ts              # Bootstrap gRPC server on port 5001
│   │   │   ├── user.module.ts       # NestJS module with pino logger
│   │   │   ├── user.controller.ts   # gRPC method handlers
│   │   │   ├── user.service.ts      # Business logic + error handling
│   │   │   ├── prisma.service.ts    # PrismaClient wrapper
│   │   │   └── dto/
│   │   │       └── create-user.dto.ts
│   │   └── tsconfig.app.json
│   └── wallet-service/
│       ├── src/
│       │   ├── main.ts              # Bootstrap gRPC server on port 5002
│       │   ├── wallet.module.ts     # Module + gRPC client registration
│       │   ├── wallet.controller.ts # gRPC method handlers
│       │   ├── wallet.service.ts    # Business logic + inter-service calls
│       │   ├── prisma.service.ts    # PrismaClient wrapper
│       │   └── dto/
│       │       └── wallet.dto.ts
│       └── tsconfig.app.json
├── packages/
│   ├── proto/
│   │   ├── user.proto               # User service proto definition
│   │   └── wallet.proto             # Wallet service proto definition
│   └── prisma/
│       └── schema.prisma            # Shared Prisma schema
├── docs/
│   ├── grpcurl-examples.md          # CLI testing examples
│   └── test-client.js               # Node.js integration test client
├── docker-compose.yml               # PostgreSQL container
├── nest-cli.json                    # NestJS monorepo config
├── package.json                     # Root dependencies & scripts
├── tsconfig.json
└── .env.example
```

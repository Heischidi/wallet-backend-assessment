# API Testing with grpcurl

> `grpcurl` is a command-line tool for interacting with gRPC servers.
> Install from: https://github.com/fullstorydev/grpcurl/releases

**Proto directory:** `packages/proto/`

---

## 1. Create a User

```bash
grpcurl -plaintext \
  -proto packages/proto/user.proto \
  -d '{"email": "alice@example.com", "name": "Alice"}' \
  localhost:5001 \
  user.UserService/CreateUser
```

**Expected response:**
```json
{
  "id": "e3b21c7a-...",
  "email": "alice@example.com",
  "name": "Alice",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 2. Get User by ID

```bash
grpcurl -plaintext \
  -proto packages/proto/user.proto \
  -d '{"id": "<USER_ID>"}' \
  localhost:5001 \
  user.UserService/GetUserById
```

---

## 3. Create a Wallet

> The Wallet Service will call the User Service via gRPC to verify the user exists.

```bash
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>"}' \
  localhost:5002 \
  wallet.WalletService/CreateWallet
```

**Expected response:**
```json
{
  "id": "a7f02d1b-...",
  "userId": "<USER_ID>",
  "balance": 0,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 4. Credit Wallet

```bash
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>", "amount": 500.00}' \
  localhost:5002 \
  wallet.WalletService/CreditWallet
```

**Expected response:**
```json
{
  "id": "a7f02d1b-...",
  "userId": "<USER_ID>",
  "balance": 500,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 5. Debit Wallet

```bash
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>", "amount": 150.00}' \
  localhost:5002 \
  wallet.WalletService/DebitWallet
```

**Expected response:**
```json
{
  "id": "a7f02d1b-...",
  "userId": "<USER_ID>",
  "balance": 350,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 6. Get Wallet

```bash
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>"}' \
  localhost:5002 \
  wallet.WalletService/GetWallet
```

---

## Error Cases

### Duplicate user
```bash
# Repeat Create User with same email — returns ALREADY_EXISTS
grpcurl -plaintext \
  -proto packages/proto/user.proto \
  -d '{"email": "alice@example.com", "name": "Alice"}' \
  localhost:5001 user.UserService/CreateUser
# ERROR: Code: AlreadyExists, Message: A user with email 'alice@example.com' already exists
```

### Create wallet for non-existent user
```bash
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "00000000-0000-0000-0000-000000000000"}' \
  localhost:5002 wallet.WalletService/CreateWallet
# ERROR: Code: NotFound, Message: User with id '...' not found
```

### Insufficient balance on debit
```bash
# Debit more than available balance
grpcurl -plaintext \
  -proto packages/proto/wallet.proto \
  -d '{"userId": "<USER_ID>", "amount": 999999}' \
  localhost:5002 wallet.WalletService/DebitWallet
# ERROR: Code: FailedPrecondition, Message: Insufficient balance. Available: 350, Requested: 999999
```

/**
 * Wallet System — Node.js gRPC Test Client
 *
 * Run: node docs/test-client.js
 *
 * Make sure both services are running before executing:
 *   - User Service  on localhost:5001
 *   - Wallet Service on localhost:5002
 *
 * Install dependencies first: npm install
 */

'use strict';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// ─── Load proto definitions ─────────────────────────────────────────────────

const USER_PROTO_PATH = path.join(__dirname, '../packages/proto/user.proto');
const WALLET_PROTO_PATH = path.join(__dirname, '../packages/proto/wallet.proto');

const userPackageDef = protoLoader.loadSync(USER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const walletPackageDef = protoLoader.loadSync(WALLET_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(userPackageDef).user;
const walletProto = grpc.loadPackageDefinition(walletPackageDef).wallet;

// ─── Create clients ──────────────────────────────────────────────────────────

const userClient = new userProto.UserService(
  'localhost:5001',
  grpc.credentials.createInsecure(),
);

const walletClient = new walletProto.WalletService(
  'localhost:5002',
  grpc.credentials.createInsecure(),
);

// ─── Helper: promisify gRPC call ─────────────────────────────────────────────

function call(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function log(title, data) {
  console.log(`\n✅ ${title}`);
  console.log(JSON.stringify(data, null, 2));
}

function logError(title, err) {
  console.log(`\n❌ ${title}`);
  console.log(`   Code: ${err.code} | Message: ${err.details}`);
}

// ─── Test suite ──────────────────────────────────────────────────────────────

async function runTests() {
  console.log('='.repeat(60));
  console.log('  Wallet System — gRPC Integration Tests');
  console.log('='.repeat(60));

  let userId;

  // 1. Create User
  try {
    const user = await call(userClient, 'CreateUser', {
      email: `test_${Date.now()}@example.com`,
      name: 'Test User',
    });
    log('1. CreateUser', user);
    userId = user.id;
  } catch (err) {
    logError('1. CreateUser FAILED', err);
    process.exit(1);
  }

  // 2. Get User By ID
  try {
    const user = await call(userClient, 'GetUserById', { id: userId });
    log('2. GetUserById', user);
  } catch (err) {
    logError('2. GetUserById FAILED', err);
  }

  // 3. Create Wallet (calls User Service internally via gRPC)
  try {
    const wallet = await call(walletClient, 'CreateWallet', { userId });
    log('3. CreateWallet', wallet);
  } catch (err) {
    logError('3. CreateWallet FAILED', err);
  }

  // 4. Credit Wallet
  try {
    const wallet = await call(walletClient, 'CreditWallet', { userId, amount: 1000 });
    log('4. CreditWallet (+ 1000)', wallet);
  } catch (err) {
    logError('4. CreditWallet FAILED', err);
  }

  // 5. Debit Wallet
  try {
    const wallet = await call(walletClient, 'DebitWallet', { userId, amount: 250 });
    log('5. DebitWallet (- 250)', wallet);
  } catch (err) {
    logError('5. DebitWallet FAILED', err);
  }

  // 6. Get Wallet
  try {
    const wallet = await call(walletClient, 'GetWallet', { userId });
    log('6. GetWallet (balance should be 750)', wallet);
  } catch (err) {
    logError('6. GetWallet FAILED', err);
  }

  // ── Error Cases ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('  Error Handling Tests');
  console.log('─'.repeat(60));

  // 7. Duplicate email
  try {
    await call(userClient, 'CreateUser', { email: 'dupe@example.com', name: 'A' });
    await call(userClient, 'CreateUser', { email: 'dupe@example.com', name: 'B' });
    console.log('\n❌ 7. DuplicateUser: should have thrown ALREADY_EXISTS');
  } catch (err) {
    logError('7. DuplicateUser (expected ALREADY_EXISTS)', err);
  }

  // 8. User not found
  try {
    await call(userClient, 'GetUserById', { id: '00000000-0000-0000-0000-000000000000' });
    console.log('\n❌ 8. UserNotFound: should have thrown NOT_FOUND');
  } catch (err) {
    logError('8. UserNotFound (expected NOT_FOUND)', err);
  }

  // 9. Create wallet for non-existent user
  try {
    await call(walletClient, 'CreateWallet', { userId: '00000000-0000-0000-0000-000000000000' });
    console.log('\n❌ 9. WalletForMissingUser: should have thrown NOT_FOUND');
  } catch (err) {
    logError('9. WalletForMissingUser (expected NOT_FOUND)', err);
  }

  // 10. Insufficient balance
  try {
    await call(walletClient, 'DebitWallet', { userId, amount: 999999 });
    console.log('\n❌ 10. InsufficientBalance: should have thrown FAILED_PRECONDITION');
  } catch (err) {
    logError('10. InsufficientBalance (expected FAILED_PRECONDITION)', err);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Tests completed');
  console.log('='.repeat(60) + '\n');
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

"use server";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

// ─── Load proto definitions ─────────────────────────────────────────────────

// For Vercel Serverless, process.cwd() is the root of the frontend folder
const USER_PROTO_PATH = path.join(process.cwd(), "proto", "user.proto");
const WALLET_PROTO_PATH = path.join(process.cwd(), "proto", "wallet.proto");

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

const userProto = grpc.loadPackageDefinition(userPackageDef).user as any;
const walletProto = grpc.loadPackageDefinition(walletPackageDef).wallet as any;

// ─── Create clients ──────────────────────────────────────────────────────────

// In production on render, these will be set to the Render URLs via Vercel env vars
const userServiceUrl = process.env.USER_SERVICE_URL || "localhost:5001";
const walletServiceUrl = process.env.WALLET_SERVICE_URL || "localhost:5002";

// Next.js caches module scope in development usually, but be careful with gRPC clients
const userClient = new userProto.UserService(
  userServiceUrl,
  grpc.credentials.createInsecure() // In a real prod it would be createSsl() for secure gRPC
);

const walletClient = new walletProto.WalletService(
  walletServiceUrl,
  grpc.credentials.createInsecure()
);

// ─── Helper: promisify gRPC call ─────────────────────────────────────────────

function callGrpc(client: any, method: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    client[method](payload, (err: any, response: any) => {
      if (err) {
        reject(new Error(err.details || err.message));
      } else resolve(response);
    });
  });
}

// ─── Exported Server Actions ─────────────────────────────────────────────────

export async function createUser(email: string, name: string) {
  try {
    const response = await callGrpc(userClient, "CreateUser", { email, name });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserById(id: string) {
  try {
    const response = await callGrpc(userClient, "GetUserById", { id });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createWallet(userId: string) {
  try {
    const response = await callGrpc(walletClient, "CreateWallet", { userId });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWallet(userId: string) {
  try {
    const response = await callGrpc(walletClient, "GetWallet", { userId });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function creditWallet(userId: string, amount: number) {
  try {
    const response = await callGrpc(walletClient, "CreditWallet", {
      userId,
      amount,
    });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function debitWallet(userId: string, amount: number) {
  try {
    const response = await callGrpc(walletClient, "DebitWallet", {
      userId,
      amount,
    });
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

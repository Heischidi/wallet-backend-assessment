"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createUser,
  getUserById,
  createWallet,
  getWallet,
  creditWallet,
  debitWallet,
} from "@/app/actions";
import {
  Wallet,
  User,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Search,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

export default function Dashboard() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [searchId, setSearchId] = useState("");
  const [amount, setAmount] = useState("");

  const showNotification = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createUser(email, name);
    if (res.success) {
      setActiveUser(res.data);
      showNotification("success", "User created successfully!");

      // Auto create wallet
      const walletRes = await createWallet(res.data.id);
      if (walletRes.success) {
        setWallet(walletRes.data);
        showNotification("success", "Wallet automatically created!");
      }
    } else {
      showNotification("error", res.error || "Failed to create user");
    }
    setLoading(false);
  };

  const handleFetchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    setLoading(true);
    const res = await getUserById(searchId);
    if (res.success) {
      setActiveUser(res.data);
      refreshWallet(res.data.id);
      showNotification("success", "User found!");
    } else {
      showNotification("error", "User not found");
      setActiveUser(null);
      setWallet(null);
    }
    setLoading(false);
  };

  const refreshWallet = async (userId: string) => {
    const res = await getWallet(userId);
    if (res.success) {
      setWallet(res.data);
    } else {
      setWallet(null);
    }
  };

  const handleTransaction = async (type: "credit" | "debit") => {
    if (!activeUser || !amount || isNaN(Number(amount))) return;
    setLoading(true);

    const res =
      type === "credit"
        ? await creditWallet(activeUser.id, Number(amount))
        : await debitWallet(activeUser.id, Number(amount));

    if (res.success) {
      setWallet(res.data);
      showNotification("success", `Wallet ${type}ed by $${amount}`);
      setAmount("");
    } else {
      showNotification("error", res.error || `Failed to ${type}`);
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
              notification.type === "success"
                ? "bg-green-950/80 border-green-500/30 text-green-300"
                : "bg-red-950/80 border-red-500/30 text-red-300"
            } backdrop-blur-md`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column: Identity Management */}
      <div className="lg:col-span-5 space-y-6">
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Identity Management</h2>
          </div>

          <form onSubmit={handleFetchUser} className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-500" />
              </div>
              <input
                type="text"
                placeholder="Find User by ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute inset-y-1.5 right-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-semibold tracking-wide transition-colors"
              >
                FETCH
              </button>
            </div>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-neutral-950 px-2 text-xs text-neutral-500 uppercase tracking-widest font-semibold">
                OR CREATE NEW
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="jane@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              CREATE IDENTITY
            </button>
          </form>
        </GlassCard>
      </div>

      {/* Right Column: Wallet Actions */}
      <div className="lg:col-span-7 space-y-6">
        {activeUser ? (
          <GlassCard className="border-emerald-500/20 bg-emerald-500/[0.02]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {activeUser.name}
                  </h3>
                  <p className="text-emerald-400/80 font-mono text-xs mt-1">
                    {activeUser.email}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-400">
                ID: {activeUser.id.substring(0, 8)}...
              </div>
            </div>

            <div className="bg-neutral-950/50 rounded-2xl p-6 border border-neutral-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-32 h-32 text-emerald-500" />
              </div>

              <p className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> AVAILABLE
                BALANCE
              </p>

              <div className="flex items-end gap-3 mb-8 relative z-10">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  ${wallet ? Number(wallet.balance).toFixed(2) : "0.00"}
                </span>
                <span
                  className="text-emerald-500 font-medium pb-2 flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors"
                  onClick={() => refreshWallet(activeUser.id)}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Sync
                </span>
              </div>

              {wallet && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 relative z-10">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-lg"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex gap-3 sm:mt-6">
                    <button
                      onClick={() => handleTransaction("credit")}
                      disabled={loading || !amount}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ArrowDownCircle className="w-5 h-5" />
                      CREDIT
                    </button>
                    <button
                      onClick={() => handleTransaction("debit")}
                      disabled={loading || !amount}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ArrowUpCircle className="w-5 h-5" />
                      DEBIT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="h-full flex flex-col items-center justify-center min-h-[400px] border-neutral-800/50">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 mb-6">
              <Wallet className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-xl font-medium text-neutral-300 mb-2">
              No Active Wallet
            </h3>
            <p className="text-neutral-500 text-sm text-center max-w-sm">
              Create a new user identity or lookup an existing one to access
              wallet operations.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

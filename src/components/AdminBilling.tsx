import React, { useState } from 'react';
import { PaymentInvoice, UserPersona } from '../types';
import { INITIAL_PAYMENTS } from '../data/mockData';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Download, 
  ShieldCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  PieChart, 
  Users, 
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Check,
  FileSpreadsheet,
  Settings2,
  FileText
} from 'lucide-react';

interface AdminBillingProps {
  invoices?: PaymentInvoice[];
  onAddPayment?: (invoice: PaymentInvoice) => void;
  activePersona: UserPersona;
  onNavigateTab?: (tab: string) => void;
}

export const AdminBilling: React.FC<AdminBillingProps> = ({
  invoices: initialInvoices = INITIAL_PAYMENTS,
  onAddPayment,
  activePersona,
  onNavigateTab,
}) => {
  const [invoices, setInvoices] = useState<PaymentInvoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showBudgetAlertModal, setShowBudgetAlertModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [topUpTokens, setTopUpTokens] = useState<number>(50_000_000);
  const [accountName, setAccountName] = useState<string>('Acme AI Global Engineering');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [alertEmail, setAlertEmail] = useState<string>('billing@acme.ai');
  const [alertSavedSuccess, setAlertSavedSuccess] = useState<boolean>(false);

  // Financial aggregates
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.amountUsd, 0);
  const totalSavingsDelivered = invoices.reduce((acc, curr) => acc + curr.savingsGeneratedUsd, 0);
  const totalTokensBilled = invoices.reduce((acc, curr) => acc + curr.tokensCovered, 0);

  const handleSimulatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice: PaymentInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      accountName: accountName,
      role: 'enterprise_seat',
      planName: 'Enterprise Scale Dynamic Token Pool',
      amountUsd: Number(topUpAmount),
      tokensCovered: Number(topUpTokens),
      savingsGeneratedUsd: Number(topUpAmount) * 3.8, // 3.8x baseline frontier savings multiplier
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'Corporate Visa ending in 4921',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    if (onAddPayment) {
      onAddPayment(newInvoice);
    }
    setShowTopUpModal(false);
    setSelectedInvoice(newInvoice);
  };

  const handleSaveBudgetAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSavedSuccess(true);
    setTimeout(() => {
      setAlertSavedSuccess(false);
      setShowBudgetAlertModal(false);
    }, 1200);
  };

  const handleExportCsv = () => {
    const headers = ['Invoice_Number', 'Account_Name', 'Role', 'Plan_Name', 'Date', 'Amount_USD', 'Tokens_Covered', 'Savings_Generated_USD', 'Status'];
    const rows = invoices.map(i => [
      `"${i.invoiceNumber}"`,
      `"${i.accountName}"`,
      `"${i.role}"`,
      `"${i.planName}"`,
      `"${i.date}"`,
      i.amountUsd,
      i.tokensCovered,
      i.savingsGeneratedUsd,
      `"${i.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-billing-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDownloadInvoiceReceipt = (inv: PaymentInvoice) => {
    const receiptText = `
============================================================
              WHYOR DISPATCH ENTERPRISE INVOICE
============================================================
Invoice Number: ${inv.invoiceNumber}
Invoice ID:     ${inv.id}
Date:           ${inv.date}
Account Name:   ${inv.accountName}
Account Role:   ${inv.role}
Plan:           ${inv.planName}
Status:         ${inv.status.toUpperCase()} (VERIFIED)

------------------------------------------------------------
TOKEN & COMPUTATIONAL CONSUMPTION BREAKDOWN:
------------------------------------------------------------
Allocated Token Pool:   ${inv.tokensCovered.toLocaleString()} tokens
Net Paid Amount:        $${inv.amountUsd.toFixed(2)} USD
WhyOr Dispatch Savings: +$${inv.savingsGeneratedUsd.toFixed(2)} USD (Delivered)
Cryptographic Hash:     ${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}
Payment Rail:           Automated Corporate Clearing / Stripe Connect

Thank you for choosing WhyOr Dispatch Intelligent AI Router.
============================================================
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${inv.invoiceNumber}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <CreditCard className="w-3.5 h-3.5" /> Enterprise Billing & Financial Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              Token Budgets, Invoices & <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ROI Tracking</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Real-time audit trails of token consumption, payment settlements, and net savings delivered versus un-routed frontier model baselines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <button
              id="budget-alert-btn"
              onClick={() => setShowBudgetAlertModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Budget Alerts</span>
            </button>

            <button
              id="export-invoices-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="topup-payment-btn"
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Simulate Top-Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">TOTAL TOKEN POOL BILLED</div>
          <div className="text-2xl font-bold text-white mt-1">
            {(totalTokensBilled / 1_000_000).toFixed(0)}M
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Across {invoices.length} active invoices</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">NET BILLING SETTLED</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">100% On-time automated clearing</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-emerald-400/30 rounded-2xl p-5 shadow-xl shadow-emerald-500/5">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">CUMULATIVE SAVINGS DELIVERED</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            +${totalSavingsDelivered.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">380% ROI vs Frontier Only</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">CURRENT BILLING STATUS</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            Active · Pro
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tier-cap enforcement: LIVE</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Payment & Settlement Ledger
            </div>
            <h3 className="text-lg font-display font-bold text-white mt-0.5">
              Itemized Invoice History
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any row to inspect itemized token telemetry and download receipt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                <th className="py-3 pr-4">Invoice #</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Plan Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Savings Delivered</th>
                <th className="py-3 pl-4 text-right">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 pr-4 font-bold text-white flex items-center gap-1.5 group-hover:text-cyan-300">
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-white">
                    {inv.accountName}
                    <div className="text-[10px] text-slate-400">{inv.role}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {inv.planName}
                    <div className="text-[10px] text-cyan-400 font-semibold">{(inv.tokensCovered / 1_000_000).toFixed(0)}M Token Allocation</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4 text-white font-bold">
                    ${inv.amountUsd.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                    +${inv.savingsGeneratedUsd.toFixed(2)}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold backdrop-blur-md ${
                        inv.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                      }`}>
                        {inv.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadInvoiceReceipt(inv);
                        }}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Download Receipt Text"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Invoice Breakdown: {selectedInvoice.invoiceNumber}
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400">BILLED ACCOUNT</div>
                  <div className="text-white font-bold mt-0.5">{selectedInvoice.accountName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SETTLEMENT DATE</div>
                  <div className="text-white font-bold mt-0.5">{selectedInvoice.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">TOTAL AMOUNT</div>
                  <div className="text-cyan-400 font-bold mt-0.5 text-sm">${selectedInvoice.amountUsd.toFixed(2)} USD</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SAVINGS DELIVERED</div>
                  <div className="text-emerald-400 font-bold mt-0.5 text-sm">+${selectedInvoice.savingsGeneratedUsd.toFixed(2)} USD</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-slate-300 font-bold uppercase">Token Pool Allocation:</div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Tokens Included:</span>
                    <span className="text-white font-bold">{selectedInvoice.tokensCovered.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Low Tier (Flash/Haiku):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.7).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mid/High Tier (Sonnet/GPT-4o):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.25).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frontier/Reasoning (Pro/R1):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.05).toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoiceReceipt(selectedInvoice)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Simulate Dynamic Token Top-Up
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePaymentSubmit} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">ACCOUNT / DEPARTMENT</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">TOP-UP AMOUNT ($ USD)</label>
                  <input
                    type="number"
                    step="50"
                    min="50"
                    value={topUpAmount}
                    onChange={(e) => {
                      const amt = Number(e.target.value);
                      setTopUpAmount(amt);
                      setTopUpTokens(amt * 100_000);
                    }}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ALLOCATED TOKENS</label>
                  <input
                    type="number"
                    step="1000000"
                    value={topUpTokens}
                    onChange={(e) => setTopUpTokens(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-200">
                ⚡ Simulated Instant Settlement via WhyOr Stripe Connect. Adds {(topUpTokens / 1_000_000).toFixed(0)}M tokens immediately to active workspace pool.
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
                >
                  Confirm & Charge Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Alerts Modal */}
      {showBudgetAlertModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                Configure Automated Budget Alerts
              </div>
              <button
                onClick={() => setShowBudgetAlertModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudgetAlerts} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">ALERT NOTIFICATION EMAIL</label>
                <input
                  type="email"
                  required
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">THRESHOLD TRIGGER PERCENTAGE</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-white font-bold w-12 text-right">{alertThreshold}%</span>
                </div>
              </div>

              {alertSavedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Budget alert webhooks saved successfully!</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBudgetAlertModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
                >
                  Save Alert Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

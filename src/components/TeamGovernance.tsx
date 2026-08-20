import React, { useState } from 'react';
import { TeamAccount, TeamMember, ModelTier, UserPersona } from '../types';
import { INITIAL_TEAM_ACCOUNT } from '../data/mockData';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Sliders, 
  SlidersHorizontal,
  DollarSign, 
  Sparkles, 
  Clock, 
  Check, 
  Lock, 
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  CheckCircle2
} from 'lucide-react';

interface TeamGovernanceProps {
  team?: TeamAccount;
  onUpdateMemberTierCap?: (memberId: string, newTierCap: ModelTier) => void;
  onAddMember?: (newMember: TeamMember) => void;
  activePersona: UserPersona;
  onNavigateTab?: (tab: string) => void;
}

export const TeamGovernance: React.FC<TeamGovernanceProps> = ({
  team: initialTeam = INITIAL_TEAM_ACCOUNT,
  onUpdateMemberTierCap,
  onAddMember,
  activePersona,
  onNavigateTab,
}) => {
  const [team, setTeam] = useState<TeamAccount>(initialTeam);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Invite state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviteTierCap, setInviteTierCap] = useState<ModelTier>('high');
  const [inviteQuota, setInviteQuota] = useState<number>(20_000_000);

  // Department Budget state
  const [deptBudget, setDeptBudget] = useState<number>(team.monthlyBudgetUsd);
  const [deptBudgetSaved, setDeptBudgetSaved] = useState<boolean>(false);

  // Edit Quota state
  const [editQuotaVal, setEditQuotaVal] = useState<number>(20_000_000);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now().toString(36)}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      tierCap: inviteTierCap,
      monthlyTokenQuota: Number(inviteQuota),
      monthlyTokensUsed: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    setTeam((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));

    if (onAddMember) {
      onAddMember(newMember);
    }

    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  const handleUpdateMemberTier = (memberId: string, newTierCap: ModelTier) => {
    setTeam((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId ? { ...m, tierCap: newTierCap } : m
      ),
    }));
    if (onUpdateMemberTierCap) {
      onUpdateMemberTierCap(memberId, newTierCap);
    }
  };

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setTeam((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === editingMember.id
          ? { ...m, monthlyTokenQuota: Number(editQuotaVal) }
          : m
      ),
    }));
    setEditingMember(null);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setTeam((prev) => ({
      ...prev,
      monthlyBudgetUsd: deptBudget,
    }));
    setDeptBudgetSaved(true);
    setTimeout(() => {
      setDeptBudgetSaved(false);
      setShowBudgetModal(false);
    }, 1000);
  };

  const handleExportTeamCsv = () => {
    const headers = ['User_ID', 'Full_Name', 'Email', 'Role', 'Tier_Cap', 'Quota_Tokens', 'Used_Tokens', 'Status', 'Joined_Date'];
    const rows = team.members.map(m => [
      `"${m.id}"`,
      `"${m.name}"`,
      `"${m.email}"`,
      `"${m.role}"`,
      `"${m.tierCap}"`,
      m.monthlyTokenQuota,
      m.monthlyTokensUsed,
      `"${m.status}"`,
      `"${m.joinedAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-team-roster-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalMonthlyTokensUsed = team.members.reduce((acc, m) => acc + m.monthlyTokensUsed, 0);
  const totalMonthlyTokensQuota = team.members.reduce((acc, m) => acc + m.monthlyTokenQuota, 0);
  const percentTokensUsed = Math.min(100, Math.round((totalMonthlyTokensUsed / totalMonthlyTokensQuota) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Users className="w-3.5 h-3.5" /> Multi-Tenant Team & Policy Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              Team Seats, Tier Caps & <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Model Quotas</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Enforce least-privilege model access across team seats. Restrict junior developers from burning expensive frontier tokens while giving architects uninhibited deep-reasoning access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <button
              id="export-team-csv-btn"
              onClick={handleExportTeamCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Roster CSV</span>
            </button>

            {activePersona.canManagePlatform && (
              <button
                id="adjust-budget-btn"
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Budget Cap</span>
              </button>
            )}

            {activePersona.canManagePlatform && (
              <button
                id="invite-member-btn"
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team Aggregates Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">ORGANIZATION WORKSPACE</div>
          <div className="text-xl font-display font-bold text-white mt-1">{team.name}</div>
          <div className="text-slate-400 text-[11px] mt-1">Tier: <strong className="text-amber-400 uppercase">{team.tierPlan}</strong></div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">MONTHLY TOKEN CONSUMPTION</div>
          <div className="text-xl font-bold text-white mt-1">
            {(totalMonthlyTokensUsed / 1_000_000).toFixed(1)}M / {(totalMonthlyTokensQuota / 1_000_000).toFixed(0)}M
          </div>
          <div className="w-full bg-slate-950/60 rounded-full h-2 mt-2 overflow-hidden border border-white/10">
            <div
              className={`h-full ${percentTokensUsed > 85 ? 'bg-amber-400' : 'bg-cyan-400'}`}
              style={{ width: `${percentTokensUsed}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">MONTHLY BUDGET SPEND CAP</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${team.currentMonthSpendUsd.toFixed(2)} / ${team.monthlyBudgetUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-sans">
            Auto-throttles requests when budget exceeds 100%
          </div>
        </div>
      </div>

      {/* Team Members Governance Table */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
              Team Member Seats ({team.members.length} Active)
            </div>
            <h3 className="text-lg font-display font-bold text-white mt-0.5">
              Access Controls & Tier Entitlements
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Changes apply instantly to live dispatch requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                <th className="py-3 pr-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Model Tier Cap</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Monthly Quota</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {team.members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3 font-mono">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-white text-sm font-semibold">No Team Members Registered Yet</h4>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Team governance provides fine-grained model access control, monthly token quotas, role-based budget caps, and cryptographic auditability across your organization.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                        >
                          + Add Team Member
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                team.members.map((m) => {
                const usedPct = (m.monthlyTokensUsed / m.monthlyTokenQuota) * 100;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-white font-sans text-sm">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-white/10 text-slate-300 border border-white/10">
                        {m.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {activePersona.canManagePlatform ? (
                        <select
                          value={m.tierCap}
                          onChange={(e) => handleUpdateMemberTier(m.id, e.target.value as any)}
                          className="bg-slate-950/70 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                        >
                          <option value="low">Low (Fast)</option>
                          <option value="mid">Mid (Balanced)</option>
                          <option value="high">High (Code/Sonnet)</option>
                          <option value="frontier">Frontier (Gemini Pro)</option>
                          <option value="deep_reasoning">Deep Reasoning</option>
                        </select>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          {m.tierCap}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        <Check className="w-3 h-3" /> {m.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-36">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{(m.monthlyTokensUsed / 1_000_000).toFixed(1)}M</span>
                          <span>/ {(m.monthlyTokenQuota / 1_000_000).toFixed(0)}M</span>
                        </div>
                        <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-white/10">
                          <div
                            className={`h-full ${usedPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                            style={{ width: `${Math.min(100, usedPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {m.joinedAt}
                    </td>

                    <td className="py-3.5 pl-4 text-right">
                      {activePersona.canManagePlatform && (
                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setEditQuotaVal(m.monthlyTokenQuota);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-400/20 text-[10px] font-mono flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Quota</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Invite Team Member to {team.name}
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">WORK EMAIL</label>
                <input
                  type="email"
                  required
                  placeholder="jordan@acme.ai"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SEAT ROLE</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    <option value="member">Team Member</option>
                    <option value="admin">Team Admin</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MODEL TIER CAP</label>
                  <select
                    value={inviteTierCap}
                    onChange={(e) => setInviteTierCap(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    <option value="low">Low (Fast)</option>
                    <option value="mid">Mid (Balanced)</option>
                    <option value="high">High (Balanced/Sonnet)</option>
                    <option value="frontier">Frontier (Gemini Pro)</option>
                    <option value="deep_reasoning">Deep Reasoning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">MONTHLY TOKEN QUOTA</label>
                <input
                  type="number"
                  step="1000000"
                  value={inviteQuota}
                  onChange={(e) => setInviteQuota(Number(e.target.value))}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Edit Monthly Quota for {editingMember.name}
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">MONTHLY TOKEN ALLOCATION</label>
                <input
                  type="number"
                  step="1000000"
                  value={editQuotaVal}
                  onChange={(e) => setEditQuotaVal(Number(e.target.value))}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
                >
                  Save Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                Adjust Workspace Budget Spend Cap
              </div>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">MONTHLY SPEND CAP ($ USD)</label>
                <input
                  type="number"
                  step="250"
                  min="500"
                  value={deptBudget}
                  onChange={(e) => setDeptBudget(Number(e.target.value))}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              {deptBudgetSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Budget spend cap updated!</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
                >
                  Update Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

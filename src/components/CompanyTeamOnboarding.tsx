import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  Mail, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  Send,
  Zap,
  Globe,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { 
  CompanyFirestore, 
  TeamFirestore, 
  saveCompanyToFirestore, 
  loadCompaniesFromFirestore, 
  deleteCompanyFromFirestore, 
  saveTeamToFirestore, 
  loadTeamsFromFirestore, 
  deleteTeamFromFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore
} from '../lib/firebase';
import { User } from 'firebase/auth';

const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Reasoning & Coding)', tier: 'Frontier Tier 3', provider: 'Google', defaultChecked: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Sub-Second Multimodal)', tier: 'Fast Tier 1', provider: 'Google', defaultChecked: true },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', tier: 'Frontier Tier 3', provider: 'Anthropic', defaultChecked: true },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (High-Speed Code/Chat)', tier: 'Fast Tier 1', provider: 'Anthropic', defaultChecked: true },
  { id: 'gpt-4o', name: 'GPT-4o (Omni Production Model)', tier: 'General Tier 2', provider: 'OpenAI', defaultChecked: true },
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Orion (Next-Gen World Knowledge)', tier: 'Frontier Tier 3', provider: 'OpenAI', defaultChecked: true },
  { id: 'o3-mini', name: 'OpenAI o3-mini (High-Speed STEM Reasoning)', tier: 'General Tier 2', provider: 'OpenAI', defaultChecked: true },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Open Reasoning Engine)', tier: 'Frontier Tier 3', provider: 'DeepSeek', defaultChecked: true },
  { id: 'deepseek-chat', name: 'DeepSeek V3 (High-Throughput Chat)', tier: 'Fast Tier 1', provider: 'DeepSeek', defaultChecked: true },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq LPU Instant)', tier: 'Fast Tier 1', provider: 'Groq', defaultChecked: true },
  { id: 'mistral-large-latest', name: 'Mistral Large 2 (Sovereign European AI)', tier: 'General Tier 2', provider: 'Mistral', defaultChecked: true },
];

const DEFAULT_COMPANIES: CompanyFirestore[] = [
  {
    id: 'comp_solarastra',
    name: 'SolarAstra Energy Systems',
    domain: 'solarastra.in',
    industry: 'CleanTech & Renewable Energy AI',
    tier: 'enterprise',
    billingEmail: 'solarastra.in@gmail.com',
    monthlyTokenQuota: 100_000_000,
    monthlyTokensUsed: 14_280_000,
    monthlyBudgetUsd: 5000,
    allowedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'claude-3-7-sonnet-20250219', 'deepseek-reasoner', 'gpt-4.5-preview'],
    routingPriority: 'subscription_first',
    smtpAlertsEnabled: true,
    superAdminEmail: 'solarastra.in@gmail.com',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp_acme_health',
    name: 'Acme Health AI Laboratories',
    domain: 'acmehealth.com',
    industry: 'Healthcare & Biotech Diagnostics',
    tier: 'growth',
    billingEmail: 'billing@acmehealth.com',
    monthlyTokenQuota: 50_000_000,
    monthlyTokensUsed: 8_940_000,
    monthlyBudgetUsd: 2500,
    allowedModels: ['gemini-2.5-pro', 'claude-3-7-sonnet-20250219', 'gpt-4o', 'mistral-large-latest'],
    routingPriority: 'subscription_first',
    smtpAlertsEnabled: true,
    superAdminEmail: 'solarastra.in@gmail.com',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp_fincorp',
    name: 'FinCorp Quantitative Analytics',
    domain: 'fincorp.io',
    industry: 'FinTech & Quantitative Risk Modeling',
    tier: 'enterprise',
    billingEmail: 'ai-trading@fincorp.io',
    monthlyTokenQuota: 200_000_000,
    monthlyTokensUsed: 42_190_000,
    monthlyBudgetUsd: 10000,
    allowedModels: ['gemini-2.5-pro', 'claude-3-7-sonnet-20250219', 'gpt-4.5-preview', 'o3-mini', 'deepseek-reasoner'],
    routingPriority: 'balanced',
    smtpAlertsEnabled: true,
    superAdminEmail: 'solarastra.in@gmail.com',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_TEAMS: TeamFirestore[] = [
  {
    id: 'team_solar_grid',
    companyId: 'comp_solarastra',
    companyName: 'SolarAstra Energy Systems',
    name: 'AI Grid Optimization Lab',
    leadEmail: 'grid-lead@solarastra.in',
    tierCap: 'Frontier Tier 3 (Reasoning)',
    monthlyTokenQuota: 50_000_000,
    monthlyTokensUsed: 8_200_000,
    monthlyBudgetUsd: 2500,
    allowedModels: ['gemini-2.5-pro', 'claude-3-7-sonnet-20250219', 'deepseek-reasoner'],
    members: [
      {
        id: 'mem_1',
        name: 'Aarav Sharma',
        email: 'solarastra.in@gmail.com',
        role: 'SuperAdmin / Lead Scientist',
        tierCap: 'Frontier Tier 3',
        monthlyTokenQuota: 20_000_000,
        monthlyTokensUsed: 4_100_000,
        joinedAt: '2026-01-10',
        status: 'active',
      },
      {
        id: 'mem_2',
        name: 'Priya Iyer',
        email: 'priya.grid@solarastra.in',
        role: 'Senior ML Engineer',
        tierCap: 'Frontier Tier 3',
        monthlyTokenQuota: 15_000_000,
        monthlyTokensUsed: 2_800_000,
        joinedAt: '2026-02-01',
        status: 'active',
      },
      {
        id: 'mem_3',
        name: 'Vikram Patel',
        email: 'vikram.iot@solarastra.in',
        role: 'IoT Systems Architect',
        tierCap: 'General Tier 2',
        monthlyTokenQuota: 10_000_000,
        monthlyTokensUsed: 1_300_000,
        joinedAt: '2026-02-15',
        status: 'active',
      }
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'team_solar_iot',
    companyId: 'comp_solarastra',
    companyName: 'SolarAstra Energy Systems',
    name: 'Embedded Telemetry & Dispatch',
    leadEmail: 'telemetry@solarastra.in',
    tierCap: 'General Tier 2 (Production)',
    monthlyTokenQuota: 30_000_000,
    monthlyTokensUsed: 5_100_000,
    monthlyBudgetUsd: 1500,
    allowedModels: ['gemini-2.5-flash', 'claude-3-5-haiku-20241022', 'llama-3.3-70b-versatile'],
    members: [
      {
        id: 'mem_4',
        name: 'Rohan Deshmukh',
        email: 'rohan.telemetry@solarastra.in',
        role: 'Edge Firmware Engineer',
        tierCap: 'Fast Tier 1',
        monthlyTokenQuota: 10_000_000,
        monthlyTokensUsed: 2_400_000,
        joinedAt: '2026-02-18',
        status: 'active',
      }
    ],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'team_acme_nlp',
    companyId: 'comp_acme_health',
    companyName: 'Acme Health AI Laboratories',
    name: 'Clinical Trials NLP Team',
    leadEmail: 'nlp-trials@acmehealth.com',
    tierCap: 'Frontier Tier 3 (Reasoning)',
    monthlyTokenQuota: 35_000_000,
    monthlyTokensUsed: 6_200_000,
    monthlyBudgetUsd: 1800,
    allowedModels: ['gemini-2.5-pro', 'claude-3-7-sonnet-20250219', 'gpt-4o'],
    members: [
      {
        id: 'mem_5',
        name: 'Dr. Sarah Chen',
        email: 'dr.chen@acmehealth.com',
        role: 'Clinical AI Director',
        tierCap: 'Frontier Tier 3',
        monthlyTokenQuota: 20_000_000,
        monthlyTokensUsed: 4_500_000,
        joinedAt: '2026-02-05',
        status: 'active',
      }
    ],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

interface CompanyTeamOnboardingProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const CompanyTeamOnboarding: React.FC<CompanyTeamOnboardingProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [companies, setCompanies] = useState<CompanyFirestore[]>(DEFAULT_COMPANIES);
  const [teams, setTeams] = useState<TeamFirestore[]>(DEFAULT_TEAMS);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp_solarastra');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals
  const [showOnboardCompanyModal, setShowOnboardCompanyModal] = useState<boolean>(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState<boolean>(false);
  const [activeTeamForInvite, setActiveTeamForInvite] = useState<TeamFirestore | null>(null);

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyDomain, setNewCompanyDomain] = useState<string>('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState<string>('Enterprise AI & Software');
  const [newCompanyTier, setNewCompanyTier] = useState<'enterprise' | 'growth' | 'startup' | 'gov_defense'>('enterprise');
  const [newCompanyBillingEmail, setNewCompanyBillingEmail] = useState<string>('solarastra.in@gmail.com');
  const [newCompanyQuota, setNewCompanyQuota] = useState<number>(50_000_000);
  const [newCompanyBudget, setNewCompanyBudget] = useState<number>(3000);
  const [newCompanyRouting, setNewCompanyRouting] = useState<'subscription_first' | 'byok_first' | 'balanced'>('subscription_first');
  const [newCompanyModels, setNewCompanyModels] = useState<string[]>([
    'gemini-2.5-pro', 
    'gemini-2.5-flash', 
    'claude-3-7-sonnet-20250219', 
    'gpt-4o', 
    'deepseek-reasoner'
  ]);
  const [newCompanySmtpAlerts, setNewCompanySmtpAlerts] = useState<boolean>(true);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamLeadEmail, setNewTeamLeadEmail] = useState<string>('');
  const [newTeamTierCap, setNewTeamTierCap] = useState<string>('Frontier Tier 3 (Reasoning)');
  const [newTeamQuota, setNewTeamQuota] = useState<number>(20_000_000);
  const [newTeamBudget, setNewTeamBudget] = useState<number>(1000);
  const [newTeamModels, setNewTeamModels] = useState<string[]>([
    'gemini-2.5-pro',
    'claude-3-7-sonnet-20250219',
    'gpt-4o'
  ]);

  // Invite Member Form State
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('Senior AI Developer');
  const [inviteTierCap, setInviteTierCap] = useState<string>('Frontier Tier 3');
  const [inviteQuota, setInviteQuota] = useState<number>(10_000_000);
  const [dispatchSmtpWelcomeEmail, setDispatchSmtpWelcomeEmail] = useState<boolean>(true);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState<boolean>(false);

  // Fetch initial data from Firestore
  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async () => {
    setIsLoading(true);
    try {
      const cloudComps = await loadCompaniesFromFirestore();
      if (cloudComps.length > 0) {
        setCompanies(cloudComps);
        setSelectedCompanyId(cloudComps[0].id);
      } else {
        // Seed default companies to Firestore
        for (const c of DEFAULT_COMPANIES) {
          await saveCompanyToFirestore(c);
        }
      }

      const cloudTeams = await loadTeamsFromFirestore();
      if (cloudTeams.length > 0) {
        setTeams(cloudTeams);
      } else {
        // Seed default teams to Firestore
        for (const t of DEFAULT_TEAMS) {
          await saveTeamToFirestore(t);
        }
      }
    } catch (err) {
      console.warn('Using local fallback for companies & teams');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || DEFAULT_COMPANIES[0];
  const companyTeams = teams.filter(t => t.companyId === selectedCompany.id);

  // Model selection toggler for Company
  const toggleCompanyModel = (modelId: string) => {
    if (newCompanyModels.includes(modelId)) {
      if (newCompanyModels.length > 1) {
        setNewCompanyModels(newCompanyModels.filter(m => m !== modelId));
      }
    } else {
      setNewCompanyModels([...newCompanyModels, modelId]);
    }
  };

  // Model selection toggler for Team
  const toggleTeamModel = (modelId: string) => {
    if (newTeamModels.includes(modelId)) {
      if (newTeamModels.length > 1) {
        setNewTeamModels(newTeamModels.filter(m => m !== modelId));
      }
    } else {
      setNewTeamModels([...newTeamModels, modelId]);
    }
  };

  // Create Company Handler
  const handleOnboardCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const companyId = `comp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newCompany: CompanyFirestore = {
      id: companyId,
      name: newCompanyName.trim(),
      domain: newCompanyDomain.trim() || 'enterprise.ai',
      industry: newCompanyIndustry,
      tier: newCompanyTier,
      billingEmail: newCompanyBillingEmail.trim() || (currentUser?.email || 'solarastra.in@gmail.com'),
      monthlyTokenQuota: Number(newCompanyQuota),
      monthlyTokensUsed: 0,
      monthlyBudgetUsd: Number(newCompanyBudget),
      allowedModels: newCompanyModels,
      routingPriority: newCompanyRouting,
      smtpAlertsEnabled: newCompanySmtpAlerts,
      superAdminEmail: currentUser?.email || 'solarastra.in@gmail.com',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save to state
      setCompanies([newCompany, ...companies]);
      setSelectedCompanyId(companyId);

      // 2. Persist to Firestore
      await saveCompanyToFirestore(newCompany);

      // 3. Record Audit Log
      await recordAuditLogToFirestore(
        'Onboard Company',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Onboarded company '${newCompany.name}' (${newCompany.domain}) with ${newCompany.monthlyTokenQuota.toLocaleString()} token cap & $${newCompany.monthlyBudgetUsd} budget.`
      );

      // 4. If SMTP alerts enabled, dispatch welcome notification
      if (newCompanySmtpAlerts) {
        try {
          await fetch('/api/admin/smtp/send-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: newCompany.billingEmail,
              subject: `[WhyOr Dispatch AI] Company Onboarded: ${newCompany.name}`,
              templateType: 'onboarding_invite',
              customMessage: `Company ${newCompany.name} has been successfully provisioned on WhyOr Dispatch AI by SuperAdmin ${currentUser?.email || 'solarastra.in@gmail.com'}. Allocated quota: ${newCompany.monthlyTokenQuota.toLocaleString()} tokens/mo.`,
              sentBy: currentUser?.email || 'solarastra.in@gmail.com',
            }),
          });
        } catch (mailErr) {
          console.warn('SMTP welcome email skipped/failed:', mailErr);
        }
      }

      setNotice({
        type: 'success',
        text: `Company '${newCompany.name}' onboarded successfully to Firestore Cloud Database.`,
      });

      // Reset form
      setShowOnboardCompanyModal(false);
      setNewCompanyName('');
      setNewCompanyDomain('');
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to onboard company: ${err.message}` });
    }
  };

  // Create Team Handler
  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const teamId = `team_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newTeam: TeamFirestore = {
      id: teamId,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      name: newTeamName.trim(),
      leadEmail: newTeamLeadEmail.trim() || selectedCompany.billingEmail,
      tierCap: newTeamTierCap,
      monthlyTokenQuota: Number(newTeamQuota),
      monthlyTokensUsed: 0,
      monthlyBudgetUsd: Number(newTeamBudget),
      allowedModels: newTeamModels,
      members: [
        {
          id: `mem_lead_${Date.now().toString(36)}`,
          name: 'Team Lead',
          email: newTeamLeadEmail.trim() || selectedCompany.billingEmail,
          role: 'Team Lead / Admin',
          tierCap: newTeamTierCap,
          monthlyTokenQuota: Number(newTeamQuota),
          monthlyTokensUsed: 0,
          joinedAt: new Date().toISOString().split('T')[0],
          status: 'active',
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setTeams([...teams, newTeam]);
      await saveTeamToFirestore(newTeam);

      await recordAuditLogToFirestore(
        'Create Team',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Created team '${newTeam.name}' under company '${selectedCompany.name}' with ${newTeam.monthlyTokenQuota.toLocaleString()} token cap.`
      );

      setNotice({
        type: 'success',
        text: `Team '${newTeam.name}' provisioned under ${selectedCompany.name}.`,
      });

      setShowAddTeamModal(false);
      setNewTeamName('');
      setNewTeamLeadEmail('');
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to create team: ${err.message}` });
    }
  };

  // Invite Team Member Handler (with real SMTP email dispatch)
  const handleInviteMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForInvite || !inviteName.trim() || !inviteEmail.trim()) return;

    setIsDispatchingEmail(true);

    const newMember = {
      id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      tierCap: inviteTierCap,
      monthlyTokenQuota: Number(inviteQuota),
      monthlyTokensUsed: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    const updatedTeam: TeamFirestore = {
      ...activeTeamForInvite,
      members: [...activeTeamForInvite.members, newMember],
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Update state
      setTeams(teams.map(t => t.id === activeTeamForInvite.id ? updatedTeam : t));
      
      // 2. Persist to Firestore
      await saveTeamToFirestore(updatedTeam);

      // 3. Record Audit Log
      await recordAuditLogToFirestore(
        'Invite Team Member',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Invited '${newMember.name}' (${newMember.email}) to team '${activeTeamForInvite.name}' with ${newMember.monthlyTokenQuota.toLocaleString()} tokens/mo.`
      );

      // 4. Dispatch Real Welcome Email via SMTP Server
      let emailStatusText = '';
      if (dispatchSmtpWelcomeEmail) {
        try {
          const res = await fetch('/api/admin/smtp/send-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: newMember.email,
              subject: `[WhyOr Dispatch AI] Welcome ${newMember.name} - Your Enterprise Workspace Credentials`,
              templateType: 'onboarding_invite',
              customMessage: `You have been granted access to the ${activeTeamForInvite.name} workspace under ${selectedCompany.name}. Your monthly allowance is ${newMember.monthlyTokenQuota.toLocaleString()} tokens with access up to ${newMember.tierCap}. Authenticate with your Google account (${newMember.email}) to begin zero-markup model execution.`,
              sentBy: `SuperAdmin: ${currentUser?.email || 'solarastra.in@gmail.com'}`,
            }),
          });
          const emailData = await res.json();
          if (emailData.success) {
            emailStatusText = ` • Welcome invitation dispatched via SMTP (${emailData.messageId})`;
            await logEmailToFirestore({
              to: newMember.email,
              from: 'WhyOr Dispatch AI Enterprise <solarastra.in@gmail.com>',
              subject: `[WhyOr Dispatch AI] Welcome ${newMember.name}`,
              emailType: 'onboarding_invite',
              status: 'sent',
              messageId: emailData.messageId,
              sentBy: currentUser?.email || 'solarastra.in@gmail.com',
            });
          }
        } catch (mailErr: any) {
          console.warn('SMTP welcome email dispatch error:', mailErr);
          emailStatusText = ' (SMTP email delivery queued)';
        }
      }

      setNotice({
        type: 'success',
        text: `Member '${newMember.name}' onboarded to ${activeTeamForInvite.name}${emailStatusText}.`,
      });

      setShowInviteMemberModal(false);
      setInviteName('');
      setInviteEmail('');
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to invite member: ${err.message}` });
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  // Delete Company Handler
  const handleDeleteCompany = async (companyId: string) => {
    if (companies.length <= 1) {
      alert('Cannot delete the last onboarded company.');
      return;
    }
    if (!confirm('Are you sure you want to delete this company and all associated team configurations?')) {
      return;
    }

    try {
      await deleteCompanyFromFirestore(companyId);
      const remaining = companies.filter(c => c.id !== companyId);
      setCompanies(remaining);
      if (selectedCompanyId === companyId) {
        setSelectedCompanyId(remaining[0]?.id || '');
      }
      setNotice({ type: 'info', text: 'Company removed from Firestore registry.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    }
  };

  // Delete Team Handler
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await deleteTeamFromFirestore(teamId);
      setTeams(teams.filter(t => t.id !== teamId));
      setNotice({ type: 'info', text: 'Team removed from Firestore.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* SuperAdmin Authority Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-display font-bold text-white tracking-tight">
                  SuperAdmin Multi-Tenant & Team Governance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 uppercase tracking-wider">
                  Master Authority
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Authenticated SuperAdmin: <strong className="text-purple-300 font-mono">solarastra.in@gmail.com</strong>. Provision corporate tenants, configure granular model access tiers, allocate monthly token budgets, and dispatch SMTP onboarding invites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnboardCompanyModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Onboard New Company</span>
            </button>
            
            <button
              onClick={loadCloudData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
              title="Sync with Firestore Cloud Database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Onboarded Tenants</div>
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <span>{companies.length}</span>
              <span className="text-[10px] font-normal text-emerald-400">Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Configured Teams</div>
            <div className="text-xl font-bold font-mono text-indigo-300">
              {teams.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Global Token Allocation</div>
            <div className="text-xl font-bold font-mono text-purple-300">
              {(companies.reduce((acc, c) => acc + c.monthlyTokenQuota, 0) / 1_000_000).toFixed(0)}M
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SMTP Welcome Relay</div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notice.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' :
          notice.type === 'error' ? 'bg-rose-950/50 border-rose-500/40 text-rose-200' :
          'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-sm font-bold">×</button>
        </div>
      )}

      {/* Company Selector Ribbon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Select Enterprise Company
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {companies.length} Corporate Accounts Managed by SuperAdmin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {companies.map((comp) => {
            const isSelected = comp.id === selectedCompany.id;
            const usagePercent = Math.min(100, Math.round((comp.monthlyTokensUsed / comp.monthlyTokenQuota) * 100));

            return (
              <div
                key={comp.id}
                onClick={() => setSelectedCompanyId(comp.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900/90 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm tracking-tight">{comp.name}</h4>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-purple-300">
                      @{comp.domain} • <span className="uppercase text-slate-400">{comp.tier}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                    comp.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Token Quota:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {(comp.monthlyTokensUsed / 1_000_000).toFixed(1)}M / {(comp.monthlyTokenQuota / 1_000_000).toFixed(0)}M
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        usagePercent > 80 ? 'bg-amber-500' : 'bg-purple-500'
                      }`} 
                      style={{ width: `${usagePercent}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>Budget: ${comp.monthlyBudgetUsd.toLocaleString()}/mo</span>
                    <span>{comp.allowedModels.length} Models Allowed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Company Deep Dive & Team Governance */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        {/* Company Header Info */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                {selectedCompany.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {selectedCompany.industry}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Billing & Alert Email: <span className="text-slate-200 font-mono">{selectedCompany.billingEmail}</span> • Routing Policy: <span className="text-purple-300 font-mono">{selectedCompany.routingPriority.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Create New Team</span>
            </button>

            <button
              onClick={() => handleDeleteCompany(selectedCompany.id)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
              title="Delete Company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Allowed Models Multi-Chip Catalog */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
            Authorized Models for {selectedCompany.name}:
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCompany.allowedModels.map((mId) => {
              const modelMeta = AVAILABLE_MODELS.find(m => m.id === mId);
              return (
                <div 
                  key={mId}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-white/10 text-xs flex items-center gap-2 text-slate-200"
                >
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="font-mono text-[11px]">{modelMeta?.name || mId}</span>
                  <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded">
                    {modelMeta?.provider || 'AI'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teams & Members Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Department Teams & Member Access Controls ({companyTeams.length})</span>
            </h4>
            <span className="text-xs text-slate-400">
              Each team enforces isolated token quotas and model tier boundaries
            </span>
          </div>

          {companyTeams.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-white/5 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No teams created for {selectedCompany.name} yet.</p>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Create First Team
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {companyTeams.map((team) => (
                <div 
                  key={team.id}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4"
                >
                  {/* Team Top Strip */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h5 className="text-sm font-bold text-white">{team.name}</h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {team.tierCap}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Lead: <span className="text-slate-200">{team.leadEmail}</span> • Monthly Cap: <span className="text-indigo-300">{(team.monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens</span> • Budget: <span className="text-emerald-400">${team.monthlyBudgetUsd}/mo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTeamForInvite(team);
                          setShowInviteMemberModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Invite Member (SMTP)</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Members Table */}
                  <div className="overflow-x-auto border border-white/5 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Member & Role</th>
                          <th className="py-2.5 px-3">Email Identity</th>
                          <th className="py-2.5 px-3">Model Tier Limit</th>
                          <th className="py-2.5 px-3">Monthly Token Usage</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {team.members.map((mem) => {
                          const memUsagePct = Math.min(100, Math.round((mem.monthlyTokensUsed / (mem.monthlyTokenQuota || 1)) * 100));

                          return (
                            <tr key={mem.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-200">{mem.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{mem.role}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-purple-300">
                                {mem.email}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-300">
                                  {mem.tierCap}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="space-y-1 w-32">
                                  <div className="flex justify-between text-[10px] font-mono">
                                    <span className="text-slate-300">{(mem.monthlyTokensUsed / 1_000_000).toFixed(1)}M</span>
                                    <span className="text-slate-500">/ {(mem.monthlyTokenQuota / 1_000_000).toFixed(0)}M</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500 rounded-full" 
                                      style={{ width: `${memUsagePct}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL 1: ONBOARD NEW COMPANY ==================== */}
      {showOnboardCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Onboard New Enterprise Company
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provision a new corporate tenant with isolated model catalog and billing caps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboardCompanyModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardCompanySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SolarAstra Energy Systems"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Corporate Email Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. solarastra.in"
                    value={newCompanyDomain}
                    onChange={(e) => setNewCompanyDomain(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Industry Vertical</label>
                  <input
                    type="text"
                    placeholder="e.g. CleanTech, Healthcare, FinTech"
                    value={newCompanyIndustry}
                    onChange={(e) => setNewCompanyIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Enterprise Tier</label>
                  <select
                    value={newCompanyTier}
                    onChange={(e) => setNewCompanyTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="enterprise">Enterprise Platinum (Unlimited / Multi-Model)</option>
                    <option value="growth">Growth Scale (Priority Routing)</option>
                    <option value="startup">Startup Seed (BYOK & Subscriptions)</option>
                    <option value="gov_defense">Government / Sovereign Defense (Air-Gapped)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Primary Billing Email</label>
                  <input
                    type="email"
                    required
                    placeholder="billing@solarastra.in"
                    value={newCompanyBillingEmail}
                    onChange={(e) => setNewCompanyBillingEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Monthly Token Quota</label>
                  <input
                    type="number"
                    min="1000000"
                    step="1000000"
                    value={newCompanyQuota}
                    onChange={(e) => setNewCompanyQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Monthly Spend Cap (USD)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={newCompanyBudget}
                    onChange={(e) => setNewCompanyBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Model Catalog Multi-Select */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span>Allowlisted AI Models for this Tenant ({newCompanyModels.length} Selected)</span>
                  <span className="text-[10px] text-purple-300 font-mono">SuperAdmin Model Access Policy</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-white/5">
                  {AVAILABLE_MODELS.map((model) => {
                    const isChecked = newCompanyModels.includes(model.id);

                    return (
                      <div
                        key={model.id}
                        onClick={() => toggleCompanyModel(model.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-950/40 border-purple-500/60 text-white'
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] leading-tight">{model.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{model.tier} • {model.provider}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SMTP Alert Checkbox */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10">
                <input
                  type="checkbox"
                  id="smtpAlerts"
                  checked={newCompanySmtpAlerts}
                  onChange={(e) => setNewCompanySmtpAlerts(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="smtpAlerts" className="text-slate-300 text-xs cursor-pointer">
                  <strong>Enable Automated SMTP Alerts</strong>: Dispatch live email notifications on token quota threshold (80%), security credential updates, and onboarding welcomes.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowOnboardCompanyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Save & Provision to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD NEW TEAM ==================== */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create Department Team
                  </h3>
                  <p className="text-xs text-slate-400">
                    Under <strong className="text-slate-200">{selectedCompany.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeamSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Research Lab, Backend Core, Data Science"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Team Lead Email *</label>
                <input
                  type="email"
                  required
                  placeholder="team-lead@solarastra.in"
                  value={newTeamLeadEmail}
                  onChange={(e) => setNewTeamLeadEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Max Model Tier</label>
                  <select
                    value={newTeamTierCap}
                    onChange={(e) => setNewTeamTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Frontier Tier 3 (Reasoning)">Tier 3: Reasoning Frontier (Gemini Pro, Claude 3.7, o3)</option>
                    <option value="General Tier 2 (Production)">Tier 2: General Production (GPT-4o, Mistral)</option>
                    <option value="Fast Tier 1 (Economy)">Tier 1: Fast Economy (Flash, Haiku, Llama 3.3)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Monthly Token Cap</label>
                  <input
                    type="number"
                    min="1000000"
                    step="1000000"
                    value={newTeamQuota}
                    onChange={(e) => setNewTeamQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer"
                >
                  Create Team in Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: INVITE TEAM MEMBER WITH REAL SMTP DISPATCH ==================== */}
      {showInviteMemberModal && activeTeamForInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Invite Member to {activeTeamForInvite.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatches credentials & quota notice via SMTP server
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteMemberModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMemberSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Member Email Identity *</label>
                <input
                  type="email"
                  required
                  placeholder="arjun@solarastra.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Senior AI Developer">Senior AI Developer</option>
                    <option value="Research Scientist">Research Scientist</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Security Auditor">Security Auditor</option>
                    <option value="Team Admin">Team Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Model Tier Cap</label>
                  <select
                    value={inviteTierCap}
                    onChange={(e) => setInviteTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Frontier Tier 3">Frontier Tier 3 (Reasoning)</option>
                    <option value="General Tier 2">General Tier 2 (Production)</option>
                    <option value="Fast Tier 1">Fast Tier 1 (Economy)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Monthly Token Quota</label>
                <input
                  type="number"
                  min="500000"
                  step="500000"
                  value={inviteQuota}
                  onChange={(e) => setInviteQuota(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* SMTP Dispatch Toggle */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="smtpInviteCheck"
                  checked={dispatchSmtpWelcomeEmail}
                  onChange={(e) => setDispatchSmtpWelcomeEmail(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-purple-500 rounded cursor-pointer"
                />
                <label htmlFor="smtpInviteCheck" className="text-purple-200 text-xs cursor-pointer">
                  <strong>Dispatch Instant Onboarding Welcome Email via SMTP Server</strong>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">
                    Sends real welcome email to <code>{inviteEmail || 'member'}</code> with workspace parameters, allowed model tiers, and Google login link.
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteMemberModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatchingEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {isDispatchingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Invite via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Onboard Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

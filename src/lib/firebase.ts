import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  deleteDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom Database ID if specified
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

// Real Google Sign-In with Popup
export async function signInWithGoogle(): Promise<{ user: User; idToken: string }> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Persist user profile to Firestore
    await saveUserProfile(user);

    return { user, idToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Auth State Change Listener
export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Profile Firestore Sync
export async function saveUserProfile(user: User, role: string = 'superadmin') {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      photoURL: user.photoURL || '',
      role: user.email === 'solarastra.in@gmail.com' ? 'superadmin' : role,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to persist user profile to Firestore:', err);
  }
}

// ==================== FIRESTORE PERSISTENCE HELPERS ====================

// 1. Credentials Persistence
export async function saveCredentialToFirestore(provider: string, data: any) {
  try {
    const credRef = doc(db, 'credentials', provider);
    await setDoc(credRef, {
      ...data,
      provider,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error(`Error saving credential for ${provider} to Firestore:`, err);
  }
}

export async function loadAllCredentialsFromFirestore(): Promise<Record<string, any>> {
  try {
    const snap = await getDocs(collection(db, 'credentials'));
    const result: Record<string, any> = {};
    snap.forEach((docSnap) => {
      result[docSnap.id] = docSnap.data();
    });
    return result;
  } catch (err) {
    console.error('Error loading credentials from Firestore:', err);
    return {};
  }
}

// 2. SMTP Settings Persistence (Admin Console)
export interface SmtpConfigFirestore {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string;
  passMasked?: string;
  passRaw?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  isVerified: boolean;
  lastVerifiedAt?: string;
  updatedAt?: string;
}

export async function saveSmtpSettingsToFirestore(settings: Partial<SmtpConfigFirestore>) {
  try {
    const smtpRef = doc(db, 'smtp_settings', 'global_smtp');
    await setDoc(smtpRef, {
      ...settings,
      id: 'global_smtp',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving SMTP settings to Firestore:', err);
  }
}

export async function loadSmtpSettingsFromFirestore(): Promise<SmtpConfigFirestore | null> {
  try {
    const docSnap = await getDoc(doc(db, 'smtp_settings', 'global_smtp'));
    if (docSnap.exists()) {
      return docSnap.data() as SmtpConfigFirestore;
    }
    return null;
  } catch (err) {
    console.error('Error loading SMTP settings from Firestore:', err);
    return null;
  }
}

// 2b. Email Templates Persistence (HTML & Text Customization for Billing/System Notifications)
export interface EmailTemplateConfig {
  id: string;
  name: string;
  category: 'billing' | 'system' | 'security' | 'onboarding' | 'verification';
  subject: string;
  htmlBody: string;
  textBody?: string;
  description: string;
  variables: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export async function saveEmailTemplateToFirestore(template: EmailTemplateConfig) {
  try {
    const templateRef = doc(db, 'email_templates', template.id);
    await setDoc(templateRef, {
      ...template,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error(`Error saving email template ${template.id} to Firestore:`, err);
  }
}

export async function saveAllEmailTemplatesToFirestore(templates: Record<string, EmailTemplateConfig>) {
  try {
    const promises = Object.values(templates).map((template) => saveEmailTemplateToFirestore(template));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error saving all email templates to Firestore:', err);
  }
}

export async function loadEmailTemplatesFromFirestore(): Promise<Record<string, EmailTemplateConfig> | null> {
  try {
    const snap = await getDocs(collection(db, 'email_templates'));
    if (snap.empty) {
      return null;
    }
    const result: Record<string, EmailTemplateConfig> = {};
    snap.forEach((docSnap) => {
      result[docSnap.id] = docSnap.data() as EmailTemplateConfig;
    });
    return result;
  } catch (err) {
    console.error('Error loading email templates from Firestore:', err);
    return null;
  }
}

// 3. Email Logs
export async function logEmailToFirestore(log: {
  to: string;
  from: string;
  subject: string;
  emailType: string;
  status: 'sent' | 'failed';
  messageId?: string;
  errorMessage?: string;
  sentBy?: string;
}) {
  try {
    const logId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'email_logs', logId);
    await setDoc(logRef, {
      ...log,
      id: logId,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving email log to Firestore:', err);
  }
}

export async function loadEmailLogsFromFirestore(limitCount: number = 50): Promise<any[]> {
  try {
    const q = query(collection(db, 'email_logs'), orderBy('sentAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach((d) => logs.push(d.data()));
    return logs;
  } catch (err) {
    console.error('Error loading email logs from Firestore:', err);
    return [];
  }
}

// 4. Dispatch Ledger & Context Ledger Persistence
export async function saveDispatchRecordToFirestore(entry: any) {
  try {
    const ledgerId = entry.taskId || entry.id || `dispatch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ledgerRef = doc(db, 'dispatch_ledger', ledgerId);
    await setDoc(ledgerRef, {
      ...entry,
      id: ledgerId,
      timestamp: entry.timestamp || new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving dispatch record to Firestore:', err);
  }
}

export async function saveLedgerEntryToFirestore(entry: any) {
  return saveDispatchRecordToFirestore(entry);
}

export async function loadDispatchLedgerFromFirestore(limitCount: number = 100): Promise<any[]> {
  try {
    const q = query(collection(db, 'dispatch_ledger'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const entries: any[] = [];
    snap.forEach((d) => entries.push(d.data()));
    return entries;
  } catch (err) {
    console.error('Error loading dispatch ledger from Firestore:', err);
    return [];
  }
}

export async function loadLedgerFromFirestore(limitCount: number = 100): Promise<any[]> {
  return loadDispatchLedgerFromFirestore(limitCount);
}

// 5. Context Sessions Persistence (With Firestore as Default, or Transient Local only when toggled)
export async function saveContextSessionToFirestore(
  sessionIdOrObj: string | { id: string; [key: string]: any },
  sessionData?: any
) {
  let id = typeof sessionIdOrObj === 'string' ? sessionIdOrObj : sessionIdOrObj.id;
  let data = typeof sessionIdOrObj === 'string' ? (sessionData || {}) : sessionIdOrObj;

  // Only persist to Firestore if persistenceMode is firestore_cloud (DEFAULT)
  if (data.persistenceMode === 'local_transient') {
    return;
  }

  try {
    const sessionRef = doc(db, 'context_sessions', id || `ctx_${Date.now()}`);
    await setDoc(sessionRef, {
      ...data,
      id: id || `ctx_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving context session to Firestore:', err);
  }
}

export async function loadContextSessionsFromFirestore(): Promise<any[]> {
  try {
    const q = query(collection(db, 'context_sessions'), orderBy('updatedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const sessions: any[] = [];
    snap.forEach((d) => sessions.push(d.data()));
    return sessions;
  } catch (err) {
    console.error('Error loading context sessions from Firestore:', err);
    return [];
  }
}

// 6. Audit Logs
export async function recordAuditLogToFirestore(action: string, category: string, actor: string, details: string) {
  try {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const auditRef = doc(db, 'audit_logs', logId);
    await setDoc(auditRef, {
      id: logId,
      action,
      category,
      actor,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error recording audit log to Firestore:', err);
  }
}

export async function loadAuditLogsFromFirestore(limitCount: number = 50): Promise<any[]> {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach((d) => logs.push(d.data()));
    return logs;
  } catch (err) {
    console.error('Error loading audit logs from Firestore:', err);
    return [];
  }
}

// 7. Companies & Enterprise Onboarding Persistence
export interface CompanyFirestore {
  id: string;
  name: string;
  domain: string;
  industry: string;
  tier: 'enterprise' | 'growth' | 'startup' | 'gov_defense';
  billingEmail: string;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  monthlyBudgetUsd: number;
  allowedModels: string[];
  routingPriority: 'subscription_first' | 'byok_first' | 'balanced' | 'latency_optimized';
  smtpAlertsEnabled: boolean;
  superAdminEmail: string;
  status: 'active' | 'paused' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export async function saveCompanyToFirestore(company: CompanyFirestore): Promise<void> {
  try {
    const compRef = doc(db, 'companies', company.id);
    await setDoc(compRef, {
      ...company,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving company to Firestore:', err);
    throw err;
  }
}

export async function loadCompaniesFromFirestore(): Promise<CompanyFirestore[]> {
  try {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const comps: CompanyFirestore[] = [];
    snap.forEach((d) => comps.push(d.data() as CompanyFirestore));
    return comps;
  } catch (err) {
    console.error('Error loading companies from Firestore:', err);
    return [];
  }
}

export async function deleteCompanyFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'companies', id));
  } catch (err) {
    console.error('Error deleting company from Firestore:', err);
    throw err;
  }
}

// 8. Teams & Granular Access Controls Persistence
export interface TeamFirestore {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  leadEmail: string;
  tierCap: string;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  monthlyBudgetUsd: number;
  allowedModels: string[];
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    tierCap: string;
    monthlyTokenQuota: number;
    monthlyTokensUsed: number;
    joinedAt: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function saveTeamToFirestore(team: TeamFirestore): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', team.id);
    await setDoc(teamRef, {
      ...team,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving team to Firestore:', err);
    throw err;
  }
}

export async function loadTeamsFromFirestore(companyId?: string): Promise<TeamFirestore[]> {
  try {
    const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const teams: TeamFirestore[] = [];
    snap.forEach((d) => {
      const data = d.data() as TeamFirestore;
      if (!companyId || data.companyId === companyId) {
        teams.push(data);
      }
    });
    return teams;
  } catch (err) {
    console.error('Error loading teams from Firestore:', err);
    return [];
  }
}

export async function deleteTeamFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teams', id));
  } catch (err) {
    console.error('Error deleting team from Firestore:', err);
    throw err;
  }
}

// ==================== 9. USER 7-DAY TRIAL & SUBSCRIPTION TRACKING ====================
export interface UserTrialInfo {
  uid: string;
  email: string;
  displayName: string;
  plan: 'free_trial' | 'pro' | 'enterprise';
  planType?: string;
  isPaidPlan?: boolean;
  signupDate: string;
  trialStartDate: string;
  trialEndDate: string;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  trialDaysTotal: number;
  daysRemaining: number;
  isTrialActive: boolean;
  isExpired: boolean;
  emailVerified?: boolean;
  hasConfiguredByok: boolean;
  isByokConfigured?: boolean;
  dailyTokensUsed: number;
  dailyTokenLimit: number;
  totalTokensProcessed: number;
  totalDispatches: number;
  updatedAt: string;
}

export async function saveUserTrialToFirestore(trial: Partial<UserTrialInfo> & { uid: string; email: string }): Promise<UserTrialInfo> {
  try {
    const userDocRef = doc(db, 'user_trials', trial.uid);
    const existingSnap = await getDoc(userDocRef);
    
    let now = new Date();
    let signupDate = trial.signupDate || trial.trialStartedAt || (existingSnap.exists() ? existingSnap.data().signupDate : now.toISOString());
    let trialStartDate = trial.trialStartDate || trial.trialStartedAt || (existingSnap.exists() ? existingSnap.data().trialStartDate : now.toISOString());
    
    // Calculate trial end (7 days from start)
    let startDateObj = new Date(trialStartDate);
    let endDateObj = new Date(startDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
    let trialEndDate = trial.trialEndDate || trial.trialExpiresAt || endDateObj.toISOString();
    
    let msRemaining = new Date(trialEndDate).getTime() - now.getTime();
    let daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    let isTrialActive = trial.isTrialActive ?? (daysRemaining > 0);
    let isExpired = daysRemaining <= 0 && (trial.plan === 'free_trial' || !trial.plan);

    const fullData: UserTrialInfo = {
      uid: trial.uid,
      email: trial.email,
      displayName: trial.displayName || trial.email.split('@')[0] || 'User',
      plan: trial.plan || (trial.isPaidPlan ? 'pro' : (existingSnap.exists() ? existingSnap.data().plan : 'free_trial')),
      planType: trial.planType || (trial.isPaidPlan ? 'pro' : 'free_trial'),
      isPaidPlan: trial.isPaidPlan ?? (trial.plan === 'pro' || trial.plan === 'enterprise'),
      signupDate,
      trialStartDate,
      trialEndDate,
      trialStartedAt: signupDate,
      trialExpiresAt: trialEndDate,
      trialDaysTotal: 7,
      daysRemaining,
      isTrialActive,
      isExpired,
      hasConfiguredByok: trial.hasConfiguredByok ?? trial.isByokConfigured ?? (existingSnap.exists() ? existingSnap.data().hasConfiguredByok : false),
      isByokConfigured: trial.hasConfiguredByok ?? trial.isByokConfigured ?? (existingSnap.exists() ? existingSnap.data().hasConfiguredByok : false),
      dailyTokensUsed: trial.dailyTokensUsed ?? (existingSnap.exists() ? existingSnap.data().dailyTokensUsed : 0),
      dailyTokenLimit: trial.dailyTokenLimit ?? 100000,
      totalTokensProcessed: trial.totalTokensProcessed ?? (existingSnap.exists() ? existingSnap.data().totalTokensProcessed : 0),
      totalDispatches: trial.totalDispatches ?? (existingSnap.exists() ? existingSnap.data().totalDispatches : 0),
      updatedAt: now.toISOString(),
    };

    await setDoc(userDocRef, fullData, { merge: true });
    return fullData;
  } catch (err) {
    console.error('Error saving user trial to Firestore:', err);
    throw err;
  }
}

export async function getUserTrialFromFirestore(uid: string, email?: string): Promise<UserTrialInfo | null> {
  try {
    const userDocRef = doc(db, 'user_trials', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserTrialInfo;
      const now = new Date();
      const trialEndDate = data.trialEndDate || data.trialExpiresAt || new Date().toISOString();
      const msRemaining = new Date(trialEndDate).getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      return {
        ...data,
        daysRemaining,
        trialExpiresAt: trialEndDate,
        trialStartedAt: data.trialStartDate || data.signupDate,
        isTrialActive: daysRemaining > 0,
        isExpired: daysRemaining <= 0 && data.plan === 'free_trial',
        isPaidPlan: data.isPaidPlan || data.plan === 'pro' || data.plan === 'enterprise',
        isByokConfigured: data.hasConfiguredByok || data.isByokConfigured,
      };
    }
    if (email) {
      // Auto-initialize 7-day free trial on first retrieval
      return await saveUserTrialToFirestore({ uid, email });
    }
    return null;
  } catch (err) {
    console.error('Error loading user trial from Firestore:', err);
    return null;
  }
}

export async function loadAllUserTrialsFromFirestore(): Promise<UserTrialInfo[]> {
  try {
    const q = query(collection(db, 'user_trials'), orderBy('signupDate', 'desc'), limit(100));
    const snap = await getDocs(q);
    const trials: UserTrialInfo[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserTrialInfo;
      const now = new Date();
      const trialEndDate = data.trialEndDate || data.trialExpiresAt || new Date().toISOString();
      const msRemaining = new Date(trialEndDate).getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      trials.push({
        ...data,
        daysRemaining,
        trialExpiresAt: trialEndDate,
        trialStartedAt: data.trialStartDate || data.signupDate,
        isTrialActive: daysRemaining > 0,
        isExpired: daysRemaining <= 0 && data.plan === 'free_trial',
        isPaidPlan: data.isPaidPlan || data.plan === 'pro' || data.plan === 'enterprise',
        isByokConfigured: data.hasConfiguredByok || data.isByokConfigured,
      });
    });
    return trials;
  } catch (err) {
    console.error('Error loading user trials list from Firestore:', err);
    return [];
  }
}

// ==================== 10. CONTACT US INQUIRIES ====================
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  topic: 'enterprise_quote' | 'custom_onprem' | 'sla_security' | 'byok_integration' | 'billing_api' | 'general';
  message: string;
  status: 'new' | 'in_review' | 'contacted' | 'resolved' | 'closed';
  createdAt: string;
}

export async function saveContactInquiryToFirestore(inquiry: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>): Promise<ContactInquiry> {
  try {
    const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullInquiry: ContactInquiry = {
      ...inquiry,
      id,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'contact_inquiries', id), fullInquiry);
    
    // Also record an audit log
    await recordAuditLogToFirestore('CONTACT_INQUIRY_RECEIVED', 'support', inquiry.email, `Inquiry: ${inquiry.topic} from ${inquiry.name}`);

    return fullInquiry;
  } catch (err) {
    console.error('Error saving contact inquiry to Firestore:', err);
    throw err;
  }
}

export async function updateContactInquiryStatusInFirestore(id: string, status: ContactInquiry['status']): Promise<void> {
  try {
    const docRef = doc(db, 'contact_inquiries', id);
    await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error updating inquiry status:', err);
  }
}

export async function loadContactInquiriesFromFirestore(): Promise<ContactInquiry[]> {
  try {
    const q = query(collection(db, 'contact_inquiries'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const inquiries: ContactInquiry[] = [];
    snap.forEach((d) => inquiries.push(d.data() as ContactInquiry));
    return inquiries;
  } catch (err) {
    console.error('Error loading contact inquiries from Firestore:', err);
    return [];
  }
}

// ==================== 11. ADMIN AI ENGINE KEYS & BUDGET CONFIGURATION ====================
export interface AdminKeyConfig {
  id: string;
  provider: string;
  providerName: string;
  providerDisplayName: string;
  modelFamily: string;
  envVarName: string;
  apiKey?: string;
  keyMasked: string;
  keyRaw?: string;
  isActive: boolean;
  status: 'active' | 'warning' | 'budget_exceeded' | 'day_limit_exceeded' | 'invalid';
  monthlyBudgetCents: number; // in USD dollars
  monthlyBudgetLimit: number;
  currentMonthlySpendUsd: number;
  currentSpend: number;
  dailyUsageLimitUsd: number;
  dailyUsageLimit: number;
  todaySpendUsd: number;
  todaySpend: number;
  isBudgetOver: boolean;
  isDayUsageOver: boolean;
  alertEmailSent: boolean;
  lastUpdated: string;
  notes?: string;
}

const DEFAULT_ADMIN_KEYS: AdminKeyConfig[] = [
  {
    id: 'key_gemini',
    provider: 'gemini',
    providerName: 'Google Gemini Pro / Flash 2.5',
    providerDisplayName: 'Google Gemini',
    modelFamily: 'gemini',
    envVarName: 'GEMINI_API_KEY',
    apiKey: '',
    keyMasked: 'AIza••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 500,
    monthlyBudgetLimit: 500,
    currentMonthlySpendUsd: 142.30,
    currentSpend: 142.30,
    dailyUsageLimitUsd: 50,
    dailyUsageLimit: 50,
    todaySpendUsd: 18.20,
    todaySpend: 18.20,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'key_claude',
    provider: 'anthropic',
    providerName: 'Anthropic Claude 3.7 Sonnet',
    providerDisplayName: 'Anthropic Claude',
    modelFamily: 'claude',
    envVarName: 'ANTHROPIC_API_KEY',
    apiKey: '',
    keyMasked: 'sk-ant-••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 800,
    monthlyBudgetLimit: 800,
    currentMonthlySpendUsd: 285.50,
    currentSpend: 285.50,
    dailyUsageLimitUsd: 60,
    dailyUsageLimit: 60,
    todaySpendUsd: 34.10,
    todaySpend: 34.10,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'key_openai',
    provider: 'openai',
    providerName: 'OpenAI GPT-4o & o3-mini',
    providerDisplayName: 'OpenAI',
    modelFamily: 'openai',
    envVarName: 'OPENAI_API_KEY',
    apiKey: '',
    keyMasked: 'sk-proj-••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 600,
    monthlyBudgetLimit: 600,
    currentMonthlySpendUsd: 190.80,
    currentSpend: 190.80,
    dailyUsageLimitUsd: 40,
    dailyUsageLimit: 40,
    todaySpendUsd: 12.50,
    todaySpend: 12.50,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'key_deepseek',
    provider: 'deepseek',
    providerName: 'DeepSeek R1 & V3',
    providerDisplayName: 'DeepSeek',
    modelFamily: 'deepseek',
    envVarName: 'DEEPSEEK_API_KEY',
    apiKey: '',
    keyMasked: 'sk-••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 300,
    monthlyBudgetLimit: 300,
    currentMonthlySpendUsd: 45.20,
    currentSpend: 45.20,
    dailyUsageLimitUsd: 25,
    dailyUsageLimit: 25,
    todaySpendUsd: 6.40,
    todaySpend: 6.40,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'key_groq',
    provider: 'groq',
    providerName: 'Groq Llama-3.3 70B (LPUs)',
    providerDisplayName: 'Groq',
    modelFamily: 'groq',
    envVarName: 'GROQ_API_KEY',
    apiKey: '',
    keyMasked: 'gsk_••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 200,
    monthlyBudgetLimit: 200,
    currentMonthlySpendUsd: 18.90,
    currentSpend: 18.90,
    dailyUsageLimitUsd: 20,
    dailyUsageLimit: 20,
    todaySpendUsd: 3.20,
    todaySpend: 3.20,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'key_mistral',
    provider: 'mistral',
    providerName: 'Mistral Large 2',
    providerDisplayName: 'Mistral',
    modelFamily: 'mistral',
    envVarName: 'MISTRAL_API_KEY',
    apiKey: '',
    keyMasked: 'mistral_••••••••••••••••',
    isActive: true,
    status: 'active',
    monthlyBudgetCents: 250,
    monthlyBudgetLimit: 250,
    currentMonthlySpendUsd: 28.40,
    currentSpend: 28.40,
    dailyUsageLimitUsd: 20,
    dailyUsageLimit: 20,
    todaySpendUsd: 4.10,
    todaySpend: 4.10,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
  }
];

export async function saveAdminKeyConfigToFirestore(config: AdminKeyConfig): Promise<void> {
  try {
    const docRef = doc(db, 'admin_ai_keys', config.id);
    
    const monthlyLimit = config.monthlyBudgetLimit ?? config.monthlyBudgetCents ?? 500;
    const currentSpend = config.currentSpend ?? config.currentMonthlySpendUsd ?? 0;
    const dailyLimit = config.dailyUsageLimit ?? config.dailyUsageLimitUsd ?? 50;
    const todaySpend = config.todaySpend ?? config.todaySpendUsd ?? 0;

    // Recompute budget and day usage flags
    const isBudgetOver = monthlyLimit > 0 && currentSpend >= monthlyLimit;
    const isDayUsageOver = dailyLimit > 0 && todaySpend >= dailyLimit;
    let status = config.status;
    if (isBudgetOver) status = 'budget_exceeded';
    else if (isDayUsageOver) status = 'day_limit_exceeded';
    else if (config.isActive) status = 'active';

    const payload: AdminKeyConfig = {
      ...config,
      monthlyBudgetCents: monthlyLimit,
      monthlyBudgetLimit: monthlyLimit,
      currentMonthlySpendUsd: currentSpend,
      currentSpend: currentSpend,
      dailyUsageLimitUsd: dailyLimit,
      dailyUsageLimit: dailyLimit,
      todaySpendUsd: todaySpend,
      todaySpend: todaySpend,
      isBudgetOver,
      isDayUsageOver,
      status,
      lastUpdated: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error(`Error saving admin key config for ${config.id}:`, err);
    throw err;
  }
}

export async function loadAdminKeyConfigsFromFirestore(): Promise<AdminKeyConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'admin_ai_keys'));
    if (snap.empty) {
      // Seed default configs if none exist
      for (const def of DEFAULT_ADMIN_KEYS) {
        await setDoc(doc(db, 'admin_ai_keys', def.id), def);
      }
      return DEFAULT_ADMIN_KEYS;
    }
    const configs: AdminKeyConfig[] = [];
    snap.forEach((d) => {
      const data = d.data() as AdminKeyConfig;
      const monthlyLimit = data.monthlyBudgetLimit ?? data.monthlyBudgetCents ?? 500;
      const currentSpend = data.currentSpend ?? data.currentMonthlySpendUsd ?? 0;
      const dailyLimit = data.dailyUsageLimit ?? data.dailyUsageLimitUsd ?? 50;
      const todaySpend = data.todaySpend ?? data.todaySpendUsd ?? 0;

      const isBudgetOver = monthlyLimit > 0 && currentSpend >= monthlyLimit;
      const isDayUsageOver = dailyLimit > 0 && todaySpend >= dailyLimit;
      configs.push({
        ...data,
        providerName: data.providerName || data.providerDisplayName || data.provider,
        modelFamily: data.modelFamily || data.provider,
        monthlyBudgetLimit: monthlyLimit,
        monthlyBudgetCents: monthlyLimit,
        currentSpend: currentSpend,
        currentMonthlySpendUsd: currentSpend,
        dailyUsageLimit: dailyLimit,
        dailyUsageLimitUsd: dailyLimit,
        todaySpend: todaySpend,
        todaySpendUsd: todaySpend,
        isBudgetOver,
        isDayUsageOver,
      });
    });
    return configs;
  } catch (err) {
    console.error('Error loading admin key configs from Firestore:', err);
    return DEFAULT_ADMIN_KEYS;
  }
}

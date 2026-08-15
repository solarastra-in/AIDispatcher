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

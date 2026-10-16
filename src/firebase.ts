import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AuditResponse } from './types/compliance';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);

// Google Auth Provider configured for popups
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection on boot as mandated by security guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing:', error.message);
    }
  }
}
testConnection();

// Standardized error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile helper
export async function syncUserProfile(user: User) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userRef);
    const nowIso = new Date().toISOString();
    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Customs Auditor',
        photoURL: user.photoURL || '',
        createdAt: nowIso,
        lastLoginAt: nowIso,
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || existing.data()?.displayName || 'Customs Auditor',
          photoURL: user.photoURL || existing.data()?.photoURL || '',
          lastLoginAt: nowIso,
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Save audit to user subcollection
export async function saveUserAudit(userId: string, audit: AuditResponse) {
  const auditId = audit.audit_id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/audits/${auditId}`;
  try {
    const auditRef = doc(db, 'users', userId, 'audits', auditId);
    await setDoc(auditRef, {
      id: auditId,
      userId: userId,
      auditId: audit.audit_id,
      destinationCountry: audit.destination_country,
      documentType: audit.extracted_entities?.document_type || 'Customs Filing',
      auditStatus: audit.audit_status,
      riskScore: Math.round(audit.risk_score),
      riskLevel: audit.risk_level,
      timestamp: audit.timestamp || new Date().toISOString(),
      fileName: audit.document_file_name || 'Document',
      summary: audit.compliance_discrepancies?.slice(0, 2).join('; ') || 'Regulatory audit completed.',
      fullAuditJson: JSON.stringify(audit),
    });
  } catch (err) {
    console.warn('Could not save audit to cloud firestore:', err);
  }
}

// Fetch user audits from cloud
export async function getUserAudits(userId: string): Promise<AuditResponse[]> {
  const colPath = `users/${userId}/audits`;
  try {
    const auditsRef = collection(db, 'users', userId, 'audits');
    const q = query(auditsRef, orderBy('timestamp', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    const results: AuditResponse[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.fullAuditJson) {
        try {
          results.push(JSON.parse(data.fullAuditJson));
        } catch {
          // fallback construct
        }
      }
    });
    return results;
  } catch (err) {
    console.warn('Error fetching audits from Firestore:', err);
    return [];
  }
}

// Delete user audit
export async function deleteUserAudit(userId: string, auditId: string) {
  const cleanId = auditId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/audits/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'audits', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

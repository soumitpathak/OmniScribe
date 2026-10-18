import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuditResponse, AuditComment } from '../types/compliance';
import { UserProfile } from '../types/auth';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without this line specifying the custom firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Standard Error Handling per Firebase Integration Skill
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup per Firebase Integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or network restricted:', error.message);
    }
    return false;
  }
}

testConnection().catch(() => {});

// Authentication helpers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;
  // Sync profile to Firestore
  try {
    await syncUserProfileToFirestore({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Compliance Officer',
      photoURL: user.photoURL || '',
      role: 'Logistics Compliance Officer',
      company: 'Global Trade Customs Partner',
    });
  } catch (e) {
    console.warn('Could not sync user profile immediately to Firestore:', e);
  }
  return user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// User Profile Firestore Operations
export async function syncUserProfileToFirestore(profile: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  company?: string;
}): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(
      doc(db, 'users', profile.uid),
      {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName || 'Compliance Officer',
        photoURL: profile.photoURL || '',
        role: profile.role || 'Logistics Compliance Officer',
        company: profile.company || 'Global Logistics',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(uid: string): Promise<any | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Audit Record Firestore Operations
export async function saveAuditToFirestore(audit: AuditResponse, userUid: string): Promise<void> {
  const path = `audits/${audit.audit_id}`;
  try {
    const auditData = {
      ...audit,
      author_uid: userUid,
      updatedAt: new Date().toISOString(),
      createdAt: audit.timestamp || new Date().toISOString(),
    };
    await setDoc(doc(db, 'audits', audit.audit_id), auditData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAuditFromFirestore(auditId: string): Promise<void> {
  const path = `audits/${auditId}`;
  try {
    await deleteDoc(doc(db, 'audits', auditId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getAuditsFromFirestore(): Promise<AuditResponse[]> {
  const path = 'audits';
  try {
    const snap = await getDocs(collection(db, 'audits'));
    const list: AuditResponse[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AuditResponse);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export function subscribeAuditsFromFirestore(
  onData: (audits: AuditResponse[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = 'audits';
  return onSnapshot(
    collection(db, 'audits'),
    (snapshot) => {
      const audits: AuditResponse[] = [];
      snapshot.forEach((d) => {
        audits.push(d.data() as AuditResponse);
      });
      onData(audits);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Audit Comments Firestore Operations
export async function saveCommentToFirestore(
  auditId: string,
  comment: AuditComment,
  userUid: string
): Promise<void> {
  const path = `audits/${auditId}/comments/${comment.id}`;
  try {
    const commentData = {
      id: comment.id,
      audit_id: auditId,
      author_uid: userUid,
      author_name: comment.author_name,
      author_role: comment.author_role || 'Logistics Compliance Officer',
      author_avatar_color: comment.author_avatar_color || 'from-indigo-500 to-purple-600',
      content: comment.content,
      category: comment.category || 'GENERAL',
      priority: comment.priority || 'MEDIUM',
      resolved: Boolean(comment.is_resolved),
      is_pinned: Boolean(comment.is_pinned),
      created_at: comment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: comment.tags || [],
      mentions: comment.mentions || [],
      replies: comment.replies || [],
      target_item_ref: comment.target_item_ref || null,
    };
    await setDoc(doc(db, 'audits', auditId, 'comments', comment.id), commentData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCommentInFirestore(
  auditId: string,
  commentId: string,
  updates: Record<string, any>
): Promise<void> {
  const path = `audits/${auditId}/comments/${commentId}`;
  try {
    await updateDoc(doc(db, 'audits', auditId, 'comments', commentId), {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCommentFromFirestore(auditId: string, commentId: string): Promise<void> {
  const path = `audits/${auditId}/comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'audits', auditId, 'comments', commentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCommentsFromFirestore(
  auditId: string,
  onData: (comments: AuditComment[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `audits/${auditId}/comments`;
  return onSnapshot(
    collection(db, 'audits', auditId, 'comments'),
    (snapshot) => {
      const comments: AuditComment[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        comments.push({
          id: data.id || d.id,
          audit_id: data.audit_id || auditId,
          author_name: data.author_name || 'Compliance Officer',
          author_role: data.author_role || 'Customs Specialist',
          author_avatar_color: data.author_avatar_color || 'from-indigo-500 to-purple-600',
          created_at: data.created_at || new Date().toISOString(),
          category: data.category || 'GENERAL',
          priority: data.priority || 'MEDIUM',
          is_pinned: Boolean(data.is_pinned),
          is_resolved: Boolean(data.resolved),
          content: data.content || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          target_item_ref: data.target_item_ref || undefined,
          mentions: Array.isArray(data.mentions) ? data.mentions : [],
          replies: Array.isArray(data.replies) ? data.replies : [],
        } as AuditComment);
      });
      onData(comments);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

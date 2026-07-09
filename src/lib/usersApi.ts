import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';

export interface SystemUser {
  id: string;
  name: string;
  role: 'teacher' | 'secretary';
  password?: string;
  isDefault?: boolean;
  permissions?: string[];
  tenantId?: string;
}

export const getAllSystemUsers = async (): Promise<SystemUser[]> => {
  const usersRef = collection(db, 'system_users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => doc.data() as SystemUser);
};

export const getSystemUsersByTenant = async (tenantId: string): Promise<SystemUser[]> => {
  const usersRef = collection(db, 'system_users');
  const q = query(usersRef, where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SystemUser);
};

export const saveSystemUser = async (user: SystemUser): Promise<void> => {
  const userRef = doc(db, 'system_users', user.id);
  await setDoc(userRef, user);
};

export const deleteSystemUser = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'system_users', userId);
  await deleteDoc(userRef);
};

export const subscribeToSystemUsers = (tenantId: string, callback: (users: SystemUser[]) => void) => {
  const usersRef = collection(db, 'system_users');
  const q = query(usersRef, where('tenantId', '==', tenantId));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as SystemUser);
    callback(users);
  });
};

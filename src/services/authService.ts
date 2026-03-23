import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type UserCredential,
  type User as FirebaseUser,
  type Unsubscribe
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async registerWithEmail(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  async signOut(): Promise<void> {
    return firebaseSignOut(auth);
  },

  onAuthChange(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  async reauthenticate(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Usuário não autenticado');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  },

  async updateUserInfo(data: { name: string; email: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    
    if (data.name) {
      await updateProfile(user, { displayName: data.name });
    }
    
    if (data.email && data.email !== user.email) {
      await updateEmail(user, data.email);
    }
  },

  async updatePassword(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    await firebaseUpdatePassword(user, password);
  },

  async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    await user.delete();
  }
};

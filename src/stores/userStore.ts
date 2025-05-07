import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firestore';
import type { User } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const auth = getAuth();
  const user = ref<User | null>(null);

  const fetchUser = async (): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado.');
  
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('Usuário não encontrado no banco de dados.');
    
    setUser({ id: uid, ...userSnap.data() } as User);
  };

  const saveUser = async (userData: User): Promise<void> => {
    const userRef = doc(db, 'users', userData.id);
  
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp()
    });
  
    setUser(userData);
  };

  const updateUser = async (updatedData: Partial<User> & { id: string }): Promise<void> => {
    const userRef = doc(db, 'users', updatedData.id);
      
    await updateDoc(userRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  
    setUser({ ...user.value, ...updatedData } as User);
  };
  
  const deleteUser = async (uid: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    clearUser();
  };

  const setUser = (userData: User): void => {
    user.value = userData;
    console.log('USER: ', user.value);
  };

  const clearUser = (): void => {
    user.value = null;
  };

  return {
    user,
    fetchUser,
    saveUser,
    updateUser,
    deleteUser,
    setUser,
    clearUser
  };
});

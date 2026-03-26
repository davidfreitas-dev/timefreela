import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useUserStore } from './userStore';
import { useProjectStore } from './projectStore';
import { useSessionStore } from './sessionStore';
import { useTimerStore } from './timerStore';
import { useReportStore } from './reportStore';
import { Timestamp } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
  const firebaseUser = ref<FirebaseUser | null>(null);
  const isAuthChecked = ref(false);

  const isAuthenticated = computed(() => !!firebaseUser.value);

  const userStore = useUserStore();
  const projectStore = useProjectStore();
  const sessionStore = useSessionStore();
  const timerStore = useTimerStore();
  const reportStore = useReportStore();

  const resetAllStores = () => {
    userStore.reset();
    projectStore.reset();
    sessionStore.reset();
    timerStore.reset();
    reportStore.reset();
  };

  const init = () => {
    authService.onAuthChange(async (user) => {
      firebaseUser.value = user;
      if (user) {
        try {
          await userStore.fetchProfile(user.uid);
        } catch (error) {
          console.error('Error fetching user profile during init:', error);
        }
      } else {
        resetAllStores();
      }
      isAuthChecked.value = true;
    });
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.signInWithEmail(email, password);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error during password reset email:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const credential = await authService.registerWithEmail(email, password);
      const now = Timestamp.now();
      await userService.createUser(credential.user.uid, {
        name,
        email,
        createdAt: now,
        updatedAt: now,
      });
      await userStore.fetchProfile(credential.user.uid);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      firebaseUser.value = null;
      resetAllStores();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUserInfo = async (data: { name: string; email: string }) => {
    try {
      await authService.updateUserInfo(data);
      await userStore.updateProfile(data);
    } catch (error) {
      console.error('Error updating user info:', error);
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const reauthenticateUser = async (password: string) => {
    try {
      await authService.reauthenticate(password);
    } catch (error) {
      console.error('Error during reauthentication:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!firebaseUser.value) throw new Error('Usuário não autenticado');
      
      const uid = firebaseUser.value.uid;
      
      // 1. Delete Firestore data first (while authenticated)
      await userService.deleteUserData(uid);
      
      // 2. Delete Auth account
      await authService.deleteAccount();
      
      // 3. Clear local state
      firebaseUser.value = null;
      resetAllStores();
    } catch (error) {
      console.error('Error during account deletion:', error);
      throw error;
    }
  };

  return {
    firebaseUser,
    isAuthChecked,
    isAuthenticated,
    init,
    login,
    sendPasswordResetEmail,
    register,
    logout,
    updateUserInfo,
    updatePassword,
    reauthenticateUser,
    deleteAccount,
  };
});

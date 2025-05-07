import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import {
  getAuth,
  onAuthStateChanged,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updateEmail,
} from 'firebase/auth';
import { useUserStore } from '@/stores/userStore';
import { useLoading } from '@/composables/useLoading';
import type { User } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
  const userStore = useUserStore();
  const isAuthChecked: Ref<boolean> = ref(false);
  const isAuthenticated: Ref<boolean> = ref(false);
  const { isLoading, withLoading } = useLoading();

  const getAuthInstance = () => {
    const auth = getAuth();
    auth.languageCode = 'pt-BR';
    return auth;
  };

  const setUserFromAuth = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const auth = getAuthInstance();

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            if (!userStore.user?.id) {
              await userStore.fetchUser();
            }
            isAuthenticated.value = true;
          } catch {
            try {
              await userStore.saveUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                image: firebaseUser.photoURL || undefined,
              });
              isAuthenticated.value = true;
            } catch (error) {
              console.error('Erro ao salvar o usuário no Firebase', error);
              reject(error);
              return;
            }
          }
        } else {
          userStore.clearUser();
          isAuthenticated.value = false;
        }
        isAuthChecked.value = true;
        resolve();
      });
    });
  };

  const reauthenticateUser = async (password: string) => {
    const auth = getAuthInstance();
    
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      throw new Error('Usuário não autenticado ou sem e-mail válido');
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);

    await reauthenticateWithCredential(currentUser, credential);
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const auth = getAuthInstance();

    await withLoading(async () => {
      await signInWithEmailAndPassword(auth, email, password);
      await setUserFromAuth();
    });
  };

  const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const auth = getAuthInstance();

    await withLoading(async () => {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await userStore.saveUser({
        id: result.user.uid,
        name,
        email: result.user.email || '',
      });

      await setUserFromAuth();
    });
  };

  const passwordReset = async (email: string) => {
    const auth = getAuthInstance();

    await withLoading(async () => {
      await sendPasswordResetEmail(auth, email);
    });
  };

  const logOut = async () => {
    const auth = getAuthInstance();

    await withLoading(async () => {
      await signOut(auth);
    });
  };

  const signInWithGoogle = async () => {
    const auth = getAuthInstance();
    
    const provider = new GoogleAuthProvider();

    await withLoading(async () => {
      await signInWithPopup(auth, provider);
      await setUserFromAuth();
    });
  };
  
  const updateUserInfo = async ({ name, email, photoURL }: { name: string; email?: string; photoURL?: string }) => {
    const auth = getAuthInstance();
    
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    await updateProfile(currentUser, {
      displayName: name,
      photoURL: photoURL || currentUser.photoURL,
    });

    if (email && email !== currentUser.email) {
      await updateEmail(currentUser, email);
    }

    const updatedData: Partial<User> & { id: string } = {
      id: currentUser.uid,
      name: currentUser.displayName || '',
      email: currentUser.email || '',
    };
    
    if (currentUser.photoURL) {
      updatedData.image = currentUser.photoURL;
    }
    
    await userStore.updateUser(updatedData);
  };

  return {
    isLoading,
    isAuthChecked,
    isAuthenticated,
    setUserFromAuth,
    reauthenticateUser,
    signIn,
    signUp,
    passwordReset,
    logOut,
    signInWithGoogle,
    updateUserInfo, // Expondo o novo método
  };
});

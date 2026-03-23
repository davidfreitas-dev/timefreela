import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userService } from '../services/userService';
import type { User } from '../types';

export const useUserStore = defineStore('user', () => {
  const profile = ref<User | null>(null);

  const displayName = computed(() => profile.value?.name || '');

  const fetchProfile = async (uid: string) => {
    try {
      const data = await userService.getUser(uid);
      profile.value = data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!profile.value?.id) return;
    
    try {
      await userService.updateUser(profile.value.id, data);
      profile.value = { ...profile.value, ...data };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const reset = () => {
    profile.value = null;
  };

  return {
    profile,
    user: profile,
    displayName,
    fetchProfile,
    updateProfile,
    reset,
  };
});

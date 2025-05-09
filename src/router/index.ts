import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { watch } from 'vue';

const routes = [
  { 
    path: '/login', 
    name: 'Login',
    component: () => import('../views/auth/Login.vue') 
  },
  { 
    path: '/register', 
    name: 'Register',
    component: () => import('../views/auth/Register.vue') 
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetails',
    component: () => import('../views/Project.vue'),
    meta: { requiresAuth: true },
    props: true,
  },  
  {
    path: '/projects/create',
    name: 'ProjectCreate',
    component: () => import('../views/Project.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthChecked) {
    await new Promise(resolve => {
      const unwatch = watch(
        () => authStore.isAuthChecked,
        (checked) => {
          if (checked) {
            unwatch();
            resolve(true);
          }
        }
      );
    });
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;

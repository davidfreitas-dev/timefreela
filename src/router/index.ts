import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { watch } from 'vue';

const routes = [
  {
    path: '/',
    redirect: ROUTES.DASHBOARD,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.LOGIN,
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: ROUTES.REGISTER,
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: ROUTES.DASHBOARD,
    name: 'Dashboard',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.PROJECTS,
    name: 'Projects',
    component: () => import('../views/ProjectsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.PROJECT_CREATE,
    name: 'ProjectCreate',
    component: () => import('../views/ProjectView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.PROJECT_DETAIL,
    name: 'ProjectDetail',
    component: () => import('../views/ProjectView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.SESSIONS,
    name: 'Sessions',
    component: () => import('../views/SessionsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.SESSION_CREATE,
    name: 'SessionCreate',
    component: () => import('../views/SessionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.SESSION_DETAIL,
    name: 'SessionDetail',
    component: () => import('../views/SessionView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.TIMER,
    name: 'Timer',
    component: () => import('../views/TimerView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: ROUTES.SETTINGS,
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Wait for auth to be checked
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

  const { isAuthenticated } = authStore;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next(ROUTES.LOGIN);
  } else if ((to.path === ROUTES.LOGIN || to.path === ROUTES.REGISTER) && isAuthenticated) {
    next(ROUTES.DASHBOARD);
  } else {
    next();
  }
});

export default router;

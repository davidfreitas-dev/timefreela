import { type App } from 'vue';
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';

const toastConfig: ToastContainerOptions = {
  position: 'top-right',
  autoClose: 5000,
  theme: 'auto',
  transition: 'bounce',
  newestOnTop: true,
  closeOnClick: true,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
  hideProgressBar: false,
  closeButton: true,
  multiple: true,
  limit: 5,
};

export default {
  install(app: App) {
    app.use(Vue3Toastify, toastConfig);
  },
};

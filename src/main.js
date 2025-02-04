import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './assets/main.css';

// ルート定義
const routes = [
  {
    path: '/',
    component: () => import('./components/CreateMeeting.vue')
  },
  {
    path: '/meeting/:id',
    component: () => import('./components/JoinMeeting.vue')
  }
];

// ルーター作成
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Pinia ストア作成
const pinia = createPinia();

// アプリケーション作成
const app = createApp(App);

// プラグイン登録
app.use(router);
app.use(pinia);

// アプリケーションマウント
app.mount('#app');

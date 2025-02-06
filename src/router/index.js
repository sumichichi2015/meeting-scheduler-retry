import { createRouter, createWebHistory } from 'vue-router';
import CreateMeeting from '../components/CreateMeeting.vue';
import JoinMeeting from '../components/JoinMeeting.vue';
import FirebaseTest from '../components/FirebaseTest.vue';

const routes = [
  {
    path: '/',
    redirect: '/create'
  },
  {
    path: '/create',
    name: 'create',
    component: CreateMeeting
  },
  {
    path: '/join/:id',
    name: 'join',
    component: JoinMeeting
  },
  {
    path: '/test',
    name: 'test',
    component: FirebaseTest
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

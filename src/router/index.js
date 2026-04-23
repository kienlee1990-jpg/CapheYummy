import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "../components/views/Dashboard.vue";
import Invoice from "../components/views/Invoice.vue";
import Inventory from "../components/views/Inventory.vue";
import Login from "../components/views/Login.vue";
import Orders from "../components/views/Orders.vue";
import Products from "../components/views/Products.vue";
import Reports from "../components/views/Reports.vue";

const AUTH_STORAGE_KEY = "arlo-coffee-auth-user";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/san-pham",
    name: "products",
    component: Products,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/ban-hang",
    name: "orders",
    component: Orders,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/don-hang",
    redirect: "/ban-hang",
  },
  {
    path: "/hoa-don/:id?",
    name: "invoice",
    component: Invoice,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/nhap-hang",
    name: "inventory",
    component: Inventory,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/bao-cao",
    name: "reports",
    component: Reports,
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const authUser = localStorage.getItem(AUTH_STORAGE_KEY);
  const isAuthenticated = Boolean(authUser);

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;

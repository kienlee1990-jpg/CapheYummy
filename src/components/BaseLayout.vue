<script setup>
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useCoffeeStore } from "../composables/useCoffeeStore";

const props = defineProps({
  pageTitle: {
    type: String,
    default: "Bảng điều khiển",
  },
  pageDescription: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();
const mobileSidebarOpen = ref(false);

const { currentUser, logout } = useCoffeeStore();

const navigationItems = [
  { label: "Bảng điều khiển", icon: "TQ", to: "/dashboard" },
  { label: "Sản phẩm", icon: "SP", to: "/san-pham" },
  { label: "Bán hàng", icon: "BH", to: "/ban-hang" },
  { label: "Hóa đơn", icon: "HD", to: "/hoa-don" },
  { label: "Nhập hàng", icon: "NH", to: "/nhap-hang" },
  { label: "Báo cáo", icon: "BC", to: "/bao-cao" },
];

const userInitials = computed(() => {
  if (!currentUser.value?.fullName) return "CF";

  return currentUser.value.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
});

const sidebarNote = computed(() => {
  return props.pageDescription || "Dữ liệu gốc được seed từ các file JSON trong thư mục src/data.";
});

const closeSidebar = () => {
  mobileSidebarOpen.value = false;
};

const handleLogout = () => {
  closeSidebar();
  logout();
  router.push("/login");
};

const isActiveRoute = (path) => route.path === path;
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-open': mobileSidebarOpen }">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">A</div>
        <div>
          <strong>Arlo Coffee</strong>
          <p>Quản trị cửa hàng</p>
        </div>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="sidebar__link"
          :class="{ 'is-active': isActiveRoute(item.to) }"
          @click="closeSidebar"
        >
          <span class="sidebar__icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <p>{{ sidebarNote }}</p>
      </div>
    </aside>

    <div v-if="mobileSidebarOpen" class="layout-backdrop" @click="closeSidebar"></div>

    <div class="layout-main">
      <header class="topbar">
        <div class="topbar__left">
          <button type="button" class="topbar__menu" @click="mobileSidebarOpen = !mobileSidebarOpen">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div>
            <p class="topbar__eyebrow">Hệ thống quản lý quán cà phê</p>
            <h1>{{ pageTitle }}</h1>
            <span class="topbar__meta">{{ sidebarNote }}</span>
          </div>
        </div>

        <div class="topbar__right">
          <div class="topbar__search">
            <input type="text" placeholder="Thanh tìm kiếm mẫu..." />
          </div>

          <div class="topbar__user">
            <div class="topbar__avatar">{{ userInitials }}</div>
            <div>
              <strong>{{ currentUser?.fullName || "Quản trị viên" }}</strong>
              <p>{{ currentUser?.username || "admin" }}</p>
            </div>
          </div>

          <button type="button" class="topbar__logout" @click="handleLogout">Đăng xuất</button>
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

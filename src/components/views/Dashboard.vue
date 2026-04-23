<script setup>
import { computed } from "vue";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const { currentUser, inventoryReceipts, orders, products, users, getRevenueReport } = useCoffeeStore();

const today = new Date().toISOString().slice(0, 10);

const todayRevenue = computed(() =>
  orders.value
    .filter((order) => order.orderDate === today)
    .reduce((sum, order) => sum + order.total, 0)
);

const dashboardCards = computed(() => [
  {
    label: "Doanh thu hôm nay",
    value: formatCurrency(todayRevenue.value),
    note: `${orders.value.filter((order) => order.orderDate === today).length} đơn trong ngày`,
  },
  {
    label: "Sản phẩm đang bán",
    value: `${products.value.length}`,
    note: `${products.value.filter((product) => product.stock < 20).length} sản phẩm sắp hết`,
  },
  {
    label: "Phiếu nhập đã tạo",
    value: `${inventoryReceipts.value.length}`,
    note: "Theo dõi nhập kho và giá vốn",
  },
  {
    label: "Nhân viên sử dụng",
    value: `${users.value.length}`,
    note: "Dùng cho đăng nhập và báo cáo",
  },
]);

const recentOrders = computed(() => orders.value.slice(0, 5));
const lowStockProducts = computed(() => products.value.filter((product) => product.stock < 20).slice(0, 5));
const employeeReport = computed(() => getRevenueReport({ fromDate: "", toDate: "", employeeUsername: "" }).byEmployee);
</script>

<template>
  <BaseLayout
    page-title="Bảng điều khiển"
    page-description="Tổng quan nhanh về bán hàng, tồn kho, nhập hàng và hiệu suất nhân viên."
  >
    <section class="stats-grid">
      <article v-for="card in dashboardCards" :key="card.label" class="stat-card">
        <span class="stat-card__label">{{ card.label }}</span>
        <strong class="stat-card__value">{{ card.value }}</strong>
        <p class="stat-card__note">{{ card.note }}</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Đơn hàng gần đây</p>
            <h2>Hoạt động bán hàng</h2>
          </div>
        </div>

        <div class="stack-list">
          <div v-for="order in recentOrders" :key="order.id" class="stack-row">
            <div>
              <strong>{{ order.customerName }}</strong>
              <p>{{ formatDate(order.orderDate) }} · {{ order.employeeFullName }}</p>
            </div>
            <div class="stack-row__meta">
              <span>{{ formatCurrency(order.total) }}</span>
              <small>{{ order.items.length }} dòng món</small>
            </div>
          </div>
        </div>
      </article>

      <article class="panel panel--accent">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Cảnh báo tồn kho</p>
            <h2>Sản phẩm sắp hết</h2>
          </div>
        </div>

        <div class="stack-list">
          <div v-for="product in lowStockProducts" :key="product.id" class="stack-row">
            <div>
              <strong>{{ product.name }}</strong>
              <p>{{ product.category }}</p>
            </div>
            <div class="stack-row__meta">
              <span>{{ product.stock }} {{ product.unit }}</span>
              <small>{{ formatCurrency(product.price) }}</small>
            </div>
          </div>
          <div v-if="lowStockProducts.length === 0" class="empty-state">
            Chưa có sản phẩm nào dưới ngưỡng tồn kho cảnh báo.
          </div>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="panel__eyebrow">Doanh thu theo nhân viên</p>
          <h2>Hiệu suất bán hàng</h2>
        </div>
        <span class="panel__hint">Người dùng hiện tại: {{ currentUser?.fullName }}</span>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Tài khoản</th>
              <th>Số đơn</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in employeeReport" :key="item.employeeUsername">
              <td>{{ item.employeeFullName }}</td>
              <td>{{ item.employeeUsername }}</td>
              <td>{{ item.orders }}</td>
              <td>{{ formatCurrency(item.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </BaseLayout>
</template>

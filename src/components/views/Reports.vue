<script setup>
import { computed, ref } from "vue";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const { getRevenueReport, users } = useCoffeeStore();

const filters = ref({
  fromDate: "",
  toDate: "",
  employeeUsername: "",
});

const report = computed(() => getRevenueReport(filters.value));
</script>

<template>
  <BaseLayout
    page-title="Báo cáo doanh thu"
    page-description="Lọc doanh thu theo khoảng thời gian và theo nhân viên từ dữ liệu đơn hàng."
  >
    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="panel__eyebrow">Bộ lọc</p>
          <h2>Lọc dữ liệu báo cáo</h2>
        </div>
      </div>

      <div class="form-row">
        <label class="form-field">
          <span>Từ ngày</span>
          <input v-model="filters.fromDate" type="date" />
        </label>

        <label class="form-field">
          <span>Đến ngày</span>
          <input v-model="filters.toDate" type="date" />
        </label>

        <label class="form-field">
          <span>Nhân viên</span>
          <select v-model="filters.employeeUsername">
            <option value="">Tất cả nhân viên</option>
            <option v-for="user in users" :key="user.username" :value="user.username">
              {{ user.fullName }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-card__label">Tổng doanh thu</span>
        <strong class="stat-card__value">{{ formatCurrency(report.totalRevenue) }}</strong>
        <p class="stat-card__note">Áp dụng theo bộ lọc hiện tại</p>
      </article>

      <article class="stat-card">
        <span class="stat-card__label">Số đơn hàng</span>
        <strong class="stat-card__value">{{ report.totalOrders }}</strong>
        <p class="stat-card__note">Số đơn phù hợp điều kiện lọc</p>
      </article>

      <article class="stat-card">
        <span class="stat-card__label">Giá trị trung bình / đơn</span>
        <strong class="stat-card__value">{{ formatCurrency(report.averageOrderValue) }}</strong>
        <p class="stat-card__note">Doanh thu chia theo số đơn</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Theo thời gian</p>
            <h2>Doanh thu theo ngày</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số đơn</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.byDate" :key="item.date">
                <td>{{ formatDate(item.date) }}</td>
                <td>{{ item.orders }}</td>
                <td>{{ formatCurrency(item.revenue) }}</td>
              </tr>
              <tr v-if="report.byDate.length === 0">
                <td colspan="3" class="table-empty">Không có dữ liệu trong khoảng lọc.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Theo nhân viên</p>
            <h2>Hiệu suất bán hàng</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Số đơn</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.byEmployee" :key="item.employeeUsername">
                <td>{{ item.employeeFullName }}</td>
                <td>{{ item.orders }}</td>
                <td>{{ formatCurrency(item.revenue) }}</td>
              </tr>
              <tr v-if="report.byEmployee.length === 0">
                <td colspan="3" class="table-empty">Không có nhân viên nào khớp bộ lọc.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="panel__eyebrow">Món bán chạy</p>
          <h2>Sản phẩm đóng góp doanh thu</h2>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Số lượng bán</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in report.topProducts" :key="item.productId">
              <td>{{ item.productName }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatCurrency(item.revenue) }}</td>
            </tr>
            <tr v-if="report.topProducts.length === 0">
              <td colspan="3" class="table-empty">Chưa có dữ liệu sản phẩm bán ra.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </BaseLayout>
</template>

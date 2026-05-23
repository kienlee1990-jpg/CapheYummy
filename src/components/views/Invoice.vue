<script setup>
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const route = useRoute();
const router = useRouter();
const { orders, removeOrder } = useCoffeeStore();

const selectedOrderId = computed(() => route.params.id || orders.value[0]?.id || "");

const selectedOrder = computed(() =>
  orders.value.find((order) => order.id === selectedOrderId.value) || null
);

const subtotal = computed(() =>
  selectedOrder.value
    ? selectedOrder.value.items.reduce((sum, item) => sum + item.subtotal, 0)
    : 0
);

const totalQuantity = computed(() =>
  selectedOrder.value
    ? selectedOrder.value.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0
);

const handlePrint = () => {
  window.print();
};

const handleDeleteInvoice = () => {
  if (!selectedOrder.value) return;

  const confirmed = window.confirm(`Xóa hóa đơn ${selectedOrder.value.id}? Tồn kho sẽ được hoàn lại.`);
  if (!confirmed) return;

  const response = removeOrder(selectedOrder.value.id);
  if (!response.success) return;

  router.push(orders.value[0] ? `/hoa-don/${orders.value[0].id}` : "/hoa-don");
};
</script>

<template>
  <BaseLayout
    page-title="Hóa đơn"
    page-description="Xem chi tiết hóa đơn từ dữ liệu order, chọn đơn hàng và in trực tiếp từ trình duyệt."
  >
    <section class="content-grid content-grid--invoice">
      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Danh sách order</p>
            <h2>Chọn hóa đơn</h2>
          </div>
          <span class="summary-chip">{{ orders.length }} đơn</span>
        </div>

        <div class="invoice-list">
          <RouterLink
            v-for="order in orders"
            :key="order.id"
            :to="`/hoa-don/${order.id}`"
            class="invoice-list__item"
            :class="{ 'is-active': selectedOrder?.id === order.id }"
          >
            <div>
              <strong>{{ order.id }}</strong>
              <p>{{ order.customerName }} · {{ formatDate(order.orderDate) }}</p>
            </div>
            <span>{{ formatCurrency(order.total) }}</span>
          </RouterLink>
        </div>
      </article>

      <article class="panel invoice-panel">
        <div v-if="selectedOrder" class="invoice-sheet">
          <div class="invoice-sheet__header">
            <div>
              <p class="panel__eyebrow">Hóa đơn bán hàng</p>
              <h2>Cà Phê Yummy</h2>
              <p class="page-copy">Cửa hàng cà phê Yummy · Hệ thống quản lý bán hàng</p>
            </div>
            <div class="invoice-sheet__meta">
              <strong>{{ selectedOrder.id }}</strong>
              <span>{{ formatDate(selectedOrder.orderDate) }}</span>
            </div>
          </div>

          <div class="invoice-info-grid">
            <div class="invoice-info-card">
              <span>Khách hàng</span>
              <strong>{{ selectedOrder.customerName }}</strong>
            </div>
            <div class="invoice-info-card">
              <span>Nhân viên</span>
              <strong>{{ selectedOrder.employeeFullName }}</strong>
            </div>
            <div class="invoice-info-card">
              <span>Trạng thái</span>
              <strong>{{ selectedOrder.status }}</strong>
            </div>
            <div class="invoice-info-card">
              <span>Tổng số món</span>
              <strong>{{ totalQuantity }}</strong>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table invoice-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.items" :key="`${selectedOrder.id}-${item.productId}`">
                  <td>{{ item.productName }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatCurrency(item.price) }}</td>
                  <td>{{ formatCurrency(item.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="invoice-summary">
            <div>
              <span>Tạm tính</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>
            <div>
              <span>Giảm giá</span>
              <strong>{{ formatCurrency(0) }}</strong>
            </div>
            <div class="invoice-summary__total">
              <span>Tổng thanh toán</span>
              <strong>{{ formatCurrency(selectedOrder.total) }}</strong>
            </div>
          </div>

          <div class="invoice-note">
            <span>Ghi chú</span>
            <p>{{ selectedOrder.note || "Không có ghi chú thêm." }}</p>
          </div>

          <div class="inline-actions no-print">
            <button type="button" class="button-primary" @click="handlePrint">In hóa đơn</button>
            <button type="button" class="button-danger" @click="handleDeleteInvoice">Xóa hóa đơn</button>
            <RouterLink class="button-secondary invoice-link-button" to="/ban-hang">
              Quay lại bán hàng
            </RouterLink>
          </div>
        </div>

        <div v-else class="empty-state">Chưa có order nào để tạo hóa đơn.</div>
      </article>
    </section>
  </BaseLayout>
</template>

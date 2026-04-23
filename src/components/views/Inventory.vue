<script setup>
import { ref } from "vue";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const { addInventoryReceipt, currentUser, inventoryReceipts, products, users } = useCoffeeStore();

const createInventoryForm = () => ({
  receiptDate: new Date().toISOString().slice(0, 10),
  productId: products.value[0]?.id || "",
  quantity: "",
  unitCost: "",
  supplier: "",
  note: "",
  employeeUsername: currentUser.value?.username || users.value[0]?.username || "",
});

const form = ref(createInventoryForm());
const feedback = ref("");

const handleSubmit = () => {
  const response = addInventoryReceipt(form.value);
  feedback.value = response.message;

  if (response.success) {
    form.value = createInventoryForm();
  }
};
</script>

<template>
  <BaseLayout
    page-title="Quản lý nhập hàng"
    page-description="Tạo phiếu nhập để tăng tồn kho, cập nhật giá vốn và lưu lịch sử nhập hàng."
  >
    <section class="content-grid content-grid--sidebar">
      <article class="panel form-panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Nhập hàng</p>
            <h2>Tạo phiếu nhập</h2>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <label class="form-field">
              <span>Ngày nhập</span>
              <input v-model="form.receiptDate" type="date" required />
            </label>

            <label class="form-field">
              <span>Nhân viên nhập</span>
              <select v-model="form.employeeUsername" required>
                <option v-for="user in users" :key="user.username" :value="user.username">
                  {{ user.fullName }}
                </option>
              </select>
            </label>
          </div>

          <label class="form-field">
            <span>Sản phẩm</span>
            <select v-model="form.productId" required>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }}
              </option>
            </select>
          </label>

          <div class="form-row">
            <label class="form-field">
              <span>Số lượng nhập</span>
              <input v-model="form.quantity" type="number" min="1" required />
            </label>

            <label class="form-field">
              <span>Giá nhập / đơn vị</span>
              <input v-model="form.unitCost" type="number" min="1" required />
            </label>
          </div>

          <label class="form-field">
            <span>Nhà cung cấp</span>
            <input v-model="form.supplier" type="text" placeholder="Tên nhà cung cấp" required />
          </label>

          <label class="form-field">
            <span>Ghi chú</span>
            <textarea v-model="form.note" rows="3" placeholder="Nội dung phiếu nhập"></textarea>
          </label>

          <p v-if="feedback" class="form-feedback">{{ feedback }}</p>

          <div class="inline-actions">
            <button type="submit" class="button-primary">Lưu phiếu nhập</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Lịch sử nhập</p>
            <h2>{{ inventoryReceipts.length }} phiếu nhập</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Ngày nhập</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Chi phí</th>
                <th>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="receipt in inventoryReceipts" :key="receipt.id">
                <td>{{ receipt.id }}</td>
                <td>{{ formatDate(receipt.receiptDate) }}</td>
                <td>{{ receipt.productName }}</td>
                <td>{{ receipt.quantity }}</td>
                <td>{{ formatCurrency(receipt.totalCost) }}</td>
                <td>{{ receipt.employeeFullName }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </BaseLayout>
</template>

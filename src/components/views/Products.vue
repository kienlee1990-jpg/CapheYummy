<script setup>
import { ref } from "vue";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency } from "../../utils/formatters";

const { addProduct, products, removeProduct, updateProduct } = useCoffeeStore();

const createDefaultForm = () => ({
  name: "",
  category: "",
  price: "",
  cost: "",
  stock: "",
  unit: "ly",
  status: "Đang bán",
  imageUrl: "/menu/cafe-sua.svg",
});

const form = ref(createDefaultForm());
const editingId = ref("");
const feedback = ref("");

const resetForm = () => {
  form.value = createDefaultForm();
  editingId.value = "";
};

const handleSubmit = () => {
  const action = editingId.value
    ? updateProduct(editingId.value, form.value)
    : addProduct(form.value);

  feedback.value = action.message;

  if (action.success) {
    resetForm();
  }
};

const handleEdit = (product) => {
  editingId.value = product.id;
  form.value = {
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    unit: product.unit,
    status: product.status,
    imageUrl: product.imageUrl || "/menu/cafe-sua.svg",
  };
};

const handleDelete = (product) => {
  if (!window.confirm(`Xóa sản phẩm "${product.name}" khỏi danh sách?`)) {
    return;
  }

  const response = removeProduct(product.id);
  feedback.value = response.message;

  if (editingId.value === product.id) {
    resetForm();
  }
};
</script>

<template>
  <BaseLayout
    page-title="Quản lý sản phẩm"
    page-description="Thêm mới, chỉnh sửa giá bán, tồn kho và trạng thái hiển thị của sản phẩm."
  >
    <section class="content-grid content-grid--sidebar">
      <article class="panel form-panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Sản phẩm</p>
            <h2>{{ editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới" }}</h2>
          </div>
        </div>

        <form class="resource-form" @submit.prevent="handleSubmit">
          <label class="form-field">
            <span>Tên sản phẩm</span>
            <input v-model="form.name" type="text" placeholder="Ví dụ: Cà phê đen" required />
          </label>

          <label class="form-field">
            <span>Danh mục</span>
            <input v-model="form.category" type="text" placeholder="Ví dụ: Cà phê đậm đà" required />
          </label>

          <label class="form-field">
            <span>Ảnh sản phẩm</span>
            <input v-model="form.imageUrl" type="text" placeholder="/menu/cafe-sua.svg" />
          </label>

          <div class="form-row">
            <label class="form-field">
              <span>Giá bán</span>
              <input v-model="form.price" type="number" min="0" required />
            </label>

            <label class="form-field">
              <span>Giá vốn</span>
              <input v-model="form.cost" type="number" min="0" required />
            </label>
          </div>

          <div class="form-row">
            <label class="form-field">
              <span>Tồn kho</span>
              <input v-model="form.stock" type="number" min="0" required />
            </label>

            <label class="form-field">
              <span>Đơn vị</span>
              <input v-model="form.unit" type="text" placeholder="ly / cái / gói" required />
            </label>
          </div>

          <label class="form-field">
            <span>Trạng thái</span>
            <select v-model="form.status">
              <option>Đang bán</option>
              <option>Tạm ẩn</option>
              <option>Ngừng bán</option>
            </select>
          </label>

          <p v-if="feedback" class="form-feedback">{{ feedback }}</p>

          <div class="inline-actions">
            <button type="submit" class="button-primary">
              {{ editingId ? "Lưu cập nhật" : "Thêm sản phẩm" }}
            </button>
            <button type="button" class="button-secondary" @click="resetForm">Làm mới form</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Danh sách</p>
            <h2>{{ products.length }} sản phẩm</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Ảnh</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>
                  <strong>{{ product.name }}</strong>
                </td>
                <td>
                  <img class="product-table-image" :src="product.imageUrl" :alt="product.name" />
                </td>
                <td>{{ product.category }}</td>
                <td>{{ formatCurrency(product.price) }}</td>
                <td>{{ product.stock }} {{ product.unit }}</td>
                <td><span class="status-badge">{{ product.status }}</span></td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="button-secondary" @click="handleEdit(product)">
                      Sửa
                    </button>
                    <button type="button" class="button-danger" @click="handleDelete(product)">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </BaseLayout>
</template>

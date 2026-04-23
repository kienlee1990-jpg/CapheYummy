<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import BaseLayout from "../BaseLayout.vue";
import { useCoffeeStore } from "../../composables/useCoffeeStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const { addOrder, currentUser, orders, products, users } = useCoffeeStore();

const searchKeyword = ref("");
const selectedCategory = ref("Tất cả");
const feedback = ref("");

const createOrderForm = () => ({
  orderDate: new Date().toISOString().slice(0, 10),
  customerName: "",
  employeeUsername: currentUser.value?.username || users.value[0]?.username || "",
  status: "Hoàn tất",
  note: "",
  items: [],
});

const form = ref(createOrderForm());

const categories = computed(() => [
  "Tất cả",
  ...new Set(products.value.map((product) => product.category)),
]);

const filteredProducts = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return products.value.filter((product) => {
    const matchCategory =
      selectedCategory.value === "Tất cả" || product.category === selectedCategory.value;
    const matchKeyword =
      keyword.length === 0 ||
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword);

    return matchCategory && matchKeyword;
  });
});

const productMap = computed(() =>
  Object.fromEntries(products.value.map((product) => [product.id, product]))
);

const cartItems = computed(() =>
  form.value.items.map((item) => {
    const product = productMap.value[item.productId];
    const quantity = Number(item.quantity || 0);

    return {
      ...item,
      product,
      quantity,
      subtotal: (product?.price || 0) * quantity,
    };
  })
);

const cartTotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.subtotal, 0)
);

const totalQuantity = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
);

const recentOrders = computed(() => orders.value.slice(0, 6));

const addToCart = (product) => {
  const foundItem = form.value.items.find((item) => item.productId === product.id);

  if (foundItem) {
    foundItem.quantity += 1;
    return;
  }

  form.value.items.push({
    productId: product.id,
    quantity: 1,
  });
};

const increaseQuantity = (productId) => {
  const foundItem = form.value.items.find((item) => item.productId === productId);
  if (!foundItem) return;
  foundItem.quantity += 1;
};

const decreaseQuantity = (productId) => {
  const foundItem = form.value.items.find((item) => item.productId === productId);
  if (!foundItem) return;

  if (foundItem.quantity <= 1) {
    form.value.items = form.value.items.filter((item) => item.productId !== productId);
    return;
  }

  foundItem.quantity -= 1;
};

const removeFromCart = (productId) => {
  form.value.items = form.value.items.filter((item) => item.productId !== productId);
};

const resetForm = () => {
  form.value = createOrderForm();
};

const handleSubmit = () => {
  const response = addOrder(form.value);
  feedback.value = response.message;

  if (response.success) {
    resetForm();
  }
};
</script>

<template>
  <BaseLayout
    page-title="Bán hàng"
    page-description="Tạo order tại quầy, chọn món nhanh, theo dõi giỏ hàng và lưu lịch sử đơn."
  >
    <section class="content-grid content-grid--sales">
      <article class="panel">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Menu bán hàng</p>
            <h2>Chọn món cho order</h2>
          </div>
          <span class="summary-chip">{{ filteredProducts.length }} sản phẩm hiển thị</span>
        </div>

        <div class="sales-toolbar">
          <label class="form-field">
            <span>Tìm sản phẩm</span>
            <input v-model="searchKeyword" type="text" placeholder="Nhập tên món..." />
          </label>

          <label class="form-field">
            <span>Danh mục</span>
            <select v-model="selectedCategory">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>
        </div>

        <div class="product-grid">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            type="button"
            class="product-card"
            @click="addToCart(product)"
          >
            <div class="product-card__top">
              <span class="status-badge">{{ product.category }}</span>
              <span class="product-card__stock">Tồn {{ product.stock }} {{ product.unit }}</span>
            </div>
            <div class="product-card__body">
              <strong>{{ product.name }}</strong>
              <p>{{ product.status }}</p>
            </div>
            <div class="product-card__bottom">
              <span>{{ formatCurrency(product.price) }}</span>
              <small>Nhấn để thêm</small>
            </div>
          </button>
        </div>
      </article>

      <article class="panel panel--accent">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Order hiện tại</p>
            <h2>Giỏ hàng</h2>
          </div>
          <span class="summary-chip">{{ totalQuantity }} món</span>
        </div>

        <form class="resource-form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <label class="form-field">
              <span>Ngày bán</span>
              <input v-model="form.orderDate" type="date" required />
            </label>

            <label class="form-field">
              <span>Nhân viên</span>
              <select v-model="form.employeeUsername" required>
                <option v-for="user in users" :key="user.username" :value="user.username">
                  {{ user.fullName }}
                </option>
              </select>
            </label>
          </div>

          <label class="form-field">
            <span>Khách hàng</span>
            <input v-model="form.customerName" type="text" placeholder="Khách lẻ / tên khách" />
          </label>

          <div class="cart-list">
            <div v-for="item in cartItems" :key="item.productId" class="cart-row">
              <div>
                <strong>{{ item.product?.name }}</strong>
                <p>{{ formatCurrency(item.product?.price || 0) }} / {{ item.product?.unit }}</p>
              </div>

              <div class="cart-row__actions">
                <button type="button" class="qty-button" @click="decreaseQuantity(item.productId)">-</button>
                <span>{{ item.quantity }}</span>
                <button type="button" class="qty-button" @click="increaseQuantity(item.productId)">+</button>
              </div>

              <div class="cart-row__meta">
                <span>{{ formatCurrency(item.subtotal) }}</span>
                <button type="button" class="button-danger" @click="removeFromCart(item.productId)">
                  Xóa
                </button>
              </div>
            </div>

            <div v-if="cartItems.length === 0" class="empty-state">
              Chưa có món nào trong order. Hãy chọn sản phẩm ở cột bên trái.
            </div>
          </div>

          <label class="form-field">
            <span>Ghi chú</span>
            <textarea v-model="form.note" rows="3" placeholder="Ghi chú thêm cho order"></textarea>
          </label>

          <div class="checkout-box">
            <div>
              <span>Tổng thanh toán</span>
              <strong>{{ formatCurrency(cartTotal) }}</strong>
            </div>
            <div>
              <span>Số dòng món</span>
              <strong>{{ cartItems.length }}</strong>
            </div>
          </div>

          <p v-if="feedback" class="form-feedback">{{ feedback }}</p>

          <div class="inline-actions">
            <button type="submit" class="button-primary">Hoàn tất order</button>
            <button type="button" class="button-secondary" @click="resetForm">Làm mới giỏ hàng</button>
          </div>
        </form>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="panel__eyebrow">Lịch sử bán hàng</p>
          <h2>Order gần đây</h2>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã order</th>
              <th>Ngày</th>
              <th>Khách hàng</th>
              <th>Nhân viên</th>
              <th>Số món</th>
              <th>Tổng tiền</th>
              <th>Hóa đơn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ formatDate(order.orderDate) }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.employeeFullName }}</td>
              <td>{{ order.items.length }}</td>
              <td>{{ formatCurrency(order.total) }}</td>
              <td>
                <RouterLink class="button-secondary invoice-link-button" :to="`/hoa-don/${order.id}`">
                  Xem
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </BaseLayout>
</template>

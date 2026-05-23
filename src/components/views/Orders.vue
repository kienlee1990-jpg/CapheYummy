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
const activeOrderTab = ref("Hóa đơn 1");

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

const cartLineCount = computed(() => cartItems.value.length);

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
    <section class="pos-shell">
      <form class="pos-cart" @submit.prevent="handleSubmit">
        <div class="pos-tabs">
          <button type="button" class="pos-tab is-active">{{ activeOrderTab }}</button>
          <button type="button" class="pos-tab" @click="resetForm">+ Hóa đơn mới</button>
        </div>

        <div class="pos-customer">
          <label class="pos-search">
            <span>Tìm khách hàng</span>
            <input v-model="form.customerName" type="text" placeholder="Khách lẻ / tên khách" />
          </label>
          <span class="summary-chip">{{ totalQuantity }} món</span>
        </div>

        <div class="pos-cart-list">
          <div v-for="(item, index) in cartItems" :key="item.productId" class="pos-cart-row">
            <div class="pos-cart-row__index">{{ index + 1 }}</div>
            <div class="pos-cart-row__name">
              <strong>{{ item.product?.name }}</strong>
              <span>{{ formatCurrency(item.product?.price || 0) }} / {{ item.product?.unit }}</span>
            </div>

            <div class="pos-qty">
              <button type="button" @click="decreaseQuantity(item.productId)">-</button>
              <span>{{ item.quantity }}</span>
              <button type="button" @click="increaseQuantity(item.productId)">+</button>
            </div>

            <strong class="pos-cart-row__total">{{ formatCurrency(item.subtotal) }}</strong>
            <button type="button" class="pos-row-delete" @click="removeFromCart(item.productId)">×</button>
          </div>

          <div v-if="cartItems.length === 0" class="pos-empty">
            Chọn sản phẩm bên phải để thêm vào hóa đơn.
          </div>
        </div>

        <div class="pos-cart-meta">
          <label>
            <span>Ngày bán</span>
            <input v-model="form.orderDate" type="date" required />
          </label>
          <label>
            <span>Nhân viên</span>
            <select v-model="form.employeeUsername" required>
              <option v-for="user in users" :key="user.username" :value="user.username">
                {{ user.fullName }}
              </option>
            </select>
          </label>
          <label class="pos-note">
            <span>Ghi chú</span>
            <input v-model="form.note" type="text" placeholder="Ghi chú hóa đơn" />
          </label>
        </div>

        <div class="pos-checkout">
          <div>
            <span>Tổng tiền hàng</span>
            <strong>{{ formatCurrency(cartTotal) }}</strong>
          </div>
          <div>
            <span>Số dòng</span>
            <strong>{{ cartLineCount }}</strong>
          </div>
          <button type="submit" class="pos-pay-button" :disabled="cartItems.length === 0">
            Thanh toán
          </button>
        </div>

        <p v-if="feedback" class="form-feedback">{{ feedback }}</p>
      </form>

      <article class="pos-products">
        <div class="pos-products__toolbar">
          <label class="pos-search">
            <span>Tìm hàng hóa</span>
            <input v-model="searchKeyword" type="text" placeholder="Tìm hàng hóa..." />
          </label>
          <label class="pos-category">
            <span>Danh mục</span>
            <select v-model="selectedCategory">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>
        </div>

        <div class="pos-category-tabs">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            :class="{ 'is-active': selectedCategory === category }"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <div class="pos-product-grid">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            type="button"
            class="pos-product-card"
            @click="addToCart(product)"
          >
            <img
              class="pos-product-card__thumb"
              :src="product.imageUrl"
              :alt="product.name"
              loading="lazy"
            />
            <div>
              <strong>{{ product.name }}</strong>
              <span>{{ formatCurrency(product.price) }}</span>
              <small>Tồn {{ product.stock }} {{ product.unit }}</small>
            </div>
          </button>
        </div>
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

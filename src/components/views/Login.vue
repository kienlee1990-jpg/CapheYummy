<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCoffeeStore } from "../../composables/useCoffeeStore";

const router = useRouter();
const { login } = useCoffeeStore();

const form = ref({
  username: "",
  password: "",
});

const errorMessage = ref("");
const isSubmitting = ref(false);

const handleSubmit = () => {
  isSubmitting.value = true;
  errorMessage.value = "";

  const response = login({
    username: form.value.username.trim(),
    password: form.value.password,
  });

  if (!response.success) {
    errorMessage.value = response.message;
    isSubmitting.value = false;
    return;
  }

  router.push("/dashboard").finally(() => {
    isSubmitting.value = false;
  });
};
</script>

<template>
  <div class="login-page">
    <section class="login-hero">
      <p class="login-hero__eyebrow">Cà Phê Yummy Admin</p>
      <h1>Đăng nhập để quản lý sản phẩm, đơn hàng và báo cáo doanh thu.</h1>
      <p>
        Dữ liệu được seed từ các file JSON trong <code>src/data</code> và lưu phiên làm việc
        trong trình duyệt để bạn thao tác nhanh.
      </p>
    </section>

    <section class="login-card">
      <div class="login-card__header">
        <h2>Đăng nhập</h2>
        <p>Dùng tài khoản trong <code>users.json</code> để truy cập hệ thống quản lý.</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="form-field">
          <span>Tên đăng nhập</span>
          <input v-model="form.username" type="text" placeholder="Ví dụ: admin" required />
        </label>

        <label class="form-field">
          <span>Mật khẩu</span>
          <input v-model="form.password" type="password" placeholder="Nhập mật khẩu" required />
        </label>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <button type="submit" class="login-submit" :disabled="isSubmitting">
          {{ isSubmitting ? "Đang kiểm tra..." : "Đăng nhập" }}
        </button>
      </form>
    </section>
  </div>
</template>

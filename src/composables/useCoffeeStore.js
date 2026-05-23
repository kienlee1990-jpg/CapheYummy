import { computed, reactive } from "vue";
import inventorySeed from "../data/inventory.json";
import ordersSeed from "../data/orders.json";
import productsSeed from "../data/products.json";
import usersSeed from "../data/users.json";

const STORAGE_KEYS = {
  auth: "ca-phe-yummy-auth-user",
  products: "ca-phe-yummy-products",
  orders: "ca-phe-yummy-orders",
  inventory: "ca-phe-yummy-inventory",
};

const LEGACY_STORAGE_KEYS = {
  auth: "arlo-coffee-auth-user",
  products: "arlo-coffee-products",
  orders: "arlo-coffee-orders",
  inventory: "arlo-coffee-inventory",
};

const MENU_STORAGE_VERSION_KEY = "ca-phe-yummy-menu-version";
const MENU_STORAGE_VERSION = "2026-05-yummy-menu-v2";

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readStorage = (key, fallbackValue) => {
  if (!canUseStorage()) {
    return cloneData(fallbackValue);
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : cloneData(fallbackValue);
  } catch {
    return cloneData(fallbackValue);
  }
};

const readMigratedStorage = (key, legacyKey, fallbackValue) => {
  if (!canUseStorage()) {
    return cloneData(fallbackValue);
  }

  const currentValue = window.localStorage.getItem(key);
  if (currentValue) {
    return readStorage(key, fallbackValue);
  }

  const legacyValue = window.localStorage.getItem(legacyKey);
  if (!legacyValue) {
    return cloneData(fallbackValue);
  }

  window.localStorage.setItem(key, legacyValue);
  window.localStorage.removeItem(legacyKey);
  return readStorage(key, fallbackValue);
};

const writeStorage = (key, value) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStorage = (key) => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
};

const formatDateValue = () => new Date().toISOString().slice(0, 10);

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const toNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const state = reactive({
  users: cloneData(usersSeed),
  currentUser: readMigratedStorage(STORAGE_KEYS.auth, LEGACY_STORAGE_KEYS.auth, null),
  products: readMigratedStorage(STORAGE_KEYS.products, LEGACY_STORAGE_KEYS.products, productsSeed),
  orders: readMigratedStorage(STORAGE_KEYS.orders, LEGACY_STORAGE_KEYS.orders, ordersSeed),
  inventoryReceipts: readMigratedStorage(
    STORAGE_KEYS.inventory,
    LEGACY_STORAGE_KEYS.inventory,
    inventorySeed
  ),
});

const ADMIN_USER = usersSeed[0];

const normalizeAdminUser = () => {
  if (state.currentUser?.username === ADMIN_USER.username) {
    state.currentUser = {
      fullName: ADMIN_USER.fullName,
      username: ADMIN_USER.username,
    };
    writeStorage(STORAGE_KEYS.auth, state.currentUser);
  }

  state.orders.forEach((order) => {
    if (["admin", "manager"].includes(order.employeeUsername)) {
      order.employeeUsername = ADMIN_USER.username;
      order.employeeFullName = ADMIN_USER.fullName;
    }
  });

  state.inventoryReceipts.forEach((receipt) => {
    if (["admin", "manager"].includes(receipt.employeeUsername)) {
      receipt.employeeUsername = ADMIN_USER.username;
      receipt.employeeFullName = ADMIN_USER.fullName;
    }
  });

  persistOrders();
  persistInventory();
};

const persistProducts = () => writeStorage(STORAGE_KEYS.products, state.products);
const persistOrders = () => writeStorage(STORAGE_KEYS.orders, state.orders);
const persistInventory = () => writeStorage(STORAGE_KEYS.inventory, state.inventoryReceipts);

const resetMenuIfNeeded = () => {
  if (!canUseStorage()) return;

  const currentVersion = window.localStorage.getItem(MENU_STORAGE_VERSION_KEY);
  if (currentVersion === MENU_STORAGE_VERSION) return;

  state.products = cloneData(productsSeed);
  state.orders = cloneData(ordersSeed);
  state.inventoryReceipts = cloneData(inventorySeed);

  persistProducts();
  persistOrders();
  persistInventory();
  window.localStorage.setItem(MENU_STORAGE_VERSION_KEY, MENU_STORAGE_VERSION);
};

resetMenuIfNeeded();
normalizeAdminUser();

const getUserByUsername = (username) => state.users.find((user) => user.username === username);
const getProductById = (productId) => state.products.find((product) => product.id === productId);

const login = ({ username, password }) => {
  const matchedUser = state.users.find(
    (user) => user.username === username && user.password === password
  );

  if (!matchedUser) {
    return {
      success: false,
      message: "Tên đăng nhập hoặc mật khẩu không đúng.",
    };
  }

  state.currentUser = {
    fullName: matchedUser.fullName,
    username: matchedUser.username,
  };
  writeStorage(STORAGE_KEYS.auth, state.currentUser);

  return {
    success: true,
  };
};

const logout = () => {
  state.currentUser = null;
  removeStorage(STORAGE_KEYS.auth);
};

const addProduct = (payload) => {
  const product = {
    id: createId("SP"),
    name: payload.name.trim(),
    category: payload.category.trim(),
    price: toNumber(payload.price),
    cost: toNumber(payload.cost),
    stock: toNumber(payload.stock),
    unit: payload.unit.trim() || "ly",
    status: payload.status || "Đang bán",
    imageUrl: payload.imageUrl?.trim() || "/menu/cafe-sua.svg",
    createdAt: new Date().toISOString(),
  };

  state.products.unshift(product);
  persistProducts();

  return {
    success: true,
    message: "Đã thêm sản phẩm mới.",
  };
};

const updateProduct = (productId, payload) => {
  const index = state.products.findIndex((product) => product.id === productId);
  if (index === -1) {
    return {
      success: false,
      message: "Không tìm thấy sản phẩm cần cập nhật.",
    };
  }

  state.products[index] = {
    ...state.products[index],
    name: payload.name.trim(),
    category: payload.category.trim(),
    price: toNumber(payload.price),
    cost: toNumber(payload.cost),
    stock: toNumber(payload.stock),
    unit: payload.unit.trim() || "ly",
    status: payload.status || "Đang bán",
    imageUrl: payload.imageUrl?.trim() || state.products[index].imageUrl || "/menu/cafe-sua.svg",
    updatedAt: new Date().toISOString(),
  };

  persistProducts();

  return {
    success: true,
    message: "Đã cập nhật sản phẩm.",
  };
};

const removeProduct = (productId) => {
  state.products = state.products.filter((product) => product.id !== productId);
  persistProducts();

  return {
    success: true,
    message: "Đã xóa sản phẩm khỏi danh sách.",
  };
};

const addInventoryReceipt = (payload) => {
  const product = getProductById(payload.productId);
  const employee = getUserByUsername(payload.employeeUsername);

  if (!product || !employee) {
    return {
      success: false,
      message: "Dữ liệu phiếu nhập không hợp lệ.",
    };
  }

  const quantity = toNumber(payload.quantity);
  const unitCost = toNumber(payload.unitCost);

  if (quantity <= 0 || unitCost <= 0) {
    return {
      success: false,
      message: "Số lượng và giá nhập phải lớn hơn 0.",
    };
  }

  const receipt = {
    id: createId("NH"),
    receiptDate: payload.receiptDate || formatDateValue(),
    productId: product.id,
    productName: product.name,
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
    supplier: payload.supplier.trim(),
    note: payload.note.trim(),
    employeeUsername: employee.username,
    employeeFullName: employee.fullName,
  };

  product.stock += quantity;
  product.cost = unitCost;
  state.inventoryReceipts.unshift(receipt);

  persistProducts();
  persistInventory();

  return {
    success: true,
    message: "Đã tạo phiếu nhập hàng.",
  };
};

const addOrder = (payload) => {
  const employee = getUserByUsername(payload.employeeUsername);

  if (!employee) {
    return {
      success: false,
      message: "Không tìm thấy nhân viên xử lý đơn.",
    };
  }

  const normalizedItems = payload.items
    .map((item) => {
      const product = getProductById(item.productId);
      const quantity = toNumber(item.quantity);

      if (!product || quantity <= 0) {
        return null;
      }

      return {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        subtotal: product.price * quantity,
      };
    })
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    return {
      success: false,
      message: "Đơn hàng cần ít nhất một sản phẩm hợp lệ.",
    };
  }

  const outOfStockItem = normalizedItems.find((item) => {
    const product = getProductById(item.productId);
    return !product || product.stock < item.quantity;
  });

  if (outOfStockItem) {
    return {
      success: false,
      message: `Sản phẩm ${outOfStockItem.productName} không đủ tồn kho.`,
    };
  }

  normalizedItems.forEach((item) => {
    const product = getProductById(item.productId);
    product.stock -= item.quantity;
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  state.orders.unshift({
    id: createId("DH"),
    orderDate: payload.orderDate || formatDateValue(),
    customerName: payload.customerName.trim() || "Khách lẻ",
    employeeUsername: employee.username,
    employeeFullName: employee.fullName,
    status: payload.status || "Hoàn tất",
    note: payload.note.trim(),
    items: normalizedItems,
    total,
  });

  persistOrders();
  persistProducts();

  return {
    success: true,
    message: "Đã tạo đơn hàng mới.",
  };
};

const removeOrder = (orderId) => {
  const order = state.orders.find((item) => item.id === orderId);

  if (!order) {
    return {
      success: false,
      message: "Không tìm thấy hóa đơn cần xóa.",
    };
  }

  order.items.forEach((item) => {
    const product = getProductById(item.productId);
    if (product) {
      product.stock += toNumber(item.quantity);
    }
  });

  state.orders = state.orders.filter((item) => item.id !== orderId);
  persistOrders();
  persistProducts();

  return {
    success: true,
    message: "Đã xóa hóa đơn và hoàn lại tồn kho.",
  };
};

const getRevenueReport = ({ fromDate, toDate, employeeUsername }) => {
  const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
  const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

  const filteredOrders = state.orders.filter((order) => {
    const orderTime = new Date(`${order.orderDate}T12:00:00`).getTime();
    const matchesFromDate = fromTime === null || orderTime >= fromTime;
    const matchesToDate = toTime === null || orderTime <= toTime;
    const matchesEmployee = !employeeUsername || order.employeeUsername === employeeUsername;

    return matchesFromDate && matchesToDate && matchesEmployee;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const byEmployeeMap = filteredOrders.reduce((accumulator, order) => {
    if (!accumulator[order.employeeUsername]) {
      accumulator[order.employeeUsername] = {
        employeeUsername: order.employeeUsername,
        employeeFullName: order.employeeFullName,
        orders: 0,
        revenue: 0,
      };
    }

    accumulator[order.employeeUsername].orders += 1;
    accumulator[order.employeeUsername].revenue += order.total;

    return accumulator;
  }, {});

  const byDateMap = filteredOrders.reduce((accumulator, order) => {
    if (!accumulator[order.orderDate]) {
      accumulator[order.orderDate] = {
        date: order.orderDate,
        orders: 0,
        revenue: 0,
      };
    }

    accumulator[order.orderDate].orders += 1;
    accumulator[order.orderDate].revenue += order.total;

    return accumulator;
  }, {});

  const topProductsMap = filteredOrders.reduce((accumulator, order) => {
    order.items.forEach((item) => {
      if (!accumulator[item.productId]) {
        accumulator[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }

      accumulator[item.productId].quantity += item.quantity;
      accumulator[item.productId].revenue += item.subtotal;
    });

    return accumulator;
  }, {});

  return {
    filteredOrders,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    byEmployee: Object.values(byEmployeeMap).sort((left, right) => right.revenue - left.revenue),
    byDate: Object.values(byDateMap).sort((left, right) => left.date.localeCompare(right.date)),
    topProducts: Object.values(topProductsMap).sort((left, right) => right.quantity - left.quantity),
  };
};

export function useCoffeeStore() {
  return {
    users: computed(() => state.users),
    currentUser: computed(() => state.currentUser),
    products: computed(() => state.products),
    orders: computed(() => state.orders),
    inventoryReceipts: computed(() => state.inventoryReceipts),
    login,
    logout,
    addProduct,
    updateProduct,
    removeProduct,
    addInventoryReceipt,
    addOrder,
    removeOrder,
    getRevenueReport,
  };
}

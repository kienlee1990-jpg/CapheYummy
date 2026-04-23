import { computed, reactive } from "vue";
import inventorySeed from "../data/inventory.json";
import ordersSeed from "../data/orders.json";
import productsSeed from "../data/products.json";
import usersSeed from "../data/users.json";

const STORAGE_KEYS = {
  auth: "arlo-coffee-auth-user",
  products: "arlo-coffee-products",
  orders: "arlo-coffee-orders",
  inventory: "arlo-coffee-inventory",
};

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
  currentUser: readStorage(STORAGE_KEYS.auth, null),
  products: readStorage(STORAGE_KEYS.products, productsSeed),
  orders: readStorage(STORAGE_KEYS.orders, ordersSeed),
  inventoryReceipts: readStorage(STORAGE_KEYS.inventory, inventorySeed),
});

const persistProducts = () => writeStorage(STORAGE_KEYS.products, state.products);
const persistOrders = () => writeStorage(STORAGE_KEYS.orders, state.orders);
const persistInventory = () => writeStorage(STORAGE_KEYS.inventory, state.inventoryReceipts);

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
    getRevenueReport,
  };
}

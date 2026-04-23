const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "--";
  return dateFormatter.format(new Date(`${value}T12:00:00`));
};

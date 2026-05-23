# Cà Phê Yummy Vue UI

Ứng dụng Vue + Vite quản lý Cà Phê Yummy với các luồng:

- đăng nhập bằng dữ liệu JSON
- bán hàng
- hóa đơn
- sản phẩm
- nhập hàng
- báo cáo doanh thu theo thời gian và theo nhân viên

## Chạy local

```bash
npm install
npm run dev
```

## Deploy GitHub Pages

Project đã được cấu hình để deploy tự động lên GitHub Pages qua GitHub Actions.

- workflow: `.github/workflows/deploy.yml`
- router dùng `hash mode` để không lỗi khi refresh trên Pages
- `vite.config.js` tự đặt `base` là `/CapheYummy/` khi chạy trên GitHub Actions

Sau khi push lên branch mặc định của repo `kienlee1990-jpg/CapheYummy`, workflow sẽ build và publish lên GitHub Pages.

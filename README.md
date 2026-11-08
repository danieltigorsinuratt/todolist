# Task Management System (CRUD API & Load Testing Environment)

Aplikasi manajemen tugas (Todo List) modern berbasis **Next.js (App Router)** yang dirancang untuk pengujian beban server (*load testing*) menggunakan **Locust** di lingkungan **Ubuntu Server**.

## Fitur Utama
- **Desain Minimalis & Human-crafted**: Palet warna soft pink/rose berpadu dengan netral slate yang bersih, tanpa emotikon, dan tipografi rapi.
- **RESTful CRUD API**: Endpoint lengkap di `/api/todos` (GET, POST, PATCH, DELETE).
- **Database SQLite + Prisma ORM**: Cepat, ringan, dan tidak membutuhkan instalasi database server yang rumit.
- **Skrip Pengujian Beban Locust**: Siap digunakan langsung dengan pengujian siklus penambahan data (POST) dan pembersihan data (DELETE).
- **Panduan Deployment Ubuntu Server**: Dokumentasi lengkap di [`UBUNTU_DEPLOYMENT_GUIDE.md`](./UBUNTU_DEPLOYMENT_GUIDE.md).

## Struktur Endpoint
- `GET /api/todos` — Mengambil seluruh daftar tugas
- `POST /api/todos` — Menambahkan tugas baru
- `GET /api/todos/[id]` — Mengambil detail tugas
- `PATCH /api/todos/[id]` — Memperbarui status / judul tugas
- `DELETE /api/todos/[id]` — Menghapus tugas

## Pengujian Beban (Locust)
Jalankan di komputer lokal:
```bash
pip install locust
locust -f locustfile.py
```
Buka `http://localhost:8089` dan masukkan host server Ubuntu kamu.

Untuk panduan lengkap setup di Ubuntu Server (Node.js, PM2, Nginx, UFW), silakan baca file:
👉 **[`UBUNTU_DEPLOYMENT_GUIDE.md`](./UBUNTU_DEPLOYMENT_GUIDE.md)**

# Panduan Deployment Ubuntu Server (MySQL) & Pengujian Beban (Locust)

Proyek ini adalah aplikasi Task Management berbasis **Next.js (App Router)** dengan antarmuka bertema pink minimalis, REST API CRUD (`/api/todos`), database **MySQL via Prisma**, serta skrip pengujian beban **Locust**.

---

## Daftar Isi
1. [Arsitektur & Spesifikasi API](#1-arsitektur--spesifikasi-api)
2. [Persiapan Transfer File ke Ubuntu](#2-persiapan-transfer-file-ke-ubuntu)
3. [Langkah Instalasi Node.js & Nginx](#3-langkah-instalasi-nodejs--nginx)
4. [Instalasi & Konfigurasi MySQL Server](#4-instalasi--konfigurasi-mysql-server)
5. [Setup Project & Database Migration](#5-setup-project--database-migration)
6. [Konfigurasi PM2 Process Manager](#6-konfigurasi-pm2-process-manager)
7. [Konfigurasi Nginx Reverse Proxy](#7-konfigurasi-nginx-reverse-proxy)
8. [Konfigurasi Firewall (UFW)](#8-konfigurasi-firewall-ufw)
9. [Menjalankan Pengujian Beban (Locust)](#9-menjalankan-pengujian-beban-locust)
10. [Tips Monitoring Server saat Load Test](#10-tips-monitoring-server-saat-load-test)

---

## 1. Arsitektur & Spesifikasi API

* **Frontend & Backend**: Next.js App Router (Port internal: `3000`)
* **Reverse Proxy**: Nginx (Port publik: `80` $\rightarrow$ `3000`)
* **Process Manager**: PM2 (Menjaga aplikasi selalu aktif & auto-restart)
* **Database**: MySQL Server (Port default: `3306`)

### Endpoint API:
| Method | Endpoint | Deskripsi | Respons Status |
|---|---|---|---|
| `GET` | `/api/todos` | Mengambil semua daftar tugas | `200 OK` |
| `POST` | `/api/todos` | Menambah tugas baru (`{"title": "..."}`) | `201 Created` |
| `GET` | `/api/todos/[id]` | Mengambil satu tugas berdasarkan ID | `200 OK` / `404 Not Found` |
| `PATCH` | `/api/todos/[id]` | Update status selesai / judul tugas | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/todos/[id]` | Menghapus tugas berdasarkan ID | `200 OK` / `404 Not Found` |

---

## 2. Persiapan Transfer File ke Ubuntu

### Opsi A: Menggunakan Git (Paling Mudah & Rapi)
1. Push project lokal ini ke repository pribadi GitHub/GitLab kamu.
2. Di Ubuntu Server, tinggal jalankan:
   ```bash
   git clone <URL_REPO_KAMU> todolist
   ```

### Opsi B: Transfer Manual via SCP dari Terminal Windows
```powershell
scp -r "C:\Users\Hi\Documents\Project\Yulinafaesa\todolist" user@<IP_UBUNTU>:~/todolist
```

---

## 3. Langkah Instalasi Node.js & Nginx

Login ke terminal SSH Ubuntu Server kamu, lalu jalankan:

```bash
# 1. Update paket Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx

# 2. Install Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v    # Harus v20.x.x
npm -v
```

---

## 4. Instalasi & Konfigurasi MySQL Server

### Langkah 4.1: Install Paket MySQL
```bash
sudo apt install -y mysql-server

# Pastikan MySQL aktif
sudo systemctl status mysql
```

### Langkah 4.2: Buat Database dan Akun User
Buka terminal interaktif MySQL:
```bash
sudo mysql
```

Jalankan perintah SQL berikut di dalam prompt `mysql>`:
```sql
CREATE DATABASE todolist_db;

CREATE USER 'todouser'@'localhost' IDENTIFIED BY 'Password123!';

GRANT ALL PRIVILEGES ON todolist_db.* TO 'todouser'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```
*(Catatan: Kamu bisa mengganti password `Password123!` dengan password pilihanmu).*

---

## 5. Setup Project & Database Migration

Masuk ke folder project di Ubuntu Server:
```bash
cd ~/todolist

# 1. Install seluruh dependencies
npm install

# 2. Buat file konfigurasi .env untuk MySQL
nano .env
```

Isikan kredensial MySQL yang dibuat tadi:
```env
DATABASE_URL="mysql://todouser:Password123!@localhost:3306/todolist_db"
```
*Simpan dengan `CTRL + O`, lalu `Enter`, dan keluar dengan `CTRL + X`.*

```bash
# 3. Sinkronisasi tabel ke MySQL secara otomatis via Prisma
npx prisma db push

# 4. Build aplikasi Next.js untuk production
npm run build
```
*(Pastikan muncul tulisan `Compiled successfully`).*

---

## 6. Konfigurasi PM2 Process Manager

PM2 akan menjaga aplikasi Next.js tetap menyala di background:

```bash
# Install PM2 secara global
sudo npm install -g pm2

# Jalankan aplikasi Next.js
cd ~/todolist
pm2 start npm --name "todolist-app" -- start

# Simpan agar otomatis hidup saat server reboot
pm2 startup
# (Jika muncul perintah sudo env PATH=..., salin dan jalankan perintah tersebut)
pm2 save
```

---

## 7. Konfigurasi Nginx Reverse Proxy

Nginx meneruskan request publik dari port 80 ke Next.js di port 3000:

```bash
sudo nano /etc/nginx/sites-available/todolist
```

Isikan konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name _; # Atau masukkan IP publik server kamu

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/todolist /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Konfigurasi Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

Sekarang coba buka di browser:
`http://<IP_UBUNTU_SERVER>/`

---

## 9. Menjalankan Pengujian Beban (Locust)

File `locustfile.py` ada di root folder (bisa kamu copy/pindahkan ke folder terpisah di komputermu).

> **Jalankan Locust dari laptop lokal kamu**, bukan di dalam server Ubuntu.

1. Install Locust di komputermu:
   ```bash
   pip install locust
   ```
2. Jalankan Locust:
   ```bash
   locust -f locustfile.py
   ```
3. Buka browser: `http://localhost:8089`
4. Masukkan parameter:
   * **Host**: `http://<IP_UBUNTU_SERVER>`
   * **Number of users**: misal `50` atau `100`
   * **Spawn rate**: misal `5` (user baru per detik)
5. Klik **Start swarming**.

Skenario Locust akan:
- Membaca daftar tugas (`GET /api/todos`).
- Membuat tugas acak (`POST /api/todos`), membaca ID baru, lalu menghapusnya (`DELETE /api/todos/[id]`).

---

## 10. Tips Monitoring Server saat Load Test

Di terminal SSH Ubuntu Server:
```bash
# Pantau konsumsi CPU & RAM aplikasi
pm2 monit

# Pantau beban CPU server secara global
htop

# Pantau koneksi query MySQL secara real-time
sudo mysqladmin -u todouser -p processlist
```

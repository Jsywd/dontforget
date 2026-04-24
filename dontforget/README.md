# 🗒️ Don't Forget — Checklist App

เว็บแอปจัดการ Checklist พร้อม Login ผ่าน Google, Community, สถานที่, และแผนที่

---

## 📁 โครงสร้างโปรเจค

```
dontforget/
├── frontend/
│   ├── css/
│   │   └── style.css          ← Global CSS (Dark theme)
│   ├── js/
│   │   ├── app.js             ← Shared utilities (API, toast, auth)
│   │   └── sidebar.js         ← Sidebar component
│   ├── pages/
│   │   ├── login.html         ← หน้า Login / Register
│   │   ├── dashboard.html     ← หน้า Dashboard
│   │   ├── my-checklists.html ← Checklist ของฉัน
│   │   ├── checklist-detail.html ← รายละเอียด + items + สถานที่
│   │   └── community.html     ← Community / ค้นหา
│   └── index.html             ← Landing (redirect)
│
├── backend/
│   ├── config/
│   │   ├── db.js              ← MySQL connection pool
│   │   └── passport.js        ← Local + Google OAuth strategy
│   ├── middleware/
│   │   └── auth.js            ← isAuthenticated middleware
│   ├── routes/
│   │   ├── auth.js            ← /auth/* (login, register, google, logout)
│   │   ├── checklists.js      ← /api/checklists/* (CRUD + copy + popular)
│   │   ├── items.js           ← /api/items/* (CRUD + image upload)
│   │   ├── places.js          ← /api/places/* (CRUD)
│   │   └── categories.js      ← /api/categories/* (list + interests)
│   ├── uploads/               ← ไฟล์รูปที่อัปโหลด
│   ├── server.js              ← Express entry point
│   ├── package.json
│   └── .env.example
│
└── database/
    └── schema.sql             ← MySQL schema + seed data
```

---

## 🚀 วิธีติดตั้งและรัน

### 1. สร้างฐานข้อมูล
```bash
mysql -u root -p < database/schema.sql
```

### 2. ติดตั้ง dependencies
```bash
cd backend
npm install
```

### 3. ตั้งค่า environment
```bash
cp .env.example .env
# แก้ไขค่าใน .env
```

ค่าที่ต้องตั้ง:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=รหัสผ่าน MySQL ของคุณ
DB_NAME=dontforget_db
SESSION_SECRET=สร้างรหัสยาวๆ เช่น abc123xyz...

# Google OAuth (ดูขั้นตอนด้านล่าง)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 4. รัน server
```bash
npm run dev    # Development (nodemon)
# หรือ
npm start      # Production
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

---

## 🔑 ตั้งค่า Google OAuth

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. ไปที่ **APIs & Services → Credentials**
4. คลิก **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. คัดลอก **Client ID** และ **Client Secret** ไปใส่ใน `.env`

---

## 🌐 API Endpoints

### Auth
| Method | URL | คำอธิบาย |
|--------|-----|----------|
| POST | /auth/register | สมัครสมาชิก |
| POST | /auth/login | เข้าสู่ระบบ |
| POST | /auth/logout | ออกจากระบบ |
| GET  | /auth/me | ดูผู้ใช้ปัจจุบัน |
| GET  | /auth/google | Login ด้วย Google |

### Checklists
| Method | URL | คำอธิบาย |
|--------|-----|----------|
| GET  | /api/checklists/my | Checklist ของฉัน |
| GET  | /api/checklists/popular | ยอดนิยม |
| GET  | /api/checklists/recommended | แนะนำตามความสนใจ |
| GET  | /api/checklists/search?q=&categoryID= | ค้นหา |
| GET  | /api/checklists/:id | ดูรายละเอียด |
| POST | /api/checklists | สร้างใหม่ |
| PUT  | /api/checklists/:id | แก้ไข |
| DELETE | /api/checklists/:id | ลบ |
| POST | /api/checklists/:id/copy | คัดลอก |

### Items
| Method | URL | คำอธิบาย |
|--------|-----|----------|
| POST | /api/items | เพิ่มรายการ (รองรับ multipart/image) |
| PUT  | /api/items/:id | แก้ไขรายการ |
| DELETE | /api/items/:id | ลบรายการ |

### Places
| Method | URL | คำอธิบาย |
|--------|-----|----------|
| POST | /api/places | เพิ่มสถานที่ |
| PUT  | /api/places/:id | แก้ไข |
| DELETE | /api/places/:id | ลบ |
| GET  | /api/places/checklist/:id | ดึงสถานที่ทั้งหมด |

---

## ✅ ฟีเจอร์ที่มี

- ✅ Login / Register (Email + Password)
- ✅ Login ผ่าน Google OAuth 2.0
- ✅ Dashboard + สถิติ
- ✅ สร้าง / แก้ไข / ลบ Checklist
- ✅ เพิ่ม / แก้ไข / ลบ รายการ
- ✅ อัปโหลดรูปในแต่ละรายการ
- ✅ เพิ่มสถานที่ / ร้านอาหาร พร้อม GPS
- ✅ แสดงแผนที่ Google Maps
- ✅ Community + ค้นหา Checklist
- ✅ Copy Checklist จากคนอื่น
- ✅ จัดหมวดหมู่และกรองตามหมวดหมู่
- ✅ แนะนำตามความสนใจ
- ✅ ตั้งค่า Public / Private
- ✅ Progress bar แต่ละ Checklist

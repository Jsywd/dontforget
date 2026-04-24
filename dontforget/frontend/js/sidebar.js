// ฟังก์ชันสำหรับสร้าง HTML ของเมนูตาม Role
function getSidebarContent(isAdmin) {
  if (isAdmin) {
    // --- เมนูสำหรับ Admin ---
    return `
    <aside class="sidebar admin-theme" id="sidebar">
      <div class="sidebar-logo">
        <a href="/pages/admin.html">Don<span>'t</span>Forget 🛡️</a>
      </div>
      
      <div class="sidebar-section">
        <div class="sidebar-label">Admin Management</div>
        <nav class="sidebar-nav">
          <a href="/pages/admin.html" id="nav-admin">
            <span class="icon">📊</span> รายงานรีพอร์ต
          </a>
          <a href="/pages/community.html">
            <span class="icon">🌐</span> ดูหน้า Community
          </a>
        </nav>
      </div>
      <div class="sidebar-bottom">
  <div class="user-chip">
    <div class="user-avatar" style="background: var(--red); color: white;">AD</div>
    <div class="user-info">
      <div class="user-name">Admin Staff</div>
      <div class="user-email">admin@gmail.com</div>
    </div>
  </div>
  <button id="logout-btn" class="logout-btn">
    <span>↪</span> ออกจากระบบ
  </button>
</div>
    </aside>`;
  } else {
    // --- เมนูสำหรับ User ปกติ (โค้ดเดิมของคุณ) ---
    return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <a href="/pages/dashboard.html">Don<span>'t</span>Forget</a>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">เมนูหลัก</div>
        <nav class="sidebar-nav">
          <a href="/pages/dashboard.html" id="nav-dash">
            <span class="icon">🏠</span> แดชบอร์ด
          </a>
          <a href="/pages/my-checklists.html" id="nav-my">
            <span class="icon">✅</span> Checklist ของฉัน
          </a>
          <a href="/pages/community.html" id="nav-comm">
            <span class="icon">👥</span> Community
          </a>
        </nav>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">หมวดหมู่</div>
        <nav class="sidebar-nav" id="sidebar-categories"></nav>
      </div>
      <div class="sidebar-bottom">
  <div class="user-chip" id="user-chip">
    <div class="user-avatar">U</div>
    <div class="user-info">
      <div class="user-name">Loading...</div>
      <div class="user-email"></div>
    </div>
  </div>
  <button id="logout-btn" class="logout-btn">
    <span>↪</span> ออกจากระบบ
  </button>
</div>
    </aside>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const target = document.getElementById('sidebar-mount');

  // 1. วาดโครง Sidebar (ใช้ฟังก์ชันเดิมเพื่อแยก Role แอดมิน/ยูสเซอร์)
  if (target) {
    target.innerHTML = getSidebarContent(isAdmin);
  }

  // 2. โหลดหมวดหมู่เข้า Sidebar (เฉพาะ User ตามที่คุณต้องการ)
  if (!isAdmin) {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' });
      const data = await res.json();
      const nav = document.getElementById('sidebar-categories');

      if (nav && data.success) {
        // 🚩 แก้ไข href ตรงนี้เพื่อให้ส่งค่าไปหน้า Dashboard ได้ถูกต้อง
        nav.innerHTML = data.data.map(c => `
  <a href="/pages/community.html?categoryID=${c.categoryID}">
    <span class="icon">${c.icon || '📂'}</span> ${c.categoryName}
  </a>
`).join('');
      }
    } catch (e) {
      console.error("โหลดหมวดหมู่ไม่สำเร็จ:", e);
    }
  }

  // 3. ผูกฟังก์ชัน Logout (ถ้ามี)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if(confirm('ออกจากระบบใช่ไหม?')) logout();
    });
  }
});

// ฟังก์ชันโหลดหมวดหมู่
async function loadSidebarCategories() {
    const container = document.getElementById('sidebar-categories');
    if (!container) return;

    try {
        const res = await API.get('/api/categories');
        // ตรวจสอบโครงสร้าง res (บางทีอาจเป็น {success: true, data: []})
        const categories = Array.isArray(res) ? res : (res.data || []);
        
        container.innerHTML = categories.map(cat => `
    <a href="/pages/dashboard.html?category=${cat.categoryID}">
        <span class="icon">📁</span> ${cat.categoryName}
    </a>
`).join('');
    } catch (err) {
        console.error("Failed to load categories", err);
    }
}

// ฟังก์ชันพิเศษสำหรับ Admin (ดึงข้อมูลจาก LocalStorage มาโชว์)
function renderAdminChip() {
    const adminData = JSON.parse(localStorage.getItem('user'));
    if (adminData) {
        const nameEl = document.querySelector('.user-name');
        const emailEl = document.querySelector('.user-email');
        if (nameEl) nameEl.textContent = adminData.username || 'Admin Staff';
        if (emailEl) emailEl.textContent = adminData.email || 'admin@gmail.com';
    }
}
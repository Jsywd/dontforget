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
  const target = document.getElementById('sidebar-mount');
  if (!target) return;

  // ดึงข้อมูล user จาก server แทน localStorage
  let isAdmin = false;
  let user = null;

  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (data.loggedIn) {
      user = data.user;
      isAdmin = data.user.role === 'admin';
    }
  } catch (e) {}

  target.innerHTML = getSidebarContent(isAdmin);

  // แสดงข้อมูล user ใน sidebar
  if (user) {
    const nameEl = document.querySelector('.user-name');
    const emailEl = document.querySelector('.user-email');
    const avatarEl = document.querySelector('.user-avatar');
    if (nameEl) nameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) {
      if (user.avatar) avatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
      else avatarEl.textContent = (user.username || 'U').substring(0, 2).toUpperCase();
    }
  }

  // โหลดหมวดหมู่
  if (!isAdmin) {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' });
      const data = await res.json();
      const nav = document.getElementById('sidebar-categories');
      if (nav && data.success) {
        nav.innerHTML = data.data.map(c => `
          <a href="/pages/community.html?categoryID=${c.categoryID}">
            <span class="icon">${c.icon || '📂'}</span> ${c.categoryName}
          </a>
        `).join('');
      }
    } catch (e) {}
  }

  // logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('ออกจากระบบใช่ไหม?')) logout();
    });
  }
});
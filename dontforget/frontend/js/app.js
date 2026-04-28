// API helper 
const API = {
  async request(method, url, data = null, isForm = false) {
    const opts = {
      method,
      credentials: "include",
      headers: {},
    };

    if (isForm) {
      opts.body = data;
    } else {
      opts.headers["Content-Type"] = "application/json";
      if (data) opts.body = JSON.stringify(data);
    }

    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error ${res.status}`);
      }
      return res.json();
    } catch (err) {
      console.error("API Request Error:", err);
      return { success: false, message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
    }
  },
  get: (url) => API.request("GET", url),
  post: (url, data, isForm) => API.request("POST", url, data, isForm),
  put: (url, data, isForm) => API.request("PUT", url, data, isForm),
  delete: (url) => API.request("DELETE", url),
};

// Auth state 
let currentUser = null;

async function loadAuth() {
  try {
    if (localStorage.getItem("isAdmin") === "true") {
      const adminUser = JSON.parse(localStorage.getItem("adminUser"));
      renderUserChip(adminUser);
      return adminUser;
    }

    const res = await API.get("/auth/me");
    if (res.loggedIn) {
      currentUser = res.user;
      renderUserChip(res.user);
      return res.user;
    } else {
      const protectedPages = [
        "dashboard",
        "my-checklists",
        "checklist-detail",
        "admin",
      ];
      const currentPage = window.location.pathname;
      if (protectedPages.some((p) => currentPage.includes(p))) {
        window.location.href = "/pages/login.html";
      }
      return null;
    }
  } catch (e) {
    return null;
  }
}

function renderUserChip(user) {
  const chip = document.getElementById("user-chip");
  if (!chip) return;
  const initials = (user.username || "U").substring(0, 2).toUpperCase();

  const nameEl = chip.querySelector(".user-name");
  const emailEl = chip.querySelector(".user-email");
  const av = chip.querySelector(".user-avatar");

  if (nameEl) nameEl.textContent = user.username;
  if (emailEl) emailEl.textContent = user.email;

  if (av) {
    if (user.avatar) av.innerHTML = `<img src="${user.avatar}" alt="">`;
    else av.textContent = initials;
  }
}

// Logout 
async function logout() {
  localStorage.clear();
  sessionStorage.clear();
  try {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
  } catch (err) {
    console.log("Server logout failed, but clearing local data anyway.");
  }
  window.location.replace("/pages/login.html");
}

function toast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === "success" ? "✅" : "❌"}</span> ${message}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".sidebar-nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href) a.classList.toggle("active", path.includes(href));
  });
}

function initMobileSidebar() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCategoryColor(name) {
  const colors = {
    การท่องเที่ยว: "#3b82f6",
    การถ่ายภาพ: "#8b5cf6",
    ร้านกาแฟ: "#f59e0b",
    ร้านอาหาร: "#ef4444",
    การเรียน: "#10b981",
    ช้อปปิ้ง: "#ec4899",
    ออกกำลังกาย: "#06b6d4",
  };
  return colors[name] || "#6b7280";
}

// Init on every page
document.addEventListener("DOMContentLoaded", () => {
  loadAuth();
  setActiveNav();
  initMobileSidebar();
});

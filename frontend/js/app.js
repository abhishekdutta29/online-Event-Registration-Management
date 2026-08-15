// Apply saved theme immediately on load to prevent flash
(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Frontend Utilities and Auth Management

const API_BASE = '';

// Auth helper functions
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const userJson = localStorage.getItem('user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Global API Fetch wrapper with Auth Headers
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle unauthorized / expired token
      if (response.status === 401 || response.status === 403) {
        // If they were logged in, clear and redirect
        if (getToken()) {
          clearSession();
          showAlert('Session expired. Please log in again.', 'warning');
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 1500);
        }
      }
      throw new Error(data.message || 'API request failed.');
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Custom Premium Alerts
function showAlert(message, type = 'info') {
  let container = document.getElementById('alert-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alert-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-glass ${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <span class="me-2 fs-5">${icon}</span>
      <span>${message}</span>
    </div>
    <button class="close-btn-glass ms-3" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Dynamically Render Common Navbar
function renderNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  const user = getUser();
  const isLoggedIn = !!user;
  const isAdmin = user && user.role === 'admin';

  let navItems = `
    <li class="nav-item">
      <a class="nav-link ${window.location.pathname === '/' || window.location.pathname.endsWith('index.html') ? 'active' : ''}" href="/index.html">Browse Events</a>
    </li>
  `;

  if (isLoggedIn) {
    navItems += `
      <li class="nav-item">
        <a class="nav-link ${window.location.pathname.endsWith('dashboard.html') ? 'active' : ''}" href="/dashboard.html">My Dashboard</a>
      </li>
    `;
    if (isAdmin) {
      navItems += `
        <li class="nav-item">
          <a class="nav-link ${window.location.pathname.endsWith('admin.html') ? 'active' : ''}" href="/admin.html">Admin Panel</a>
        </li>
      `;
    }
  }

  const theme = localStorage.getItem('theme') || 'dark';
  const themeIcon = theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill';
  const themeBtn = `
    <button class="btn btn-outline-glass btn-sm me-2 d-flex align-items-center justify-content-center" id="theme-toggle-btn" title="Toggle Light/Dark Mode" style="width: 32px; height: 32px; padding: 0;">
      <i class="bi ${themeIcon}"></i>
    </button>
  `;

  let authSection = '';
  if (isLoggedIn) {
    authSection = `
      <div class="d-flex align-items-center gap-2">
        <span class="text-secondary me-2 d-none d-md-inline">Welcome, <strong class="text-light">${user.username}</strong>${isAdmin ? ' (Admin)' : ''}</span>
        ${themeBtn}
        <button class="btn btn-outline-glass btn-sm" id="logout-btn">Logout</button>
      </div>
    `;
  } else {
    authSection = `
      <div class="d-flex gap-2 align-items-center">
        ${themeBtn}
        <a class="btn btn-outline-glass btn-sm" href="/login.html">Login</a>
        <a class="btn btn-primary-glow btn-sm" href="/register.html">Register</a>
      </div>
    `;
  }

  header.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-glass fixed-top">
      <div class="container">
        <a class="navbar-brand" href="/index.html">
          <i class="bi bi-calendar-event me-2"></i>EventVibe
        </a>
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navItems}
          </ul>
          ${authSection}
        </div>
      </div>
    </nav>
    <div style="height: 80px;"></div>
  `;

  // Bind theme toggle listener
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      renderNavbar();
    });
  }

  // Bind logout listener
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      showAlert('Logged out successfully.', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    });
  }
}

// Utility to get category tag class
function getCategoryTagClass(category) {
  const cat = category.toLowerCase();
  if (cat.includes('tech')) return 'tag-tech';
  if (cat.includes('music') || cat.includes('art')) return 'tag-music';
  if (cat.includes('food') || cat.includes('drink')) return 'tag-food';
  if (cat.includes('business') || cat.includes('startup')) return 'tag-business';
  if (cat.includes('sport') || cat.includes('run')) return 'tag-sports';
  return 'tag-default';
}

// Load navbar on load
document.addEventListener('DOMContentLoaded', renderNavbar);

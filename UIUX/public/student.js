// ==========================================================================
// UMSKAL Lost & Found - Student Portal Logic Controller
// Enforces precise validation states and field-level error messages
// ==========================================================================

let activeStudentTab = "home";
let activeReportsSubTab = "lost-claims";
let searchCategoryFilter = "";
let currentViewItem = null;
let currentViewReport = null;
let preselectedLostReportId = null;

// Photo uploads state
let uploadPhotoState = {
  lost: null,
  found: null,
  claim: null
};

const SVG_MOCKS = {
  wallet: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231E3A8A'/><rect x='10' y='25' width='80' height='50' rx='6' fill='%230F172A'/><line x1='10' y1='40' x2='90' y2='40' stroke='%23FBBF24' stroke-width='3'/><circle cx='80' cy='50' r='5' fill='%23FBBF24'/><text x='50' y='88' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Leather Wallet</text></svg>",
  matric: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%2316A34A'/><rect x='15' y='15' width='70' height='45' rx='4' fill='%23FFFFFF' opacity='0.9'/><circle cx='35' cy='35' r='10' fill='%2316A34A'/><rect x='52' y='25' width='25' height='4' rx='1' fill='%230F172A'/><rect x='52' y='33' width='20' height='4' rx='1' fill='%2364748B'/><rect x='52' y='41' width='25' height='4' rx='1' fill='%2364748B'/><text x='50' y='85' font-family='sans-serif' font-size='7' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Matric Card (UMS)</text></svg>",
  keys: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%23D97706'/><circle cx='40' cy='45' r='12' fill='none' stroke='%23FFFFFF' stroke-width='4'/><rect x='50' y='41' width='25' height='8' fill='%23FFFFFF'/><rect x='60' y='49' width='6' height='8' fill='%23FFFFFF'/><rect x='70' y='49' width='6' height='8' fill='%23FFFFFF'/><circle cx='40' cy='45' r='4' fill='%23FFFFFF'/><text x='50' y='85' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Key Ring</text></svg>",
  bottle: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%232563EB'/><rect x='42' y='18' width='16' height='10' rx='2' fill='%23DBEAFE'/><rect x='35' y='28' width='30' height='50' rx='10' fill='%23FFFFFF' opacity='0.9'/><line x1='35' y1='45' x2='65' y2='45' stroke='%232563EB' stroke-width='4'/><text x='50' y='88' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Thermos Bottle</text></svg>",
  electronics: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%23475569'/><rect x='30' y='20' width='40' height='60' rx='6' fill='%230F172A'/><rect x='34' y='24' width='32' height='46' rx='2' fill='%23FFFFFF' opacity='0.15'/><circle cx='50' cy='73' r='4' fill='%23FFFFFF'/><text x='50' y='88' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Smartphone</text></svg>",
  bag: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%234F46E5'/><path d='M30 40 C 30 25, 70 25, 70 40 Z' fill='none' stroke='%23FFFFFF' stroke-width='4'/><rect x='25' y='40' width='50' height='40' rx='8' fill='%23FFFFFF' opacity='0.9'/><rect x='42' y='50' width='16' height='10' fill='%234F46E5'/><text x='50' y='88' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Backpack</text></svg>",
  books: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%230891B2'/><rect x='30' y='20' width='45' height='55' rx='2' fill='%23FFFFFF' transform='rotate(-5 30 20)'/><rect x='35' y='20' width='45' height='55' rx='2' fill='%230E7490' transform='rotate(5 35 20)'/><rect x='45' y='30' width='25' height='4' fill='%23FFFFFF'/><text x='50' y='88' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Textbook</text></svg>",
  default: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%2364748B'/><circle cx='50' cy='45' r='15' fill='none' stroke='%23FFFFFF' stroke-width='4'/><text x='50' y='85' font-family='sans-serif' font-size='8' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>Campus Item</text></svg>"
};

// ==========================================================================
// Settings Sync from Admin (localStorage)
// ==========================================================================
const DEFAULT_CATEGORIES = ["Matric Card", "Wallet", "Keys", "Bottle", "Electronics", "Bag", "Books", "Others"];
const DEFAULT_LOCATIONS = ["Library", "Cafeteria", "DK 3", "Block D Lab", "Campus Mosque", "Hostel", "Admin Block", "Security Office", "Others"];

function loadStudentSettings() {
  const categories = JSON.parse(localStorage.getItem("settingsCategories") || "null") || DEFAULT_CATEGORIES;
  const locations = JSON.parse(localStorage.getItem("settingsLocations") || "null") || DEFAULT_LOCATIONS;
  const counterLocation = localStorage.getItem("settingsCounterLocation") || "Student Affairs Office, Admin Block";
  const collectionInstructions = localStorage.getItem("settingsCollectionInstructions") !== null ? localStorage.getItem("settingsCollectionInstructions") : "Bring your student ID when collecting an approved item.";
  const officer = JSON.parse(localStorage.getItem("settingsOfficer") || "null") || { name: "Dahlan", role: "HEP Officer", email: "hep@ums.edu.my" };

  // --- Populate category chip buttons in Lost and Found forms ---
  ["lost", "found"].forEach(type => {
    const grid = document.getElementById(`${type}-category-chips`);
    const select = document.getElementById(`${type}-category`);
    if (!grid || !select) return;

    // Build chips
    grid.innerHTML = categories.map(cat => `
      <button class="chip-btn" type="button" onclick="selectCategoryChip('${type}', '${cat}', this)">${cat}</button>
    `).join("");

    // Build hidden select options
    select.innerHTML = `<option value="" disabled selected>Select category</option>` +
      categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  });

  // --- Populate search filter chips ---
  const searchFilter = document.getElementById("search-category-filter");
  if (searchFilter) {
    searchFilter.innerHTML = `<span class="chip active" onclick="setCategoryFilter('', this)">All Categories</span>` +
      categories.map(cat => {
        // Pluralise common names for readability
        const label = cat === "Matric Card" ? "Matric Cards"
          : cat === "Wallet" ? "Wallets"
            : cat === "Bottle" ? "Bottles"
              : cat === "Bag" ? "Bags"
                : cat === "Books" ? "Books"
                  : cat;
        return `<span class="chip" onclick="setCategoryFilter('${cat}', this)">${label}</span>`;
      }).join("");
  }

  // --- Populate location datalist for lost, found, and claim location inputs ---
  ["lost-location", "found-location", "claim-lost-where"].forEach(inputId => {
    const input = document.getElementById(inputId);
    if (!input) return;
    // Add or reuse datalist
    let datalistId = `${inputId}-datalist`;
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.id = datalistId;
      input.parentNode.insertBefore(datalist, input.nextSibling);
    }
    input.setAttribute("list", datalistId);
    datalist.innerHTML = locations.map(loc => `<option value="${loc}">`).join("");
  });

  // --- Help screen: counter info ---
  const locEl = document.getElementById("help-counter-location");
  if (locEl) locEl.innerText = counterLocation;

  const emailEl = document.getElementById("help-counter-email");
  if (emailEl) emailEl.innerText = officer.email;

  const instrEl = document.getElementById("help-counter-instructions");
  const instrRow = document.getElementById("help-counter-instructions-row");
  if (instrEl && instrRow) {
    if (collectionInstructions) {
      instrEl.innerText = collectionInstructions;
      instrRow.style.display = "block";
    } else {
      instrRow.style.display = "none";
    }
  }
}

window.onload = function () {
  // Mobile clock
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById("mobile-clock");
    if (clock) {
      clock.innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
  }, 1000);

  // Sync settings from admin
  loadStudentSettings();

  // Initialize student authentication session
  initUserSession();

  // Set default form dates
  const dField = document.getElementById("lost-date");
  if (dField) dField.value = new Date().toISOString().split('T')[0];
  const tField = document.getElementById("lost-time");
  if (tField) tField.value = "12:00";

  const fdField = document.getElementById("found-date");
  if (fdField) fdField.value = new Date().toISOString().split('T')[0];
  const ftField = document.getElementById("found-time");
  if (ftField) ftField.value = "12:00";

  lucide.createIcons();
};

// Add listener to automatically reload settings when changed from admin tab
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('settings')) {
    loadStudentSettings();
  }
});

// ==========================================================================
// Authentication & Profile Controller (With localStorage session state)
// ==========================================================================
const DEFAULT_USER = {
  fullName: "Muhammad Haziq Hazim bin Amir",
  matric: "BI23110360",
  email: "haxim.2mars@gmail.com",
  phone: "0108204841",
  password: "password123"
};

function getDisplayName(fullName) {
  if (!fullName) return "Student";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[1]; // Always take the second word
  }
  return parts[0];
}

function initUserSession() {
  const seedKey = "db_seed_reset_haxim_v6";
  if (localStorage.getItem(seedKey) !== "true") {
    // Clear custom registered users and set default student user
    localStorage.setItem("studentUsers", JSON.stringify([DEFAULT_USER]));
    // Clear active session to force login screen first
    localStorage.removeItem("currentUser");

    // Reset admin session and update default settings officer
    sessionStorage.removeItem("adminLogged");

    const adminOfficer = {
      name: "Haziq",
      role: "HEP Officer",
      email: "haziq_hep@ums.edu.my"
    };
    localStorage.setItem("settingsOfficer", JSON.stringify(adminOfficer));

    // Call server-side DB reset
    fetch('/api/reset', { method: 'POST' })
      .catch(err => console.error("Failed to reset server DB:", err));

    localStorage.setItem(seedKey, "true");
  }

  // Load active session
  let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) {
    // If not logged in, make sure screen is login screen
    navigateToStudentScreen('scr-student-login');
  } else {
    // Already logged in
    updateUIWithUser(currentUser);
    navigateToStudentScreen('scr-student-home');
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return "-";
  // Remove any spaces or dashes to normalize
  const cleaned = phone.replace(/[\s-]/g, "");
  if (/^011\d{7,8}$/.test(cleaned)) {
    // 011-XXXX XXXX
    return cleaned.slice(0, 3) + "-" + cleaned.slice(3, 7) + " " + cleaned.slice(7);
  } else if (/^01[02-9]\d{7,8}$/.test(cleaned)) {
    // 01X-XXX XXXX or 01X-XXXX XXXX
    return cleaned.slice(0, 3) + "-" + cleaned.slice(3, 6) + " " + cleaned.slice(6);
  }
  return phone;
}

function updateUIWithUser(user) {
  // Update homepage greeting
  const greetingEl = document.getElementById("home-greeting-name");
  if (greetingEl) {
    greetingEl.innerText = `Hi, ${getDisplayName(user.fullName)}`;
  }

  // Update Profile screen inputs & view elements
  const pfViewName = document.getElementById("profile-view-fullname");
  if (pfViewName) pfViewName.innerText = user.fullName;
  const pfViewMatric = document.getElementById("profile-view-matric");
  if (pfViewMatric) pfViewMatric.innerText = user.matric;
  const pfViewEmail = document.getElementById("profile-view-email");
  if (pfViewEmail) pfViewEmail.innerText = user.email;
  const pfViewPhone = document.getElementById("profile-view-phone");
  if (pfViewPhone) pfViewPhone.innerText = formatPhoneNumber(user.phone);

  const pfPhoneInput = document.getElementById("profile-phone");
  if (pfPhoneInput) pfPhoneInput.value = user.phone || "";

  // Update avatar initials
  const avatarInitials = document.getElementById("profile-avatar-initials");
  if (avatarInitials) {
    const parts = user.fullName.trim().split(/\s+/);
    let init = "ST";
    if (parts.length >= 2) {
      init = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      init = parts[0].slice(0, 2).toUpperCase();
    }
    avatarInitials.innerText = init;
  }

  const avatarName = document.getElementById("profile-display-name");
  if (avatarName) avatarName.innerText = user.fullName;
}

function studentLogin() {
  const emailInput = document.getElementById("student-email").value.trim();
  const passwordInput = document.getElementById("student-password").value.trim();

  if (!emailInput || !passwordInput) {
    alert("Please enter both email and password.");
    return;
  }

  // Admin login check (redirect to admin panel using the same portal login)
  if (emailInput.toLowerCase() === "haziq_hep@ums.edu.my" && passwordInput === "password123") {
    sessionStorage.setItem("adminLogged", "true");
    alert("Admin login successful. Redirecting to admin dashboard...");
    window.location.href = "/admin.html";
    return;
  }

  const users = JSON.parse(localStorage.getItem("studentUsers") || "[]");
  const user = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput);

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    updateUIWithUser(user);
    navigateToStudentTab('home');
  } else {
    alert("Invalid credentials. Try using default credentials or register a new account.");
  }
}

function studentRegister() {
  clearFormErrors('scr-student-register');

  const fullName = document.getElementById("register-fullname").value.trim();
  const matric = document.getElementById("register-matric").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const phone = document.getElementById("register-phone").value.trim();
  const password = document.getElementById("register-password").value.trim();

  let valid = true;
  if (!fullName) {
    document.getElementById("err-register-fullname").style.display = "block";
    valid = false;
  }
  if (!matric) {
    document.getElementById("err-register-matric").style.display = "block";
    valid = false;
  }
  if (!email || !email.includes('@')) {
    document.getElementById("err-register-email").style.display = "block";
    valid = false;
  }
  if (!phone) {
    document.getElementById("err-register-phone").style.display = "block";
    valid = false;
  }
  if (!password || password.length < 4) {
    document.getElementById("err-register-password").style.display = "block";
    valid = false;
  }

  if (!valid) return;

  let users = JSON.parse(localStorage.getItem("studentUsers") || "[]");
  const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    alert("An account with this email is already registered.");
    return;
  }

  const newUser = { fullName, matric, email, phone, password };
  users.push(newUser);
  localStorage.setItem("studentUsers", JSON.stringify(users));

  // Clear registration fields
  document.getElementById("register-fullname").value = "";
  document.getElementById("register-matric").value = "";
  document.getElementById("register-email").value = "";
  document.getElementById("register-phone").value = "";
  document.getElementById("register-password").value = "";

  alert("Account registered successfully! Please log in.");
  navigateToStudentScreen('scr-student-login');
}

function enableProfileEdit() {
  document.getElementById("profile-phone-view-container").style.display = "none";
  document.getElementById("profile-phone-edit-container").style.display = "block";
  document.getElementById("profile-default-actions").style.display = "none";
  document.getElementById("profile-edit-actions").style.display = "block";

  const phoneInput = document.getElementById("profile-phone");
  if (phoneInput) {
    phoneInput.focus();
    // Move cursor to end of text
    const val = phoneInput.value;
    phoneInput.value = '';
    phoneInput.value = val;
  }
}

function cancelProfileEdit() {
  clearFormErrors('scr-student-profile');

  document.getElementById("profile-phone-edit-container").style.display = "none";
  document.getElementById("profile-phone-view-container").style.display = "block";
  document.getElementById("profile-edit-actions").style.display = "none";
  document.getElementById("profile-default-actions").style.display = "block";

  // Restore current value
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (currentUser) {
    document.getElementById("profile-phone").value = currentUser.phone || "";
  }
}

function saveStudentProfile() {
  clearFormErrors('scr-student-profile');

  const phone = document.getElementById("profile-phone").value.trim();

  let valid = true;
  if (!phone) {
    document.getElementById("err-profile-phone").style.display = "block";
    valid = false;
  }

  if (!valid) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (currentUser) {
    currentUser.phone = phone;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Update in users array
    let users = JSON.parse(localStorage.getItem("studentUsers") || "[]");
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx].phone = phone;
      localStorage.setItem("studentUsers", JSON.stringify(users));
    }

    updateUIWithUser(currentUser);
    alert("Contact details saved successfully!");
    cancelProfileEdit();
  }
}

function showChangePasswordModal() {
  const currentPassword = prompt("Enter your current password:");
  if (currentPassword === null) return; // Cancelled

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser || currentPassword !== currentUser.password) {
    alert("Incorrect current password.");
    return;
  }

  const newPassword = prompt("Enter your new password (minimum 4 characters):");
  if (!newPassword) return;
  if (newPassword.length < 4) {
    alert("Password must be at least 4 characters long.");
    return;
  }

  // Update user
  currentUser.password = newPassword;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Update in users array
  let users = JSON.parse(localStorage.getItem("studentUsers") || "[]");
  const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
  if (idx !== -1) {
    users[idx].password = newPassword;
    localStorage.setItem("studentUsers", JSON.stringify(users));
  }

  alert("Password changed successfully!");
}

function studentLogout() {
  localStorage.removeItem("currentUser");
  // Reset fields on login page
  document.getElementById("student-email").value = "";
  document.getElementById("student-password").value = "";
  navigateToStudentScreen('scr-student-login');
}

function contactAdminEmail() {
  const officer = JSON.parse(localStorage.getItem("settingsOfficer") || "null") || { email: "hep@ums.edu.my" };
  const email = officer.email || "hep@ums.edu.my";
  alert(`Contacting Admin: Email client would open ${email}`);
}

// ==========================================================================
// View Routing
// ==========================================================================
function navigateToStudentScreen(screenId) {
  const screens = document.querySelectorAll(".mobile-screen");
  screens.forEach(s => s.classList.remove("active"));

  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");

  const bottomNav = document.getElementById("mobile-nav-bar");
  const hideNavScreens = ['scr-student-login', 'scr-student-register', 'scr-student-success', 'scr-student-claim-success', 'scr-student-report-lost', 'scr-student-report-found', 'scr-student-submit-claim'];
  if (hideNavScreens.includes(screenId)) {
    bottomNav.style.display = "none";
  } else {
    bottomNav.style.display = "flex";
  }

  if (screenId === 'scr-student-home') {
    loadHomeWidgets();
  } else if (screenId === 'scr-student-notifications') {
    loadNotifications();
  } else if (screenId === 'scr-student-report-lost') {
    resetLostStepper();
  } else if (screenId === 'scr-student-report-found') {
    resetFoundStepper();
  } else if (screenId === 'scr-student-submit-claim') {
    resetClaimStepper();
  } else if (screenId === 'scr-student-profile') {
    cancelProfileEdit();
  }

  lucide.createIcons();
}

function navigateToStudentTab(tabName) {
  activeStudentTab = tabName;

  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(t => t.classList.remove("active"));
  document.getElementById(`nav-tab-${tabName}`).classList.add("active");

  if (tabName === 'home') navigateToStudentScreen('scr-student-home');
  else if (tabName === 'search') {
    loadSearchItems();
    navigateToStudentScreen('scr-student-search');
  }
  else if (tabName === 'reports') {
    loadMyReports();
    navigateToStudentScreen('scr-student-reports');
  }
  else if (tabName === 'notifications') {
    loadNotifications();
    navigateToStudentScreen('scr-student-notifications');
  }
  else if (tabName === 'help') navigateToStudentScreen('scr-student-help');
}

function setReportsSubTab(subTab) {
  activeReportsSubTab = subTab;
  const subBtns = document.querySelectorAll(".sub-tab-btn");
  subBtns.forEach(btn => btn.classList.remove("active"));
  document.getElementById(`btn-subtab-${subTab}`).classList.add("active");
  loadMyReports();
}

// ==========================================================================
// Real File Picker and Reader
// ==========================================================================
function triggerUpload(type) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size is too large. Please select an image smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      const dataUrl = evt.target.result;

      uploadPhotoState[type] = dataUrl;

      document.getElementById(`preview-${type}-img`).src = dataUrl;
      document.getElementById(`preview-${type}-img`).style.display = "block";
      document.getElementById(`overlay-${type}-remove`).style.display = "flex";
      document.getElementById(`upload-${type}-photo-box`).classList.add("has-image");

      document.getElementById(`icon-upload-${type}`).style.display = "none";
      document.getElementById(`text-upload-${type}`).innerText = "Photo Uploaded";
      document.getElementById(`sub-upload-${type}`).innerText = `Loaded: ${file.name}`;

      // Hide error on found upload once uploaded
      if (type === 'found') {
        const errEl = document.getElementById("err-found-photo");
        if (errEl) errEl.style.display = "none";
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function removeUpload(event, type) {
  event.stopPropagation();
  uploadPhotoState[type] = null;

  document.getElementById(`preview-${type}-img`).style.display = "none";
  document.getElementById(`overlay-${type}-remove`).style.display = "none";
  document.getElementById(`upload-${type}-photo-box`).classList.remove("has-image");

  document.getElementById(`icon-upload-${type}`).style.display = "block";
  document.getElementById(`text-upload-${type}`).innerText = type === "claim" ? "Upload Document/Image" : "Choose a photo";
  document.getElementById(`sub-upload-${type}`).innerText = type === "claim" ? "Screenshot, old photo, invoice, etc." : "PNG, JPG up to 5MB";
}

// ==========================================================================
// REST Fetch Operations (Student Side)
// ==========================================================================

function loadSearchItems() {
  const resultsContainer = document.getElementById("search-results-list");
  const query = document.getElementById("search-input").value.toLowerCase();

  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      const filtered = items.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        const matchesCategory = searchCategoryFilter === "" || item.category === searchCategoryFilter;
        // Only show items available for claim
        const isSearchable = item.status === "Available for Claim";

        return matchesQuery && matchesCategory && isSearchable;
      });

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <i data-lucide="package-search" class="empty-state-icon" style="width:40px; height:40px;"></i>
            <h5>No matching item found.</h5>
            <p>Try another keyword or report your lost item.</p>
            <button class="btn btn-primary" onclick="openLostReportWithSearchTerm()" style="width:auto; font-size:12px; padding:6px 14px;">
              Can't find it? Report it as Lost
            </button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      let html = "";
      filtered.forEach(item => {
        const badgeClass = item.status === "Available for Claim" ? "badge-available-for-claim" : "badge-claim-pending";
        html += `
          <div class="item-card" onclick="viewItemDetail('${item.id}')">
            <div class="item-card-img-wrapper">
              <img src="${item.image}" class="item-card-img">
            </div>
            <div class="item-card-info">
              <div>
                <h4 class="item-card-title">${item.name}</h4>
                <div class="item-card-meta">
                  <span><i data-lucide="map-pin"></i> Found near: ${item.location}</span>
                  <span><i data-lucide="calendar"></i> Date: ${item.date}</span>
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span class="status-badge ${badgeClass}">${item.status}</span>
                <button class="view-details-btn">View Details</button>
              </div>
            </div>
          </div>
        `;
      });
      resultsContainer.innerHTML = html;
      lucide.createIcons();
    })
    .catch(err => console.error("Error loading search items:", err));
}

function setCategoryFilter(category, el) {
  searchCategoryFilter = category;
  const chips = document.querySelectorAll("#search-category-filter .chip");
  chips.forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  loadSearchItems();
}

function filterItems() {
  loadSearchItems();
}

function viewItemDetail(id) {
  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      const item = items.find(i => i.id === id);
      if (!item) return;

      currentViewItem = item;

      document.getElementById("detail-item-img").src = item.image;
      document.getElementById("detail-item-name").innerText = item.name;
      document.getElementById("detail-item-category").innerText = `Category: ${item.category}`;
      document.getElementById("detail-item-location").innerText = item.location;
      document.getElementById("detail-item-date").innerText = item.date;
      document.getElementById("detail-item-ref").innerText = `#${item.reference}`;

      const statusEl = document.getElementById("detail-item-status");
      statusEl.innerText = item.status;
      statusEl.className = "status-badge " + (item.status === "Available for Claim" ? "badge-available-for-claim" : "badge-claim-pending");

      const claimBtn = document.getElementById("detail-claim-btn");
      if (item.status === "Claim Pending" || item.status === "Ready for Collection" || item.status === "Returned") {
        claimBtn.innerText = item.status;
        claimBtn.disabled = true;
        claimBtn.style.opacity = "0.6";
        claimBtn.style.cursor = "not-allowed";
      } else {
        claimBtn.innerText = "Claim This Item";
        claimBtn.disabled = false;
        claimBtn.style.opacity = "1";
        claimBtn.style.cursor = "pointer";
      }

      navigateToStudentScreen('scr-student-item-detail');
    });
}

function openClaimForm() {
  if (!currentViewItem) return;
  document.getElementById("claim-item-thumb").src = currentViewItem.image;
  document.getElementById("claim-item-name").innerText = currentViewItem.name;
  document.getElementById("claim-item-ref").innerText = `Ref: #${currentViewItem.reference}`;

  // Clear error spans
  const errorSpans = document.querySelectorAll("#scr-student-submit-claim .field-error-msg");
  errorSpans.forEach(span => span.style.display = "none");

  // Auto-fill values from user session if logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (currentUser) {
    document.getElementById("claim-fullname").value = currentUser.fullName;
    document.getElementById("claim-matric").value = currentUser.matric;
    document.getElementById("claim-email").value = currentUser.email;
  }

  // Default values
  document.getElementById("claim-lost-date").value = new Date().toISOString().split('T')[0];
  document.getElementById("claim-lost-time").value = "12:00";

  // Fetch active lost reports to see if we can link
  fetch('/api/lost-reports')
    .then(res => res.json())
    .then(reports => {
      const activeReports = reports.filter(r => r.status === "Submitted" || r.status === "Possible Match Found");
      const group = document.getElementById("claim-link-report-group");
      const select = document.getElementById("claim-link-report");

      if (activeReports.length > 0) {
        group.style.display = "block";
        select.innerHTML = `<option value="">-- No linked report (Direct Claim) --</option>`;
        activeReports.forEach(r => {
          const isSelected = (preselectedLostReportId === r.id || r.matchedItemId === currentViewItem.id) ? "selected" : "";
          select.innerHTML += `<option value="${r.id}" ${isSelected}>${r.name} (Ref: ${r.id})</option>`;
        });
      } else {
        group.style.display = "none";
        select.innerHTML = `<option value="">-- No linked report (Direct Claim) --</option>`;
      }
      navigateToStudentScreen('scr-student-submit-claim');
    })
    .catch(err => {
      console.error("Error loading active reports:", err);
      navigateToStudentScreen('scr-student-submit-claim');
    });
}

function closeClaimForm() {
  navigateToStudentScreen('scr-student-item-detail');
}

// Render student reports
function loadMyReports() {
  const container = document.getElementById("reports-items-list");
  container.innerHTML = "";

  if (activeReportsSubTab === 'lost-claims') {
    Promise.all([
      fetch('/api/lost-reports').then(res => res.json()),
      fetch('/api/claims').then(res => res.json())
    ]).then(([reports, claims]) => {
      const cardsData = [];

      // 1. Process all Lost Reports
      reports.forEach(r => {
        const linkedClaim = claims.find(c => c.lostReportId === r.id);
        if (linkedClaim) {
          // Linked: Show the Claim's status but with the Lost Report's details!
          let badgeClass = "badge-under-review";
          if (linkedClaim.status === 'Ready for Collection') badgeClass = "badge-ready-for-collection";
          else if (linkedClaim.status === 'Returned') badgeClass = "badge-returned";
          else if (linkedClaim.status === 'Rejected') badgeClass = "badge-rejected";
          else if (linkedClaim.status === 'Claim Pending') badgeClass = "badge-claim-pending";

          cardsData.push({
            id: linkedClaim.id,
            type: 'claim',
            name: r.name,
            image: r.image,
            meta1: `<i data-lucide="map-pin"></i> Last seen: ${r.location}`,
            meta2: `<i data-lucide="calendar"></i> Date Lost: ${r.date}`,
            status: linkedClaim.status,
            badgeClass: badgeClass,
            clickAction: `viewTimeline('claim', '${linkedClaim.id}')`
          });
        } else {
          // Unlinked Lost Report: Either Submitted or Possible Match Found
          let badgeClass = "badge-submitted";
          if (r.status === "Possible Match Found") badgeClass = "badge-possible-match";

          cardsData.push({
            id: r.id,
            type: 'lost',
            name: r.name,
            image: r.image,
            meta1: `<i data-lucide="map-pin"></i> Last seen: ${r.location}`,
            meta2: `<i data-lucide="calendar"></i> Date Lost: ${r.date}`,
            status: r.status,
            badgeClass: badgeClass,
            clickAction: `viewTimeline('lost', '${r.id}')`
          });
        }
      });

      // 2. Process claims that are NOT linked to any Lost Report (Direct claims)
      claims.forEach(c => {
        if (!c.lostReportId) {
          let badgeClass = "badge-under-review";
          if (c.status === 'Ready for Collection') badgeClass = "badge-ready-for-collection";
          else if (c.status === 'Returned') badgeClass = "badge-returned";
          else if (c.status === 'Rejected') badgeClass = "badge-rejected";
          else if (c.status === 'Claim Pending') badgeClass = "badge-claim-pending";

          cardsData.push({
            id: c.id,
            type: 'claim',
            name: c.itemName,
            image: c.proofImage,
            meta1: `<i data-lucide="hash"></i> Item Ref: ${c.itemRef}`,
            meta2: `<i data-lucide="calendar"></i> Claim Date: ${c.lostDate}`,
            status: c.status,
            badgeClass: badgeClass,
            clickAction: `viewTimeline('claim', '${c.id}')`
          });
        }
      });

      if (cardsData.length === 0) {
        container.innerHTML = getReportsEmptyState("lost");
        lucide.createIcons();
        return;
      }

      let html = "";
      cardsData.forEach(card => {
        html += `
          <div class="item-card" onclick="${card.clickAction}">
            <div class="item-card-img-wrapper">
              <img src="${card.image}" class="item-card-img">
            </div>
            <div class="item-card-info">
              <div>
                <h4 class="item-card-title">${card.name}</h4>
                <div class="item-card-meta">
                  <span>${card.meta1}</span>
                  <span>${card.meta2}</span>
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span class="status-badge ${card.badgeClass}">${card.status}</span>
                <button class="view-details-btn">View Status</button>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
  }
  else if (activeReportsSubTab === 'found') {
    fetch('/api/found-reports')
      .then(res => res.json())
      .then(reports => {
        if (reports.length === 0) {
          container.innerHTML = getReportsEmptyState("found");
          lucide.createIcons();
          return;
        }

        let html = "";
        reports.forEach(r => {
          let badgeClass = "badge-awaiting-handover";
          if (r.status === 'Under Review') badgeClass = "badge-under-review";
          else if (r.status === 'Available for Claim') badgeClass = "badge-available-for-claim";
          else if (r.status === 'Returned') badgeClass = "badge-returned";

          html += `
            <div class="item-card" onclick="viewTimeline('found', '${r.id}')">
              <div class="item-card-img-wrapper">
                <img src="${r.image}" class="item-card-img">
              </div>
              <div class="item-card-info">
                <div>
                  <h4 class="item-card-title">${r.name}</h4>
                  <div class="item-card-meta">
                    <span><i data-lucide="map-pin"></i> Found Location: ${r.location}</span>
                    <span><i data-lucide="calendar"></i> Date Found: ${r.date}</span>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                  <span class="status-badge ${badgeClass}">${r.status}</span>
                  <button class="view-details-btn">View Status</button>
                </div>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
        lucide.createIcons();
      });
  }
}

function getReportsEmptyState(type) {
  let title = "No reports yet.";
  let desc = "Start by reporting a lost or found item.";
  if (type === 'claims') {
    title = "No claim requests yet.";
    desc = "Browse verified found items to claim ownership.";
  }

  return `
    <div class="empty-state">
      <i data-lucide="folder-search" class="empty-state-icon" style="width:40px; height:40px;"></i>
      <h5>${title}</h5>
      <p>${desc}</p>
      <div style="display:flex; gap:10px; width:100%;">
        ${type !== 'claims' ? `
          <button class="btn btn-primary" onclick="navigateToStudentScreen('scr-student-report-lost')" style="font-size:12px; padding:6px 10px; flex:1;">
            Report Lost Item
          </button>
          <button class="btn btn-secondary" onclick="navigateToStudentScreen('scr-student-report-found')" style="font-size:12px; padding:6px 10px; flex:1;">
            Report Found Item
          </button>
        ` : `
          <button class="btn btn-primary" onclick="navigateToStudentTab('search')" style="font-size:12px; padding:6px 10px; flex:1;">
            Search Items
          </button>
        `}
      </div>
    </div>
  `;
}

// Vertical timeline step tracking
function viewTimeline(type, id) {
  let title = "";
  let subtitle = "";
  let steps = [];

  const banner = document.getElementById("timeline-match-banner");
  if (banner) banner.style.display = "none";

  if (type === 'lost') {
    fetch('/api/lost-reports')
      .then(res => res.json())
      .then(reports => {
        const item = reports.find(r => r.id === id);
        if (!item) return;

        title = item.name;
        subtitle = `Lost Report Filed • Filed on ${item.date}`;

        const isSubmitted = item.status === "Submitted";
        const isMatched = item.status === "Possible Match Found";
        const isClaimPending = item.status === "Claim Pending";
        const isReady = item.status === "Ready for Collection";
        const isReturned = item.status === "Returned";

        steps = [
          { label: "Submitted", desc: "Your lost report has been submitted.", status: "completed" },
          { label: "Searching for Match", desc: "Management matches database records.", status: isSubmitted ? "active" : "completed" },
          { label: "Possible Match Found", desc: "Management identified a matched verified item.", status: isMatched ? "active" : (isSubmitted ? "pending" : "completed") },
          { label: "Claim Submitted", desc: "Owner submits claim proof details.", status: isClaimPending ? "active" : ((isSubmitted || isMatched) ? "pending" : "completed") },
          { label: "Ready for Collection", desc: "Collect at Lost & Found Counter.", status: isReady ? "active" : ((isSubmitted || isMatched || isClaimPending) ? "pending" : "completed") },
          { label: "Returned", desc: "Handover signed. Case closed.", status: isReturned ? "active" : "pending" }
        ];

        if (banner && isMatched && item.matchedItemId) {
          banner.style.display = "block";
          const btn = document.getElementById("btn-timeline-view-match");
          btn.onclick = () => {
            preselectedLostReportId = item.id;
            viewItemDetail(item.matchedItemId);
          };
        }

        renderTimelineHTML(title, subtitle, steps);
      });
  }
  else if (type === 'found') {
    fetch('/api/found-reports')
      .then(res => res.json())
      .then(reports => {
        const item = reports.find(r => r.id === id);
        if (!item) return;

        title = item.name;
        subtitle = `Found Report Filed • Filed on ${item.date}`;

        const isAwaiting = item.status === "Awaiting Handover";
        const isReview = item.status === "Under Review";
        const isVerified = item.status === "Available for Claim";
        const isReturned = item.status === "Returned";

        steps = [
          { label: "Submitted", desc: "Your found item report has been submitted.", status: "completed" },
          { label: "Awaiting Handover", desc: "Finder must hand over item physically to counter.", status: isAwaiting ? "active" : "completed" },
          { label: "Under Admin Verification", desc: "Management physically verifies handover.", status: isReview ? "active" : (isAwaiting ? "pending" : "completed") },
          { label: "Available for Claim", desc: "Item marked as available for claim.", status: isVerified ? "active" : (isReturned ? "completed" : "pending") },
          { label: "Returned", desc: "Item returned to owner. Case closed.", status: isReturned ? "active" : "pending" }
        ];

        renderTimelineHTML(title, subtitle, steps);
      });
  }
  else if (type === 'claim') {
    fetch('/api/claims')
      .then(res => res.json())
      .then(claims => {
        const item = claims.find(c => c.id === id);
        if (!item) return;

        title = item.itemName;
        subtitle = `Claim Request • Filed on ${item.lostDate}`;

        const isReview = item.status === "Under Review";
        const isReady = item.status === "Ready for Collection";
        const isReturned = item.status === "Returned";
        const isRejected = item.status === "Rejected";

        steps = [
          { label: "Claim Submitted", desc: "Proof documents received.", status: "completed" },
          { label: "Proof Under Review", desc: "Management is auditing ownership answers.", status: isReview ? "active" : "completed" },
          { label: "Approved / Rejected", desc: isRejected ? "Claim Rejected: Incomplete proof details." : "Claim Approved. Matching successfully.", status: (isReady || isReturned) ? "completed" : (isRejected ? "completed" : "pending"), class: isRejected ? "danger" : "" }
        ];

        if (isRejected) {
          steps.push({ label: "Closed", desc: "Case ended.", status: "active" });
        } else {
          steps.push(
            { label: "Ready for Collection", desc: "Collect item at Lost & Found Counter.", status: isReady ? "active" : (isReturned ? "completed" : "pending") },
            { label: "Returned", desc: "Item returned to owner. Case closed.", status: isReturned ? "active" : "pending" }
          );
        }

        renderTimelineHTML(title, subtitle, steps);
      });
  }
}

function renderTimelineHTML(title, subtitle, steps) {
  document.getElementById("timeline-item-title").innerText = title;
  document.getElementById("timeline-item-subtitle").innerText = subtitle;

  const stepsWrapper = document.getElementById("timeline-steps-wrapper");
  let html = "";
  steps.forEach(s => {
    let statusClass = s.status;
    if (s.class === "danger") statusClass += " danger";
    html += `
      <div class="timeline-step ${statusClass}">
        <div class="timeline-node"></div>
        <div class="timeline-step-title">${s.label}</div>
        <div class="timeline-step-desc">${s.desc}</div>
      </div>
    `;
  });

  stepsWrapper.innerHTML = html;
  navigateToStudentScreen('scr-student-status-timeline');
}

// Load Home dashboard lists
function loadHomeWidgets() {
  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      const active = items.filter(i => i.status === "Available for Claim").slice(0, 4);
      const recentContainer = document.getElementById("home-recent-verified-list");

      if (active.length === 0) {
        recentContainer.innerHTML = `<p style="font-size:12px; color:var(--text-muted); padding:10px 0;">No verified items recently.</p>`;
        return;
      }

      let html = "";
      active.forEach(i => {
        html += `
          <div class="item-card-horizontal" onclick="viewItemDetail('${i.id}')">
            <img src="${i.image}" class="item-card-horizontal-img">
            <div class="item-card-horizontal-title">${i.name}</div>
            <div class="item-card-horizontal-location">${i.location}</div>
          </div>
        `;
      });
      recentContainer.innerHTML = html;
    });

  // Latest status tracking widget
  const statusContainer = document.getElementById("home-latest-status-container");

  Promise.all([
    fetch('/api/claims').then(r => r.json()),
    fetch('/api/found-reports').then(r => r.json()),
    fetch('/api/lost-reports').then(r => r.json())
  ]).then(([claims, founds, losts]) => {
    let latest = null;

    if (claims.length > 0) {
      const c = claims[0];
      latest = {
        title: c.itemName,
        typeLabel: "Claim Request",
        status: c.status,
        desc: c.status === "Under Review" ? "Management is reviewing your proof." : (c.status === "Ready for Collection" ? "Approved. Ready for collection." : (c.status === "Returned" ? "Item returned successfully." : "Claim pending review.")),
        badge: c.status === "Ready for Collection" ? "badge-ready-for-collection" : (c.status === "Returned" ? "badge-returned" : (c.status === "Rejected" ? "badge-rejected" : (c.status === "Claim Pending" ? "badge-claim-pending" : "badge-under-review"))),
        clickType: 'claim',
        clickId: c.id
      };
    } else if (founds.length > 0) {
      const f = founds[0];
      latest = {
        title: f.name,
        typeLabel: "Found Report",
        status: f.status,
        desc: f.status === "Awaiting Handover" ? "Please hand over physical item to counter." : (f.status === "Under Review" ? "Management is verifying physical custody." : "Verified. Marked as available for claim."),
        badge: f.status === "Awaiting Handover" ? "badge-awaiting-handover" : (f.status === "Under Review" ? "badge-under-review" : (f.status === "Returned" ? "badge-returned" : "badge-available-for-claim")),
        clickType: 'found',
        clickId: f.id
      };
    } else if (losts.length > 0) {
      const l = losts[0];
      latest = {
        title: l.name,
        typeLabel: "Lost Report",
        status: l.status,
        desc: l.status === "Possible Match Found" ? "Possible match identified by management." : "Management is matching database records.",
        badge: l.status === "Possible Match Found" ? "badge-possible-match" : "badge-submitted",
        clickType: 'lost',
        clickId: l.id
      };
    }

    if (!latest) {
      statusContainer.innerHTML = `
        <div style="background-color:#FFFFFF; border:1px solid var(--border-color); border-radius:12px; padding:16px; text-align:center; font-size:12px; color:var(--text-muted); box-shadow:var(--shadow-flat);">
          No reports yet. Start by reporting a lost or found item.
        </div>
      `;
      return;
    }

    statusContainer.innerHTML = `
      <div class="latest-status-card" onclick="viewTimeline('${latest.clickType}', '${latest.clickId}')">
        <div class="latest-status-left">
          <h5 class="latest-status-card-title">${latest.title}</h5>
          <p class="latest-status-card-desc">${latest.desc}</p>
        </div>
        <div class="latest-status-right">
          <span class="latest-status-badge">${latest.typeLabel}</span>
        </div>
      </div>
    `;
    lucide.createIcons();
  });
}

let activeNotifFilter = 'all';

function setNotifFilter(filter, el) {
  activeNotifFilter = filter;
  loadNotifications();
}

function getNotifCategoryDetails(n) {
  const title = (n.title || '').toLowerCase();
  const message = (n.message || '').toLowerCase();

  // 1. Found Report Submitted (Awaiting Handover / Please hand it over / Please hand over)
  if (title.includes('found report submitted') || title.includes('found item reported') || message.includes('hand it over') || message.includes('hand over')) {
    return {
      badgeLabel: 'Action Required',
      badgeClass: 'badge-action-required',
      cardClass: 'notif-type-action',
      iconClass: 'warning',
      iconName: 'package'
    };
  }

  // 2. Claim Approved / Ready for Collection / Please collect
  if (title.includes('claim approved') || title.includes('ready for collection') || message.includes('ready for collection') || message.includes('please collect')) {
    return {
      badgeLabel: 'Collection',
      badgeClass: 'badge-ready-for-collection',
      cardClass: 'notif-type-collection',
      iconClass: 'success',
      iconName: 'check-circle-2'
    };
  }

  // 3. Item Returned Successfully
  if (title.includes('returned')) {
    return {
      badgeLabel: 'Collection',
      badgeClass: 'badge-returned',
      cardClass: 'notif-type-system',
      iconClass: 'info',
      iconName: 'check-circle-2'
    };
  }

  // 4. Lost Report Filed / Match suggestion
  if (title.includes('lost report')) {
    return {
      badgeLabel: 'Lost Report',
      badgeClass: 'badge-submitted',
      cardClass: 'notif-type-lost',
      iconClass: 'info',
      iconName: 'info'
    };
  }
  if (title.includes('match found')) {
    return {
      badgeLabel: 'Lost Report',
      badgeClass: 'badge-possible-match',
      cardClass: 'notif-type-lost',
      iconClass: 'info',
      iconName: 'info'
    };
  }

  // 5. Found Report Verified or Status change
  if (title.includes('found item') || title.includes('found report') || title.includes('verification')) {
    if (title.includes('rejected') || message.includes('rejected')) {
      return {
        badgeLabel: 'Found Report',
        badgeClass: 'badge-rejected',
        cardClass: 'notif-type-claim-reject',
        iconClass: 'info',
        iconName: 'x-circle'
      };
    }
    if (title.includes('verified') || message.includes('verified')) {
      return {
        badgeLabel: 'Found Report',
        badgeClass: 'badge-verified',
        cardClass: 'notif-type-found',
        iconClass: 'warning',
        iconName: 'check-circle-2'
      };
    }
    return {
      badgeLabel: 'Found Report',
      badgeClass: 'badge-submitted',
      cardClass: 'notif-type-found',
      iconClass: 'warning',
      iconName: 'check-circle-2'
    };
  }

  // 6. Claim Submitted
  if (title.includes('claim submitted') || title.includes('claim request') || title.includes('claim proof')) {
    return {
      badgeLabel: 'Claim',
      badgeClass: 'badge-claim-pending',
      cardClass: 'notif-type-claim-submit',
      iconClass: 'info',
      iconName: 'clipboard-list'
    };
  }

  // 7. Claim Rejected
  if (title.includes('claim rejected')) {
    return {
      badgeLabel: 'Claim',
      badgeClass: 'badge-rejected',
      cardClass: 'notif-type-claim-reject',
      iconClass: 'info',
      iconName: 'alert-triangle'
    };
  }

  // Default Fallback: System / Info
  return {
    badgeLabel: 'System',
    badgeClass: 'badge-submitted',
    cardClass: 'notif-type-system',
    iconClass: 'info',
    iconName: 'info'
  };
}

// Load notifications
function loadNotifications() {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  fetch('/api/notifications')
    .then(res => res.json())
    .then(notifications => {
      // Sync active button class
      const buttons = document.querySelectorAll('#scr-student-notifications .sub-tab-btn');
      buttons.forEach(btn => {
        if (btn.id === `btn-notif-${activeNotifFilter}`) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Unread dot count
      const unreadCount = notifications.filter(n => n.unread).length;

      const tabBadge = document.getElementById("nav-tab-notifications");
      if (tabBadge) {
        // Render or update dot inside tab
        let dot = tabBadge.querySelector(".badge-dot");
        if (unreadCount > 0) {
          if (!dot) {
            dot = document.createElement("span");
            dot.className = "badge-dot";
            tabBadge.appendChild(dot);
          }
        } else {
          if (dot) dot.remove();
        }
      }

      // Filter notifications based on activeNotifFilter
      const filteredNotifications = notifications.filter(n => {
        const details = getNotifCategoryDetails(n);
        if (activeNotifFilter === 'unread') {
          return n.unread;
        } else if (activeNotifFilter === 'reports') {
          return ['Lost Report', 'Found Report', 'Action Required'].includes(details.badgeLabel);
        } else if (activeNotifFilter === 'claims') {
          return ['Claim', 'Collection'].includes(details.badgeLabel);
        }
        return true; // 'all'
      });

      if (filteredNotifications.length === 0) {
        let filterText = "";
        if (activeNotifFilter === 'unread') filterText = " unread";
        else if (activeNotifFilter === 'reports') filterText = " report";
        else if (activeNotifFilter === 'claims') filterText = " claim";

        container.innerHTML = `
          <div class="empty-state">
            <i data-lucide="bell-off" class="empty-state-icon" style="width:40px; height:40px;"></i>
            <h5>No${filterText} notifications</h5>
            <p>We'll alert you here when management updates your case status.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      let html = "";
      filteredNotifications.forEach(n => {
        const isUnread = n.unread ? "unread" : "";
        const details = getNotifCategoryDetails(n);

        html += `
          <div class="notification-card ${isUnread} ${details.cardClass}" onclick="markNotificationRead('${n.id}')">
            <div class="notification-icon-box ${details.iconClass}">
              <i data-lucide="${details.iconName}" style="width:18px; height:18px;"></i>
            </div>
            <div class="notification-details">
              <div style="margin-bottom: 6px;">
                <span class="notif-badge ${details.badgeClass}">${details.badgeLabel}</span>
              </div>
              <h4 class="notification-title">
                ${n.unread ? `<span class="notif-dot"></span>` : ""}${n.title}
              </h4>
              <p class="notification-message">${n.message}</p>
              <div class="notification-time">${n.time}</div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

function markNotificationRead(id) {
  fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
    .then(() => loadNotifications());
}

function markAllNotificationsAsRead() {
  fetch('/api/notifications/read-all', { method: 'PUT' })
    .then(() => loadNotifications());
}

// Clean previous errors helper
function clearFormErrors(screenId) {
  const errorMsgs = document.querySelectorAll(`#${screenId} .field-error-msg`);
  errorMsgs.forEach(m => m.style.display = "none");
}

// Submit Lost Report post
function submitLostReport() {
  clearFormErrors('scr-student-report-lost');

  const name = document.getElementById("lost-name").value;
  const category = document.getElementById("lost-category").value;
  const location = document.getElementById("lost-location").value;
  const date = document.getElementById("lost-date").value;
  const time = document.getElementById("lost-time").value;
  const desc = document.getElementById("lost-desc").value;

  let valid = true;

  if (!name) {
    document.getElementById("err-lost-name").style.display = "block";
    valid = false;
  }
  if (!category) {
    document.getElementById("err-lost-category").style.display = "block";
    valid = false;
  }
  if (!location) {
    document.getElementById("err-lost-location").style.display = "block";
    valid = false;
  }
  if (!date) {
    document.getElementById("err-lost-date").style.display = "block";
    valid = false;
  }
  if (!time) {
    document.getElementById("err-lost-time").style.display = "block";
    valid = false;
  }
  if (!desc) {
    document.getElementById("err-lost-desc").style.display = "block";
    valid = false;
  }

  if (!valid) {
    document.querySelector("#scr-student-report-lost .screen-body").scrollTop = 0;
    return;
  }

  const report = {
    id: `LR-${Date.now().toString().slice(-4)}`,
    name,
    category,
    location,
    date,
    time,
    description: desc,
    image: uploadPhotoState.lost || SVG_MOCKS.default,
    status: "Submitted"
  };

  fetch('/api/lost-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  })
    .then(() => {
      // Clean inputs
      document.getElementById("lost-name").value = "";
      document.getElementById("lost-category").value = "";
      document.getElementById("lost-location").value = "";
      document.getElementById("lost-desc").value = "";
      removeUpload({ stopPropagation: () => { } }, 'lost');

      // Success screen
      document.getElementById("success-title").innerText = "Lost Report Filed!";
      document.getElementById("success-message").innerText = "Lost report submitted successfully. We will notify you if a matching item is found. You can track this report in My Reports.";
      navigateToStudentScreen('scr-student-success');
    });
}

// Submit Found Report post
function submitFoundReport() {
  clearFormErrors('scr-student-report-found');

  const name = document.getElementById("found-name").value;
  const category = document.getElementById("found-category").value;
  const location = document.getElementById("found-location").value;
  const date = document.getElementById("found-date").value;
  const time = document.getElementById("found-time").value;
  const desc = document.getElementById("found-desc").value;

  let valid = true;

  if (!name) {
    document.getElementById("err-found-name").style.display = "block";
    valid = false;
  }
  if (!category) {
    document.getElementById("err-found-category").style.display = "block";
    valid = false;
  }
  if (!location) {
    document.getElementById("err-found-location").style.display = "block";
    valid = false;
  }
  if (!date) {
    document.getElementById("err-found-date").style.display = "block";
    valid = false;
  }
  if (!time) {
    document.getElementById("err-found-time").style.display = "block";
    valid = false;
  }
  if (!uploadPhotoState.found) {
    document.getElementById("err-found-photo").style.display = "block";
    valid = false;
  }
  if (!desc) {
    document.getElementById("err-found-desc").style.display = "block";
    valid = false;
  }

  if (!valid) {
    document.querySelector("#scr-student-report-found .screen-body").scrollTop = 0;
    return;
  }

  const report = {
    id: `FR-${Date.now().toString().slice(-4)}`,
    name,
    category,
    location,
    date,
    time,
    description: desc,
    image: uploadPhotoState.found,
    finderName: "Aiman Abdullah",
    finderMatric: "AL230941",
    status: "Awaiting Handover"
  };

  fetch('/api/found-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  })
    .then(() => {
      resetFoundStepper();

      // Success screen
      document.getElementById("success-title").innerText = "Found Report Filed!";
      document.getElementById("success-message").innerText = "Found item report submitted successfully. Please hand over the item to management. The item will be visible after admin verification.";
      navigateToStudentScreen('scr-student-success');
    });
}

// Submit Claim Request post
function submitClaimRequest() {
  clearFormErrors('scr-student-submit-claim');

  const fullname = document.getElementById("claim-fullname").value;
  const matric = document.getElementById("claim-matric").value;
  const email = document.getElementById("claim-email").value;
  const lostWhere = document.getElementById("claim-lost-where").value;
  const lostDate = document.getElementById("claim-lost-date").value;
  const lostTime = document.getElementById("claim-lost-time").value;
  const uniqueDetail = document.getElementById("claim-lost-detail").value;

  let valid = true;

  if (!fullname) {
    document.getElementById("err-claim-fullname").style.display = "block";
    valid = false;
  }
  if (!matric) {
    document.getElementById("err-claim-matric").style.display = "block";
    valid = false;
  }
  if (!email || !email.includes('@')) {
    document.getElementById("err-claim-email").style.display = "block";
    valid = false;
  }
  if (!lostWhere) {
    document.getElementById("err-claim-lost-where").style.display = "block";
    valid = false;
  }
  if (!lostDate) {
    document.getElementById("err-claim-lost-date").style.display = "block";
    valid = false;
  }
  if (!lostTime) {
    document.getElementById("err-claim-lost-time").style.display = "block";
    valid = false;
  }
  if (!uniqueDetail) {
    document.getElementById("err-claim-lost-detail").style.display = "block";
    valid = false;
  }

  if (!valid) {
    document.querySelector("#scr-student-submit-claim .screen-body").scrollTop = 0;
    return;
  }

  const lostReportId = document.getElementById("claim-link-report").value || null;

  const claim = {
    id: `CR-${Date.now().toString().slice(-4)}`,
    studentName: fullname,
    studentMatric: matric,
    studentEmail: email,
    itemId: currentViewItem.id,
    itemName: currentViewItem.name,
    itemRef: currentViewItem.reference,
    lostWhere,
    lostDate,
    lostTime,
    uniqueDetail,
    proofImage: uploadPhotoState.claim || SVG_MOCKS.default,
    status: "Under Review",
    lostReportId
  };

  fetch('/api/claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claim)
  })
    .then(() => {
      // Clean inputs
      document.getElementById("claim-lost-where").value = "";
      document.getElementById("claim-lost-detail").value = "";
      preselectedLostReportId = null;
      removeUpload({ stopPropagation: () => { } }, 'claim');

      navigateToStudentScreen('scr-student-claim-success');
    });
}

// ==========================================================================
// Stepper Form Navigation, Chips Syncing & Reset Operations
// ==========================================================================
let currentLostStep = 1;
let currentClaimStep = 1;

function selectCategoryChip(type, value, el) {
  const selectEl = document.getElementById(`${type}-category`);
  if (selectEl) {
    selectEl.value = value;
    const event = new Event('change');
    selectEl.dispatchEvent(event);
  }

  // Toggle active styling
  const chips = el.parentElement.querySelectorAll(".chip-btn");
  chips.forEach(c => c.classList.remove("active"));
  el.classList.add("active");

  const errEl = document.getElementById(`err-${type}-category`);
  if (errEl) errEl.style.display = "none";
}

function resetLostStepper() {
  currentLostStep = 1;
  clearFormErrors('scr-student-report-lost');

  document.getElementById("step-lost-panel-1").style.display = "block";
  document.getElementById("step-lost-panel-2").style.display = "none";
  document.getElementById("step-lost-panel-3").style.display = "none";

  const chips = document.querySelectorAll("#scr-student-report-lost .chip-btn");
  chips.forEach(c => c.classList.remove("active"));
  document.getElementById("lost-category").value = "";

  document.getElementById("lost-name").value = "";
  document.getElementById("lost-location").value = "";
  document.getElementById("lost-desc").value = "";
  document.getElementById("lost-date").value = new Date().toISOString().split('T')[0];
  document.getElementById("lost-time").value = "12:00";
  removeUpload({ stopPropagation: () => { } }, 'lost');

  updateLostStepperUI();
}

function updateLostStepperUI() {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-lost-${i}`);
    if (!indicator) continue;
    const numEl = indicator.querySelector(".step-num");
    const labelEl = indicator.querySelector(".step-label");

    if (i < currentLostStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = "✓";
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else if (i === currentLostStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = i;
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else {
      numEl.style.backgroundColor = "#E2E8F0";
      numEl.style.color = "var(--text-muted)";
      numEl.innerText = i;
      labelEl.style.color = "var(--text-muted)";
      labelEl.style.fontWeight = "500";
    }

    if (i < 3) {
      const conn = document.getElementById(`conn-lost-${i}`);
      if (conn) {
        conn.style.backgroundColor = i < currentLostStep ? "#1E3A8A" : "var(--border-color)";
      }
    }
  }
}

function nextLostStep(step) {
  clearFormErrors('scr-student-report-lost');

  if (step === 1) {
    const name = document.getElementById("lost-name").value;
    const category = document.getElementById("lost-category").value;
    let valid = true;

    if (!name) {
      document.getElementById("err-lost-name").style.display = "block";
      valid = false;
    }
    if (!category) {
      document.getElementById("err-lost-category").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentLostStep = 2;
    document.getElementById("step-lost-panel-1").style.display = "none";
    document.getElementById("step-lost-panel-2").style.display = "block";
  } else if (step === 2) {
    const location = document.getElementById("lost-location").value;
    const date = document.getElementById("lost-date").value;
    const time = document.getElementById("lost-time").value;
    let valid = true;

    if (!location) {
      document.getElementById("err-lost-location").style.display = "block";
      valid = false;
    }
    if (!date) {
      document.getElementById("err-lost-date").style.display = "block";
      valid = false;
    }
    if (!time) {
      document.getElementById("err-lost-time").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentLostStep = 3;
    document.getElementById("step-lost-panel-2").style.display = "none";
    document.getElementById("step-lost-panel-3").style.display = "block";
  }
  updateLostStepperUI();
}

function prevLostStep(step) {
  if (step === 2) {
    currentLostStep = 1;
    document.getElementById("step-lost-panel-2").style.display = "none";
    document.getElementById("step-lost-panel-1").style.display = "block";
  } else if (step === 3) {
    currentLostStep = 2;
    document.getElementById("step-lost-panel-3").style.display = "none";
    document.getElementById("step-lost-panel-2").style.display = "block";
  }
  updateLostStepperUI();
}

function resetClaimStepper() {
  currentClaimStep = 1;
  clearFormErrors('scr-student-submit-claim');

  document.getElementById("step-claim-panel-1").style.display = "block";
  document.getElementById("step-claim-panel-2").style.display = "none";
  document.getElementById("step-claim-panel-3").style.display = "none";

  document.getElementById("claim-lost-where").value = "";
  document.getElementById("claim-lost-detail").value = "";
  removeUpload({ stopPropagation: () => { } }, 'claim');

  updateClaimStepperUI();
}

function updateClaimStepperUI() {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-claim-${i}`);
    if (!indicator) continue;
    const numEl = indicator.querySelector(".step-num");
    const labelEl = indicator.querySelector(".step-label");

    if (i < currentClaimStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = "✓";
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else if (i === currentClaimStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = i;
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else {
      numEl.style.backgroundColor = "#E2E8F0";
      numEl.style.color = "var(--text-muted)";
      numEl.innerText = i;
      labelEl.style.color = "var(--text-muted)";
      labelEl.style.fontWeight = "500";
    }

    if (i < 3) {
      const conn = document.getElementById(`conn-claim-${i}`);
      if (conn) {
        conn.style.backgroundColor = i < currentClaimStep ? "#1E3A8A" : "var(--border-color)";
      }
    }
  }
}

function nextClaimStep(step) {
  clearFormErrors('scr-student-submit-claim');

  if (step === 1) {
    const fullname = document.getElementById("claim-fullname").value;
    const matric = document.getElementById("claim-matric").value;
    const email = document.getElementById("claim-email").value;
    let valid = true;

    if (!fullname) {
      document.getElementById("err-claim-fullname").style.display = "block";
      valid = false;
    }
    if (!matric) {
      document.getElementById("err-claim-matric").style.display = "block";
      valid = false;
    }
    if (!email || !email.includes('@')) {
      document.getElementById("err-claim-email").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentClaimStep = 2;
    document.getElementById("step-claim-panel-1").style.display = "none";
    document.getElementById("step-claim-panel-2").style.display = "block";
  } else if (step === 2) {
    const lostWhere = document.getElementById("claim-lost-where").value;
    const lostDate = document.getElementById("claim-lost-date").value;
    const lostTime = document.getElementById("claim-lost-time").value;
    let valid = true;

    if (!lostWhere) {
      document.getElementById("err-claim-lost-where").style.display = "block";
      valid = false;
    }
    if (!lostDate) {
      document.getElementById("err-claim-lost-date").style.display = "block";
      valid = false;
    }
    if (!lostTime) {
      document.getElementById("err-claim-lost-time").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentClaimStep = 3;
    document.getElementById("step-claim-panel-2").style.display = "none";
    document.getElementById("step-claim-panel-3").style.display = "block";
  }
  updateClaimStepperUI();
}

function prevClaimStep(step) {
  if (step === 2) {
    currentClaimStep = 1;
    document.getElementById("step-claim-panel-2").style.display = "none";
    document.getElementById("step-claim-panel-1").style.display = "block";
  } else if (step === 3) {
    currentClaimStep = 2;
    document.getElementById("step-claim-panel-3").style.display = "none";
    document.getElementById("step-claim-panel-2").style.display = "block";
  }
  updateClaimStepperUI();
}

let currentFoundStep = 1;

function resetFoundStepper() {
  currentFoundStep = 1;
  clearFormErrors('scr-student-report-found');

  document.getElementById("step-found-panel-1").style.display = "block";
  document.getElementById("step-found-panel-2").style.display = "none";
  document.getElementById("step-found-panel-3").style.display = "none";

  document.getElementById("found-name").value = "";
  document.getElementById("found-location").value = "";
  document.getElementById("found-desc").value = "";
  document.getElementById("found-date").value = new Date().toISOString().split('T')[0];
  document.getElementById("found-time").value = "12:00";

  const chips = document.querySelectorAll("#scr-student-report-found .chip-btn");
  chips.forEach(c => c.classList.remove("active"));
  document.getElementById("found-category").value = "";

  removeUpload({ stopPropagation: () => { } }, 'found');
  updateFoundStepperUI();
}

function updateFoundStepperUI() {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-found-${i}`);
    if (!indicator) continue;
    const numEl = indicator.querySelector(".step-num");
    const labelEl = indicator.querySelector(".step-label");

    if (i < currentFoundStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = "✓";
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else if (i === currentFoundStep) {
      numEl.style.backgroundColor = "#1E3A8A";
      numEl.style.color = "#FFFFFF";
      numEl.innerText = i;
      labelEl.style.color = "#1E3A8A";
      labelEl.style.fontWeight = "600";
    } else {
      numEl.style.backgroundColor = "#E2E8F0";
      numEl.style.color = "var(--text-muted)";
      numEl.innerText = i;
      labelEl.style.color = "var(--text-muted)";
      labelEl.style.fontWeight = "500";
    }

    if (i < 3) {
      const conn = document.getElementById(`conn-found-${i}`);
      if (conn) {
        conn.style.backgroundColor = i < currentFoundStep ? "#1E3A8A" : "var(--border-color)";
      }
    }
  }
}

function nextFoundStep(step) {
  clearFormErrors('scr-student-report-found');

  if (step === 1) {
    const name = document.getElementById("found-name").value;
    const category = document.getElementById("found-category").value;
    let valid = true;

    if (!name) {
      document.getElementById("err-found-name").style.display = "block";
      valid = false;
    }
    if (!category) {
      document.getElementById("err-found-category").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentFoundStep = 2;
    document.getElementById("step-found-panel-1").style.display = "none";
    document.getElementById("step-found-panel-2").style.display = "block";
  } else if (step === 2) {
    const location = document.getElementById("found-location").value;
    const date = document.getElementById("found-date").value;
    const time = document.getElementById("found-time").value;
    let valid = true;

    if (!location) {
      document.getElementById("err-found-location").style.display = "block";
      valid = false;
    }
    if (!date) {
      document.getElementById("err-found-date").style.display = "block";
      valid = false;
    }
    if (!time) {
      document.getElementById("err-found-time").style.display = "block";
      valid = false;
    }
    if (!valid) return;

    currentFoundStep = 3;
    document.getElementById("step-found-panel-2").style.display = "none";
    document.getElementById("step-found-panel-3").style.display = "block";
  }
  updateFoundStepperUI();
}

function prevFoundStep(step) {
  if (step === 2) {
    currentFoundStep = 1;
    document.getElementById("step-found-panel-2").style.display = "none";
    document.getElementById("step-found-panel-1").style.display = "block";
  } else if (step === 3) {
    currentFoundStep = 2;
    document.getElementById("step-found-panel-3").style.display = "none";
    document.getElementById("step-found-panel-2").style.display = "block";
  }
  updateFoundStepperUI();
}

function openLostReportWithSearchTerm() {
  const query = document.getElementById("search-input").value;
  navigateToStudentScreen('scr-student-report-lost');
  if (query) {
    document.getElementById("lost-name").value = query;
  }
}

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btnEl.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.setAttribute('data-lucide', 'eye-off');
      lucide.createIcons();
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.setAttribute('data-lucide', 'eye');
      lucide.createIcons();
    }
  }
}

// Global security header injection (Monkey patching fetch)
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  if (!options.headers) {
    options.headers = {};
  }
  if (currentStaffUser) {
    options.headers['X-User-Role'] = currentStaffUser.role;
    options.headers['X-User-Id'] = currentStaffUser.id;
  }
  return originalFetch(url, options);
};

let currentStaffUser = null;
let activeStaffScreen = "scr-do-routes";
let selectedSchoolId = null; // For PPD school assignment
let picActiveEvent = null;
let teacherClassId = null;
let teacherSelectedStudentId = null;
let teacherStudentsList = []; // Local cache for filtering
let teacherFilterValue = "";

window.onload = function() {
  const storedUser = sessionStorage.getItem("staffUser");
  if (storedUser) {
    currentStaffUser = JSON.parse(storedUser);
    loginSuccess();
  } else {
    document.getElementById("admin-login-container").style.display = "flex";
    document.getElementById("admin-main-container").style.display = "none";
  }

  // Periodic polling for monitoring and data updates
  setInterval(() => {
    if (currentStaffUser) {
      pollStaffData();
    }
  }, 4000);

  lucide.createIcons();
};

function adminLogin() {
  const email = document.getElementById("adm-email").value.trim();
  const password = document.getElementById("adm-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error("Invalid staff login credentials");
    return res.json();
  })
  .then(user => {
    if (user.role === 'parent') {
      alert("Parents must use the Parent Portal at http://localhost:3000/");
      return;
    }
    currentStaffUser = user;
    sessionStorage.setItem("staffUser", JSON.stringify(user));
    loginSuccess();
  })
  .catch(err => {
    alert(err.message);
  });
}

function loginSuccess() {
  document.getElementById("admin-login-container").style.display = "none";
  document.getElementById("admin-main-container").style.display = "flex";
  
  // Set UI name
  document.getElementById("footer-user-name").innerText = currentStaffUser.name;
  
  // Align theme and screen lists
  document.body.className = `theme-${currentStaffUser.role}`;
  document.getElementById("demo-role-switcher").value = currentStaffUser.role;

  // Render sidebar menu items based on role
  const roles = ['do', 'ppd', 'pic', 'teacher'];
  roles.forEach(r => {
    const elList = document.querySelectorAll(`.nav-${r}`);
    elList.forEach(el => {
      if (r === currentStaffUser.role) {
        el.style.display = "block";
      } else {
        el.style.display = "none";
      }
    });
  });

  if (currentStaffUser.role === 'do') {
    document.getElementById("footer-user-role").innerText = "DO Officer";
    document.getElementById("sidebar-role-title").innerText = "District Office";
    navigateToStaffScreen('scr-do-routes');
  } else if (currentStaffUser.role === 'ppd') {
    document.getElementById("footer-user-role").innerText = "PPD Officer";
    document.getElementById("sidebar-role-title").innerText = "PPD Office";
    navigateToStaffScreen('scr-ppd-schools');
  } else if (currentStaffUser.role === 'pic') {
    document.getElementById("footer-user-role").innerText = "School PIC";
    document.getElementById("sidebar-role-title").innerText = "School PIC";
    navigateToStaffScreen('scr-pic-events');
  } else if (currentStaffUser.role === 'teacher') {
    document.getElementById("footer-user-role").innerText = "Class Teacher";
    document.getElementById("sidebar-role-title").innerText = "Class Teacher";
    
    // Resolve teacher class
    fetch(`/api/pic/classes?school_id=${currentStaffUser.school_id}`)
    .then(res => res.json())
    .then(classes => {
      const cls = classes.find(c => c.teacher_user_id === currentStaffUser.id);
      if (cls) {
        teacherClassId = cls.id;
      }
      navigateToStaffScreen('scr-teacher-class');
    });
  }

  loadStaffNotificationsBadge();
}

function adminLogout() {
  sessionStorage.removeItem("staffUser");
  currentStaffUser = null;
  document.getElementById("admin-login-container").style.display = "flex";
  document.getElementById("admin-main-container").style.display = "none";
}

function demoSwitchRole(role) {
  let email = "do@klisp.gov.my";
  if (role === 'ppd') email = "ppd@klisp.gov.my";
  else if (role === 'pic') email = "pic@klisp.edu.my";
  else if (role === 'teacher') email = "teacher1@klisp.edu.my";

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: "password123" })
  })
  .then(res => res.json())
  .then(user => {
    currentStaffUser = user;
    sessionStorage.setItem("staffUser", JSON.stringify(user));
    loginSuccess();
  });
}

function navigateToStaffScreen(screenId) {
  activeStaffScreen = screenId;
  const screens = document.querySelectorAll(".admin-screen");
  screens.forEach(s => s.style.display = "none");
  
  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";

  const btns = document.querySelectorAll(".sidebar-item-btn");
  btns.forEach(b => b.classList.remove("active"));

  // Highlight active menu
  const menuMap = {
    'scr-do-routes': 'menu-do-routes',
    'scr-do-reports-review': 'menu-do-reports-review',
    'scr-do-logs': 'menu-do-logs',
    'scr-ppd-schools': 'menu-ppd-schools',
    'scr-ppd-notify': 'menu-ppd-notify',
    'scr-pic-events': 'menu-pic-events',
    'scr-pic-classes': 'menu-pic-classes',
    'scr-teacher-class': 'menu-teacher-class',
    'scr-teacher-students': 'menu-teacher-students',
    'scr-notif-log': 'menu-notif-log'
  };

  const activeMenu = document.getElementById(menuMap[screenId]);
  if (activeMenu) activeMenu.classList.add("active");

  // Title setting
  const headerMap = {
    'scr-do-routes': 'Route Status Manager',
    'scr-do-reports-review': 'Parent Block Reports Review',
    'scr-do-logs': 'Route Status Change Audit History',
    'scr-ppd-schools': 'School Predefined Route Linkages',
    'scr-ppd-notify': 'PPD Area alert broadcaster',
    'scr-pic-events': 'Active Flood Pickup Manager',
    'scr-pic-classes': 'Controlled Dismissal Report Summary',
    'scr-teacher-class': 'Teacher Gate Verification Pane',
    'scr-teacher-students': 'Roster & Parent Linking Records',
    'scr-notif-log': 'Staff Alerts & Incident Log Center'
  };
  document.getElementById("admin-header-title").innerText = headerMap[screenId];

  // Refresh data on load
  refreshActiveScreenData();
  lucide.createIcons();
}

function refreshActiveScreenData() {
  if (activeStaffScreen === 'scr-do-routes') {
    loadDoRoutes();
  } else if (activeStaffScreen === 'scr-do-reports-review') {
    loadDoReportsReview();
  } else if (activeStaffScreen === 'scr-do-logs') {
    loadDoLogs();
  } else if (activeStaffScreen === 'scr-ppd-schools') {
    loadPpdSchools();
  } else if (activeStaffScreen === 'scr-ppd-notify') {
    loadPpdNotifyScreen();
  } else if (activeStaffScreen === 'scr-pic-events') {
    loadPicEventScreen();
  } else if (activeStaffScreen === 'scr-pic-classes') {
    loadPicSummaryReport();
  } else if (activeStaffScreen === 'scr-teacher-class') {
    loadTeacherClassStudents();
  } else if (activeStaffScreen === 'scr-teacher-students') {
    loadTeacherClassRecords();
  } else if (activeStaffScreen === 'scr-notif-log') {
    loadStaffNotificationsFeed();
  }
}

function pollStaffData() {
  if (!currentStaffUser) return;
  
  if (activeStaffScreen === 'scr-do-routes') {
    loadDoRoutes();
  } else if (activeStaffScreen === 'scr-do-reports-review') {
    loadDoReportsReview();
  } else if (activeStaffScreen === 'scr-do-logs') {
    loadDoLogs();
  } else if (activeStaffScreen === 'scr-ppd-schools') {
    loadPpdSchools();
    if (selectedSchoolId) {
      loadPpdSchoolRoutes();
    }
  } else if (activeStaffScreen === 'scr-ppd-notify') {
    loadPpdSituationReports();
  } else if (activeStaffScreen === 'scr-pic-events') {
    loadPicEventScreenQuietly();
  } else if (activeStaffScreen === 'scr-teacher-class') {
    loadTeacherClassStudentsQuietly();
  }
  
  loadStaffNotificationsBadge();
}

// ==========================================================================
// DO SCREEN FLOWS
// ==========================================================================
function loadDoRoutes() {
  fetch('/api/do/routes')
  .then(res => res.json())
  .then(routes => {
    // Dynamically calculate and display DO Dashboard metrics
    fetch('/api/do/route-issues')
    .then(res => res.json())
    .then(reports => {
      const totalRoutes = routes.length;
      const safeRoutes = routes.filter(r => r.current_status === 'Safe' || r.current_status === 'Resolved').length;
      const riskRoutes = routes.filter(r => r.current_status === 'Caution' || r.current_status === 'Flood Risk' || r.current_status === 'Flooded' || r.current_status === 'Closed').length;
      const pendingReports = reports.filter(rep => rep.status === 'pending').length;

      const totalEl = document.getElementById("do-kpi-total-routes");
      const safeEl = document.getElementById("do-kpi-safe-routes");
      const riskEl = document.getElementById("do-kpi-risk-routes");
      const repEl = document.getElementById("do-kpi-parent-reports");

      if (totalEl) totalEl.innerText = totalRoutes;
      if (safeEl) safeEl.innerText = safeRoutes;
      if (riskEl) riskEl.innerText = riskRoutes;
      if (repEl) repEl.innerText = pendingReports;
    }).catch(err => console.warn("Failed to load reports metrics", err));

    const tbody = document.getElementById("do-routes-tbody");
    let html = "";
    routes.forEach(r => {
      let recStyle = "background:rgba(16,185,129,0.1); color:var(--success);";
      if (r.current_status === "Caution") recStyle = "background:rgba(245,158,11,0.1); color:var(--warning);";
      else if (r.current_status === "Flood Risk") recStyle = "background:rgba(245,158,11,0.15); color:var(--warning);";
      else if (r.current_status === "Flooded" || r.current_status === "Closed") recStyle = "background:rgba(239,68,68,0.15); color:var(--danger);";
      else if (r.current_status === "Resolved") recStyle = "background:rgba(16,185,129,0.1); color:var(--success);";

      const blocksBadge = r.parent_blocks >= 3 
        ? `<span class="status-badge status-issue" style="font-size:10px; font-weight:800; animation: pulse-border 1.5s infinite;">⚠️ ${r.parent_blocks} Parent Blocks</span>`
        : r.parent_blocks > 0 
          ? `<span class="status-badge status-notified">${r.parent_blocks} block reports</span>`
          : `<span style="color:var(--text-muted);">None</span>`;

      const areaName = r.area_id === 'A-01' ? 'Bingkor' : r.area_id === 'A-02' ? 'Apin-Apin' : 'Sook';

      html += `
        <tr>
          <td style="font-family:monospace; font-weight:700;">${r.id}</td>
          <td><strong>${r.name}</strong></td>
          <td>${areaName}</td>
          <td>${r.description}</td>
          <td>${blocksBadge}</td>
          <td><span class="route-rec-tag" style="padding:4px 8px; border-radius:8px; font-weight:700; ${recStyle}">${r.current_status}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; cursor:pointer;" onclick="openUpdateRouteStatusDialog('${r.id}', '${r.name}')">Status</button>
              <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; cursor:pointer;" onclick="openDoRouteModal('${r.id}')">Edit</button>
              <button class="btn btn-danger" style="padding:6px 12px; font-size:12px; background:var(--danger); color:white; border:none; cursor:pointer;" onclick="deactivateRoute('${r.id}')">Deactivate</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

// DO Route CRUD helper functions
function openDoRouteModal(routeId = null) {
  const modal = document.getElementById("modal-do-route-crud");
  const title = document.getElementById("do-route-modal-title");
  const idInput = document.getElementById("do-route-id-input");
  const nameInput = document.getElementById("do-route-name-input");
  const areaSelect = document.getElementById("do-route-area-select");
  const descInput = document.getElementById("do-route-desc-input");

  if (routeId) {
    title.innerText = "Edit Predefined Route Details";
    idInput.value = routeId;
    
    // Fetch details
    fetch('/api/do/routes')
    .then(res => res.json())
    .then(routes => {
      const r = routes.find(rt => rt.id === routeId);
      if (r) {
        nameInput.value = r.name;
        areaSelect.value = r.area_id;
        descInput.value = r.description;
      }
    });
  } else {
    title.innerText = "Register Predefined Route";
    idInput.value = "";
    nameInput.value = "";
    areaSelect.value = "A-01";
    descInput.value = "";
  }
  modal.style.display = "flex";
}

function closeDoRouteModal() {
  document.getElementById("modal-do-route-crud").style.display = "none";
}

function submitDoRouteForm() {
  const id = document.getElementById("do-route-id-input").value;
  const name = document.getElementById("do-route-name-input").value.trim();
  const area_id = document.getElementById("do-route-area-select").value;
  const description = document.getElementById("do-route-desc-input").value.trim();

  if (!name) {
    alert("Please enter route name");
    return;
  }

  const url = id ? `/api/do/routes/${id}` : '/api/do/routes';
  const method = id ? 'PUT' : 'POST';

  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      area_id,
      description,
      last_updated_by: currentStaffUser ? currentStaffUser.name : "DO Officer"
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(id ? "Route updated successfully." : "Route registered successfully.");
    closeDoRouteModal();
    loadDoRoutes();
  });
}

function deactivateRoute(routeId) {
  if (!confirm("Are you sure you want to deactivate/delete this route? This will clean up its links to any schools.")) return;

  fetch(`/api/do/routes/${routeId}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    alert("Route deactivated successfully.");
    loadDoRoutes();
  });
}

// DO Parent Block Reports Review
function loadDoReportsReview() {
  fetch('/api/do/route-issues')
  .then(res => res.json())
  .then(reports => {
    const tbody = document.getElementById("do-reports-review-tbody");
    if (!tbody) return;

    if (reports.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:14px;">No block reports submitted by parents yet.</td></tr>`;
      return;
    }

    let html = "";
    reports.forEach(r => {
      let badgeStyle = "background:rgba(245,158,11,0.1); color:var(--warning);";
      if (r.status === "reviewed") {
        badgeStyle = "background:rgba(16,185,129,0.1); color:var(--success);";
      }

      html += `
        <tr>
          <td><strong>${r.route_name}</strong></td>
          <td>${r.area_name}</td>
          <td>${r.reporter_name}</td>
          <td>${r.description}</td>
          <td><span class="route-rec-tag" style="padding:4px 8px; border-radius:8px; font-weight:700; ${badgeStyle}">${r.status.toUpperCase()}</span></td>
          <td>
            ${r.status !== 'reviewed' 
              ? `<button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; cursor:pointer;" onclick="openDoReviewModal('${r.id}')">Review</button>`
              : `<span style="font-size:12px; color:var(--text-muted);">Remarks: "${r.reviewer_remarks}"</span>`
            }
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

function openDoReviewModal(reportId) {
  fetch('/api/do/route-issues')
  .then(res => res.json())
  .then(reports => {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("do-review-report-id").value = reportId;
    document.getElementById("do-review-route-name").innerText = r.route_name;
    document.getElementById("do-review-parent-name").innerText = r.reporter_name;
    document.getElementById("do-review-description").innerText = r.description;
    document.getElementById("do-review-remarks").value = "";

    document.getElementById("modal-do-review-report").style.display = "flex";
  });
}

function closeDoReviewModal() {
  document.getElementById("modal-do-review-report").style.display = "none";
}

function submitDoReviewReport() {
  const reportId = document.getElementById("do-review-report-id").value;
  const remarks = document.getElementById("do-review-remarks").value.trim();

  if (!remarks) {
    alert("Please enter action remarks or feedback notes.");
    return;
  }

  fetch(`/api/do/route-issues/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: "reviewed",
      remarks: remarks,
      reviewed_by: currentStaffUser ? currentStaffUser.name : "DO Officer"
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("Report reviewed successfully.");
    closeDoReviewModal();
    loadDoReportsReview();
  });
}

function openUpdateRouteStatusDialog(routeId, routeName) {
  const status = prompt(`Update status for ${routeName}. Choose: Safe, Caution, Flood Risk, Flooded, Closed, Resolved:`);
  if (!status) return;

  const valid = ["Safe", "Caution", "Flood Risk", "Flooded", "Closed", "Resolved"];
  const formatted = status.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  
  if (!valid.includes(formatted)) {
    alert("Invalid status selected. Action aborted.");
    return;
  }

  const remarks = prompt("Enter logs reason/comment:");
  fetch(`/api/do/routes/${routeId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: formatted,
      remarks,
      updated_by: currentStaffUser.name
    })
  })
  .then(() => {
    alert("Route status updated successfully.");
    loadDoRoutes();
  });
}

function loadDoLogs() {
  fetch('/api/do/logs')
  .then(res => res.json())
  .then(logs => {
    const container = document.getElementById("do-logs-container");
    if (logs.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:14px;">No updates logged yet.</p>`;
      return;
    }
    let html = "";
    logs.forEach(log => {
      html += `
        <div class="log-item">
          <div class="log-item-header">${new Date(log.timestamp).toLocaleString()} • Updated by ${log.updated_by}</div>
          <h5>Route ${log.route_id}: ${log.old_status} ➔ ${log.new_status}</h5>
          <p>${log.remarks ? `Remarks: "${log.remarks}"` : 'No remarks logged.'}</p>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

function openNotifyPpdModal() {
  document.getElementById("modal-do-notify-ppd").style.display = "flex";
}

function closeDoNotifyPpdModal() {
  document.getElementById("modal-do-notify-ppd").style.display = "none";
}

function doNotifyPpdSubmit() {
  const areaId = document.getElementById("do-alert-area").value;
  const remarks = document.getElementById("do-alert-remarks").value.trim();

  fetch('/api/do/notify-ppd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      area_id: areaId,
      remarks,
      sender_name: currentStaffUser.name
    })
  })
  .then(() => {
    alert("Incident notice dispatched successfully to PPD.");
    closeDoNotifyPpdModal();
    document.getElementById("do-alert-remarks").value = "";
  });
}

// ==========================================================================
// PPD SCREEN FLOWS
// ==========================================================================
function loadPpdSchools() {
  const filterInput = document.getElementById("ppd-school-search-filter");
  const query = filterInput ? filterInput.value.toLowerCase().trim() : "";

  fetch('/api/ppd/schools')
  .then(res => res.json())
  .then(schools => {
    // Dynamically calculate and display PPD Dashboard metrics
    fetch('/api/ppd/stats')
    .then(res => res.json())
    .then(stats => {
      const schoolCount = schools.length;
      const picContacts = schools.filter(s => s.pic_user_id !== null).length;

      const schEl = document.getElementById("ppd-kpi-schools");
      const lnkEl = document.getElementById("ppd-kpi-links");
      const fldEl = document.getElementById("ppd-kpi-floods");
      const picEl = document.getElementById("ppd-kpi-pics");

      if (schEl) schEl.innerText = schoolCount;
      if (lnkEl) lnkEl.innerText = stats.school_routes_count;
      if (fldEl) fldEl.innerText = stats.flooded_areas_count;
      if (picEl) picEl.innerText = picContacts;
    }).catch(err => console.warn("Failed to load PPD metrics", err));

    const tbody = document.getElementById("ppd-schools-tbody");
    let html = "";

    const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(query));

    if (filteredSchools.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:12px;">No matching schools found.</td></tr>`;
      return;
    }

    filteredSchools.forEach(s => {
      const areaName = s.area_id === 'A-01' ? 'Bingkor' : s.area_id === 'A-02' ? 'Apin-Apin' : 'Sook';
      const rowStyle = selectedSchoolId === s.id ? "style='background: rgba(6, 182, 212, 0.1); cursor:pointer;'" : "style='cursor:pointer;'";
      html += `
        <tr onclick="ppdSelectSchool('${s.id}', '${s.name}')" ${rowStyle} id="school-row-${s.id}">
          <td><strong>${s.name}</strong></td>
          <td>${areaName}</td>
          <td>${s.pic_user_id ? 'Yes (Cikgu Rosli)' : 'None'}</td>
          <td>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation(); ppdDeleteSchool('${s.id}')">Delete</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

function filterPpdSchoolsLocal(query) {
  loadPpdSchools();
}

function ppdSelectSchool(id, name) {
  selectedSchoolId = id;
  const listRows = document.querySelectorAll("#ppd-schools-tbody tr");
  listRows.forEach(r => r.style.background = "none");
  
  const selectedRow = document.getElementById(`school-row-${id}`);
  if (selectedRow) selectedRow.style.background = "rgba(6, 182, 212, 0.1)";

  const section = document.getElementById("ppd-route-assignment-section");
  section.style.opacity = "1";
  section.style.pointerEvents = "auto";
  
  document.getElementById("ppd-selected-school-title").innerText = `Predefined Route Links (${name})`;
  loadPpdSchoolRoutes();
}

function loadPpdSchoolRoutes() {
  if (!selectedSchoolId) return;

  fetch(`/api/ppd/schools/${selectedSchoolId}/routes`)
  .then(res => res.json())
  .then(routes => {
    const tbody = document.getElementById("ppd-assigned-routes-tbody");
    if (routes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding: 14px;">No predefined routes linked yet.</td></tr>`;
      return;
    }
    let html = "";
    routes.forEach(r => {
      html += `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>Bingkor</td>
          <td>${r.current_status}</td>
          <td>
            <button class="btn btn-danger" style="padding:4px 8px; font-size:11px; background:var(--danger); color:white;" onclick="ppdUnlinkRoute('${r.id}')">Remove</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

function openAssignRouteModal() {
  fetch('/api/do/routes')
  .then(res => res.json())
  .then(routes => {
    // Filter routes not already assigned
    fetch(`/api/ppd/schools/${selectedSchoolId}/routes`)
    .then(r => r.json())
    .then(assigned => {
      const assignedIds = assigned.map(a => a.id);
      const unassigned = routes.filter(rt => !assignedIds.includes(rt.id));

      const select = document.getElementById("ppd-assign-select-route");
      if (unassigned.length === 0) {
        select.innerHTML = `<option value="">No unlinked routes available</option>`;
      } else {
        select.innerHTML = unassigned.map(u => `<option value="${u.id}">${u.name}</option>`).join("");
      }
      document.getElementById("modal-ppd-assign-route").style.display = "flex";
    });
  });
}

function closeAssignRouteModal() {
  document.getElementById("modal-ppd-assign-route").style.display = "none";
}

function ppdAssignRouteSubmit() {
  const route_id = document.getElementById("ppd-assign-select-route").value;
  if (!route_id) return;

  fetch(`/api/ppd/schools/${selectedSchoolId}/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route_id })
  })
  .then(() => {
    alert("Predefined route linked to school.");
    closeAssignRouteModal();
    loadPpdSchoolRoutes();
  });
}

function ppdUnlinkRoute(routeId) {
  if (!confirm("Are you sure you want to remove this route connection?")) return;

  fetch(`/api/ppd/schools/${selectedSchoolId}/routes/${routeId}`, { method: 'DELETE' })
  .then(() => {
    alert("Route link removed.");
    loadPpdSchoolRoutes();
  });
}

function openAddSchoolModal() {
  document.getElementById("modal-ppd-add-school").style.display = "flex";
}

function closeAddSchoolModal() {
  document.getElementById("modal-ppd-add-school").style.display = "none";
}

function ppdSaveSchoolSubmit() {
  const name = document.getElementById("ppd-school-name").value.trim();
  const area_id = document.getElementById("ppd-school-area").value;
  const address = document.getElementById("ppd-school-address").value.trim();

  if (!name) {
    alert("Enter school name");
    return;
  }

  fetch('/api/ppd/schools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, area_id, address })
  })
  .then(() => {
    alert("School registered successfully.");
    closeAddSchoolModal();
    loadPpdSchools();
  });
}

function ppdDeleteSchool(id) {
  if (!confirm("Delete school record?")) return;
  fetch(`/api/ppd/schools/${id}`, { method: 'DELETE' })
  .then(() => loadPpdSchools());
}

function loadPpdNotifyScreen() {
  // Populate areas dropdown
  const areas = [
    { id: "A-01", name: "Bingkor" },
    { id: "A-02", name: "Apin-Apin" },
    { id: "A-03", name: "Sook" }
  ];
  const select = document.getElementById("ppd-search-area");
  select.innerHTML = `<option value="">-- Choose Flood Area --</option>` + 
                     areas.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
                     
  loadPpdSituationReports();
}

function ppdSearchSchools() {
  const areaId = document.getElementById("ppd-search-area").value;
  const container = document.getElementById("ppd-matched-schools-list");
  
  if (!areaId) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; margin:0;">Search an area to find schools.</p>`;
    return;
  }

  fetch(`/api/ppd/search-schools?area_id=${areaId}`)
  .then(res => res.json())
  .then(schools => {
    if (schools.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; margin:0;">No schools affected geographically or via routes in this area.</p>`;
      return;
    }
    
    let html = "";
    schools.forEach(school => {
      html += `
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:14px; font-weight:600; cursor:pointer;">
          <input type="checkbox" name="ppd_notify_school" value="${school.id}" checked>
          <span>${school.name}</span>
        </label>
      `;
    });
    container.innerHTML = html;
  });
}

function ppdSendAlertNotice() {
  const checkboxes = document.querySelectorAll("input[name='ppd_notify_school']:checked");
  const schoolIds = Array.from(checkboxes).map(cb => cb.value);
  const remarks = document.getElementById("ppd-alert-remarks").value.trim();

  if (schoolIds.length === 0) {
    alert("Select at least one school to alert");
    return;
  }

  fetch('/api/ppd/notify-schools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      school_ids: schoolIds,
      remarks,
      sender_name: currentStaffUser.name
    })
  })
  .then(() => {
    alert("Flood risk dispatches sent successfully to PICs.");
    document.getElementById("ppd-alert-remarks").value = "";
    document.getElementById("ppd-search-area").value = "";
    ppdSearchSchools();
  });
}

function loadPpdSituationReports() {
  // Fetch PPD notifications for situation reports
  fetch(`/api/notifications?role=ppd`)
  .then(res => res.json())
  .then(notifs => {
    const list = document.getElementById("ppd-sit-reports-feed");
    const reports = notifs.filter(n => n.type === 'situation_report');

    if (reports.length === 0) {
      list.innerHTML = `<p style="font-size:13px; color:var(--text-muted);">No situation reports received.</p>`;
      return;
    }

    let html = "";
    reports.forEach(r => {
      html += `
        <div class="student-list-item" style="cursor:default; padding:12px 16px; flex-direction:column; align-items:flex-start;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${new Date(r.created_at).toLocaleString()}</div>
          <strong style="font-size:13px; color:var(--accent);">${r.title}</strong>
          <p style="font-size:13px; margin-top:4px; line-height:1.4;">${r.message}</p>
        </div>
      `;
    });
    list.innerHTML = html;
  });
}

// ==========================================================================
// School PIC SCREEN FLOWS
// ==========================================================================
function loadPicEventScreen() {
  if (!currentStaffUser.school_id) return;
  
  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    picActiveEvent = event;
    const noneBlock = document.getElementById("pic-event-none-block");
    const activeBlock = document.getElementById("pic-event-active-block");

    if (!event) {
      noneBlock.style.display = "block";
      activeBlock.style.display = "none";
      document.getElementById("pic-action-activate-block").style.display = "none";
      document.getElementById("pic-action-hold-block").style.display = "none";
    } else {
      noneBlock.style.display = "none";
      activeBlock.style.display = "block";

      const badge = document.getElementById("pic-event-status-badge");
      badge.innerText = event.status.toUpperCase();
      badge.className = `status-badge ${event.status === 'hold' ? 'status-issue' : 'status-ready'}`;

      const desc = document.getElementById("pic-event-details-status");
      desc.innerHTML = `
        <strong>Event Started:</strong> ${new Date(event.started_at).toLocaleString()}<br>
        ${event.status === 'hold' ? `<strong>Hold Postpone Reason:</strong> "${event.hold_reason}"` : `<strong>Pickup Instructions:</strong> "${event.pickup_instruction}"`}<br>
        ${event.situation_report_sent_at ? `<strong style="color:var(--accent);">Situation report sent to PPD:</strong> ${new Date(event.situation_report_sent_at).toLocaleTimeString()}` : ''}
      `;

      // Set input defaults
      if (event.status === 'hold') {
        document.getElementById("pic-held-report-input-block").style.display = "block";
        document.getElementById("pic-btn-switch-to-active").style.display = "block";
        document.getElementById("pic-btn-notify-parents").innerText = "Resend Dismissal Hold Notice";
        document.getElementById("pic-situation-report-text").value = event.situation_report_text || "";
      } else {
        document.getElementById("pic-held-report-input-block").style.display = "none";
        document.getElementById("pic-btn-switch-to-active").style.display = "none";
        document.getElementById("pic-btn-notify-parents").innerText = "Broadcast Controlled Pickup Notice";
      }
    }

    loadPicMonitoringProgress();
  });
}

function togglePicActionSelect(action) {
  if (action === 'activate') {
    document.getElementById("pic-action-activate-block").style.display = "block";
    document.getElementById("pic-action-hold-block").style.display = "none";
  } else {
    document.getElementById("pic-action-activate-block").style.display = "none";
    document.getElementById("pic-action-hold-block").style.display = "block";
  }
}

function picCreateEvent(action) {
  const instr = document.getElementById("pic-pickup-instr").value.trim();
  const reason = document.getElementById("pic-hold-reason").value.trim();

  const body = {
    school_id: currentStaffUser.school_id,
    action,
    pickup_instruction: action === 'activate' ? instr : "",
    hold_reason: action === 'hold' ? reason : "",
    created_by: currentStaffUser.name
  };

  fetch('/api/pic/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(() => {
    alert(`Dismissal Event ${action === 'hold' ? 'HOLD' : 'ACTIVATION'} initialized.`);
    loadPicEventScreen();
  });
}

function picSwitchHoldToActive() {
  const instr = prompt("Enter controlled pickup location/instructions:", "Wait at Main Gate. Check in at Block A hall.");
  if (!instr) return;

  fetch('/api/pic/event', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      school_id: currentStaffUser.school_id,
      action: 'activate',
      pickup_instruction: instr,
      updated_by: currentStaffUser.name
    })
  })
  .then(() => {
    alert("Status switched to Controlled Pickup. Notify parents of update.");
    loadPicEventScreen();
  });
}

function picNotifyParentsBroadcast() {
  if (!picActiveEvent) return;

  fetch('/api/pic/event/notify-parents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_event_id: picActiveEvent.id,
      school_id: currentStaffUser.school_id,
      type: picActiveEvent.status === 'hold' ? 'hold_notice' : 'pickup_notice'
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadPicEventScreen();
  });
}

function picSendSituationReport() {
  const text = document.getElementById("pic-situation-report-text").value.trim();
  if (!text) return;

  fetch('/api/pic/situation-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_event_id: picActiveEvent.id,
      text,
      sender_name: currentStaffUser.name
    })
  })
  .then(() => {
    alert("Situation report sent to PPD officers.");
    loadPicEventScreen();
  });
}

function loadPicMonitoringProgress() {
  if (!picActiveEvent) {
    document.getElementById("pic-monitoring-tbody").innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:14px;">No active pickup event to monitor.</td></tr>`;
    return;
  }

  fetch(`/api/pic/event/monitoring?school_id=${currentStaffUser.school_id}&pickup_event_id=${picActiveEvent.id}`)
  .then(res => res.json())
  .then(rows => {
    const tbody = document.getElementById("pic-monitoring-tbody");
    let html = "";
    rows.forEach(r => {
      html += `
        <tr>
          <td><strong>${r.class_name}</strong></td>
          <td>${r.teacher_name}</td>
          <td>${r.total}</td>
          <td>${r.supervised}</td>
          <td>${r.notified}</td>
          <td><span style="color:var(--info); font-weight:700;">${r.on_the_way}</span></td>
          <td><span style="color:var(--warning); font-weight:700;">${r.ready}</span></td>
          <td><span style="color:var(--success); font-weight:700;">${r.picked_up}</span></td>
          <td><span style="color:var(--danger); font-weight:700;">${r.issue}</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

function openCloseEventModal() {
  // Fetch all students not picked up
  fetch(`/api/teacher/students?class_id=C-01&pickup_event_id=${picActiveEvent.id}`) // Just query school classes
  .then(() => {
    // Actually, let's query all students in this school with active statuses
    return fetch(`/api/teacher/students?class_id=C-01&pickup_event_id=${picActiveEvent.id}`);
  })
  .then(res => res.json())
  .then(() => {
    // We will do a generic check via monitoring endpoint
    fetch(`/api/pic/event/monitoring?school_id=${currentStaffUser.school_id}&pickup_event_id=${picActiveEvent.id}`)
    .then(r => r.json())
    .then(classes => {
      // Find students not picked up
      // For simplicity, let's load all class students who are unresolved
      // We will mock the checklist showing unresolved cases for the school
      let unresolvedList = [];
      
      // Let's call teacher/students for C-01 and C-02
      Promise.all([
        fetch(`/api/teacher/students?class_id=C-01&pickup_event_id=${picActiveEvent.id}`).then(res => res.json()),
        fetch(`/api/teacher/students?class_id=C-02&pickup_event_id=${picActiveEvent.id}`).then(res => res.json())
      ])
      .then(([c1, c2]) => {
        const allStudents = [...c1, ...c2];
        const unresolved = allStudents.filter(s => s.status !== 'Picked Up');

        const container = document.getElementById("pic-unresolved-checklist-container");
        if (unresolved.length === 0) {
          container.innerHTML = `<p style="color:var(--success); font-size:13px; font-weight:600; margin:0;">All kids have been picked up safely! You can close the event without resolutions.</p>`;
        } else {
          let html = "";
          unresolved.forEach(s => {
            html += `
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding:10px 0;">
                <div style="text-align:left;">
                  <strong style="font-size:13px; display:block;">${s.name}</strong>
                  <span style="font-size:11px; color:var(--text-muted);">${s.status}</span>
                </div>
                <select name="resolution_child_${s.id}" class="form-control" style="width:280px; height:32px; font-size:12px; padding:0 8px;">
                  <option value="Parent contacted — coming later">Parent contacted — coming later</option>
                  <option value="Emergency contact notified">Emergency contact notified</option>
                  <option value="Student remains under school supervision">Student remains under school supervision</option>
                  <option value="Handed to authorized guardian">Handed to authorized guardian</option>
                </select>
              </div>
            `;
          });
          container.innerHTML = html;
        }

        document.getElementById("modal-pic-close-event").style.display = "flex";
      });
    });
  });
}

function closeCloseEventModal() {
  document.getElementById("modal-pic-close-event").style.display = "none";
}

function picCloseEventSubmit() {
  const selects = document.querySelectorAll("[name^='resolution_child_']");
  const resolutions = {};
  selects.forEach(sel => {
    const studentId = sel.name.replace("resolution_child_", "");
    resolutions[studentId] = sel.value;
  });

  fetch('/api/pic/event/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_event_id: picActiveEvent.id,
      school_id: currentStaffUser.school_id,
      resolutions,
      closed_by: currentStaffUser.name
    })
  })
  .then(res => {
    if (!res.ok) {
      alert("Resolution check failed. Account for all children.");
      return;
    }
    alert("Pickup event closed successfully. Generating report summary...");
    closeCloseEventModal();
    navigateToStaffScreen('scr-pic-classes');
  });
}

function loadPicSummaryReport() {
  if (!picActiveEvent) return;

  fetch('/api/pic/event/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_event_id: picActiveEvent.id,
      school_id: currentStaffUser.school_id
    })
  })
  .then(res => res.json())
  .then(report => {
    const block = document.getElementById("pic-report-data-block");
    block.innerHTML = `
      <div class="admin-grid-kpis" style="margin-top:20px;">
        <div class="kpi-card">
          <div class="kpi-desc">Total Children</div>
          <div class="kpi-value">${report.total}</div>
        </div>
        <div class="kpi-card" style="border-color:rgba(16,185,129,0.3); box-shadow: 0 4px 6px -1px rgba(16,185,129,0.05);">
          <div class="kpi-desc" style="color:var(--success);">Picked Up Safely</div>
          <div class="kpi-value" style="color:var(--success);">${report.pickedUp}</div>
        </div>
        <div class="kpi-card" style="border-color:rgba(239,68,68,0.3); box-shadow: 0 4px 6px -1px rgba(239,68,68,0.05);">
          <div class="kpi-desc" style="color:var(--danger);">Exception Issues</div>
          <div class="kpi-value" style="color:var(--danger);">${report.issues}</div>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(139, 92, 246, 0.01) 100%); border: 1px solid rgba(124, 58, 237, 0.15); border-radius: 16px; padding: 28px; text-align: left; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.05); position: relative; margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(124, 58, 237, 0.1); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="background: #7C3AED; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
              <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
            </div>
            <div>
              <h4 style="font-size: 14.5px; font-weight: 800; color: #1E293B; margin: 0;">AI Incident Summarization Feed</h4>
              <span style="font-size: 11px; color: #7C3AED; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">K-LiSP Intelligent Analysis</span>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="copyAiReportToClipboard(\`${encodeURIComponent(report.aiSummary)}\`)" style="height: 32px; padding: 0 12px; font-size: 12px; gap: 6px; border-color: rgba(124, 58, 237, 0.2); color: #7C3AED; display: inline-flex; align-items: center; font-weight: 700; cursor: pointer; border-radius: 6px;">
            <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy Summary
          </button>
        </div>
        <div style="background: #FFFFFF; border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 12px; padding: 20px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02);">
          <pre style="white-space: pre-wrap; font-family: 'Outfit', sans-serif; font-size: 13.5px; line-height: 1.6; color: #334155; margin: 0; font-weight: 500;">${report.aiSummary}</pre>
        </div>
      </div>
    `;
    lucide.createIcons();
  });
}

function copyAiReportToClipboard(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    alert("AI summary report successfully copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy text: ", err);
  });
}

// ==========================================================================
// Class Teacher SCREEN FLOWS
// ==========================================================================
function loadTeacherClassStudents() {
  if (!teacherClassId) return;

  // Find if active event exists
  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    const eventId = event ? event.id : null;
    fetch(`/api/teacher/students?class_id=${teacherClassId}&pickup_event_id=${eventId}`)
    .then(res => res.json())
    .then(students => {
      teacherStudentsList = students;
      renderTeacherStudentsList();
    });
  });
}

function loadTeacherClassStudentsQuietly() {
  if (!teacherClassId) return;
  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    const eventId = event ? event.id : null;
    fetch(`/api/teacher/students?class_id=${teacherClassId}&pickup_event_id=${eventId}`)
    .then(res => res.json())
    .then(students => {
      teacherStudentsList = students;
      renderTeacherStudentsListQuietly();
    });
  });
}

function renderTeacherStudentsList() {
  const scroll = document.getElementById("teacher-student-scroll");
  scroll.innerHTML = "";
  
  const filtered = teacherStudentsList.filter(s => {
    return teacherFilterValue === "" || s.status === teacherFilterValue;
  });

  if (filtered.length === 0) {
    scroll.innerHTML = `<p style="font-size:13px; color:var(--text-muted); padding:10px;">No students found matching filters.</p>`;
    return;
  }

  filtered.forEach(s => {
    let borderStyle = "none";
    let statusColor = "var(--text-muted)";
    if (s.status === 'On The Way') { borderStyle = "3px solid var(--accent)"; statusColor = "var(--accent)"; }
    else if (s.status === 'Ready') { borderStyle = "3px solid var(--warning)"; statusColor = "var(--warning)"; }
    else if (s.status === 'Picked Up') { borderStyle = "3px solid var(--success)"; statusColor = "var(--success)"; }
    else if (s.status === 'Issue') { borderStyle = "3px solid var(--danger)"; statusColor = "var(--danger)"; }

    const isSelected = teacherSelectedStudentId === s.id ? "selected" : "";

    scroll.innerHTML += `
      <div class="student-list-item ${isSelected}" onclick="teacherSelectStudent('${s.id}')" style="border-left: ${borderStyle};">
        <div>
          <strong style="font-size:13px; display:block;">${s.name}</strong>
          <span style="font-size:11px; color:${statusColor}; font-weight:700;">${s.status}</span>
        </div>
        <i data-lucide="chevron-right" style="width:14px; height:14px; color:var(--text-muted);"></i>
      </div>
    `;
  });
  lucide.createIcons();

  if (teacherSelectedStudentId) {
    teacherSelectStudent(teacherSelectedStudentId);
  } else {
    document.getElementById("teacher-verification-details-panel").style.display = "none";
  }
}

function renderTeacherStudentsListQuietly() {
  // Same as renderTeacherStudentsList but does not reset selections
  const scroll = document.getElementById("teacher-student-scroll");
  const scrollItems = scroll.children;
  
  const filtered = teacherStudentsList.filter(s => {
    return teacherFilterValue === "" || s.status === teacherFilterValue;
  });

  // Re-render list quietly
  renderTeacherStudentsList();
}

function teacherFilterStudents(val) {
  teacherFilterValue = val;
  renderTeacherStudentsList();
}

function loadPicEventScreenQuietly() {
  if (!currentStaffUser.school_id) return;
  
  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    picActiveEvent = event;
    const noneBlock = document.getElementById("pic-event-none-block");
    const activeBlock = document.getElementById("pic-event-active-block");

    if (!event) {
      noneBlock.style.display = "block";
      activeBlock.style.display = "none";
      document.getElementById("pic-action-activate-block").style.display = "none";
      document.getElementById("pic-action-hold-block").style.display = "none";
    } else {
      noneBlock.style.display = "none";
      activeBlock.style.display = "block";

      const badge = document.getElementById("pic-event-status-badge");
      badge.innerText = event.status.toUpperCase();
      badge.className = `status-badge ${event.status === 'hold' ? 'status-issue' : 'status-ready'}`;

      const desc = document.getElementById("pic-event-details-status");
      desc.innerHTML = `
        <strong>Event Started:</strong> ${new Date(event.started_at).toLocaleString()}<br>
        ${event.status === 'hold' ? `<strong>Hold Postpone Reason:</strong> "${event.hold_reason}"` : `<strong>Pickup Instructions:</strong> "${event.pickup_instruction}"`}<br>
        ${event.situation_report_sent_at ? `<strong style="color:var(--accent);">Situation report sent to PPD:</strong> ${new Date(event.situation_report_sent_at).toLocaleTimeString()}` : ''}
      `;

      // Set input defaults quietly (checking focus to prevent overriding user typing)
      if (event.status === 'hold') {
        document.getElementById("pic-held-report-input-block").style.display = "block";
        document.getElementById("pic-btn-switch-to-active").style.display = "block";
        document.getElementById("pic-btn-notify-parents").innerText = "Resend Dismissal Hold Notice";
        
        const sitRepText = document.getElementById("pic-situation-report-text");
        if (sitRepText && document.activeElement !== sitRepText) {
          sitRepText.value = event.situation_report_text || "";
        }
      } else {
        document.getElementById("pic-held-report-input-block").style.display = "none";
        document.getElementById("pic-btn-switch-to-active").style.display = "none";
        document.getElementById("pic-btn-notify-parents").innerText = "Broadcast Controlled Pickup Notice";
      }
    }

    loadPicMonitoringProgress();
  });
}

function teacherSelectStudent(id) {
  teacherSelectedStudentId = id;
  const items = document.querySelectorAll(".student-list-item");
  items.forEach(item => item.classList.remove("selected"));

  // Highlight locally
  const student = teacherStudentsList.find(s => s.id === id);
  if (!student) return;

  const panel = document.getElementById("teacher-verification-details-panel");
  panel.style.display = "block";

  const parent = student.parents[0] || { name: "Not Registered", ic_number: "N/A", phone: "N/A" };
  const responseBox = student.response 
    ? `<div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:12px; border-radius:12px; margin-bottom:20px;">
         <strong style="color:var(--accent);">Parent Response: ${student.response.response_type.toUpperCase().replace(/_/g, ' ')}</strong><br>
         <span style="font-size:12px; color:var(--text-muted);">Timestamp: ${new Date(student.response.timestamp).toLocaleTimeString()}</span>
       </div>`
    : `<div style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">No response submitted by parent.</div>`;

  let alertBox = "";
  if (student.response && student.response.response_type === 'guardian') {
    alertBox = `
      <div class="alert-banner" style="margin-bottom:20px;">
        <i data-lucide="shield-alert"></i>
        <div class="alert-banner-content">
          <h4>Substitute Guardian Designated</h4>
          <p>Parent stated: "${student.response.guardian_note || 'None'}". Verify details before confirmation.</p>
        </div>
      </div>
    `;
  }

  let actionButtons = "";
  if (student.status !== 'Picked Up') {
    actionButtons = `
      <div class="form-group">
        <label for="teacher-handover-remarks">Handover Remarks / Notes</label>
        <input type="text" id="teacher-handover-remarks" class="form-control" placeholder="E.g., Grandfather pick up, visually matched ID.">
      </div>
      <div style="display:flex; gap:12px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="teacherReportStudentIssue('${student.id}')" style="flex:1; justify-content:center; background:#EF4444; color:white;">Report Issue</button>
        <button class="btn" onclick="teacherConfirmHandover('${student.id}')" style="flex:1; justify-content:center; background:var(--success); color:#0f172a;">Confirm Handover</button>
      </div>
    `;
  } else {
    actionButtons = `
      <div class="audit-verification-banner">
        <i data-lucide="check-circle"></i> Handover Confirmed & Student Released.
      </div>
    `;
  }

  // Preserve typed remarks
  const remarksInput = document.getElementById("teacher-handover-remarks");
  const currentRemarksVal = remarksInput ? remarksInput.value : "";

  panel.innerHTML = `
    <h3>Physical Handover Verification</h3>
    ${alertBox}
    ${responseBox}
    
    <div class="verification-audit-box">
      <div class="audit-field-row">
        <span class="audit-field-label">Student Name</span>
        <strong class="audit-field-value">${student.name}</strong>
      </div>
      <div class="audit-field-row">
        <span class="audit-field-label">Primary Parent/Guardian</span>
        <span class="audit-field-value">${parent.name}</span>
      </div>
      <div class="audit-field-row">
        <span class="audit-field-label">Parent Registered IC</span>
        <strong class="audit-field-value" style="color:var(--accent); font-size:14px;">${parent.ic_number}</strong>
      </div>
      <div class="audit-field-row">
        <span class="audit-field-label">Relationship</span>
        <span class="audit-field-value">${parent.relationship || 'Father'}</span>
      </div>
      <div class="audit-field-row">
        <span class="audit-field-label">Contact Number</span>
        <span class="audit-field-value">${parent.phone}</span>
      </div>
    </div>

    <div style="font-size:12.5px; color:var(--text-muted); margin-bottom:20px; line-height:1.4;">
      <strong>Name + IC Visual Matching Rule:</strong> Check the parent's physical ID matches the name and IC listed above. If parent designated another guardian, match the name listed in the warning banner.
    </div>

    ${actionButtons}
  `;

  // Restore typed remarks value
  const newRemarksInput = document.getElementById("teacher-handover-remarks");
  if (newRemarksInput) {
    newRemarksInput.value = currentRemarksVal;
  }

  lucide.createIcons();
}

function teacherConfirmHandover(studentId) {
  const remarks = document.getElementById("teacher-handover-remarks").value.trim();
  
  // Find event ID
  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    if (!event) return;
    
    const student = teacherStudentsList.find(s => s.id === studentId);
    const parent = student.parents[0];

    const body = {
      pickup_event_id: event.id,
      student_id: studentId,
      verified_by_teacher_id: currentStaffUser.id,
      parent_user_id: parent ? parent.id : null,
      guardian_name_if_alternate: (student.response && student.response.response_type === 'guardian') ? student.response.guardian_note : null,
      remarks
    };

    fetch('/api/teacher/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(() => {
      alert("Verification logged. Kid released.");
      loadTeacherClassStudents();
    });
  });
}

function teacherReportStudentIssue(studentId) {
  const reason = prompt("Enter issue sub-reason (e.g. Delayed, Cannot Come Now, Route Blocked):", "Delayed");
  if (!reason) return;
  const notes = prompt("Enter additional notes:");

  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    if (!event) return;

    fetch('/api/teacher/report-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_event_id: event.id,
        student_id: studentId,
        sub_reason: reason,
        notes,
        updated_by: currentStaffUser.id
      })
    })
    .then(() => {
      alert("Student status set to Issue.");
      loadTeacherClassStudents();
    });
  });
}

function teacherBulkMarkReady() {
  const unresolved = teacherStudentsList.filter(s => s.status !== 'Picked Up' && s.status !== 'Ready');
  const ids = unresolved.map(s => s.id);
  if (ids.length === 0) {
    alert("No eligible students to mark as Ready.");
    return;
  }

  fetch(`/api/pic/event?school_id=${currentStaffUser.school_id}`)
  .then(res => res.json())
  .then(event => {
    if (!event) return;

    fetch('/api/teacher/students/bulk-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: ids,
        pickup_event_id: event.id,
        status: "Ready",
        updated_by: currentStaffUser.id
      })
    })
    .then(() => {
      alert(`${ids.length} students bulk-marked as Ready.`);
      loadTeacherClassStudents();
    });
  });
}

// ==========================================================================
// Class Records Tab Logic (Teacher CRUD)
// ==========================================================================
function loadTeacherClassRecords() {
  if (!teacherClassId) return;
  
  // Render Students
  fetch(`/api/teacher/students?class_id=${teacherClassId}`)
  .then(res => res.json())
  .then(students => {
    const tbody = document.getElementById("teacher-students-tbody");
    tbody.innerHTML = students.map(s => `
      <tr>
        <td style="font-family:monospace;">${s.id}</td>
        <td><strong>${s.name}</strong></td>
        <td>
          <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="teacherDeleteStudent('${s.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  });

  // Render Parents
  fetch('/api/teacher/parents')
  .then(res => res.json())
  .then(parents => {
    const tbody = document.getElementById("teacher-parents-tbody");
    tbody.innerHTML = parents.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.ic_number}</td>
        <td>${p.phone}</td>
        <td>${p.email}</td>
        <td>
          <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="teacherDeleteParent('${p.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  });

  // Render Links
  fetch(`/api/teacher/links?class_id=${teacherClassId}`)
  .then(res => res.json())
  .then(links => {
    const tbody = document.getElementById("teacher-links-tbody");
    if (links.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:10px;">No links registered yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = links.map(l => `
      <tr>
        <td>${l.student_name}</td>
        <td>${l.parent_name}</td>
        <td>${l.relationship}</td>
        <td>
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px; background:#EF4444; color:white;" onclick="teacherDeleteLink('${l.id}')">Remove</button>
        </td>
      </tr>
    `).join("");
  });
}

function openAddStudentModal() {
  document.getElementById("modal-teacher-add-student").style.display = "flex";
}

function closeAddStudentModal() {
  document.getElementById("modal-teacher-add-student").style.display = "none";
}

function teacherSaveStudentSubmit() {
  const name = document.getElementById("teacher-student-name").value.trim();
  if (!name) return;

  fetch('/api/teacher/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      class_id: teacherClassId,
      school_id: currentStaffUser.school_id
    })
  })
  .then(() => {
    alert("Student roster saved.");
    closeAddStudentModal();
    loadTeacherClassRecords();
    document.getElementById("teacher-student-name").value = "";
  });
}

function teacherDeleteStudent(id) {
  if (!confirm("Delete student?")) return;
  fetch(`/api/teacher/students/${id}`, { method: 'DELETE' })
  .then(() => loadTeacherClassRecords());
}

function openAddParentModal() {
  document.getElementById("modal-teacher-add-parent").style.display = "flex";
}

function closeAddParentModal() {
  document.getElementById("modal-teacher-add-parent").style.display = "none";
}

function teacherSaveParentSubmit() {
  const name = document.getElementById("teacher-parent-name").value.trim();
  const ic_number = document.getElementById("teacher-parent-ic").value.trim();
  const phone = document.getElementById("teacher-parent-phone").value.trim();
  const email = document.getElementById("teacher-parent-email").value.trim();

  if (!name || !ic_number || !phone || !email) {
    alert("All fields are required.");
    return;
  }

  fetch('/api/teacher/parents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ic_number, phone, email })
  })
  .then(() => {
    alert("Parent account created.");
    closeAddParentModal();
    loadTeacherClassRecords();
  });
}

function teacherDeleteParent(id) {
  if (!confirm("Delete parent account?")) return;
  fetch(`/api/teacher/parents/${id}`, { method: 'DELETE' })
  .then(() => loadTeacherClassRecords());
}

function openLinkParentModal() {
  // Populate dropdowns
  Promise.all([
    fetch(`/api/teacher/students?class_id=${teacherClassId}`).then(res => res.json()),
    fetch('/api/teacher/parents').then(res => res.json())
  ]).then(([students, parents]) => {
    const sDropdown = document.getElementById("teacher-link-select-student");
    const pDropdown = document.getElementById("teacher-link-select-parent");

    sDropdown.innerHTML = students.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    pDropdown.innerHTML = parents.map(p => `<option value="${p.id}">${p.name} (${p.ic_number})</option>`).join("");

    document.getElementById("modal-teacher-link-parent").style.display = "flex";
  });
}

function closeLinkParentModal() {
  document.getElementById("modal-teacher-link-parent").style.display = "none";
}

function teacherLinkParentSubmit() {
  const student_id = document.getElementById("teacher-link-select-student").value;
  const parent_user_id = document.getElementById("teacher-link-select-parent").value;
  const relationship = document.getElementById("teacher-link-relationship").value;

  if (!student_id || !parent_user_id) return;

  fetch('/api/teacher/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, parent_user_id, relationship })
  })
  .then(() => {
    alert("Records linked.");
    closeLinkParentModal();
    loadTeacherClassRecords();
  });
}

function teacherDeleteLink(id) {
  if (!confirm("Remove link association?")) return;
  fetch(`/api/teacher/links/${id}`, { method: 'DELETE' })
  .then(() => loadTeacherClassRecords());
}


// ==========================================================================
// Inbox Alerts Feeds & Notifications Loader
// ==========================================================================
function loadStaffNotificationsBadge() {
  if (!currentStaffUser) return;
  fetch(`/api/notifications?user_id=${currentStaffUser.id}`)
  .then(res => res.json())
  .then(notifs => {
    const unread = notifs.filter(n => !n.is_read).length;
    const badge = document.getElementById("staff-notif-badge");
    if (unread > 0) {
      badge.innerText = unread;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  });
}

function loadStaffNotificationsFeed() {
  fetch(`/api/notifications?user_id=${currentStaffUser.id}`)
  .then(res => res.json())
  .then(notifs => {
    const feed = document.getElementById("staff-notifications-feed");
    if (notifs.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <i data-lucide="bell-off" style="width:36px; height:36px;"></i>
          <h4>Inbox Empty</h4>
          <p>No new safety alerts or updates found.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    let html = "";
    notifs.forEach(n => {
      let icon = "bell";
      let border = "rgba(255,255,255,0.05)";
      if (n.type === 'ppd_alert') { icon = "shield-alert"; border = "var(--warning)"; }
      else if (n.type === 'school_alert') { icon = "school"; border = "var(--accent)"; }
      else if (n.type === 'route_issue') { icon = "map-pin"; border = "var(--danger)"; }
      else if (n.type === 'situation_report') { icon = "clipboard-list"; border = "var(--accent)"; }

      html += `
        <div class="student-list-item" style="border-left: 4px solid ${border}; cursor:default; flex-direction:column; align-items:flex-start; padding:16px 20px;">
          <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:4px; font-size:11px; color:var(--text-muted);">
            <span>${new Date(n.created_at).toLocaleString()}</span>
            ${!n.is_read ? `<button class="btn btn-secondary" style="padding:2px 6px; font-size:10px; height:20px; border-radius:4px;" onclick="markStaffNotifRead('${n.id}')">Mark Read</button>` : ''}
          </div>
          <strong style="font-size:14px; display:inline-flex; align-items:center; gap:6px; color:var(--accent);">
            <i data-lucide="${icon}" style="width:14px; height:14px;"></i> ${n.title}
          </strong>
          <p style="font-size:13px; color:var(--text-main); margin-top:6px; line-height:1.4;">${n.message}</p>
        </div>
      `;
    });
    feed.innerHTML = html;
    lucide.createIcons();
  });
}

function markStaffNotifRead(id) {
  fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
  .then(() => loadStaffNotificationsFeed());
}

function markAllStaffNotificationsAsRead() {
  fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentStaffUser.id })
  })
  .then(() => loadStaffNotificationsFeed());
}

// Global security header injection (Monkey patching fetch)
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  if (!options.headers) {
    options.headers = {};
  }
  if (currentParentUser) {
    options.headers['X-User-Role'] = 'parent';
    options.headers['X-User-Id'] = currentParentUser.id;
  }
  return originalFetch(url, options);
};

let activeParentTab = "home";
let currentParentUser = null;
let activeEventId = null;
let activeSchoolId = null;
let activeResponseSelection = null;

window.onload = function() {
  // Mobile clock update
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById("mobile-clock");
    if (clock) {
      clock.innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
  }, 1000);

  // Check login session
  const storedUser = localStorage.getItem("parentUser");
  if (storedUser) {
    currentParentUser = JSON.parse(storedUser);
    loginSuccess();
  } else {
    navigateToParentScreen("scr-parent-login");
  }

  // Periodic refresh
  setInterval(() => {
    if (currentParentUser) {
      loadParentDashboard();
      loadParentNotifications();
      if (activeParentTab === "report") {
        loadParentActiveReports();
      }
    }
  }, 5000);

  lucide.createIcons();
};

function navigateToParentScreen(screenId) {
  const screens = document.querySelectorAll(".mobile-screen");
  screens.forEach(s => s.classList.remove("active"));
  
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
  
  const navBar = document.getElementById("mobile-nav-bar");
  if (screenId === "scr-parent-login") {
    navBar.style.display = "none";
  } else {
    navBar.style.display = "flex";
  }
}

function navigateToParentTab(tabName) {
  activeParentTab = tabName;
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(t => t.classList.remove("active"));
  
  const activeTab = document.getElementById(`nav-tab-${tabName}`);
  if (activeTab) activeTab.classList.add("active");

  if (tabName === "home") {
    loadParentDashboard();
    navigateToParentScreen("scr-parent-home");
  } else if (tabName === "alerts") {
    loadParentNotifications();
    navigateToParentScreen("scr-parent-alerts");
  } else if (tabName === "report") {
    loadReportRouteOptions();
    loadParentActiveReports();
    navigateToParentScreen("scr-parent-report-road");
  } else if (tabName === "profile") {
    renderProfileScreen();
    navigateToParentScreen("scr-parent-profile");
  }

  lucide.createIcons();
}

// Authentication
function parentLogin() {
  const email = document.getElementById("parent-email").value.trim();
  const password = document.getElementById("parent-password").value.trim();

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
    if (!res.ok) throw new Error("Invalid login credentials");
    return res.json();
  })
  .then(user => {
    if (user.role !== 'parent') {
      alert("This portal is restricted to Parents. Staff must use the Staff Portal.");
      return;
    }
    currentParentUser = user;
    localStorage.setItem("parentUser", JSON.stringify(user));
    loginSuccess();
  })
  .catch(err => {
    alert(err.message);
  });
}

function loginSuccess() {
  document.getElementById("parent-greeting").innerText = `Hi, ${currentParentUser.name}`;
  navigateToParentTab("home");
}

function parentLogout() {
  localStorage.removeItem("parentUser");
  currentParentUser = null;
  navigateToParentScreen("scr-parent-login");
}

// Dashboard loader
function loadParentDashboard() {
  if (!currentParentUser) return;

  fetch(`/api/parent/dashboard?parent_user_id=${currentParentUser.id}`)
  .then(res => res.json())
  .then(children => {
    const container = document.getElementById("parent-children-container");
    if (children.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="users" style="width:36px; height:36px;"></i>
          <h4>No Children Linked</h4>
          <p>Please contact the school Class Teacher to register and link your children.</p>
        </div>
      `;
      document.getElementById("active-event-details-panel").style.display = "none";
      lucide.createIcons();
      return;
    }

    // Identify if there is an active event at any of the schools
    const firstActiveChild = children.find(c => c.active_event_id !== null);
    
    if (firstActiveChild) {
      activeEventId = firstActiveChild.active_event_id;
      activeSchoolId = firstActiveChild.school_id;
      document.getElementById("active-event-details-panel").style.display = "block";
      loadRouteAdvisoryList();
    } else {
      activeEventId = null;
      activeSchoolId = null;
      document.getElementById("active-event-details-panel").style.display = "none";
    }

    let html = "";
    children.forEach(child => {
      let statusClass = "status-supervised";
      if (child.status === "Notified") statusClass = "status-notified";
      else if (child.status === "On The Way") statusClass = "status-ontheway";
      else if (child.status === "Ready") statusClass = "status-ready";
      else if (child.status === "Picked Up") statusClass = "status-pickedup";
      else if (child.status === "Issue") statusClass = "status-issue";

      let actionButton = "";
      if (child.active_event_id && child.status !== "Picked Up") {
        const responseLabel = child.response ? "Change Response" : "Respond to School";
        actionButton = `
          <button class="auth-btn" style="padding: 8px 16px; font-size:13px; margin-top:12px; width:auto; display:inline-flex; align-items:center; gap:6px;" onclick="openResponseModal('${child.active_event_id}', '${child.school_name}')">
            <i data-lucide="message-square"></i> ${responseLabel}
          </button>
        `;
      }

      let alertBanner = "";
      if (child.event_status === 'hold') {
        alertBanner = `
          <div class="alert-banner" style="margin-top:10px; margin-bottom:0;">
            <i data-lucide="octagon-alert"></i>
            <div class="alert-banner-content">
              <h4>Pickup is Temporarily on Hold</h4>
              <p>Do NOT travel to the school. Grounds are unsafe. Your child is safe and supervised inside school buildings.</p>
            </div>
          </div>
        `;
      } else if (child.event_status === 'active') {
        alertBanner = `
          <div class="alert-banner" style="margin-top:10px; margin-bottom:0; background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3);">
            <i data-lucide="check-circle" style="color:var(--success);"></i>
            <div class="alert-banner-content">
              <h4>Pickup Activated</h4>
              <p>Please come to the school. Instructions: "${child.pickup_instruction}". Visual IC verification required at gate.</p>
            </div>
          </div>
        `;
      }

      html += `
        <div class="child-card">
          <div class="child-header">
            <div class="child-name">
              <h3>${child.student_name}</h3>
              <span>${child.class_name} • ${child.school_name}</span>
            </div>
            <span class="status-badge ${statusClass}">${child.status}</span>
          </div>
          <div class="status-desc-strip">
            <strong>Pickup Status:</strong> ${child.status_description}
          </div>
          ${child.response ? `
            <div style="font-size:12px; color:var(--text-muted); background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); padding:8px; border-radius:8px;">
              <strong>My Response:</strong> ${child.response.response_type.toUpperCase().replace(/_/g, ' ')} 
              ${child.response.selected_route_id ? `• Route Assigned` : ''} 
              ${child.response.guardian_note ? `• ${child.response.guardian_note}` : ''}
            </div>
          ` : ''}
          ${alertBanner}
          ${actionButton}
        </div>
      `;
    });
    container.innerHTML = html;
    lucide.createIcons();
  });
}

// Load recommended routes (predefined routes with DO status)
function loadRouteAdvisoryList() {
  if (!activeSchoolId) return;

  fetch(`/api/parent/routes?school_id=${activeSchoolId}`)
  .then(res => res.json())
  .then(routes => {
    const list = document.getElementById("parent-routes-advisory-list");
    if (routes.length === 0) {
      list.innerHTML = `<p style="font-size:13px; color:var(--text-muted);">No routes registered for this school.</p>`;
      return;
    }

    let html = "";
    routes.forEach(r => {
      let statusStyle = "background:rgba(16,185,129,0.1); color:var(--success);";
      if (r.current_status === "Caution") statusStyle = "background:rgba(245,158,11,0.1); color:var(--warning);";
      else if (r.current_status === "Flood Risk") statusStyle = "background:rgba(245,158,11,0.15); color:var(--warning);";
      else if (r.current_status === "Flooded" || r.current_status === "Closed") statusStyle = "background:rgba(239,68,68,0.15); color:var(--danger);";
      else if (r.current_status === "Resolved") statusStyle = "background:rgba(16,185,129,0.1); color:var(--success);";

      html += `
        <div class="route-recommendation-item">
          <div class="route-info-text">
            <h4>${r.name}</h4>
            <span>Area: ${r.area_name} • ${r.description}</span>
          </div>
          <span class="route-rec-tag" style="${statusStyle}">${r.current_status}</span>
        </div>
      `;
    });
    list.innerHTML = html;
  });
}

// Response modal handlers
function openResponseModal(eventId, schoolName) {
  activeResponseSelection = null;
  
  // Pre-fill routes dropdown
  fetch(`/api/parent/routes?school_id=${activeSchoolId}`)
  .then(res => res.json())
  .then(routes => {
    const dropdown = document.getElementById("response-select-route");
    dropdown.innerHTML = routes.map(r => `<option value="${r.id}">${r.name} (${r.current_status})</option>`).join("");
  });

  const overlay = document.getElementById("response-modal");
  overlay.style.display = "flex";
  
  // Highlight buttons reset
  const btns = document.querySelectorAll(".option-btn");
  btns.forEach(b => b.classList.remove("active"));
  
  document.getElementById("group-select-route").style.display = "none";
  document.getElementById("group-guardian-note").style.display = "none";

  lucide.createIcons();
}

function closeResponseModal() {
  document.getElementById("response-modal").style.display = "none";
}

function setResponseSelection(type) {
  activeResponseSelection = type;
  
  const btns = document.querySelectorAll(".option-btn");
  btns.forEach(b => b.classList.remove("active"));
  
  document.getElementById(`opt-${type.replace(/_/g, '-')}`).classList.add("active");

  // Show conditional blocks
  if (type === 'on_the_way') {
    document.getElementById("group-select-route").style.display = "block";
    document.getElementById("group-guardian-note").style.display = "none";
  } else if (type === 'guardian') {
    document.getElementById("group-select-route").style.display = "none";
    document.getElementById("group-guardian-note").style.display = "block";
  } else {
    document.getElementById("group-select-route").style.display = "none";
    document.getElementById("group-guardian-note").style.display = "none";
  }
}

function submitParentResponse() {
  if (!activeResponseSelection) {
    alert("Please select a response type");
    return;
  }

  const selectedRoute = document.getElementById("response-select-route").value;
  const guardianName = document.getElementById("response-guardian-name").value.trim();

  const body = {
    pickup_event_id: activeEventId,
    parent_user_id: currentParentUser.id,
    response_type: activeResponseSelection,
    selected_route_id: activeResponseSelection === 'on_the_way' ? selectedRoute : null,
    guardian_note: activeResponseSelection === 'guardian' ? guardianName : null
  };

  fetch('/api/parent/response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(data => {
    alert("Pickup response submitted successfully! Response propagated to all your children.");
    closeResponseModal();
    loadParentDashboard();
  });
}

// Report road blocks
function loadReportRouteOptions() {
  if (!currentParentUser) return;
  
  // We can query routes assigned to parent's active school routes, or all routes
  fetch('/api/do/routes')
  .then(res => res.json())
  .then(routes => {
    const select = document.getElementById("report-select-route");
    select.innerHTML = routes.map(r => `<option value="${r.id}">${r.name} (${r.current_status})</option>`).join("");
  });
}

function submitRoadBlockReport() {
  const routeId = document.getElementById("report-select-route").value;
  const desc = document.getElementById("report-issue-desc").value.trim();

  if (!desc) {
    alert("Please enter block observations or description");
    return;
  }

  if (!activeEventId) {
    alert("No active school pickup event to report road blocks against.");
    return;
  }

  fetch('/api/parent/report-route-issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_event_id: activeEventId,
      reported_by_user_id: currentParentUser.id,
      route_id: routeId,
      description: desc
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("Report filed successfully. This has been forwarded to the District Office.");
    document.getElementById("report-issue-desc").value = "";
    navigateToParentTab("home");
  });
}

// Load notifications feed
function loadParentNotifications() {
  if (!currentParentUser) return;

  fetch(`/api/notifications?user_id=${currentParentUser.id}`)
  .then(res => res.json())
  .then(notifs => {
    const badge = document.getElementById("notif-badge");
    const unread = notifs.filter(n => !n.is_read).length;
    
    if (unread > 0) {
      badge.innerText = unread;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    if (activeParentTab === "alerts") {
      const container = document.getElementById("parent-notifications-list");
      if (notifs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i data-lucide="bell-off" style="width:36px; height:36px;"></i>
            <h4>No Notifications</h4>
            <p>You will receive notices here when flood risks or pickup events affect your school.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      let html = "";
      notifs.forEach(n => {
        let borderClass = n.is_read ? "rgba(255,255,255,0.05)" : "var(--accent)";
        let iconType = "bell";
        if (n.type === 'hold_notice') iconType = "octagon-alert";
        else if (n.type === 'pickup_notice') iconType = "car";

        html += `
          <div class="child-card" style="border-left: 4px solid ${borderClass}; padding:14px 18px; margin-bottom:8px;" onclick="markNotificationRead('${n.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${new Date(n.created_at).toLocaleTimeString()}</span>
              ${!n.is_read ? `<span class="status-badge" style="background:var(--accent); color:#0F172A; font-size:8px; padding:1px 6px;">New</span>` : ''}
            </div>
            <h4 style="font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px;">
              <i data-lucide="${iconType}" style="width:14px; height:14px; color:var(--accent);"></i> ${n.title}
            </h4>
            <p style="font-size:13px; color:var(--text-muted); margin-top:4px; line-height:1.4;">${n.message}</p>
          </div>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    }
  });
}

function markNotificationRead(id) {
  fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
  .then(() => loadParentNotifications());
}

function markAllNotificationsAsRead() {
  if (!currentParentUser) return;
  fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentParentUser.id })
  })
  .then(() => loadParentNotifications());
}

// Render profile screen
function renderProfileScreen() {
  if (!currentParentUser) return;
  document.getElementById("parent-profile-name").innerText = currentParentUser.name;
  document.getElementById("profile-parent-ic").innerText = currentParentUser.ic_number;
  document.getElementById("profile-parent-phone").innerText = currentParentUser.phone;
  document.getElementById("profile-parent-email").innerText = currentParentUser.email;
  
  const initials = currentParentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  document.getElementById("parent-avatar-initials").innerText = initials;
}

// Active Reports History
function loadParentActiveReports() {
  if (!currentParentUser) return;
  fetch('/api/do/route-issues')
  .then(res => res.json())
  .then(data => {
    const reports = data.filter(issue => issue.reported_by_user_id === currentParentUser.id);
    const container = document.getElementById("parent-active-reports-container");
    if (!container) return;
    
    if (reports.length === 0) {
      container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align: center; margin-top: 12px;">No active road block reports filed by you.</p>`;
      return;
    }
    
    let html = "";
    reports.forEach(r => {
      let badgeStyle = "background:rgba(245,158,11,0.1); color:var(--warning);";
      if (r.status === "reviewed") {
        badgeStyle = "background:rgba(16,185,129,0.1); color:var(--success);";
      }
      
      html += `
        <div class="child-card" style="padding:14px; margin-bottom:8px; border-radius:8px; border:1px solid var(--border-color); background: #fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="font-size:14px; font-weight:700; margin:0; color:#1E293B;">${r.route_name}</h4>
            <span class="status-badge" style="${badgeStyle}; font-size:10px; padding:2px 8px; border-radius:4px; font-weight:600;">${r.status.toUpperCase()}</span>
          </div>
          <p style="font-size:13px; margin:4px 0; color:var(--text-muted);"><strong>Description:</strong> ${r.description}</p>
          ${r.reviewer_remarks ? `
            <div style="margin-top:8px; padding:8px; background:rgba(0,0,0,0.02); border-left:3px solid var(--primary); font-size:12px; border-radius:4px;">
              <strong>DO Remarks:</strong> ${r.reviewer_remarks} <br/>
              <span style="font-size:10px; color:var(--text-muted); display:inline-block; margin-top:2px;">Reviewed by ${r.reviewed_by}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:flex-end; margin-top:8px;">
            <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; color:#DC2626; border-color:#FCA5A5; display:inline-flex; align-items:center; gap:4px; font-weight:600; cursor:pointer;" onclick="cancelRoadBlockReport('${r.id}')">
              <i data-lucide="trash-2" style="width:12px; height:12px;"></i> Cancel Report
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
    lucide.createIcons();
  });
}

function cancelRoadBlockReport(reportId) {
  if (!confirm("Are you sure you want to cancel this road block report?")) return;
  
  fetch(`/api/parent/route-issue/${reportId}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(data => {
    alert("Report cancelled successfully.");
    loadParentActiveReports();
    loadReportRouteOptions();
  });
}

// ==========================================================================
// UMSKAL Lost & Found - Admin Portal Logic Controller
// Interacts with Express REST backend and handles audit workflows
// ==========================================================================

let activeAdminScreen = "adm-scr-dash";
let currentViewReport = null;
let currentMatchLostReportId = null;
let activeFoundSubTab = "pending";
let logsLimit = 10;

const SVG_MOCKS = {
  default: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2364748B'/><text x='50' y='55' fill='white' font-size='10' text-anchor='middle'>Photo</text></svg>"
};

window.onload = function () {
  loadSettingsFromStorage();

  const isLogged = sessionStorage.getItem("adminLogged");
  if (isLogged !== "true") {
    window.location.href = "/";
    return;
  }
  adminLoginSuccess();

  // Refresher interval (optimized to 15s to reduce server/DB load, only polls when tab is active)
  setInterval(() => {
    if (document.hidden) return; 
    if (sessionStorage.getItem("adminLogged") === "true") {
      if (activeAdminScreen === 'adm-scr-dash') renderDashboardSummary();
      else if (activeAdminScreen === 'adm-scr-found-verify') renderFoundQueue();
      else if (activeAdminScreen === 'adm-scr-lost') renderLostQueue();
      else if (activeAdminScreen === 'adm-scr-claims') renderClaimsQueue();
      else if (activeAdminScreen === 'adm-scr-records') renderLogs();
      else if (activeAdminScreen === 'adm-scr-logs') renderActivityLogs();
    }
  }, 15000);

  lucide.createIcons();
};

function adminLogin() {
  const email = document.getElementById("adm-email").value;
  const password = document.getElementById("adm-password").value;

  if (!email || !password) {
    alert("Please complete all required fields.");
    return;
  }

  if (email === "dahlan_hep@ums.edu.my" && password === "admin123") {
    sessionStorage.setItem("adminLogged", "true");
    adminLoginSuccess();
  } else {
    alert("Invalid credentials. Authorized management access only.");
  }
}

function adminLoginSuccess() {
  document.getElementById("admin-login-container").style.display = "none";
  document.getElementById("admin-main-container").style.display = "flex";
  navigateToAdminScreen('adm-scr-dash');
}

function adminLogout() {
  sessionStorage.removeItem("adminLogged");
  window.location.href = "/";
}

// ==========================================================================
// Sidebar Routing
// ==========================================================================
function navigateToAdminScreen(screenId) {
  activeAdminScreen = screenId;

  const screens = document.querySelectorAll(".admin-screen");
  screens.forEach(s => s.style.display = "none");

  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";

  // Sidebar active button indicators
  const sidebarBtns = document.querySelectorAll(".sidebar-item-btn");
  sidebarBtns.forEach(btn => btn.classList.remove("active"));

  const titleEl = document.getElementById("admin-topbar-title");
  const subtitleEl = document.getElementById("admin-topbar-subtitle");

  if (screenId === 'adm-scr-dash') {
    document.getElementById("adm-menu-dash").classList.add("active");
    titleEl.innerText = "Dashboard Overview";
    if (subtitleEl) {
      subtitleEl.innerText = "Monitor pending reports, claim reviews, verified items, and recent system activity.";
      subtitleEl.style.display = "block";
    }
    renderDashboardSummary();
  } else if (screenId === 'adm-scr-found-verify') {
    document.getElementById("adm-menu-found").classList.add("active");
    titleEl.innerText = "Found Items Management";
    if (subtitleEl) {
      subtitleEl.innerText = "Verify handovers, approve verified inventory, and update items custody.";
      subtitleEl.style.display = "block";
    }
    switchFoundSubTab(activeFoundSubTab);
  } else if (screenId === 'adm-scr-lost') {
    document.getElementById("adm-menu-lost").classList.add("active");
    titleEl.innerText = "Lost Reports";
    if (subtitleEl) {
      subtitleEl.innerText = "Manage student lost reports, search for potential database matches, and suggest matches.";
      subtitleEl.style.display = "block";
    }
    renderLostQueue();
  } else if (screenId === 'adm-scr-claims') {
    document.getElementById("adm-menu-claims").classList.add("active");
    titleEl.innerText = "Claim Requests";
    if (subtitleEl) {
      subtitleEl.innerText = "Review claim details, proof documents, and approve or reject ownership claims.";
      subtitleEl.style.display = "block";
    }
    renderClaimsQueue();
  } else if (screenId === 'adm-scr-records') {
    document.getElementById("adm-menu-records").classList.add("active");
    titleEl.innerText = "Returned Items";
    if (subtitleEl) {
      subtitleEl.innerText = "Track resolved cases, signed handovers, and successfully returned items history.";
      subtitleEl.style.display = "block";
    }
    renderLogs();
  } else if (screenId === 'adm-scr-logs') {
    document.getElementById("adm-menu-logs").classList.add("active");
    titleEl.innerText = "Notifications / Activity Logs";
    if (subtitleEl) {
      subtitleEl.innerText = "View automated logs, system audits, and recent admin notifications.";
      subtitleEl.style.display = "block";
    }
    renderActivityLogs();
  } else if (screenId === 'adm-scr-settings') {
    document.getElementById("adm-menu-settings").classList.add("active");
    titleEl.innerText = "System Settings";
    if (subtitleEl) {
      subtitleEl.innerText = "Configure lost & found policies, officer details, and campus counter settings.";
      subtitleEl.style.display = "block";
    }
    renderSettingsScreen();
  } else if (screenId === 'adm-scr-found-detail') {
    titleEl.innerText = "Found Item Verification";
    if (subtitleEl) {
      subtitleEl.innerText = "Review physical finder details and verify items custody.";
      subtitleEl.style.display = "block";
    }
  } else if (screenId === 'adm-scr-claim-detail') {
    titleEl.innerText = "Ownership Claim Review";
    if (subtitleEl) {
      subtitleEl.innerText = "Audit proof of ownership and verify details of the claimant.";
      subtitleEl.style.display = "block";
    }
  }

  lucide.createIcons();
}

function handleRowClick(event, ref) {
  // Ignore clicks on buttons/links/pills to avoid double triggering
  if (event.target.tagName === 'BUTTON' || 
      event.target.closest('button') ||
      event.target.classList.contains('activity-ref-pill') || 
      event.target.closest('.activity-ref-pill')) {
    return;
  }
  if (!ref) return;
  if (ref.startsWith("LF-")) openVerifiedItemDetail(ref);
  else if (ref.startsWith("LR-")) openLostReportDetail(ref);
  else if (ref.startsWith("CR-")) openClaimAudit(ref);
  else if (ref.startsWith("FR-")) openFoundVerify(ref);
}

// ==========================================================================
// REST Fetch Operations (Admin Side)
// ==========================================================================

// Dashboard Home
function renderDashboardSummary() {
  Promise.all([
    fetch('/api/found-reports').then(r => r.json()),
    fetch('/api/claims').then(r => r.json()),
    fetch('/api/items').then(r => r.json()),
    fetch('/api/activities').then(r => r.json())
  ]).then(([founds, claims, items, activities]) => {
    // Stat KPIs
    const pendingFounds = founds.filter(f => f.status === 'Awaiting Handover' || f.status === 'Under Review').length;
    document.getElementById("kpi-pending-found").innerText = pendingFounds;
    document.getElementById("badge-count-pending-found").innerText = pendingFounds;
    const foundText = pendingFounds === 1 ? "Requires item handover verification" : "Require item handover verification";
    document.getElementById("kpi-desc-found").innerText = foundText;

    const pendingClaims = claims.filter(c => c.status === 'Under Review').length;
    document.getElementById("kpi-pending-claims").innerText = pendingClaims;
    document.getElementById("badge-count-pending-claims").innerText = pendingClaims;
    const claimsText = pendingClaims === 1 ? "Claim waiting for review" : "Claims waiting for review";
    document.getElementById("kpi-desc-claims").innerText = claimsText;

    const activeVerified = items.filter(i => i.status === 'Available for Claim' || i.status === 'Claim Pending').length;
    document.getElementById("kpi-verified-items").innerText = activeVerified;
    const verifiedText = activeVerified === 1 ? "Item available for claim" : "Items available for claim";
    document.getElementById("kpi-desc-verified").innerText = verifiedText;

    const returnedItems = items.filter(i => i.status === 'Returned').length;
    document.getElementById("kpi-returned-items").innerText = returnedItems;
    const returnedText = returnedItems === 1 ? "Item returned to owner" : "Items returned to owners";
    document.getElementById("kpi-desc-returned").innerText = returnedText;

    // Live Feed rows
    const feed = document.getElementById("admin-dash-feed-rows");
    if (activities.length === 0) {
      feed.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No activity logged yet.</td></tr>`;
      return;
    }

    let html = "";
    activities.slice(0, 5).forEach(a => {
      // Clickable reference link/pill mapping
      let refHtml = "";
      let actionBtnHtml = "";
      if (a.ref) {
        if (a.ref.startsWith("LF-")) {
          refHtml = `<span class="activity-ref-pill" onclick="openVerifiedItemDetail('${a.ref}')">${a.ref}</span>`;
          actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openVerifiedItemDetail('${a.ref}')" style="height: 28px; font-size: 11px; padding: 0 10px;">Open</button>`;
        } else if (a.ref.startsWith("LR-")) {
          refHtml = `<span class="activity-ref-pill" onclick="openLostReportDetail('${a.ref}')">${a.ref}</span>`;
          actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openLostReportDetail('${a.ref}')" style="height: 28px; font-size: 11px; padding: 0 10px;">Open</button>`;
        } else if (a.ref.startsWith("CR-")) {
          refHtml = `<span class="activity-ref-pill" onclick="openClaimAudit('${a.ref}')">${a.ref}</span>`;
          actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openClaimAudit('${a.ref}')" style="height: 28px; font-size: 11px; padding: 0 10px;">Open</button>`;
        } else if (a.ref.startsWith("FR-")) {
          refHtml = `<span class="activity-ref-pill" onclick="openFoundVerify('${a.ref}')">${a.ref}</span>`;
          actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openFoundVerify('${a.ref}')" style="height: 28px; font-size: 11px; padding: 0 10px;">Open</button>`;
        } else {
          refHtml = `<span class="activity-ref-pill" style="cursor:default; pointer-events:none;">${a.ref}</span>`;
          actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" style="height: 28px; font-size: 11px; padding: 0 10px; opacity: 0.5;" disabled>Open</button>`;
        }
      } else {
        refHtml = `<span style="color:var(--text-muted); font-size:12px;">N/A</span>`;
        actionBtnHtml = `<button class="admin-table-action-btn admin-table-action-btn-navy-outline" style="height: 28px; font-size: 11px; padding: 0 10px; opacity: 0.5;" disabled>Open</button>`;
      }

      html += `
        <tr onclick="handleRowClick(event, '${a.ref}')" style="cursor: pointer;">
          <td style="color:var(--text-muted); font-size:12px;">${a.time}</td>
          <td>${a.text}</td>
          <td><span style="font-size:11px; font-weight:600; color:var(--primary);">${a.type}</span></td>
          <td>${refHtml}</td>
          <td style="text-align:center;">${actionBtnHtml}</td>
        </tr>
      `;
    });
    feed.innerHTML = html;
    lucide.createIcons();
  });
}

// Found verification list
// Sub-tab Navigation for Found Items Management
function switchFoundSubTab(tab) {
  activeFoundSubTab = tab;

  const btnPending = document.getElementById("tab-found-pending");
  const btnVerified = document.getElementById("tab-found-verified");
  const panelPending = document.getElementById("panel-found-pending-verify");
  const panelVerified = document.getElementById("panel-found-verified-inventory");

  if (tab === 'pending') {
    btnPending.classList.add("active");
    btnVerified.classList.remove("active");
    panelPending.style.display = "block";
    panelVerified.style.display = "none";
    renderFoundQueue();
  } else {
    btnVerified.classList.add("active");
    btnPending.classList.remove("active");
    panelVerified.style.display = "block";
    panelPending.style.display = "none";
    renderVerifiedInventory();
  }
}

// Found verification list (Pending)
function renderFoundQueue() {
  const container = document.getElementById("admin-pending-found-rows");
  const filterSearch = document.getElementById("flt-found-search").value.toLowerCase();
  const filterCat = document.getElementById("flt-found-cat").value;

  fetch('/api/found-reports')
    .then(res => res.json())
    .then(reports => {
      const pending = reports.filter(r => r.status === 'Awaiting Handover' || r.status === 'Under Review');

      document.getElementById("badge-count-pending-found").innerText = pending.length;

      const filtered = pending.filter(f => {
        const matchesSearch = filterSearch === "" || f.name.toLowerCase().includes(filterSearch);
        const matchesCat = filterCat === "" || f.category === filterCat;
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:30px;">No matching pending reports found.</td></tr>`;
        return;
      }

      let html = "";
      filtered.forEach(f => {
        html += `
          <tr>
            <td><img src="${f.image || SVG_MOCKS.default}" class="admin-photo-thumbnail"></td>
            <td><strong>${f.name}</strong></td>
            <td>${f.category}</td>
            <td>${f.location}</td>
            <td>${f.finderName}</td>
            <td>${f.date || '18 June 2026'}</td>
            <td><span class="status-badge ${f.status === 'Under Review' ? 'badge-under-review' : 'badge-awaiting-handover'}">${f.status}</span></td>
            <td>
              <button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openFoundVerify('${f.id}')">View</button>
            </td>
          </tr>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

// Verified items list (Inventory)
function renderVerifiedInventory() {
  const container = document.getElementById("admin-verified-inventory-rows");
  const filterSearch = document.getElementById("flt-verified-search").value.toLowerCase();
  const filterCat = document.getElementById("flt-verified-cat").value;

  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      const activeInventory = items.filter(i => i.status === 'Available for Claim' || i.status === 'Claim Pending');

      const filtered = activeInventory.filter(i => {
        const matchesSearch = filterSearch === "" || i.name.toLowerCase().includes(filterSearch);
        const matchesCat = filterCat === "" || i.category === filterCat;
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:30px;">No matching verified items found.</td></tr>`;
        return;
      }

      let html = "";
      filtered.forEach(i => {
        let statusClass = "badge-available-for-claim";
        if (i.status === 'Claim Pending') statusClass = "badge-claim-pending";

        html += `
          <tr>
            <td style="font-family:monospace; font-weight:600;">#${i.id}</td>
            <td><img src="${i.image || SVG_MOCKS.default}" class="admin-photo-thumbnail"></td>
            <td><strong>${i.name}</strong></td>
            <td>${i.category}</td>
            <td>${i.location}</td>
            <td>${i.date || '18 June 2026'}</td>
            <td><span class="status-badge ${statusClass}">${i.status}</span></td>
            <td>
              <button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openVerifiedItemDetail('${i.id}')">View</button>
            </td>
          </tr>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

// Verified Item Details Modal
function openVerifiedItemDetail(itemId) {
  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      document.getElementById("modal-item-ref").innerText = `#${item.id}`;
      document.getElementById("modal-item-img").src = item.image || SVG_MOCKS.default;
      document.getElementById("modal-item-name").innerText = item.name;
      document.getElementById("modal-item-cat").innerText = item.category;
      document.getElementById("modal-item-loc").innerText = item.location;
      document.getElementById("modal-item-date").innerText = `${item.date || '18 June 2026'} ${item.time || ''}`;
      document.getElementById("modal-item-desc").innerText = item.description || "No description provided.";
      document.getElementById("modal-item-log").innerText = item.verificationDetail || "No details logged.";

      let statusClass = "badge-available-for-claim";
      if (item.status === 'Claim Pending') statusClass = "badge-claim-pending";
      document.getElementById("modal-item-status").className = `status-badge ${statusClass}`;
      document.getElementById("modal-item-status").innerText = item.status;

      document.getElementById("adm-item-detail-modal").style.display = "flex";
      lucide.createIcons();
    });
}

function closeItemDetailModal() {
  document.getElementById("adm-item-detail-modal").style.display = "none";
}

// Verification form audit screen
function openFoundVerify(id) {
  fetch('/api/found-reports')
    .then(res => res.json())
    .then(reports => {
      const report = reports.find(r => r.id === id);
      if (!report) return;

      currentViewReport = report;

      document.getElementById("admin-verify-item-img").src = report.image || SVG_MOCKS.default;
      document.getElementById("admin-verify-item-name").innerText = report.name;
      document.getElementById("admin-verify-item-category").innerText = report.category;
      document.getElementById("admin-verify-item-location").innerText = report.location;
      document.getElementById("admin-verify-item-datetime").innerText = `${report.date} at ${report.time}`;
      document.getElementById("admin-verify-item-finder").innerText = report.finderName;
      document.getElementById("admin-verify-item-finder-id").innerText = report.finderMatric;
      document.getElementById("admin-verify-item-desc").innerText = report.description;
      document.getElementById("admin-verify-item-status").innerText = report.status;

      // Reset checklist
      document.getElementById("chk-intake-verify").checked = report.status === "Under Review";

      updateIntakeChecklist();
      navigateToAdminScreen('adm-scr-found-detail');
    });
}

function updateIntakeChecklist() {
  const isChecked = document.getElementById("chk-intake-verify").checked;
  const approveBtn = document.getElementById("btn-admin-approve-item");

  if (isChecked && currentViewReport.status === "Awaiting Handover") {
    currentViewReport.status = "Under Review";
    fetch(`/api/found-reports/${currentViewReport.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "Under Review" })
    });
  } else if (!isChecked && currentViewReport.status === "Under Review") {
    currentViewReport.status = "Awaiting Handover";
    fetch(`/api/found-reports/${currentViewReport.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "Awaiting Handover" })
    });
  }

  approveBtn.disabled = !isChecked;
}

function approveFoundItem() {
  if (!currentViewReport) return;

  const refNo = `LF-${Date.now().toString().slice(-4)}`;
  const verifiedItem = {
    id: refNo,
    name: currentViewReport.name,
    category: currentViewReport.category,
    location: currentViewReport.location,
    date: currentViewReport.date,
    time: currentViewReport.time,
    description: currentViewReport.description,
    image: currentViewReport.image,
    status: "Available for Claim",
    reference: refNo,
    verificationDetail: `Physical handover received. Locker shelf ref: LF-SHELF-${refNo.slice(-2)}`
  };

  fetch('/api/admin/verify-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId: currentViewReport.id,
      verifiedItem
    })
  })
    .then(() => {
      alert(`Item verified. Ref #${refNo} is now marked as Available for Claim.`);
      navigateToAdminScreen('adm-scr-found-verify');
    });
}

function rejectFoundItem() {
  if (!currentViewReport) return;
  if (!confirm("Are you sure you want to reject this report?")) return;

  fetch(`/api/found-reports/${currentViewReport.id}`, { method: 'DELETE' })
    .then(() => {
      alert("Report rejected and deleted from active queues.");
      navigateToAdminScreen('adm-scr-found-verify');
    });
}

// Lost reports screen list
function renderLostQueue() {
  const container = document.getElementById("admin-lost-reports-rows");
  const filterSearch = document.getElementById("flt-lost-search").value.toLowerCase();
  const filterCat = document.getElementById("flt-lost-cat").value;
  const filterStatus = document.getElementById("flt-lost-status").value;

  fetch('/api/lost-reports')
    .then(res => res.json())
    .then(reports => {
      const filtered = reports.filter(r => {
        if (r.status === "Returned") return false; // Exclude resolved cases

        const matchesSearch = filterSearch === "" ||
          r.name.toLowerCase().includes(filterSearch) ||
          (r.description && r.description.toLowerCase().includes(filterSearch));
        const matchesCat = filterCat === "" || r.category === filterCat;
        const matchesStatus = filterStatus === "" || r.status === filterStatus;
        return matchesSearch && matchesCat && matchesStatus;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:30px;">No matching lost reports found.</td></tr>`;
        return;
      }

      let html = "";
      filtered.forEach(r => {
        let actionCell = "";
        let badgeClass = "badge-submitted";

        if (r.status === "Submitted") {
          actionCell = `
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openLostReportDetail('${r.id}')">View</button>
              <button class="admin-table-action-btn admin-table-action-btn-navy-solid" onclick="openMatchModal('${r.id}')">Suggest Match</button>
            </div>
          `;
          badgeClass = "badge-submitted";
        } else {
          actionCell = `
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="admin-table-action-btn admin-table-action-btn-navy-outline" onclick="openLostReportDetail('${r.id}')">View</button>
            </div>
          `;

          if (r.status === "Possible Match Found") {
            badgeClass = "badge-possible-match";
          } else if (r.status === "Claim Pending") {
            badgeClass = "badge-claim-pending";
          } else if (r.status === "Ready for Collection") {
            badgeClass = "badge-ready-for-collection";
          }
        }

        html += `
          <tr>
            <td><img src="${r.image}" class="admin-photo-thumbnail"></td>
            <td><strong>${r.name}</strong></td>
            <td>${r.category}</td>
            <td>${r.location}</td>
            <td class="date-cell">${r.date}</td>
            <td>${r.time}</td>
            <td><span class="status-badge ${badgeClass}">${r.status}</span></td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.description}</td>
            <td>${actionCell}</td>
          </tr>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

function openLostReportDetail(reportId) {
  fetch('/api/lost-reports')
    .then(res => res.json())
    .then(reports => {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      document.getElementById("modal-lost-ref").innerText = `#${report.id}`;
      document.getElementById("modal-lost-img").src = report.image || SVG_MOCKS.default;
      document.getElementById("modal-lost-name").innerText = report.name;
      document.getElementById("modal-lost-cat").innerText = report.category;
      document.getElementById("modal-lost-loc").innerText = report.location;
      document.getElementById("modal-lost-datetime").innerText = `${report.date} at ${report.time}`;
      document.getElementById("modal-lost-desc").innerText = report.description || "No description provided.";

      let badgeClass = "badge-submitted";
      if (report.status === "Possible Match Found") badgeClass = "badge-possible-match";
      else if (report.status === "Claim Pending") badgeClass = "badge-claim-pending";
      else if (report.status === "Ready for Collection") badgeClass = "badge-ready-for-collection";
      else if (report.status === "Returned") badgeClass = "badge-returned";

      document.getElementById("modal-lost-status").className = `status-badge ${badgeClass}`;
      document.getElementById("modal-lost-status").innerText = report.status;

      document.getElementById("adm-lost-detail-modal").style.display = "flex";
      lucide.createIcons();
    });
}

function closeLostReportDetailModal() {
  document.getElementById("adm-lost-detail-modal").style.display = "none";
}


function openMatchModal(reportId) {
  currentMatchLostReportId = reportId;

  fetch('/api/lost-reports')
    .then(res => res.json())
    .then(reports => {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      document.getElementById("adm-match-lost-name").innerText = report.name;
      document.getElementById("adm-match-lost-details").innerText = `Category: ${report.category} • Last Seen: ${report.location}`;

      // Load verified found items of the same category and status "Available for Claim"
      fetch('/api/items')
        .then(r => r.json())
        .then(items => {
          const matchingItems = items.filter(i => i.category === report.category && i.status === "Available for Claim");
          const select = document.getElementById("adm-match-select-item");
          select.innerHTML = "";

          if (matchingItems.length === 0) {
            select.innerHTML = `<option value="" disabled selected>No verified items matching category: ${report.category}</option>`;
          } else {
            matchingItems.forEach(i => {
              select.innerHTML += `<option value="${i.id}">${i.name} (Ref: ${i.reference} - Found near ${i.location})</option>`;
            });
          }

          document.getElementById("adm-match-modal").style.display = "flex";
          lucide.createIcons();
        });
    });
}

function closeMatchModal() {
  document.getElementById("adm-match-modal").style.display = "none";
  currentMatchLostReportId = null;
}

function submitMatchSuggestion() {
  const itemId = document.getElementById("adm-match-select-item").value;
  if (!itemId) {
    alert("Please select a verified found item to suggest.");
    return;
  }

  fetch(`/api/lost-reports/${currentMatchLostReportId}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId })
  })
    .then(res => {
      if (res.ok) {
        alert("Match suggested successfully! Student has been notified.");
        closeMatchModal();
        renderLostQueue();
      } else {
        alert("Error submitting match suggestion.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error submitting match suggestion.");
    });
}

// Claims queue reviews list
function renderClaimsQueue() {
  const container = document.getElementById("admin-pending-claims-rows");
  const filterStat = document.getElementById("flt-claim-status").value;
  const filterSearch = document.getElementById("flt-claim-search").value.toLowerCase();

  fetch('/api/claims')
    .then(res => res.json())
    .then(claims => {
      let filtered;
      if (filterStat === "") {
        filtered = claims.filter(c => c.status === 'Under Review');
      } else {
        filtered = claims.filter(c => c.status === filterStat);
      }

      // Apply search filter
      if (filterSearch !== "") {
        filtered = filtered.filter(c =>
          c.studentName.toLowerCase().includes(filterSearch) ||
          c.itemName.toLowerCase().includes(filterSearch) ||
          c.studentMatric.toLowerCase().includes(filterSearch)
        );
      }

      document.getElementById("badge-count-pending-claims").innerText = claims.filter(c => c.status === 'Under Review').length;

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">No matching claims found.</td></tr>`;
        return;
      }

      let html = "";
      filtered.forEach(c => {
        let statusClass = "badge-claim-pending";
        if (c.status === 'Ready for Collection') statusClass = "badge-ready-for-collection";
        else if (c.status === 'Returned') statusClass = "badge-returned";
        else if (c.status === 'Rejected') statusClass = "badge-rejected";
        else if (c.status === 'Under Review') statusClass = "badge-under-review";

        // Style Review button with navy color class
        const reviewBtnClass = c.status === 'Under Review'
          ? 'admin-table-action-btn-navy-solid'
          : 'admin-table-action-btn-navy-outline';

        html += `
          <tr>
            <td><strong>${c.studentName}</strong></td>
            <td style="font-family:monospace;">${c.studentMatric}</td>
            <td>${c.itemName} (${c.itemRef})</td>
            <td class="date-cell">${c.lostDate || '18 June 2026'}</td>
            <td><span class="status-badge ${statusClass}">${c.status}</span></td>
            <td>
              <button class="admin-table-action-btn ${reviewBtnClass}" onclick="openClaimAudit('${c.id}')">Review</button>
            </td>
          </tr>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

// Open Claim details for verification audits
function openClaimAudit(id) {
  fetch('/api/claims')
    .then(res => res.json())
    .then(claims => {
      const claim = claims.find(c => c.id === id);
      if (!claim) return;

      currentViewReport = claim;

      Promise.all([
        fetch('/api/items').then(r => r.json())
      ]).then(([items]) => {
        const item = items.find(i => i.id === claim.itemId);

        // Populate Found item details (Left card)
        document.getElementById("admin-claim-item-thumb").src = item ? item.image : SVG_MOCKS.default;
        document.getElementById("admin-claim-item-img").src = item ? item.image : SVG_MOCKS.default;
        document.getElementById("admin-claim-item-name").innerText = claim.itemName;
        document.getElementById("admin-claim-item-ref").innerText = `Ref: #${claim.itemRef}`;
        document.getElementById("admin-verify-claim-category").innerText = item ? item.category : 'N/A';
        document.getElementById("admin-verify-claim-location").innerText = item ? item.location : 'N/A';
        document.getElementById("admin-verify-claim-date").innerText = item ? item.date : 'N/A';
        document.getElementById("admin-verify-claim-notes").innerText = item ? item.verificationDetail : 'N/A';

        // Populate claimant proof details (Right card)
        document.getElementById("admin-claim-student-name").innerText = claim.studentName;
        document.getElementById("admin-claim-student-matric").innerText = claim.studentMatric;
        document.getElementById("admin-claim-student-email").innerText = claim.studentEmail;
        document.getElementById("admin-claim-lost-where").innerText = claim.lostWhere;
        document.getElementById("admin-claim-lost-datetime").innerText = `${claim.lostDate} at ${claim.lostTime}`;
        document.getElementById("admin-claim-unique-desc").innerText = claim.uniqueDetail;
        document.getElementById("admin-claim-proof-img").src = claim.proofImage || SVG_MOCKS.default;

        // Reset inputs
        document.getElementById("admin-claim-note-input").value = claim.adminNote || "";
        document.getElementById("chk-claim-verify").checked = false;

        updateClaimChecklist();
        navigateToAdminScreen('adm-scr-claim-detail');
      });
    });
}

function updateClaimChecklist() {
  const isChecked = document.getElementById("chk-claim-verify").checked;
  const approveBtn = document.getElementById("btn-admin-approve-claim");
  approveBtn.disabled = !isChecked;
}

// Approve claim (Ready for Collection status)
function approveClaimRequest() {
  if (!currentViewReport) return;

  const note = document.getElementById("admin-claim-note-input").value;

  fetch(`/api/claims/${currentViewReport.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Ready for Collection',
      adminNote: note
    })
  })
    .then(() => {
      alert("Claim approved. Student has been notified to collect their item.");

      const simulateHandover = confirm("Confirm physical item handover now? (Log item as returned to owner)");
      if (simulateHandover) {
        logPhysicalHandover(currentViewReport.id);
      } else {
        navigateToAdminScreen('adm-scr-claims');
      }
    });
}

function logPhysicalHandover(claimId) {
  fetch(`/api/claims/${claimId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Returned' })
  })
    .then(() => {
      alert("Item returned to owner. Case closed.");
      navigateToAdminScreen('adm-scr-claims');
    });
}

// Reject claim request
function rejectClaimRequest() {
  if (!currentViewReport) return;

  const note = document.getElementById("admin-claim-note-input").value;
  if (!note) {
    alert("Please add an internal rejection note explaining the reason.");
    return;
  }

  fetch(`/api/claims/${currentViewReport.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Rejected',
      adminNote: note
    })
  })
    .then(() => {
      alert("Claim request rejected. Student has been notified.");
      navigateToAdminScreen('adm-scr-claims');
    });
}

// Render returned records logs table
function renderLogs() {
  const container = document.getElementById("admin-returned-records-rows");
  const filterSearch = document.getElementById("flt-returned-search").value.toLowerCase();
  const filterCat = document.getElementById("flt-returned-cat").value;

  Promise.all([
    fetch('/api/items').then(res => res.json()),
    fetch('/api/claims').then(res => res.json())
  ]).then(([items, claims]) => {
    const returned = items.filter(i => i.status === "Returned");

    if (returned.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No logs completed yet.</td></tr>`;
      return;
    }

    const filtered = returned.filter(v => {
      const match = claims.find(c => c.itemId === v.id);
      const owner = match ? match.studentName : "Student Claimant";
      const matric = match ? match.studentMatric : "AL23XXXX";

      const matchesSearch = filterSearch === "" ||
        v.name.toLowerCase().includes(filterSearch) ||
        owner.toLowerCase().includes(filterSearch) ||
        matric.toLowerCase().includes(filterSearch);
      const matchesCat = filterCat === "" || v.category === filterCat;

      return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No matching returned items found.</td></tr>`;
      return;
    }

    let html = "";
    filtered.forEach(v => {
      const match = claims.find(c => c.itemId === v.id);
      const owner = match ? match.studentName : "Student Claimant";
      const matric = match ? match.studentMatric : "AL23XXXX";

      html += `
        <tr>
          <td><strong>${v.name}</strong></td>
          <td>${v.category}</td>
          <td>${owner}</td>
          <td style="font-family:monospace;">${matric}</td>
          <td>${v.date}</td>
          <td>${settingsOfficer.name} (${settingsOfficer.role})</td>
          <td><span class="status-badge badge-returned">Returned</span></td>
        </tr>
      `;
    });
    container.innerHTML = html;
  });
}

function resetLogsLimitAndRender() {
  logsLimit = 10;
  renderActivityLogs();
}

function loadMoreLogs() {
  logsLimit += 10;
  renderActivityLogs();
}

function formatTimeTo12h(timeStr) {
  if (!timeStr) return "";
  const cleanTime = timeStr.trim();
  if (cleanTime.toLowerCase().includes("am") || cleanTime.toLowerCase().includes("pm")) {
    return cleanTime.toLowerCase();
  }
  const parts = cleanTime.split(":");
  if (parts.length < 2) return cleanTime;
  let hr = parseInt(parts[0]);
  const min = parts[1];
  const ampm = hr >= 12 ? "pm" : "am";
  hr = hr % 12;
  if (hr === 0) hr = 12;
  const hrStr = hr.toString().padStart(2, '0');
  return `${hrStr}:${min} ${ampm}`;
}

function getRelativeTime(timestamp) {
  if (!timestamp) return "Earlier today";
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Render activity timeline screen list
function renderActivityLogs() {
  const container = document.getElementById("admin-activity-logs-rows");
  const filterSearch = document.getElementById("flt-log-search").value.toLowerCase();
  const filterCat = document.getElementById("flt-log-cat").value;

  fetch('/api/activities')
    .then(res => res.json())
    .then(activities => {
      // Filter logs
      const filtered = activities.filter(a => {
        const matchesSearch = filterSearch === "" ||
          a.text.toLowerCase().includes(filterSearch) ||
          (a.ref && a.ref.toLowerCase().includes(filterSearch)) ||
          a.type.toLowerCase().includes(filterSearch);
        const matchesCat = filterCat === "" || a.type === filterCat;
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:40px;">No matching system activities logged.</td></tr>`;
        document.getElementById("logs-load-more-container").style.display = "none";
        return;
      }

      // Check Load More visibility
      const loadMoreContainer = document.getElementById("logs-load-more-container");
      if (filtered.length > logsLimit) {
        loadMoreContainer.style.display = "block";
      } else {
        loadMoreContainer.style.display = "none";
      }

      // Slice to limit
      const visibleLogs = filtered.slice(0, logsLimit);

      let html = "";
      visibleLogs.forEach(a => {
        // Map badge class, dot class and row class
        let typeSlug = a.type.toLowerCase().replace(/\s+/g, '-');
        let badgeClass = `activity-badge activity-badge-${typeSlug}`;
        let rowClass = `activity-row-${typeSlug}`;
        let dotClass = `timeline-dot timeline-dot-${typeSlug}`;

        // Format absolute and relative time
        const absTime = formatTimeTo12h(a.time);
        const relTime = getRelativeTime(a.timestamp);

        // Clickable reference link/pill mapping
        let refHtml = "";
        if (a.ref) {
          if (a.ref.startsWith("LF-")) {
            refHtml = `<span class="activity-ref-pill" onclick="openVerifiedItemDetail('${a.ref}')">${a.ref}</span>`;
          } else if (a.ref.startsWith("LR-")) {
            refHtml = `<span class="activity-ref-pill" onclick="openLostReportDetail('${a.ref}')">${a.ref}</span>`;
          } else if (a.ref.startsWith("CR-")) {
            refHtml = `<span class="activity-ref-pill" onclick="openClaimAudit('${a.ref}')">${a.ref}</span>`;
          } else if (a.ref.startsWith("FR-")) {
            refHtml = `<span class="activity-ref-pill" onclick="openFoundVerify('${a.ref}')">${a.ref}</span>`;
          } else {
            refHtml = `<span class="activity-ref-pill" style="cursor:default; pointer-events:none;">${a.ref}</span>`;
          }
        } else {
          refHtml = `<span style="color:var(--text-muted); font-size:12px;">N/A</span>`;
        }

        html += `
          <tr class="${rowClass}">
            <td style="padding-left:24px;">
              <div class="timeline-time-col">
                <span class="${dotClass}"></span>
                <div class="time-text-wrapper">
                  <span class="time-absolute">${absTime}</span>
                  <span class="time-relative">${relTime}</span>
                </div>
              </div>
            </td>
            <td style="color:var(--text-main); font-size:13.5px; padding:12px;">${a.text}</td>
            <td><span class="${badgeClass}">${a.type}</span></td>
            <td>${refHtml}</td>
          </tr>
        `;
      });
      container.innerHTML = html;
      lucide.createIcons();
    });
}

// Reset data
function resetDemoData() {
  if (!confirm("Are you sure you want to reset all database variables back to defaults?")) return;

  fetch('/api/reset', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      renderDashboardSummary();
      navigateToAdminScreen('adm-scr-dash');
    });
}

// ==========================================================================
// System Settings Management
// ==========================================================================

let settingsCategories = ["Matric Card", "Wallet", "Keys", "Bottle", "Electronics", "Bag", "Books", "Others"];
let settingsLocations = ["Library", "Cafeteria", "DK 3", "Block D Lab", "Campus Mosque", "Hostel", "Admin Block", "Security Office", "Others"];
let settingsCounterLocation = "Student Affairs Office, Admin Block";
let settingsCollectionInstructions = "Bring your student ID when collecting an approved item.";
let settingsOfficer = {
  name: "Haziq",
  role: "HEP Officer",
  email: "haziq_hep@ums.edu.my"
};

// Load settings from localStorage
function loadSettingsFromStorage() {
  const savedCategories = localStorage.getItem("settingsCategories");
  if (savedCategories) settingsCategories = JSON.parse(savedCategories);

  const savedLocations = localStorage.getItem("settingsLocations");
  if (savedLocations) settingsLocations = JSON.parse(savedLocations);

  const savedCounterLocation = localStorage.getItem("settingsCounterLocation");
  if (savedCounterLocation) settingsCounterLocation = savedCounterLocation;

  const savedCollectionInstructions = localStorage.getItem("settingsCollectionInstructions");
  if (savedCollectionInstructions) settingsCollectionInstructions = savedCollectionInstructions;

  const savedOfficer = localStorage.getItem("settingsOfficer");
  if (savedOfficer) settingsOfficer = JSON.parse(savedOfficer);

  // Apply officer profile to UI
  applyOfficerProfile();

  // Populate category filter dropdowns across forms
  populateCategoryFilters();
}

function applyOfficerProfile() {
  // Sidebar footer
  const sbName = document.querySelector(".admin-sidebar-footer .name");
  if (sbName) sbName.innerText = `Admin ${settingsOfficer.name}`;

  const sbRole = document.querySelector(".admin-sidebar-footer .role");
  if (sbRole) sbRole.innerText = settingsOfficer.role;

  // Topbar profile
  const tbName = document.querySelector(".admin-topbar-profile span:first-child");
  if (tbName) tbName.innerText = settingsOfficer.role;
}

function populateCategoryFilters() {
  const dropdownIds = ["flt-found-cat", "flt-verified-cat", "flt-lost-cat", "flt-returned-cat", "flt-log-cat"];
  dropdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;

    let html = `<option value="">All Categories</option>`;
    settingsCategories.forEach(cat => {
      let display = cat;
      if (cat === "Matric Card") display = "Matric Cards";
      else if (cat === "Wallet") display = "Wallets";
      else if (cat === "Keys") display = "Keys";
      else if (cat === "Bottle") display = "Bottles";
      else if (cat === "Electronics") display = "Electronics";
      else if (cat === "Bag") display = "Bags";
      else if (cat === "Books") display = "Books";

      html += `<option value="${cat}">${display}</option>`;
    });
    el.innerHTML = html;

    if (settingsCategories.includes(currentVal)) {
      el.value = currentVal;
    }
  });
}

function renderSettingsScreen() {
  // Populate text inputs
  document.getElementById("set-counter-loc").value = settingsCounterLocation;
  document.getElementById("set-counter-instructions").value = settingsCollectionInstructions;
  document.getElementById("set-officer-name").value = settingsOfficer.name;
  document.getElementById("set-officer-role").value = settingsOfficer.role;
  document.getElementById("set-officer-email").value = settingsOfficer.email;

  // Render categories list
  const catList = document.getElementById("settings-categories-list");
  let catHtml = "";
  settingsCategories.forEach(cat => {
    catHtml += `
      <div class="settings-tag" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: #F1F5F9; border: 1px solid var(--border-color); border-radius: 20px; font-size: 13px; font-weight: 500; color: var(--text-main);">
        <span>${cat}</span>
        <span onclick="removeSettingCategory('${cat}')" style="cursor: pointer; color: var(--info); font-weight: 700; font-size: 14px; padding-left: 2px; line-height: 1;">&times;</span>
      </div>
    `;
  });
  catList.innerHTML = catHtml || `<span style="font-size:12px; color:var(--text-muted); font-style:italic;">No categories active.</span>`;

  // Render locations list
  const locList = document.getElementById("settings-locations-list");
  let locHtml = "";
  settingsLocations.forEach(loc => {
    locHtml += `
      <div class="settings-tag" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: #F1F5F9; border: 1px solid var(--border-color); border-radius: 20px; font-size: 13px; font-weight: 500; color: var(--text-main);">
        <span>${loc}</span>
        <span onclick="removeSettingLocation('${loc}')" style="cursor: pointer; color: var(--info); font-weight: 700; font-size: 14px; padding-left: 2px; line-height: 1;">&times;</span>
      </div>
    `;
  });
  locList.innerHTML = locHtml || `<span style="font-size:12px; color:var(--text-muted); font-style:italic;">No locations active.</span>`;

  lucide.createIcons();
}

function addSettingCategory() {
  const input = document.getElementById("set-new-category");
  const value = input.value.trim();
  if (!value) return;

  if (settingsCategories.includes(value)) {
    alert("Category already exists.");
    return;
  }

  settingsCategories.push(value);
  input.value = "";
  renderSettingsScreen();
}

function removeSettingCategory(cat) {
  settingsCategories = settingsCategories.filter(c => c !== cat);
  renderSettingsScreen();
}

function addSettingLocation() {
  const input = document.getElementById("set-new-location");
  const value = input.value.trim();
  if (!value) return;

  if (settingsLocations.includes(value)) {
    alert("Location already exists.");
    return;
  }

  settingsLocations.push(value);
  input.value = "";
  renderSettingsScreen();
}

function removeSettingLocation(loc) {
  settingsLocations = settingsLocations.filter(l => l !== loc);
  renderSettingsScreen();
}

function saveSystemSettings() {
  settingsCounterLocation = document.getElementById("set-counter-loc").value.trim();
  settingsCollectionInstructions = document.getElementById("set-counter-instructions").value.trim();
  settingsOfficer.name = document.getElementById("set-officer-name").value.trim();
  settingsOfficer.role = document.getElementById("set-officer-role").value.trim();
  settingsOfficer.email = document.getElementById("set-officer-email").value.trim();

  // Save to localStorage
  localStorage.setItem("settingsCategories", JSON.stringify(settingsCategories));
  localStorage.setItem("settingsLocations", JSON.stringify(settingsLocations));
  localStorage.setItem("settingsCounterLocation", settingsCounterLocation);
  localStorage.setItem("settingsCollectionInstructions", settingsCollectionInstructions);
  localStorage.setItem("settingsOfficer", JSON.stringify(settingsOfficer));

  // Sync to UI
  applyOfficerProfile();
  populateCategoryFilters();

  alert("Settings changes saved successfully.");
}

// Lightbox modal functions
function openImageLightbox(src) {
  if (!src) return;
  const modal = document.getElementById("image-lightbox-modal");
  const img = document.getElementById("lightbox-modal-img");
  img.src = src;
  modal.style.display = "flex";
  lucide.createIcons();
}

function closeLightboxModal() {
  document.getElementById("image-lightbox-modal").style.display = "none";
}

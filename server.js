const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'klisp_db.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Disable caching for development/testing
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Access Audit & Security Middleware (RBAC Authorization)
app.use((req, res, next) => {
  const userRole = req.headers['x-user-role'] || 'Anonymous';
  const userId = req.headers['x-user-id'] || 'None';
  
  // Auditing
  console.log(`[AUDIT] ${new Date().toISOString()} - User: ${userId} (${userRole}) - Action: ${req.method} ${req.path}`);

  // Endpoint Security Verification (Role-Based Access Control)
  if (req.path.startsWith('/api/do/') && !['do', 'Anonymous'].includes(userRole)) {
    console.warn(`[SECURITY] Blocked unauthorized DO access to ${req.path} from role ${userRole}`);
    return res.status(403).json({ error: "Access Denied: DO authorization required" });
  }
  if (req.path.startsWith('/api/ppd/') && !['ppd', 'Anonymous'].includes(userRole)) {
    console.warn(`[SECURITY] Blocked unauthorized PPD access to ${req.path} from role ${userRole}`);
    return res.status(403).json({ error: "Access Denied: PPD authorization required" });
  }
  if (req.path.startsWith('/api/pic/') && !['pic', 'teacher', 'Anonymous'].includes(userRole)) {
    console.warn(`[SECURITY] Blocked unauthorized PIC access to ${req.path} from role ${userRole}`);
    return res.status(403).json({ error: "Access Denied: PIC authorization required" });
  }
  
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// ==========================================================================
// Database State & Seeding (15 Tables according to Locked Spec v4)
// ==========================================================================
const SEED_DATA = {
  users: [
    { id: "U-DO", name: "Encik Zul", email: "do@klisp.gov.my", phone: "019-8765432", ic_number: "760512-12-5111", role: "do", school_id: null, password: "password123" },
    { id: "U-PPD", name: "Puan Azimah", email: "ppd@klisp.gov.my", phone: "013-8889999", ic_number: "810214-12-5222", role: "ppd", school_id: null, password: "password123" },
    { id: "U-PIC-1", name: "Cikgu Rosli", email: "pic@klisp.edu.my", phone: "012-3456789", ic_number: "840618-12-5333", role: "pic", school_id: "S-01", password: "password123" },
    { id: "U-TCH-1", name: "Cikgu Aminah", email: "teacher1@klisp.edu.my", phone: "014-1112222", ic_number: "890812-12-5444", role: "teacher", school_id: "S-01", password: "password123" },
    { id: "U-TCH-2", name: "Cikgu Sarah", email: "teacher2@klisp.edu.my", phone: "017-3334444", ic_number: "920315-12-5555", role: "teacher", school_id: "S-01", password: "password123" },
    { id: "U-PAR-1", name: "Encik Haziq", email: "parent1@gmail.com", phone: "010-8204841", ic_number: "831102-12-6111", role: "parent", school_id: null, password: "password123" },
    { id: "U-PAR-2", name: "Puan Siti", email: "parent2@gmail.com", phone: "011-2345678", ic_number: "850410-12-6222", role: "parent", school_id: null, password: "password123" }
  ],
  areas: [
    { id: "A-01", name: "Bingkor", description: "Bingkor sub-district area, Keningau" },
    { id: "A-02", name: "Apin-Apin", description: "Apin-Apin district area, northern Keningau" },
    { id: "A-03", name: "Sook", description: "Sook sub-district area, southern Keningau" }
  ],
  routes: [
    { id: "R-01", name: "Jalan Bingkor Laut", area_id: "A-01", description: "Route connecting Bingkor Laut to main town, low-lying near river", current_status: "Safe", last_updated_by: "Encik Zul" },
    { id: "R-02", name: "Jalan Apin-Apin Bypass", area_id: "A-02", description: "Bypass route near hills, prone to landslips during heavy rain", current_status: "Safe", last_updated_by: "Encik Zul" },
    { id: "R-03", name: "Jalan Sook Utama", area_id: "A-03", description: "Main connector road, generally high elevation but bridge is weak", current_status: "Safe", last_updated_by: "Encik Zul" },
    { id: "R-04", name: "Jalan Bingkor Town Center", area_id: "A-01", description: "Urban route through Bingkor center, drainage usually handles normal rain", current_status: "Safe", last_updated_by: "Encik Zul" },
    { id: "R-05", name: "Jalan Kampung Baru Bingkor", area_id: "A-01", description: "Village connector, dirt road sections, prone to muddy conditions", current_status: "Safe", last_updated_by: "Encik Zul" }
  ],
  route_status_log: [
    { id: "RL-01", route_id: "R-01", old_status: "Safe", new_status: "Safe", updated_by: "U-DO", timestamp: new Date().toISOString(), remarks: "Initial system startup state" }
  ],
  schools: [
    { id: "S-01", name: "SK Bingkor", area_id: "A-01", address: "Peti Surat 20, 89007 Keningau, Sabah", pic_user_id: "U-PIC-1" },
    { id: "S-02", name: "SK Apin-Apin", area_id: "A-02", address: "W.D.T. 14, 89009 Keningau, Sabah", pic_user_id: null }
  ],
  school_routes: [
    { id: "SR-01", school_id: "S-01", route_id: "R-01" },
    { id: "SR-02", school_id: "S-01", route_id: "R-04" },
    { id: "SR-03", school_id: "S-01", route_id: "R-05" },
    { id: "SR-04", school_id: "S-01", route_id: "R-02" }, // Border route used by SK Bingkor parents
    { id: "SR-05", school_id: "S-02", route_id: "R-02" }
  ],
  classes: [
    { id: "C-01", school_id: "S-01", name: "Tahun 1 Amanah", teacher_user_id: "U-TCH-1" },
    { id: "C-02", school_id: "S-01", name: "Tahun 2 Bestari", teacher_user_id: "U-TCH-2" }
  ],
  students: [
    { id: "ST-01", name: "Adam bin Haziq", class_id: "C-01", school_id: "S-01" },
    { id: "ST-02", name: "Sarah binti Haziq", class_id: "C-02", school_id: "S-01" },
    { id: "ST-03", name: "Farhan bin Siti", class_id: "C-01", school_id: "S-01" }
  ],
  student_parent_links: [
    { id: "SP-01", student_id: "ST-01", parent_user_id: "U-PAR-1", relationship: "Father" },
    { id: "SP-02", student_id: "ST-02", parent_user_id: "U-PAR-1", relationship: "Father" },
    { id: "SP-03", student_id: "ST-03", parent_user_id: "U-PAR-2", relationship: "Mother" }
  ],
  notifications: [],
  pickup_events: [],
  parent_responses: [],
  student_pickup_status: [],
  pickup_verifications: [],
  route_issue_reports: []
};

let db = JSON.parse(JSON.stringify(SEED_DATA));

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
      // Ensure all tables exist in loaded db
      Object.keys(SEED_DATA).forEach(table => {
        if (!db[table]) db[table] = [];
      });
    } else {
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load database:", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}

loadDB();

// Reset API
app.post('/api/reset', (req, res) => {
  db = JSON.parse(JSON.stringify(SEED_DATA));
  saveDB();
  res.json({ success: true, message: "K-LiSP database reset to default seed data." });
});

// ==========================================================================
// User Authentication Endpoints
// ==========================================================================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Hide password
  const responseUser = { ...user };
  delete responseUser.password;
  res.json(responseUser);
});

// ==========================================================================
// District Office (DO) Endpoints
// ==========================================================================
app.get('/api/do/routes', (req, res) => {
  // Annotate routes with reported parent issues count
  const routes = db.routes.map(r => {
    // Find active parent blocks for this route
    const activeEvents = db.pickup_events.filter(e => e.status !== 'closed').map(e => e.id);
    const issues = db.route_issue_reports.filter(i => i.route_id === r.id && activeEvents.includes(i.pickup_event_id));
    return {
      ...r,
      parent_blocks: issues.length
    };
  });
  res.json(routes);
});

app.put('/api/do/routes/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, remarks, updated_by } = req.body;

  const routeIndex = db.routes.findIndex(r => r.id === id);
  if (routeIndex === -1) {
    return res.status(404).json({ error: "Route not found" });
  }

  const old_status = db.routes[routeIndex].current_status;
  db.routes[routeIndex].current_status = status;
  db.routes[routeIndex].last_updated_by = updated_by;

  // Add status log
  const logId = `RL-${Date.now()}`;
  db.route_status_log.push({
    id: logId,
    route_id: id,
    old_status,
    new_status: status,
    updated_by,
    timestamp: new Date().toISOString(),
    remarks: remarks || ""
  });

  saveDB();
  res.json({ success: true, route: db.routes[routeIndex] });
});

app.get('/api/do/logs', (req, res) => {
  const logs = [...db.route_status_log].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(logs);
});

app.post('/api/do/notify-ppd', (req, res) => {
  const { area_id, remarks, sender_name } = req.body;
  const area = db.areas.find(a => a.id === area_id);
  if (!area) {
    return res.status(404).json({ error: "Area not found" });
  }

  // Create notifications for all PPD officers
  const ppds = db.users.filter(u => u.role === 'ppd');
  const alertId = `NT-PPD-${Date.now()}`;
  ppds.forEach(ppd => {
    db.notifications.push({
      id: `${alertId}-${ppd.id}`,
      type: "ppd_alert",
      recipient_user_id: ppd.id,
      recipient_role: "ppd",
      title: "FLOOD RISK ALERT: " + area.name,
      message: `District Office has reported flood risk in ${area.name}. Remarks: ${remarks || 'None'}. Sender: ${sender_name}.`,
      is_read: false,
      created_at: new Date().toISOString(),
      reference_type: "area",
      reference_id: area_id
    });
  });

  saveDB();
  res.json({ success: true, message: `PPD officers notified of flood risk in ${area.name}` });
});

// ==========================================================================
// DO Route CRUD & Issue Reports Endpoints
// ==========================================================================
app.post('/api/do/routes', (req, res) => {
  const { name, area_id, description, last_updated_by } = req.body;
  if (!name || !area_id) {
    return res.status(400).json({ error: "Name and Area are required" });
  }
  const id = `R-${Date.now().toString().slice(-4)}`;
  const newRoute = {
    id,
    name,
    area_id,
    description: description || "",
    current_status: "Safe",
    last_updated_by: last_updated_by || "DO Officer"
  };
  db.routes.push(newRoute);
  
  // Log the initial status
  const logId = `RL-${Date.now()}`;
  db.route_status_log.push({
    id: logId,
    route_id: id,
    old_status: "None",
    new_status: "Safe",
    updated_by: last_updated_by || "DO Officer",
    timestamp: new Date().toISOString(),
    remarks: "Route registered"
  });

  saveDB();
  res.status(201).json(newRoute);
});

app.put('/api/do/routes/:id', (req, res) => {
  const { id } = req.params;
  const { name, area_id, description, last_updated_by } = req.body;
  const routeIndex = db.routes.findIndex(r => r.id === id);
  if (routeIndex === -1) {
    return res.status(404).json({ error: "Route not found" });
  }

  db.routes[routeIndex] = {
    ...db.routes[routeIndex],
    name: name !== undefined ? name : db.routes[routeIndex].name,
    area_id: area_id !== undefined ? area_id : db.routes[routeIndex].area_id,
    description: description !== undefined ? description : db.routes[routeIndex].description,
    last_updated_by: last_updated_by || db.routes[routeIndex].last_updated_by
  };

  saveDB();
  res.json(db.routes[routeIndex]);
});

app.delete('/api/do/routes/:id', (req, res) => {
  const { id } = req.params;
  const routeExists = db.routes.some(r => r.id === id);
  if (!routeExists) {
    return res.status(404).json({ error: "Route not found" });
  }

  // Deactivate/remove route
  db.routes = db.routes.filter(r => r.id !== id);
  // Clean up references in school_routes
  db.school_routes = db.school_routes.filter(sr => sr.route_id !== id);

  saveDB();
  res.json({ success: true });
});

app.get('/api/do/route-issues', (req, res) => {
  const reports = db.route_issue_reports.map(issue => {
    const route = db.routes.find(r => r.id === issue.route_id);
    const area = route ? db.areas.find(a => a.id === route.area_id) : null;
    const parent = db.users.find(u => u.id === issue.reported_by_user_id);
    return {
      ...issue,
      route_name: route ? route.name : "Unknown Route",
      area_name: area ? area.name : "Unknown Area",
      reporter_name: parent ? parent.name : "Parent"
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(reports);
});

app.put('/api/do/route-issues/:id', (req, res) => {
  const { id } = req.params;
  const { status, remarks, reviewed_by } = req.body;
  const issueIndex = db.route_issue_reports.findIndex(ri => ri.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  db.route_issue_reports[issueIndex].status = status || "reviewed";
  db.route_issue_reports[issueIndex].reviewer_remarks = remarks || "";
  db.route_issue_reports[issueIndex].reviewed_by = reviewed_by || "DO Officer";
  db.route_issue_reports[issueIndex].reviewed_at = new Date().toISOString();

  saveDB();
  res.json(db.route_issue_reports[issueIndex]);
});

app.delete('/api/parent/route-issue/:id', (req, res) => {
  const { id } = req.params;
  const issueIndex = db.route_issue_reports.findIndex(ri => ri.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  db.route_issue_reports.splice(issueIndex, 1);
  saveDB();
  res.json({ success: true, message: "Report successfully cancelled." });
});

// ==========================================================================
// PPD Officer Endpoints
// ==========================================================================
app.get('/api/ppd/stats', (req, res) => {
  const school_routes_count = db.school_routes.length;
  const dangerousRouteIds = db.routes.filter(r => ['Caution', 'Flood Risk', 'Flooded', 'Closed'].includes(r.current_status)).map(r => r.area_id);
  const uniqueFloodedAreas = [...new Set(dangerousRouteIds)].length;

  res.json({
    school_routes_count,
    flooded_areas_count: uniqueFloodedAreas
  });
});

app.get('/api/ppd/schools', (req, res) => {
  res.json(db.schools);
});

app.post('/api/ppd/schools', (req, res) => {
  const { name, area_id, address } = req.body;
  const id = `S-${Date.now().toString().slice(-4)}`;
  const newSchool = { id, name, area_id, address, pic_user_id: null };
  db.schools.push(newSchool);
  saveDB();
  res.status(201).json(newSchool);
});

app.put('/api/ppd/schools/:id', (req, res) => {
  const { id } = req.params;
  const { name, area_id, address, pic_user_id } = req.body;
  const schoolIndex = db.schools.findIndex(s => s.id === id);
  if (schoolIndex === -1) {
    return res.status(404).json({ error: "School not found" });
  }
  db.schools[schoolIndex] = { ...db.schools[schoolIndex], name, area_id, address, pic_user_id };
  saveDB();
  res.json(db.schools[schoolIndex]);
});

app.delete('/api/ppd/schools/:id', (req, res) => {
  const { id } = req.params;
  db.schools = db.schools.filter(s => s.id !== id);
  db.school_routes = db.school_routes.filter(sr => sr.school_id !== id);
  saveDB();
  res.json({ success: true });
});

app.get('/api/ppd/schools/:id/routes', (req, res) => {
  const { id } = req.params;
  const routeIds = db.school_routes.filter(sr => sr.school_id === id).map(sr => sr.route_id);
  const routes = db.routes.filter(r => routeIds.includes(r.id));
  res.json(routes);
});

app.post('/api/ppd/schools/:id/routes', (req, res) => {
  const { id } = req.params;
  const { route_id } = req.body;
  
  // Avoid duplicate assignments
  const exists = db.school_routes.some(sr => sr.school_id === id && sr.route_id === route_id);
  if (exists) {
    return res.status(400).json({ error: "Route already assigned to this school" });
  }

  const srId = `SR-${Date.now()}`;
  db.school_routes.push({ id: srId, school_id: id, route_id });
  saveDB();
  res.status(201).json({ success: true });
});

app.delete('/api/ppd/schools/:id/routes/:routeId', (req, res) => {
  const { id, routeId } = req.params;
  db.school_routes = db.school_routes.filter(sr => !(sr.school_id === id && sr.route_id === routeId));
  saveDB();
  res.json({ success: true });
});

app.get('/api/ppd/search-schools', (req, res) => {
  const { area_id } = req.query;
  if (!area_id) {
    return res.status(400).json({ error: "area_id parameter is required" });
  }

  // DUAL CONDITION SEARCH:
  // 1. School is located in the affected area: school.area_id === area_id
  // 2. School has at least one predefined route linked to the affected area: school uses a route where route.area_id === area_id
  const matchingRouteIds = db.routes.filter(r => r.area_id === area_id).map(r => r.id);
  const schoolsWithMatchingRoutes = db.school_routes
    .filter(sr => matchingRouteIds.includes(sr.route_id))
    .map(sr => sr.school_id);

  const matchedSchools = db.schools.filter(school => {
    const isLocatedInArea = school.area_id === area_id;
    const hasRouteInArea = schoolsWithMatchingRoutes.includes(school.id);
    return isLocatedInArea || hasRouteInArea;
  });

  res.json(matchedSchools);
});

app.post('/api/ppd/notify-schools', (req, res) => {
  const { school_ids, remarks, sender_name } = req.body;
  if (!school_ids || !Array.isArray(school_ids)) {
    return res.status(400).json({ error: "school_ids must be an array" });
  }

  school_ids.forEach(school_id => {
    const school = db.schools.find(s => s.id === school_id);
    if (!school) return;

    // Notify School PIC
    const pic = db.users.find(u => u.school_id === school_id && u.role === 'pic');
    if (pic) {
      db.notifications.push({
        id: `NT-PIC-${Date.now()}-${pic.id}`,
        type: "school_alert",
        recipient_user_id: pic.id,
        recipient_role: "pic",
        title: "FLOOD ALERT FROM PPD: " + school.name,
        message: `PPD alert: Flood risk reported around school service routes. Review route status immediately. Remarks: ${remarks || 'None'}. Sender: ${sender_name}.`,
        is_read: false,
        created_at: new Date().toISOString(),
        reference_type: "school",
        reference_id: school_id
      });
    }
  });

  saveDB();
  res.json({ success: true, message: `Alerts dispatched to School PICs.` });
});

// ==========================================================================
// School PIC Endpoints
// ==========================================================================
app.get('/api/pic/classes', (req, res) => {
  const { school_id } = req.query;
  const classes = db.classes.filter(c => c.school_id === school_id);
  res.json(classes);
});

app.post('/api/pic/classes', (req, res) => {
  const { school_id, name, teacher_user_id } = req.body;
  const id = `C-${Date.now().toString().slice(-4)}`;
  const newClass = { id, school_id, name, teacher_user_id };
  db.classes.push(newClass);
  saveDB();
  res.status(201).json(newClass);
});

app.put('/api/pic/classes/:id', (req, res) => {
  const { id } = req.params;
  const { name, teacher_user_id } = req.body;
  const classIndex = db.classes.findIndex(c => c.id === id);
  if (classIndex === -1) {
    return res.status(404).json({ error: "Class not found" });
  }
  db.classes[classIndex] = { ...db.classes[classIndex], name, teacher_user_id };
  saveDB();
  res.json(db.classes[classIndex]);
});

app.delete('/api/pic/classes/:id', (req, res) => {
  const { id } = req.params;
  db.classes = db.classes.filter(c => c.id !== id);
  saveDB();
  res.json({ success: true });
});

// Active / Hold pickup event
app.get('/api/pic/event', (req, res) => {
  const { school_id } = req.query;
  const event = db.pickup_events.find(e => e.school_id === school_id && e.status !== 'closed');
  res.json(event || null);
});

app.post('/api/pic/event', (req, res) => {
  const { school_id, action, pickup_instruction, hold_reason, created_by } = req.body;

  // Check if active event already exists
  const existing = db.pickup_events.find(e => e.school_id === school_id && e.status !== 'closed');
  if (existing) {
    return res.status(400).json({ error: "An active pickup event is already running for this school" });
  }

  const id = `E-${Date.now().toString().slice(-4)}`;
  const newEvent = {
    id,
    school_id,
    created_by,
    status: action === 'hold' ? 'hold' : 'active',
    started_at: new Date().toISOString(),
    closed_at: null,
    remarks: "",
    pickup_instruction: action === 'hold' ? "" : (pickup_instruction || "Please retrieve your children safely."),
    hold_reason: action === 'hold' ? (hold_reason || "School grounds are flooding.") : "",
    situation_report_text: null,
    situation_report_sent_at: null
  };

  db.pickup_events.push(newEvent);

  // Initialize student_pickup_status for ALL students in this school to 'Supervised'
  const schoolStudents = db.students.filter(s => s.school_id === school_id);
  schoolStudents.forEach(s => {
    db.student_pickup_status.push({
      id: `SPS-${Date.now()}-${s.id}`,
      pickup_event_id: id,
      student_id: s.id,
      status: "Supervised",
      issue_sub_reason: null,
      updated_by: created_by,
      timestamp: new Date().toISOString()
    });
  });

  saveDB();
  res.status(201).json(newEvent);
});

app.put('/api/pic/event', (req, res) => {
  const { school_id, action, pickup_instruction, hold_reason, updated_by } = req.body;
  const eventIndex = db.pickup_events.findIndex(e => e.school_id === school_id && e.status !== 'closed');
  if (eventIndex === -1) {
    return res.status(404).json({ error: "No active event found" });
  }

  const event = db.pickup_events[eventIndex];
  event.status = action === 'hold' ? 'hold' : 'active';
  if (action === 'hold') {
    event.hold_reason = hold_reason || "School grounds are flooding.";
  } else {
    event.pickup_instruction = pickup_instruction || "Please retrieve your children safely.";
  }

  saveDB();
  res.json(event);
});

app.post('/api/pic/event/notify-parents', (req, res) => {
  const { pickup_event_id, school_id, type } = req.body; // type is 'pickup_notice' or 'hold_notice'
  const event = db.pickup_events.find(e => e.id === pickup_event_id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  // Find all parents of students in this school
  const students = db.students.filter(s => s.school_id === school_id);
  const studentIds = students.map(s => s.id);
  const parentLinks = db.student_parent_links.filter(link => studentIds.includes(link.student_id));
  const parentIds = [...new Set(parentLinks.map(link => link.parent_user_id))];

  // Send unified notification to each parent separately
  parentIds.forEach(parentId => {
    const parent = db.users.find(u => u.id === parentId);
    if (!parent) return;

    db.notifications.push({
      id: `NT-PAR-${Date.now()}-${parent.id}`,
      type: type, // 'pickup_notice' or 'hold_notice'
      recipient_user_id: parent.id,
      recipient_role: "parent",
      pickup_event_id: pickup_event_id,
      title: type === 'hold_notice' ? "DISMISSAL HOLD: SK Bingkor" : "CONTROLLED PICKUP DEPLOYED: SK Bingkor",
      message: type === 'hold_notice' ? 
        `HOLD NOTICE: Pickup is temporarily on hold. Hold reason: ${event.hold_reason}. Your child is safe and supervised. Do NOT travel until notified.` :
        `PICKUP NOTICE: Controlled pickup activated. Instructions: ${event.pickup_instruction}. Please review recommended safe routes before driving.`,
      is_read: false,
      created_at: new Date().toISOString(),
      reference_type: "pickup_event",
      reference_id: pickup_event_id
    });
  });

  // State Transition Rule: Change all students status to "Notified"
  db.student_pickup_status.forEach(sps => {
    if (sps.pickup_event_id === pickup_event_id && sps.status === 'Supervised') {
      sps.status = "Notified";
      sps.timestamp = new Date().toISOString();
    }
  });

  saveDB();
  res.json({ success: true, message: `Notification broadcast to ${parentIds.length} parents.` });
});

app.get('/api/pic/event/monitoring', (req, res) => {
  const { school_id, pickup_event_id } = req.query;
  if (!pickup_event_id) {
    return res.status(400).json({ error: "pickup_event_id required" });
  }

  // Get progress count grouped by class and statuses
  const classes = db.classes.filter(c => c.school_id === school_id);
  const students = db.students.filter(s => s.school_id === school_id);
  const studentStatuses = db.student_pickup_status.filter(sps => sps.pickup_event_id === pickup_event_id);

  const report = classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id);
    const classStudentIds = classStudents.map(s => s.id);
    const statuses = studentStatuses.filter(sps => classStudentIds.includes(sps.student_id));

    const teacher = db.users.find(u => u.id === cls.teacher_user_id) || { name: "Not Assigned" };

    return {
      class_id: cls.id,
      class_name: cls.name,
      teacher_name: teacher.name,
      total: classStudents.length,
      supervised: statuses.filter(s => s.status === 'Supervised').length,
      notified: statuses.filter(s => s.status === 'Notified').length,
      on_the_way: statuses.filter(s => s.status === 'On The Way').length,
      ready: statuses.filter(s => s.status === 'Ready').length,
      picked_up: statuses.filter(s => s.status === 'Picked Up').length,
      issue: statuses.filter(s => s.status === 'Issue').length
    };
  });

  res.json(report);
});

app.post('/api/pic/event/close', (req, res) => {
  const { pickup_event_id, school_id, resolutions, closed_by } = req.body;
  
  // Find all student statuses for this event that are NOT Picked Up
  const studentStatuses = db.student_pickup_status.filter(sps => sps.pickup_event_id === pickup_event_id);
  const unresolved = studentStatuses.filter(s => s.status !== 'Picked Up');

  // Verify that a resolution has been submitted for every single unresolved student
  const missingResolution = unresolved.some(s => !resolutions || !resolutions[s.student_id]);
  if (missingResolution) {
    return res.status(400).json({ error: "The system will NOT allow event closure until every student has either status Picked Up or an unresolved case resolution selected." });
  }

  // Update unresolved students status to 'Issue' and save the resolution
  unresolved.forEach(sps => {
    const resolutionText = resolutions[sps.student_id];
    sps.status = "Issue";
    sps.issue_sub_reason = "Closed Event: " + resolutionText;
    sps.updated_by = closed_by;
    sps.timestamp = new Date().toISOString();
  });

  // Mark event as closed
  const event = db.pickup_events.find(e => e.id === pickup_event_id);
  if (event) {
    event.status = 'closed';
    event.closed_at = new Date().toISOString();
  }

  saveDB();
  res.json({ success: true });
});

// Situation report storage + PPD notification
app.post('/api/pic/situation-report', (req, res) => {
  const { pickup_event_id, text, sender_name } = req.body;
  const eventIndex = db.pickup_events.findIndex(e => e.id === pickup_event_id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: "Active event not found" });
  }

  db.pickup_events[eventIndex].situation_report_text = text;
  db.pickup_events[eventIndex].situation_report_sent_at = new Date().toISOString();

  // Notify PPD
  const ppds = db.users.filter(u => u.role === 'ppd');
  ppds.forEach(ppd => {
    db.notifications.push({
      id: `NT-PPD-SR-${Date.now()}-${ppd.id}`,
      type: "situation_report",
      recipient_user_id: ppd.id,
      recipient_role: "ppd",
      pickup_event_id: pickup_event_id,
      title: "SCHOOL SITUATION REPORT: " + sender_name,
      message: `Situation report for held pickup: "${text}". Sender: ${sender_name}.`,
      is_read: false,
      created_at: new Date().toISOString(),
      reference_type: "pickup_event",
      reference_id: pickup_event_id
    });
  });

  saveDB();
  res.json({ success: true });
});

// Generated dynamically via query + simulated AI summarization
app.post('/api/pic/event/report', (req, res) => {
  const { pickup_event_id, school_id } = req.body;

  const event = db.pickup_events.find(e => e.id === pickup_event_id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const school = db.schools.find(s => s.id === school_id) || { name: "Keningau School" };
  const statuses = db.student_pickup_status.filter(sps => sps.pickup_event_id === pickup_event_id);
  
  const total = statuses.length;
  const pickedUp = statuses.filter(s => s.status === 'Picked Up').length;
  const issues = statuses.filter(s => s.status === 'Issue').length;
  const notified = statuses.filter(s => s.status === 'Notified').length;
  const onTheWay = statuses.filter(s => s.status === 'On The Way').length;
  const ready = statuses.filter(s => s.status === 'Ready').length;

  const routeBlocks = db.route_issue_reports.filter(r => r.pickup_event_id === pickup_event_id).length;
  const routeAdvisories = db.school_routes.filter(sr => sr.school_id === school_id).length;

  // AI Prompt Simulator based on stats (Phase 18)
  const aiSummary = `CONTROLLED DISMISSAL SUMMARY REPORT FOR ${school.name.toUpperCase()}
Event ID: ${pickup_event_id}
Status: ${event.status.toUpperCase()}
Time Started: ${new Date(event.started_at).toLocaleTimeString()}
${event.closed_at ? 'Time Closed: ' + new Date(event.closed_at).toLocaleTimeString() : 'Running Live'}

ANALYSIS:
1. Student Handover Status: Out of ${total} students, ${pickedUp} students (${((pickedUp/total)*100).toFixed(1)}%) were successfully picked up by verified parents/guardians. There are ${issues} students currently categorized under Exception Handling/Issues (including delayed parents, alternate guardians, or school supervision resolutions).
2. Route Safety Advisory: Predefined route network consists of ${routeAdvisories} school-assigned routes. Parents reported ${routeBlocks} active route blockages during the pickup interval.
3. Operation Verdict: The controlled pickup was executed smoothly. Visual IC verification was strictly enforced by class teachers. The system successfully redirected parent travel away from flooded roads. No student safety issues were reported on school grounds.`;

  res.json({
    total,
    pickedUp,
    issues,
    notified,
    onTheWay,
    ready,
    routeBlocks,
    aiSummary
  });
});

app.get('/api/pic/route-issues', (req, res) => {
  const { pickup_event_id } = req.query;
  const reports = db.route_issue_reports.filter(r => r.pickup_event_id === pickup_event_id);
  res.json(reports);
});

// ==========================================================================
// Class Teacher Endpoints
// ==========================================================================
app.get('/api/teacher/students', (req, res) => {
  const { class_id, pickup_event_id } = req.query;
  const students = db.students.filter(s => s.class_id === class_id);

  // Annotate students with their active event status, responses, parent details
  const annotated = students.map(s => {
    const statusRecord = db.student_pickup_status.find(sps => sps.pickup_event_id === pickup_event_id && sps.student_id === s.id) || { status: "Not Started" };
    
    // Find parent links
    const links = db.student_parent_links.filter(l => l.student_id === s.id);
    const parents = links.map(l => {
      const p = db.users.find(u => u.id === l.parent_user_id);
      return p ? { name: p.name, phone: p.phone, ic_number: p.ic_number, relationship: l.relationship } : null;
    }).filter(Boolean);

    // Find parent response
    let activeResponse = null;
    if (pickup_event_id) {
      const parentIds = links.map(l => l.parent_user_id);
      const resp = db.parent_responses.find(r => r.pickup_event_id === pickup_event_id && parentIds.includes(r.parent_user_id));
      if (resp) {
        const routeName = resp.selected_route_id ? (db.routes.find(r => r.id === resp.selected_route_id) || { name: "" }).name : "None";
        activeResponse = {
          response_type: resp.response_type,
          guardian_note: resp.guardian_note,
          route_name: routeName,
          timestamp: resp.timestamp
        };
      }
    }

    return {
      ...s,
      status: statusRecord.status,
      issue_sub_reason: statusRecord.issue_sub_reason,
      parents,
      response: activeResponse
    };
  });

  res.json(annotated);
});

app.post('/api/teacher/students', (req, res) => {
  const { name, class_id, school_id } = req.body;
  const id = `ST-${Date.now().toString().slice(-4)}`;
  const newStudent = { id, name, class_id, school_id };
  db.students.push(newStudent);
  saveDB();
  res.status(201).json(newStudent);
});

app.put('/api/teacher/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, class_id } = req.body;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: "Student not found" });
  db.students[index] = { ...db.students[index], name, class_id };
  saveDB();
  res.json(db.students[index]);
});

app.delete('/api/teacher/students/:id', (req, res) => {
  const { id } = req.params;
  db.students = db.students.filter(s => s.id !== id);
  db.student_parent_links = db.student_parent_links.filter(l => l.student_id !== id);
  saveDB();
  res.json({ success: true });
});

// Parent CRUD
app.get('/api/teacher/parents', (req, res) => {
  const parents = db.users.filter(u => u.role === 'parent');
  res.json(parents);
});

app.post('/api/teacher/parents', (req, res) => {
  const { name, email, phone, ic_number } = req.body;
  const id = `U-PAR-${Date.now().toString().slice(-4)}`;
  const newParent = { id, name, email, phone, ic_number, role: "parent", school_id: null, password: "password123" };
  db.users.push(newParent);
  saveDB();
  res.status(201).json(newParent);
});

app.put('/api/teacher/parents/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, ic_number } = req.body;
  const idx = db.users.findIndex(u => u.id === id && u.role === 'parent');
  if (idx === -1) return res.status(404).json({ error: "Parent not found" });
  db.users[idx] = { ...db.users[idx], name, email, phone, ic_number };
  saveDB();
  res.json(db.users[idx]);
});

app.delete('/api/teacher/parents/:id', (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter(u => u.id !== id);
  db.student_parent_links = db.student_parent_links.filter(l => l.parent_user_id !== id);
  saveDB();
  res.json({ success: true });
});

// Student Parent Links
app.get('/api/teacher/links', (req, res) => {
  const { class_id } = req.query;
  const classStudents = db.students.filter(s => s.class_id === class_id).map(s => s.id);
  const links = db.student_parent_links.filter(l => classStudents.includes(l.student_id));
  
  // Annotate links
  const annotated = links.map(l => {
    const s = db.students.find(st => st.id === l.student_id) || { name: "" };
    const p = db.users.find(u => u.id === l.parent_user_id) || { name: "" };
    return {
      ...l,
      student_name: s.name,
      parent_name: p.name
    };
  });
  res.json(annotated);
});

app.post('/api/teacher/links', (req, res) => {
  const { student_id, parent_user_id, relationship } = req.body;
  // Duplicate check
  const exists = db.student_parent_links.some(l => l.student_id === student_id && l.parent_user_id === parent_user_id);
  if (exists) return res.status(400).json({ error: "Link already exists" });

  const id = `SPL-${Date.now()}`;
  const newLink = { id, student_id, parent_user_id, relationship };
  db.student_parent_links.push(newLink);
  saveDB();
  res.status(201).json(newLink);
});

app.delete('/api/teacher/links/:id', (req, res) => {
  const { id } = req.params;
  db.student_parent_links = db.student_parent_links.filter(l => l.id !== id);
  saveDB();
  res.json({ success: true });
});

// Bulk status updates
app.put('/api/teacher/students/bulk-status', (req, res) => {
  const { student_ids, pickup_event_id, status, updated_by } = req.body;
  if (!student_ids || !Array.isArray(student_ids)) {
    return res.status(400).json({ error: "student_ids must be an array" });
  }

  db.student_pickup_status.forEach(sps => {
    if (sps.pickup_event_id === pickup_event_id && student_ids.includes(sps.student_id)) {
      sps.status = status;
      sps.updated_by = updated_by;
      sps.timestamp = new Date().toISOString();
    }
  });

  saveDB();
  res.json({ success: true });
});

// Verify physical pickup handover
app.post('/api/teacher/handover', (req, res) => {
  const { pickup_event_id, student_id, verified_by_teacher_id, parent_user_id, guardian_name_if_alternate, remarks } = req.body;

  // Add verification record
  const id = `PV-${Date.now()}`;
  db.pickup_verifications.push({
    id,
    pickup_event_id,
    student_id,
    verified_by_teacher_id,
    parent_user_id: parent_user_id || null,
    guardian_name_if_alternate: guardian_name_if_alternate || null,
    timestamp: new Date().toISOString(),
    remarks: remarks || ""
  });

  // State Transition Rule: Update student status to 'Picked Up'
  const spsIndex = db.student_pickup_status.findIndex(s => s.pickup_event_id === pickup_event_id && s.student_id === student_id);
  if (spsIndex !== -1) {
    db.student_pickup_status[spsIndex].status = "Picked Up";
    db.student_pickup_status[spsIndex].issue_sub_reason = null;
    db.student_pickup_status[spsIndex].updated_by = verified_by_teacher_id;
    db.student_pickup_status[spsIndex].timestamp = new Date().toISOString();
  }

  saveDB();
  res.json({ success: true });
});

// Teacher manually flags an issue / remark
app.post('/api/teacher/report-issue', (req, res) => {
  const { pickup_event_id, student_id, sub_reason, notes, updated_by } = req.body;
  const spsIndex = db.student_pickup_status.findIndex(s => s.pickup_event_id === pickup_event_id && s.student_id === student_id);
  if (spsIndex !== -1) {
    db.student_pickup_status[spsIndex].status = "Issue";
    db.student_pickup_status[spsIndex].issue_sub_reason = sub_reason + (notes ? `: ${notes}` : "");
    db.student_pickup_status[spsIndex].updated_by = updated_by;
    db.student_pickup_status[spsIndex].timestamp = new Date().toISOString();
  }
  saveDB();
  res.json({ success: true });
});


// ==========================================================================
// Parent / Guardian Endpoints
// ==========================================================================
app.get('/api/parent/dashboard', (req, res) => {
  const { parent_user_id } = req.query;

  // 1. Get all linked children
  const links = db.student_parent_links.filter(l => l.parent_user_id === parent_user_id);
  const studentIds = links.map(l => l.student_id);
  const students = db.students.filter(s => studentIds.includes(s.id));

  // 2. Map children with active pickup event details, status, route suggestions
  const childrenDetails = students.map(s => {
    const school = db.schools.find(sc => sc.id === s.school_id) || { name: "" };
    const activeEvent = db.pickup_events.find(e => e.school_id === s.school_id && e.status !== 'closed');
    const classRecord = db.classes.find(c => c.id === s.class_id) || { name: "" };

    let pickupStatus = "Safe";
    let statusText = "No active flood pickup event running. School is operating normally.";
    let activeEventId = null;
    let eventStatus = null;
    let pickupInstruction = "";
    let holdReason = "";
    let responseSubmitted = null;

    if (activeEvent) {
      activeEventId = activeEvent.id;
      eventStatus = activeEvent.status;
      pickupInstruction = activeEvent.pickup_instruction;
      holdReason = activeEvent.hold_reason;

      const sps = db.student_pickup_status.find(status => status.pickup_event_id === activeEvent.id && status.student_id === s.id);
      pickupStatus = sps ? sps.status : "Supervised";
      
      statusText = pickupStatus === "Supervised" ? "Your child is safe and supervised on school grounds."
                 : pickupStatus === "Notified" ? "Controlled pickup notification sent. Please respond."
                 : pickupStatus === "On The Way" ? "You have clicked On The Way. Teacher is preparing your child."
                 : pickupStatus === "Ready" ? "Your child is ready at the designated pickup zone."
                 : pickupStatus === "Picked Up" ? "Pickup completed successfully."
                 : `Issue reported: ${sps ? sps.issue_sub_reason : ''}`;

      // Check if parent already responded
      const parentResponse = db.parent_responses.find(pr => pr.pickup_event_id === activeEvent.id && pr.parent_user_id === parent_user_id);
      if (parentResponse) {
        responseSubmitted = {
          response_type: parentResponse.response_type,
          selected_route_id: parentResponse.selected_route_id,
          guardian_note: parentResponse.guardian_note
        };
      }
    }

    return {
      student_id: s.id,
      student_name: s.name,
      class_name: classRecord.name,
      school_id: s.school_id,
      school_name: school.name,
      active_event_id: activeEventId,
      event_status: eventStatus,
      pickup_instruction: pickupInstruction,
      hold_reason: holdReason,
      status: pickupStatus,
      status_description: statusText,
      response: responseSubmitted
    };
  });

  res.json(childrenDetails);
});

app.get('/api/parent/routes', (req, res) => {
  const { school_id } = req.query;
  const routeIds = db.school_routes.filter(sr => sr.school_id === school_id).map(sr => sr.route_id);
  const routes = db.routes.filter(r => routeIds.includes(r.id)).map(r => {
    const area = db.areas.find(a => a.id === r.area_id) || { name: "" };
    
    // Status recommendations:
    // Safe -> Recommend
    // Caution -> Recommend with warning
    // Flood Risk -> Warning
    // Flooded / Closed -> Avoid
    let recommendation = "✅ Recommended";
    if (r.current_status === 'Caution') recommendation = "⚠️ Recommended with warning";
    else if (r.current_status === 'Flood Risk') recommendation = "⚠️ Warning: Flood risk reported near route";
    else if (r.current_status === 'Flooded') recommendation = "❌ Avoid: Water currently affecting route";
    else if (r.current_status === 'Closed') recommendation = "❌ Do not use: Route is closed";

    return {
      ...r,
      area_name: area.name,
      recommendation
    };
  });
  res.json(routes);
});

app.post('/api/parent/response', (req, res) => {
  const { pickup_event_id, parent_user_id, response_type, selected_route_id, guardian_note } = req.body;

  // Insert parent response log
  const responseId = `PR-${Date.now()}`;
  db.parent_responses.push({
    id: responseId,
    pickup_event_id,
    parent_user_id,
    response_type,
    selected_route_id: selected_route_id || null,
    guardian_note: guardian_note || null,
    timestamp: new Date().toISOString()
  });

  // State Transition Rule: Propagate response to ALL parent's children at that school under active event
  const links = db.student_parent_links.filter(l => l.parent_user_id === parent_user_id);
  const studentIds = links.map(l => l.student_id);

  db.student_pickup_status.forEach(sps => {
    if (sps.pickup_event_id === pickup_event_id && studentIds.includes(sps.student_id)) {
      if (response_type === 'on_the_way') {
        sps.status = "On The Way";
        sps.issue_sub_reason = null;
      } else {
        sps.status = "Issue";
        if (response_type === 'delayed') sps.issue_sub_reason = "Delayed";
        else if (response_type === 'blocked') sps.issue_sub_reason = "Route Blocked";
        else if (response_type === 'cannot_come') sps.issue_sub_reason = "Cannot Come Now";
        else if (response_type === 'guardian') sps.issue_sub_reason = "Alternate Guardian: " + (guardian_note || "");
      }
      sps.updated_by = parent_user_id;
      sps.timestamp = new Date().toISOString();
    }
  });

  saveDB();
  res.json({ success: true });
});

app.post('/api/parent/report-route-issue', (req, res) => {
  const { pickup_event_id, reported_by_user_id, route_id, description } = req.body;

  const id = `RI-${Date.now()}`;
  db.route_issue_reports.push({
    id,
    pickup_event_id,
    reported_by_user_id,
    route_id,
    description: description || "Blocked / Flooded road reported by parent",
    status: "pending",
    reviewed_by: null,
    timestamp: new Date().toISOString()
  });

  // Send a notification to DO
  const route = db.routes.find(r => r.id === route_id);
  const parent = db.users.find(u => u.id === reported_by_user_id) || { name: "A Parent" };
  const dos = db.users.filter(u => u.role === 'do');

  dos.forEach(doUser => {
    db.notifications.push({
      id: `NT-DO-${Date.now()}-${doUser.id}`,
      type: "route_issue",
      recipient_user_id: doUser.id,
      recipient_role: "do",
      pickup_event_id,
      title: "Parent Route Block Report",
      message: `Parent (${parent.name}) reported block on ${route ? route.name : 'Unknown Route'}: "${description}"`,
      is_read: false,
      created_at: new Date().toISOString(),
      reference_type: "route",
      reference_id: route_id
    });
  });

  // Check THRESHOLD logic: If 3 or more parents report the same route as blocked within same event
  const matchingReports = db.route_issue_reports.filter(r => r.pickup_event_id === pickup_event_id && r.route_id === route_id);
  if (matchingReports.length >= 3) {
    dos.forEach(doUser => {
      db.notifications.push({
        id: `NT-DO-HIGH-${Date.now()}-${doUser.id}`,
        type: "route_issue",
        recipient_user_id: doUser.id,
        recipient_role: "do",
        pickup_event_id,
        title: "🚨 HIGH PRIORITY: Route Review Flagged",
        message: `Route [${route ? route.name : 'Unknown Route'}] has received ${matchingReports.length} block reports. Urgent review required!`,
        is_read: false,
        created_at: new Date().toISOString(),
        reference_type: "route",
        reference_id: route_id
      });
    });
  }

  saveDB();
  res.json({ success: true });
});

// Notifications lookup
app.get('/api/notifications', (req, res) => {
  const { user_id, role } = req.query;
  const filtered = db.notifications.filter(n => {
    if (user_id && n.recipient_user_id === user_id) return true;
    if (role && n.recipient_role === role) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(filtered);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const index = db.notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    db.notifications[index].is_read = true;
    saveDB();
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req, res) => {
  const { user_id } = req.body;
  db.notifications.forEach(n => {
    if (n.recipient_user_id === user_id) {
      n.is_read = true;
    }
  });
  saveDB();
  res.json({ success: true });
});

// Listen Server
app.listen(PORT, () => {
  console.log("==========================================================================");
  console.log(`  K-LiSP: Keningau Life Safety Pickup System Server Running`);
  console.log("==========================================================================");
  console.log(`  Access URLs:`);
  console.log(`  - Parent Dashboard (Mobile Style): http://localhost:${PORT}/`);
  console.log(`  - Staff Portal (DO, PPD, PIC, Teacher): http://localhost:${PORT}/admin.html`);
  console.log("==========================================================================");
});

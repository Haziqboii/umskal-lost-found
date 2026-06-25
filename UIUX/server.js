const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Disable caching for development/testing
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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
// Flat SVG Mock Templates (Solid corporate theme, no gradients)
// ==========================================================================
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
// Database State (Pre-seeded with mock data using the seed images)
// ==========================================================================
const DEFAULT_STATE = {
  verifiedItems: [
    {
      id: "LF-1001",
      reference: "LF-1001",
      name: "UMSKAL Matric Card",
      category: "Matric Card",
      location: "Library Lobby",
      date: "2026-06-24",
      time: "10:30",
      image: SVG_MOCKS.matric,
      status: "Available for Claim",
      description: "Found on a table near the main entrance."
    },
    {
      id: "LF-1002",
      reference: "LF-1002",
      name: "Sleek Leather Wallet",
      category: "Wallet",
      location: "Cafeteria",
      date: "2026-06-23",
      time: "14:15",
      image: SVG_MOCKS.wallet,
      status: "Available for Claim",
      description: "Brown leather wallet found on a dining table."
    },
    {
      id: "LF-1003",
      reference: "LF-1003",
      name: "Stainless Steel Thermos Bottle",
      category: "Bottle",
      location: "DK 3",
      date: "2026-06-25",
      time: "09:00",
      image: SVG_MOCKS.bottle,
      status: "Available for Claim",
      description: "Black vacuum flask left under a seat in Lecture Hall 3."
    },
    {
      id: "LF-1004",
      reference: "LF-1004",
      name: "Keyring with Car Key",
      category: "Keys",
      location: "Campus Mosque",
      date: "2026-06-22",
      time: "17:45",
      image: SVG_MOCKS.keys,
      status: "Claim Pending",
      description: "Key ring with a car key and a decorative strap."
    }
  ],
  lostReports: [
    {
      id: "LR-1001",
      name: "Leather Wallet",
      category: "Wallet",
      location: "Cafeteria",
      date: "2026-06-23",
      time: "14:00",
      description: "Brown leather wallet containing some cash and driving license.",
      image: SVG_MOCKS.wallet,
      status: "Possible Match Found",
      matchedItemId: "LF-1002"
    },
    {
      id: "LR-1002",
      name: "iPhone 13 Pro",
      category: "Electronics",
      location: "Block D Lab",
      date: "2026-06-24",
      time: "11:30",
      description: "Midnight blue iPhone with a transparent case.",
      image: SVG_MOCKS.electronics,
      status: "Submitted"
    },
    {
      id: "LR-1003",
      name: "Matric Card",
      category: "Matric Card",
      location: "Library Lobby",
      date: "2026-06-24",
      time: "10:00",
      description: "Matric card with name Muhammad Haziq Hazim.",
      image: SVG_MOCKS.matric,
      status: "Returned"
    }
  ],
  foundReports: [
    {
      id: "FR-1001",
      name: "Adidas Backpack",
      category: "Bag",
      location: "Security Office",
      date: "2026-06-25",
      time: "11:00",
      finderMatric: "BI23110360",
      finderName: "Muhammad Haziq Hazim bin Amir",
      finderEmail: "haxim.2mars@gmail.com",
      description: "Black backpack containing notebook and stationary.",
      image: SVG_MOCKS.bag,
      status: "Submitted"
    },
    {
      id: "FR-1002",
      name: "Smartphone",
      category: "Electronics",
      location: "Block D Lab",
      date: "2026-06-24",
      time: "12:00",
      finderMatric: "AL230941",
      finderName: "Aiman bin Abdullah",
      finderEmail: "aiman_student@student.ums.edu.my",
      description: "iPhone found near computer desk.",
      image: SVG_MOCKS.electronics,
      status: "Under Review"
    }
  ],
  claims: [
    {
      id: "CL-1001",
      itemId: "LF-1004",
      itemName: "Keyring with Car Key",
      itemRef: "LF-1004",
      studentName: "Muhammad Haziq Hazim bin Amir",
      studentMatric: "BI23110360",
      studentEmail: "haxim.2mars@gmail.com",
      lostWhere: "Campus Mosque",
      lostDate: "2026-06-22",
      lostTime: "17:30",
      uniqueDetail: "A black leather strap with a Toyota logo on the key ring.",
      proofImage: SVG_MOCKS.keys,
      status: "Claim Pending"
    }
  ],
  notifications: [
    {
      id: "NT-1001",
      title: "Possible Match Found",
      message: "Management has matched your lost report 'Leather Wallet' with verified found item Ref: #LF-1002. Please check details and submit claim proof.",
      time: "10 minutes ago",
      type: "warning",
      unread: true
    },
    {
      id: "NT-1002",
      title: "Lost Report Filed",
      message: "Your lost report for 'iPhone 13 Pro' has been submitted successfully.",
      time: "1 hour ago",
      type: "info",
      unread: false
    }
  ],
  activities: [
    {
      time: "11:15 AM",
      text: "Student <strong>Muhammad Haziq</strong> filed claim request for <strong>'Keyring with Car Key'</strong>.",
      type: "Claim Request",
      ref: "CL-1001",
      timestamp: "2026-06-25T11:15:00.000Z"
    },
    {
      time: "10:45 AM",
      text: "Admin suggested match for Lost Report <strong>LR-1001</strong> with Verified Item <strong>LF-1002</strong>.",
      type: "Match Suggestion",
      ref: "LR-1001",
      timestamp: "2026-06-25T10:45:00.000Z"
    },
    {
      time: "09:30 AM",
      text: "Found Item reported: <strong>Adidas Backpack</strong> by finder <strong>Muhammad Haziq</strong>.",
      type: "Found Report",
      ref: "FR-1001",
      timestamp: "2026-06-25T09:30:00.000Z"
    }
  ]
};

let db = JSON.parse(JSON.stringify(DEFAULT_STATE));

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const useSupabase = !!(supabaseUrl && supabaseAnonKey);
let supabase;

if (useSupabase) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client initialized successfully.");
} else {
  console.log("Using in-memory database fallback (no Supabase credentials provided).");
}

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const dbService = {
  async getItems() {
    if (useSupabase) {
      const { data, error } = await supabase.from('verified_items').select('*');
      if (error) console.error("Error fetching items from Supabase:", error);
      return data || [];
    }
    return db.verifiedItems;
  },
  async addItem(item) {
    if (useSupabase) {
      const { error } = await supabase.from('verified_items').insert([item]);
      if (error) console.error("Error inserting item into Supabase:", error);
      return item;
    }
    db.verifiedItems.unshift(item);
    return item;
  },
  async updateItemStatus(id, status) {
    if (useSupabase) {
      const { error } = await supabase.from('verified_items').update({ status }).eq('id', id);
      if (error) console.error("Error updating item status in Supabase:", error);
    } else {
      const idx = db.verifiedItems.findIndex(i => i.id === id);
      if (idx > -1) db.verifiedItems[idx].status = status;
    }
  },
  async getLostReports() {
    if (useSupabase) {
      const { data, error } = await supabase.from('lost_reports').select('*');
      if (error) console.error("Error fetching lost reports from Supabase:", error);
      // Map snake_case to camelCase
      return (data || []).map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        location: r.location,
        date: r.date,
        time: r.time,
        image: r.image,
        status: r.status,
        description: r.description,
        matchedItemId: r.matched_item_id
      }));
    }
    return db.lostReports;
  },
  async addLostReport(report) {
    if (useSupabase) {
      const { error } = await supabase.from('lost_reports').insert([{
        id: report.id,
        name: report.name,
        category: report.category,
        location: report.location,
        date: report.date,
        time: report.time,
        image: report.image,
        status: report.status,
        description: report.description,
        matched_item_id: report.matchedItemId
      }]);
      if (error) console.error("Error inserting lost report into Supabase:", error);
      return report;
    }
    db.lostReports.unshift(report);
    return report;
  },
  async updateLostReportMatch(id, status, matchedItemId) {
    if (useSupabase) {
      const { error } = await supabase.from('lost_reports').update({
        status,
        matched_item_id: matchedItemId
      }).eq('id', id);
      if (error) console.error("Error updating lost report match in Supabase:", error);
    } else {
      const idx = db.lostReports.findIndex(r => r.id === id);
      if (idx > -1) {
        db.lostReports[idx].status = status;
        db.lostReports[idx].matchedItemId = matchedItemId;
      }
    }
  },
  async getFoundReports() {
    if (useSupabase) {
      const { data, error } = await supabase.from('found_reports').select('*');
      if (error) console.error("Error fetching found reports from Supabase:", error);
      return (data || []).map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        location: r.location,
        date: r.date,
        time: r.time,
        finderName: r.finder_name,
        finderMatric: r.finder_matric,
        finderEmail: r.finder_email,
        description: r.description,
        image: r.image,
        status: r.status
      }));
    }
    return db.foundReports;
  },
  async addFoundReport(report) {
    if (useSupabase) {
      const { error } = await supabase.from('found_reports').insert([{
        id: report.id,
        name: report.name,
        category: report.category,
        location: report.location,
        date: report.date,
        time: report.time,
        finder_name: report.finderName,
        finder_matric: report.finderMatric,
        finder_email: report.finderEmail,
        description: report.description,
        image: report.image,
        status: report.status
      }]);
      if (error) console.error("Error inserting found report into Supabase:", error);
      return report;
    }
    db.foundReports.unshift(report);
    return report;
  },
  async deleteFoundReport(id) {
    if (useSupabase) {
      const { error } = await supabase.from('found_reports').delete().eq('id', id);
      if (error) console.error("Error deleting found report from Supabase:", error);
    } else {
      const idx = db.foundReports.findIndex(f => f.id === id);
      if (idx > -1) db.foundReports.splice(idx, 1);
    }
  },
  async updateFoundReportStatus(id, status) {
    if (useSupabase) {
      const { error } = await supabase.from('found_reports').update({ status }).eq('id', id);
      if (error) console.error("Error updating found report status in Supabase:", error);
    } else {
      const idx = db.foundReports.findIndex(f => f.id === id);
      if (idx > -1) db.foundReports[idx].status = status;
    }
  },
  async getClaims() {
    if (useSupabase) {
      const { data, error } = await supabase.from('claims').select('*');
      if (error) console.error("Error fetching claims from Supabase:", error);
      return (data || []).map(c => ({
        id: c.id,
        itemId: c.item_id,
        itemName: c.item_name,
        itemRef: c.item_ref,
        studentName: c.student_name,
        studentMatric: c.student_matric,
        studentEmail: c.student_email,
        lostWhere: c.lost_where,
        lostDate: c.lost_date,
        lostTime: c.lost_time,
        uniqueDetail: c.unique_detail,
        proofImage: c.proof_image,
        status: c.status,
        adminNote: c.admin_note,
        lostReportId: c.lost_report_id
      }));
    }
    return db.claims;
  },
  async addClaim(claim) {
    if (useSupabase) {
      const { error } = await supabase.from('claims').insert([{
        id: claim.id,
        item_id: claim.itemId,
        item_name: claim.itemName,
        item_ref: claim.itemRef,
        student_name: claim.studentName,
        student_matric: claim.studentMatric,
        student_email: claim.studentEmail,
        lost_where: claim.lostWhere,
        lost_date: claim.lostDate,
        lost_time: claim.lostTime,
        unique_detail: claim.uniqueDetail,
        proof_image: claim.proofImage,
        status: claim.status,
        admin_note: claim.adminNote,
        lost_report_id: claim.lostReportId
      }]);
      if (error) console.error("Error inserting claim into Supabase:", error);
      return claim;
    }
    db.claims.unshift(claim);
    return claim;
  },
  async updateClaimStatus(id, status, adminNote) {
    if (useSupabase) {
      const updateData = { status };
      if (adminNote !== undefined) updateData.admin_note = adminNote;
      const { error } = await supabase.from('claims').update(updateData).eq('id', id);
      if (error) console.error("Error updating claim status in Supabase:", error);
    } else {
      const idx = db.claims.findIndex(c => c.id === id);
      if (idx > -1) {
        db.claims[idx].status = status;
        if (adminNote !== undefined) db.claims[idx].adminNote = adminNote;
      }
    }
  },
  async getNotifications() {
    if (useSupabase) {
      const { data, error } = await supabase.from('notifications').select('*');
      if (error) console.error("Error fetching notifications from Supabase:", error);
      return data || [];
    }
    return db.notifications;
  },
  async addNotification(notif) {
    if (useSupabase) {
      const { error } = await supabase.from('notifications').insert([{
        id: notif.id,
        title: notif.title,
        message: notif.message,
        time: notif.time,
        type: notif.type,
        unread: notif.unread
      }]);
      if (error) console.error("Error inserting notification into Supabase:", error);
      return notif;
    }
    db.notifications.unshift(notif);
    return notif;
  },
  async markNotificationRead(id) {
    if (useSupabase) {
      const { error } = await supabase.from('notifications').update({ unread: false }).eq('id', id);
      if (error) console.error("Error marking notification read in Supabase:", error);
    } else {
      const idx = db.notifications.findIndex(n => n.id === id);
      if (idx > -1) db.notifications[idx].unread = false;
    }
  },
  async markAllNotificationsRead() {
    if (useSupabase) {
      const { error } = await supabase.from('notifications').update({ unread: false }).neq('id', '');
      if (error) console.error("Error marking all notifications read in Supabase:", error);
    } else {
      db.notifications.forEach(n => n.unread = false);
    }
  },
  async getActivities() {
    if (useSupabase) {
      const { data, error } = await supabase.from('activities').select('*');
      if (error) console.error("Error fetching activities from Supabase:", error);
      return data || [];
    }
    return db.activities;
  },
  async addActivity(act) {
    const actId = act.id || `AC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (useSupabase) {
      const { error } = await supabase.from('activities').insert([{
        id: actId,
        time: act.time,
        text: act.text,
        type: act.type,
        ref: act.ref,
        timestamp: act.timestamp
      }]);
      if (error) console.error("Error inserting activity into Supabase:", error);
      return act;
    }
    db.activities.unshift(act);
    return act;
  },
  async reset() {
    if (useSupabase) {
      try {
        await supabase.from('claims').delete().neq('id', '');
        await supabase.from('found_reports').delete().neq('id', '');
        await supabase.from('lost_reports').delete().neq('id', '');
        await supabase.from('verified_items').delete().neq('id', '');
        await supabase.from('notifications').delete().neq('id', '');
        await supabase.from('activities').delete().neq('id', '');

        // Seed initial data
        await supabase.from('verified_items').insert(DEFAULT_STATE.verifiedItems);
        
        await supabase.from('lost_reports').insert(DEFAULT_STATE.lostReports.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          location: r.location,
          date: r.date,
          time: r.time,
          image: r.image,
          status: r.status,
          description: r.description,
          matched_item_id: r.matchedItemId
        })));

        await supabase.from('found_reports').insert(DEFAULT_STATE.foundReports.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          location: r.location,
          date: r.date,
          time: r.time,
          finder_name: r.finderName,
          finder_matric: r.finderMatric,
          finder_email: r.finderEmail,
          description: r.description,
          image: r.image,
          status: r.status
        })));

        await supabase.from('claims').insert(DEFAULT_STATE.claims.map(c => ({
          id: c.id,
          item_id: c.itemId,
          item_name: c.itemName,
          item_ref: c.itemRef,
          student_name: c.studentName,
          student_matric: c.studentMatric,
          student_email: c.studentEmail,
          lost_where: c.lostWhere,
          lost_date: c.lostDate,
          lost_time: c.lostTime,
          unique_detail: c.uniqueDetail,
          proof_image: c.proofImage,
          status: c.status
        })));

        await supabase.from('notifications').insert(DEFAULT_STATE.notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.time,
          type: n.type,
          unread: n.unread
        })));

        await supabase.from('activities').insert(DEFAULT_STATE.activities.map((a, idx) => ({
          id: `AC-SEED-${idx}`,
          time: a.time,
          text: a.text,
          type: a.type,
          ref: a.ref,
          timestamp: a.timestamp
        })));
      } catch (err) {
        console.error("Error resetting Supabase state:", err);
      }
    } else {
      db = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }
};

// ==========================================================================
// REST API Endpoint Mappings
// ==========================================================================
app.get('/api/items', async (req, res) => {
  const items = await dbService.getItems();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  const item = req.body;
  const savedItem = await dbService.addItem(item);
  res.status(201).json(savedItem);
});

app.get('/api/lost-reports', async (req, res) => {
  const reports = await dbService.getLostReports();
  res.json(reports);
});

app.post('/api/lost-reports', async (req, res) => {
  const report = req.body;
  const savedReport = await dbService.addLostReport(report);

  await dbService.addNotification({
    id: `NT-${Date.now()}`,
    title: "Lost Report Filed",
    message: `Your lost report for '${report.name}' has been submitted successfully.`,
    time: "Just now",
    type: "info",
    unread: true
  });

  await dbService.addActivity({
    time: getFormattedTime(),
    text: `Student filed Lost Report: <strong>${report.name}</strong>.`,
    type: "Lost Report",
    ref: report.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(savedReport);
});

app.post('/api/lost-reports/:id/match', async (req, res) => {
  const id = req.params.id;
  const { itemId } = req.body;

  const reports = await dbService.getLostReports();
  const report = reports.find(r => r.id === id);
  const items = await dbService.getItems();
  const item = items.find(i => i.id === itemId);

  if (report && item) {
    await dbService.updateLostReportMatch(id, "Possible Match Found", itemId);

    await dbService.addNotification({
      id: `NT-${Date.now()}`,
      title: "Possible Match Found",
      message: `Management has matched your lost report '${report.name}' with verified item Ref: #${item.reference}. Please check details and submit claim proof.`,
      time: "Just now",
      type: "warning",
      unread: true
    });

    await dbService.addActivity({
      time: getFormattedTime(),
      text: `Admin suggested match for Lost Report <strong>${id}</strong> with Verified Item <strong>${itemId}</strong>.`,
      type: "Match Suggestion",
      ref: id,
      timestamp: new Date().toISOString()
    });

    const updatedReports = await dbService.getLostReports();
    res.json(updatedReports.find(r => r.id === id));
  } else {
    res.status(404).json({ error: "Report or Item not found" });
  }
});

app.get('/api/found-reports', async (req, res) => {
  const reports = await dbService.getFoundReports();
  res.json(reports);
});

app.post('/api/found-reports', async (req, res) => {
  const report = req.body;
  const savedReport = await dbService.addFoundReport(report);

  await dbService.addNotification({
    id: `NT-${Date.now()}`,
    title: "Found Item Reported",
    message: `You reported finding a '${report.name}'. Please hand it over to the Lost & Found Counter.`,
    time: "Just now",
    type: "warning",
    unread: true
  });

  await dbService.addActivity({
    time: getFormattedTime(),
    text: `Found Item reported: <strong>${report.name}</strong> by finder <strong>${report.finderMatric}</strong>.`,
    type: "Found Report",
    ref: report.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(savedReport);
});

app.delete('/api/found-reports/:id', async (req, res) => {
  const id = req.params.id;
  const reports = await dbService.getFoundReports();
  const item = reports.find(f => f.id === id);
  if (item) {
    await dbService.deleteFoundReport(id);

    await dbService.addNotification({
      id: `NT-${Date.now()}`,
      title: "Found Report Rejected",
      message: `Your found report for '${item.name}' was rejected by management.`,
      time: "Just now",
      type: "danger",
      unread: true
    });

    await dbService.addActivity({
      time: getFormattedTime(),
      text: `Admin rejected found report: <strong>${item.name}</strong>.`,
      type: "Rejection",
      ref: id,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

app.get('/api/claims', async (req, res) => {
  const claims = await dbService.getClaims();
  res.json(claims);
});

app.post('/api/claims', async (req, res) => {
  const claim = req.body;
  const savedClaim = await dbService.addClaim(claim);

  await dbService.updateItemStatus(claim.itemId, "Claim Pending");

  // Sync state of linked lost report
  if (claim.lostReportId) {
    await dbService.updateLostReportMatch(claim.lostReportId, "Claim Pending", claim.itemId);
  }

  await dbService.addNotification({
    id: `NT-${Date.now()}`,
    title: "Claim Submitted Successfully",
    message: `Management will review your proof of ownership and update your claim status.`,
    time: "Just now",
    type: "info",
    unread: true
  });

  await dbService.addActivity({
    time: getFormattedTime(),
    text: `Claim request submitted by <strong>${claim.studentMatric}</strong> on <strong>${claim.itemName}</strong>.`,
    type: "Claim Request",
    ref: claim.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(savedClaim);
});

app.put('/api/claims/:id', async (req, res) => {
  const id = req.params.id;
  const { status, adminNote } = req.body;

  const claims = await dbService.getClaims();
  const claim = claims.find(c => c.id === id);
  if (claim) {
    await dbService.updateClaimStatus(id, status, adminNote);

    if (status === 'Ready for Collection') {
      await dbService.updateItemStatus(claim.itemId, "Ready for Collection");
      if (claim.lostReportId) {
        await dbService.updateLostReportMatch(claim.lostReportId, "Ready for Collection", claim.itemId);
      }

      await dbService.addNotification({
        id: `NT-${Date.now()}`,
        title: "Claim Approved",
        message: `Your claim for '${claim.itemName}' was approved. Please collect your item at the Lost & Found Counter.`,
        time: "Just now",
        type: "success",
        unread: true
      });

      await dbService.addActivity({
        time: getFormattedTime(),
        text: `Claim approved: <strong>${claim.itemName}</strong> ready for collection.`,
        type: "Claim Approval",
        ref: id,
        timestamp: new Date().toISOString()
      });
    }
    else if (status === 'Returned') {
      await dbService.updateItemStatus(claim.itemId, "Returned");
      if (claim.lostReportId) {
        await dbService.updateLostReportMatch(claim.lostReportId, "Returned", claim.itemId);
      }

      await dbService.addNotification({
        id: `NT-${Date.now()}`,
        title: "Item Returned Successfully",
        message: `Your item '${claim.itemName}' has been marked as returned.`,
        time: "Just now",
        type: "success",
        unread: true
      });

      await dbService.addActivity({
        time: getFormattedTime(),
        text: `Item returned: <strong>${claim.itemName}</strong> returned to <strong>${claim.studentName}</strong>.`,
        type: "Item Returned",
        ref: claim.itemId,
        timestamp: new Date().toISOString()
      });
    }
    else if (status === 'Rejected') {
      await dbService.updateItemStatus(claim.itemId, "Available for Claim");
      if (claim.lostReportId) {
        await dbService.updateLostReportMatch(claim.lostReportId, "Submitted", null);
      }

      await dbService.addNotification({
        id: `NT-${Date.now()}`,
        title: "Claim Rejected",
        message: `Your claim for '${claim.itemName}' was rejected by management.`,
        time: "Just now",
        type: "danger",
        unread: true
      });

      await dbService.addActivity({
        time: getFormattedTime(),
        text: `Admin rejected claim request by <strong>${claim.studentMatric}</strong> on <strong>${claim.itemName}</strong>.`,
        type: "Claim Rejection",
        ref: id,
        timestamp: new Date().toISOString()
      });
    }

    const updatedClaims = await dbService.getClaims();
    res.json(updatedClaims.find(c => c.id === id));
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

app.post('/api/admin/verify-intake', async (req, res) => {
  const { reportId, verifiedItem } = req.body;

  await dbService.addItem(verifiedItem);

  const reports = await dbService.getFoundReports();
  const report = reports.find(f => f.id === reportId);
  if (report) {
    await dbService.deleteFoundReport(reportId);

    await dbService.addNotification({
      id: `NT-${Date.now()}`,
      title: "Your found item has been verified.",
      message: `Thank you! Your found report for '${report.name}' has been verified and marked as available for claim.`,
      time: "Just now",
      type: "success",
      unread: true
    });

    await dbService.addActivity({
      time: getFormattedTime(),
      text: `Found item verified: <strong>${verifiedItem.name}</strong> marked as Available for Claim.`,
      type: "Verification",
      ref: verifiedItem.id,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, verifiedItem });
});

app.get('/api/notifications', async (req, res) => {
  const notifications = await dbService.getNotifications();
  res.json(notifications);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const id = req.params.id;
  const notifications = await dbService.getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index > -1) {
    await dbService.markNotificationRead(id);
    const updatedNotifications = await dbService.getNotifications();
    res.json(updatedNotifications.find(n => n.id === id));
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  await dbService.markAllNotificationsRead();
  res.json({ success: true });
});

app.get('/api/activities', async (req, res) => {
  const activities = await dbService.getActivities();
  res.json(activities);
});

app.post('/api/reset', async (req, res) => {
  await dbService.reset();
  res.json({ success: true, message: "Database state reset to defaults." });
});

app.put('/api/found-reports/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const reports = await dbService.getFoundReports();
  const index = reports.findIndex(f => f.id === id);
  if (index > -1) {
    await dbService.updateFoundReportStatus(id, status);

    if (status === "Under Review") {
      await dbService.addNotification({
        id: `NT-${Date.now()}`,
        title: "Item Verification Started",
        message: `Your found item '${reports[index].name}' status is now: Under Review.`,
        time: "Just now",
        type: "info",
        unread: true
      });
    }

    const updatedReports = await dbService.getFoundReports();
    res.json(updatedReports.find(f => f.id === id));
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

app.listen(PORT, () => {
  console.log("================================================================");
  console.log(`  UMSKAL Lost & Found Management System Server Initialized  `);
  console.log("================================================================");
  console.log(`  Localhost access (Laptop):`);
  console.log(`  - Student App Portal:  http://localhost:${PORT}/`);
  console.log(`  - Admin Admin Portal: http://localhost:${PORT}/admin.html`);
  console.log("----------------------------------------------------------------");

  const interfaces = os.networkInterfaces();
  let foundWifiIp = false;

  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        console.log(`  Shared Wi-Fi Network Access (Mobile Phone):`);
        console.log(`  - URL: http://${alias.address}:${PORT}/`);
        foundWifiIp = true;
      }
    }
  }

  if (!foundWifiIp) {
    console.log("  Wi-Fi IP Address could not be auto-detected.");
  }
  console.log("================================================================");
});


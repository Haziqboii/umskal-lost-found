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
      image: "seed_matric.png",
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
      image: "seed_wallet.png",
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
      image: "seed_bottle.png",
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
      image: "seed_keys.png",
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
      image: "seed_wallet.png",
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
      image: "seed_phone.png",
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
      image: "seed_matric.png",
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
      image: "seed_backpack.png",
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
      image: "seed_phone.png",
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
      proofImage: "seed_keys.png",
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

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ==========================================================================
// REST API Endpoint Mappings
// ==========================================================================
app.get('/api/items', (req, res) => {
  res.json(db.verifiedItems);
});

app.post('/api/items', (req, res) => {
  const item = req.body;
  db.verifiedItems.unshift(item);
  res.status(201).json(item);
});

app.get('/api/lost-reports', (req, res) => {
  res.json(db.lostReports);
});

app.post('/api/lost-reports', (req, res) => {
  const report = req.body;
  db.lostReports.unshift(report);

  db.notifications.unshift({
    id: `NT-${Date.now()}`,
    title: "Lost Report Filed",
    message: `Your lost report for '${report.name}' has been submitted successfully.`,
    time: "Just now",
    type: "info",
    unread: true
  });

  db.activities.unshift({
    time: getFormattedTime(),
    text: `Student filed Lost Report: <strong>${report.name}</strong>.`,
    type: "Lost Report",
    ref: report.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(report);
});

app.post('/api/lost-reports/:id/match', (req, res) => {
  const id = req.params.id;
  const { itemId } = req.body;

  const reportIndex = db.lostReports.findIndex(r => r.id === id);
  const item = db.verifiedItems.find(i => i.id === itemId);

  if (reportIndex > -1 && item) {
    db.lostReports[reportIndex].status = "Possible Match Found";
    db.lostReports[reportIndex].matchedItemId = itemId;

    db.notifications.unshift({
      id: `NT-${Date.now()}`,
      title: "Possible Match Found",
      message: `Management has matched your lost report '${db.lostReports[reportIndex].name}' with verified item Ref: #${item.reference}. Please check details and submit claim proof.`,
      time: "Just now",
      type: "warning",
      unread: true
    });

    db.activities.unshift({
      time: getFormattedTime(),
      text: `Admin suggested match for Lost Report <strong>${id}</strong> with Verified Item <strong>${itemId}</strong>.`,
      type: "Match Suggestion",
      ref: id,
      timestamp: new Date().toISOString()
    });

    res.json(db.lostReports[reportIndex]);
  } else {
    res.status(404).json({ error: "Report or Item not found" });
  }
});


app.get('/api/found-reports', (req, res) => {
  res.json(db.foundReports);
});

app.post('/api/found-reports', (req, res) => {
  const report = req.body;
  db.foundReports.unshift(report);

  db.notifications.unshift({
    id: `NT-${Date.now()}`,
    title: "Found Item Reported",
    message: `You reported finding a '${report.name}'. Please hand it over to the Lost & Found Counter.`,
    time: "Just now",
    type: "warning",
    unread: true
  });

  db.activities.unshift({
    time: getFormattedTime(),
    text: `Found Item reported: <strong>${report.name}</strong> by finder <strong>${report.finderMatric}</strong>.`,
    type: "Found Report",
    ref: report.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(report);
});

app.delete('/api/found-reports/:id', (req, res) => {
  const id = req.params.id;
  const index = db.foundReports.findIndex(f => f.id === id);
  if (index > -1) {
    const item = db.foundReports[index];
    db.foundReports.splice(index, 1);

    db.notifications.unshift({
      id: `NT-${Date.now()}`,
      title: "Found Report Rejected",
      message: `Your found report for '${item.name}' was rejected by management.`,
      time: "Just now",
      type: "danger",
      unread: true
    });

    db.activities.unshift({
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

app.get('/api/claims', (req, res) => {
  res.json(db.claims);
});

app.post('/api/claims', (req, res) => {
  const claim = req.body;
  db.claims.unshift(claim);

  const itemIndex = db.verifiedItems.findIndex(i => i.id === claim.itemId);
  if (itemIndex > -1) {
    db.verifiedItems[itemIndex].status = "Claim Pending";
  }

  // Sync state of linked lost report
  if (claim.lostReportId) {
    const reportIndex = db.lostReports.findIndex(r => r.id === claim.lostReportId);
    if (reportIndex > -1) {
      db.lostReports[reportIndex].status = "Claim Pending";
    }
  }

  db.notifications.unshift({
    id: `NT-${Date.now()}`,
    title: "Claim Submitted Successfully",
    message: `Management will review your proof of ownership and update your claim status.`,
    time: "Just now",
    type: "info",
    unread: true
  });

  db.activities.unshift({
    time: getFormattedTime(),
    text: `Claim request submitted by <strong>${claim.studentMatric}</strong> on <strong>${claim.itemName}</strong>.`,
    type: "Claim Request",
    ref: claim.id,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(claim);
});

app.put('/api/claims/:id', (req, res) => {
  const id = req.params.id;
  const { status, adminNote } = req.body;

  const claimIndex = db.claims.findIndex(c => c.id === id);
  if (claimIndex > -1) {
    db.claims[claimIndex].status = status;
    if (adminNote !== undefined) {
      db.claims[claimIndex].adminNote = adminNote;
    }
    const claim = db.claims[claimIndex];

    const itemIndex = db.verifiedItems.findIndex(i => i.id === claim.itemId);
    const reportIndex = claim.lostReportId ? db.lostReports.findIndex(r => r.id === claim.lostReportId) : -1;

    if (status === 'Ready for Collection') {
      if (itemIndex > -1) db.verifiedItems[itemIndex].status = "Ready for Collection";
      if (reportIndex > -1) db.lostReports[reportIndex].status = "Ready for Collection";

      db.notifications.unshift({
        id: `NT-${Date.now()}`,
        title: "Claim Approved",
        message: `Your claim for '${claim.itemName}' was approved. Please collect your item at the Lost & Found Counter.`,
        time: "Just now",
        type: "success",
        unread: true
      });

      db.activities.unshift({
        time: getFormattedTime(),
        text: `Claim approved: <strong>${claim.itemName}</strong> ready for collection.`,
        type: "Claim Approval",
        ref: id,
        timestamp: new Date().toISOString()
      });
    }
    else if (status === 'Returned') {
      if (itemIndex > -1) db.verifiedItems[itemIndex].status = "Returned";
      if (reportIndex > -1) db.lostReports[reportIndex].status = "Returned";

      db.notifications.unshift({
        id: `NT-${Date.now()}`,
        title: "Item Returned Successfully",
        message: `Your item '${claim.itemName}' has been marked as returned.`,
        time: "Just now",
        type: "success",
        unread: true
      });

      db.activities.unshift({
        time: getFormattedTime(),
        text: `Item returned: <strong>${claim.itemName}</strong> returned to <strong>${claim.studentName}</strong>.`,
        type: "Item Returned",
        ref: claim.itemId,
        timestamp: new Date().toISOString()
      });
    }
    else if (status === 'Rejected') {
      if (itemIndex > -1) db.verifiedItems[itemIndex].status = "Available for Claim";
      if (reportIndex > -1) {
        db.lostReports[reportIndex].status = "Submitted";
        db.lostReports[reportIndex].matchedItemId = null;
      }

      db.notifications.unshift({
        id: `NT-${Date.now()}`,
        title: "Claim Rejected",
        message: `Your claim for '${claim.itemName}' was rejected by management.`,
        time: "Just now",
        type: "danger",
        unread: true
      });

      db.activities.unshift({
        time: getFormattedTime(),
        text: `Admin rejected claim request by <strong>${claim.studentMatric}</strong> on <strong>${claim.itemName}</strong>.`,
        type: "Claim Rejection",
        ref: id,
        timestamp: new Date().toISOString()
      });
    }

    res.json(claim);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

app.post('/api/admin/verify-intake', (req, res) => {
  const { reportId, verifiedItem } = req.body;

  db.verifiedItems.unshift(verifiedItem);

  const index = db.foundReports.findIndex(f => f.id === reportId);
  if (index > -1) {
    const report = db.foundReports[index];
    db.foundReports.splice(index, 1);

    db.notifications.unshift({
      id: `NT-${Date.now()}`,
      title: "Your found item has been verified.",
      message: `Thank you! Your found report for '${report.name}' has been verified and marked as available for claim.`,
      time: "Just now",
      type: "success",
      unread: true
    });

    db.activities.unshift({
      time: getFormattedTime(),
      text: `Found item verified: <strong>${verifiedItem.name}</strong> marked as Available for Claim.`,
      type: "Verification",
      ref: verifiedItem.id,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, verifiedItem });
});

app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const id = req.params.id;
  const index = db.notifications.findIndex(n => n.id === id);
  if (index > -1) {
    db.notifications[index].unread = false;
    res.json(db.notifications[index]);
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

app.put('/api/notifications/read-all', (req, res) => {
  db.notifications.forEach(n => n.unread = false);
  res.json({ success: true });
});

app.get('/api/activities', (req, res) => {
  res.json(db.activities);
});

app.post('/api/reset', (req, res) => {
  db = JSON.parse(JSON.stringify(DEFAULT_STATE));
  res.json({ success: true, message: "Database state reset to defaults." });
});

app.put('/api/found-reports/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const index = db.foundReports.findIndex(f => f.id === id);
  if (index > -1) {
    db.foundReports[index].status = status;

    if (status === "Under Review") {
      db.notifications.unshift({
        id: `NT-${Date.now()}`,
        title: "Item Verification Started",
        message: `Your found item '${db.foundReports[index].name}' status is now: Under Review.`,
        time: "Just now",
        type: "info",
        unread: true
      });
    }

    res.json(db.foundReports[index]);
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


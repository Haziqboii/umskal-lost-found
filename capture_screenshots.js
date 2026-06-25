const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Handle alerts/dialogs automatically to prevent hanging
  page.on('dialog', async dialog => {
    try {
      console.log(`[DIALOG STAFF] Dismissing: ${dialog.message()}`);
      await dialog.dismiss();
    } catch (e) {
      console.log(`[DIALOG STAFF] Dismiss failed: ${e.message}`);
    }
  });
  
  // Set window size for staff portal
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Staff Login Page
  console.log('Capturing staff_login.png...');
  await page.goto('http://localhost:3000/admin.html');
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'staff_login.png') });

  // Helper function to login to staff portal
  async function staffLogin(email, password) {
    await page.evaluate(() => {
      document.getElementById('adm-email').value = '';
      document.getElementById('adm-password').value = '';
    });
    await page.type('#adm-email', email);
    await page.type('#adm-password', password);
    await page.click('#admin-login-container button.btn');
    await sleep(1500);
  }

  // 2. DO Route Status Manager
  console.log('Capturing do_dashboard.png...');
  await staffLogin('do@klisp.gov.my', 'password123');
  await page.screenshot({ path: path.join(screenshotDir, 'do_dashboard.png') });

  // 3. DO Audit Log History
  console.log('Capturing do_audit_logs.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-do-logs'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'do_audit_logs.png') });

  // 4. DO Parent Block Reports Review
  console.log('Capturing do_parent_reports.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-do-reports-review'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'do_parent_reports.png') });

  // 5. PPD School Directory
  console.log('Capturing ppd_directory.png...');
  await page.evaluate(() => demoSwitchRole('ppd'));
  await sleep(1500);
  await page.evaluate(() => navigateToStaffScreen('scr-ppd-schools'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'ppd_directory.png') });

  // 6. PPD Area Alert Dispatcher
  console.log('Capturing ppd_area_alert.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-ppd-notify'));
  await sleep(1000);
  // Select Bingkor area
  await page.select('#ppd-search-area', 'A-01');
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'ppd_area_alert.png') });

  // 7. School PIC Event Coordinator (Before Activation)
  console.log('Capturing pic_event_coord.png...');
  await page.evaluate(() => demoSwitchRole('pic'));
  await sleep(1500);
  await page.evaluate(() => navigateToStaffScreen('scr-pic-events'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'pic_event_coord.png') });

  // Toggle Controlled Pickup options block in UI so it's shown in screenshot
  await page.evaluate(() => togglePicActionSelect('activate'));
  await sleep(500);
  await page.screenshot({ path: path.join(screenshotDir, 'pic_event_coord_active_instructions.png') });

  // Now, let's open parent portal
  console.log('Switching to parent portal page...');
  const parentPage = await browser.newPage();
  
  // Handle alerts/dialogs automatically to prevent hanging
  parentPage.on('dialog', async dialog => {
    try {
      console.log(`[DIALOG PARENT] Dismissing: ${dialog.message()}`);
      await dialog.dismiss();
    } catch (e) {
      console.log(`[DIALOG PARENT] Dismiss failed: ${e.message}`);
    }
  });

  await parentPage.setViewport({ width: 1200, height: 900 });

  // 8. Parent Login Page
  console.log('Capturing parent_login.png...');
  await parentPage.goto('http://localhost:3000/');
  await sleep(1000);
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_login.png') });

  // Login as parent
  console.log('Logging in as parent...');
  await parentPage.evaluate(() => {
    document.getElementById('parent-email').value = '';
    document.getElementById('parent-password').value = '';
  });
  await parentPage.type('#parent-email', 'parent1@gmail.com');
  await parentPage.type('#parent-password', 'password123');
  await parentPage.click('#scr-parent-login button.auth-btn');
  await sleep(1500);

  // 9. Parent Dashboard Default Normal
  console.log('Capturing parent_dashboard_normal.png...');
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_dashboard_normal.png') });

  // Now back to PIC to ACTIVATE controlled pickup event
  console.log('Activating event in PIC portal...');
  await page.bringToFront();
  await page.evaluate(() => navigateToStaffScreen('scr-pic-events'));
  await sleep(500);
  await page.evaluate(() => picCreateEvent('activate'));
  await sleep(1500);
  // Broadcast notices to parents
  await page.evaluate(() => picNotifyParentsBroadcast());
  await sleep(1500);

  // Back to Parent Page to see route advisory
  console.log('Viewing active event parent page...');
  await parentPage.bringToFront();
  await parentPage.evaluate(() => navigateToParentTab('home'));
  await sleep(1500);
  // 10. Parent Route Advisory & Active Notification Banner
  console.log('Capturing parent_advisory_active.png...');
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_advisory_active.png') });

  // Open Response Modal on Parent Page
  await parentPage.evaluate(() => {
    const btn = document.querySelector('#parent-children-container button.auth-btn');
    if (btn) btn.click();
  });
  await sleep(1000);
  // 11. Parent Response Modal
  console.log('Capturing parent_response_modal.png...');
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_response_modal.png') });

  // Submit response "On The Way" + Select route R-02 (Jalan Apin-Apin Bypass)
  console.log('Submitting parent response...');
  await parentPage.evaluate(() => {
    setResponseSelection('on_the_way');
    document.getElementById('response-select-route').value = 'R-02';
  });
  await sleep(500);
  await parentPage.evaluate(() => {
    const btn = document.querySelector('#response-modal button.auth-btn');
    if (btn) btn.click();
  });
  await sleep(1500);

  // 12. Parent Report Block page
  console.log('Opening parent report blockage page...');
  await parentPage.evaluate(() => navigateToParentTab('report'));
  await sleep(1000);
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_report_block.png') });

  // Submit a report blockage
  console.log('Submitting parent report blockage...');
  await parentPage.evaluate(() => {
    document.getElementById('report-select-route').value = 'R-02';
    document.getElementById('report-issue-desc').value = 'Water is overflowing the main drain, road is flooded!';
  });
  await sleep(500);
  await parentPage.evaluate(() => {
    const btn = document.querySelector('#scr-parent-report-road button.auth-btn');
    if (btn) btn.click();
  });
  await sleep(1500);
  await parentPage.screenshot({ path: path.join(screenshotDir, 'parent_report_block_submitted.png') });

  // Go to Teacher portal
  console.log('Switching to Class Teacher portal...');
  await page.bringToFront();
  await page.evaluate(() => demoSwitchRole('teacher'));
  await sleep(2000);

  // 13. Teacher Class Handover Verification (with student selected)
  console.log('Capturing teacher_handover.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-teacher-class'));
  await sleep(1500);
  // Select first student card
  await page.evaluate(() => {
    const btn = document.querySelector('#teacher-student-scroll .student-list-item');
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'teacher_handover.png') });

  // Mark all students as Ready (bulk)
  console.log('Marking students bulk Ready...');
  await page.evaluate(() => teacherBulkMarkReady());
  await sleep(1500);

  // Confirm handover for the first student (ST-01 Adam bin Haziq)
  console.log('Confirming handover for Adam...');
  await page.evaluate(() => {
    document.getElementById('teacher-handover-remarks').value = 'Father visually matched IC at gate.';
  });
  await sleep(500);
  await page.evaluate(() => {
    const btn = document.querySelector('#teacher-verification-details-panel button[style*="var(--success)"]');
    if (btn) btn.click();
  });
  await sleep(1500);

  // 14. Teacher Class Records CRUD
  console.log('Capturing teacher_records.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-teacher-students'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'teacher_records.png') });

  // Switch to PIC to close event
  console.log('Switching to PIC to close event...');
  await page.evaluate(() => demoSwitchRole('pic'));
  await sleep(2000);
  
  // 15. PIC Event Active Dashboard Monitoring
  console.log('Capturing pic_event_dashboard.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-pic-events'));
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotDir, 'pic_event_dashboard.png') });

  // Open Close Event resolution checklist modal
  console.log('Opening PIC close event modal...');
  await page.evaluate(() => {
    const btn = document.querySelector('#pic-event-active-block button.btn-danger');
    if (btn) btn.click();
  });
  await sleep(1500);
  // 16. PIC Close Resolution Modal
  console.log('Capturing pic_close_resolution.png...');
  await page.screenshot({ path: path.join(screenshotDir, 'pic_close_resolution.png') });

  // Submit resolutions & close event
  console.log('Submitting resolutions and closing event...');
  await page.evaluate(() => {
    const btn = document.querySelector('#modal-pic-close-event button.btn-danger');
    if (btn) btn.click();
  });
  await sleep(2000);

  // 17. PIC summary AI Report Page
  console.log('Capturing pic_evaluation_report.png...');
  await page.evaluate(() => navigateToStaffScreen('scr-pic-classes'));
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotDir, 'pic_evaluation_report.png') });

  console.log('Closing browser...');
  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('CRITICAL SCREENSHOT ERROR:', err);
  process.exit(1);
});

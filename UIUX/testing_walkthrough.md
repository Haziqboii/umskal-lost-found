# UMSKAL Lost & Found Interactive Testing Walkthrough

Welcome to the **UMSKAL Lost & Found System**! Share this guide with your friends so they can test every single feature on both the **Student** and **Admin** portals.

---

## 🔑 Login Access
*   **Student App URL**: `https://your-vercel-domain.vercel.app/`
    *   *Default credentials*: Use the pre-filled username/password or register a new student account!
*   **Admin Dashboard URL**: `https://your-vercel-domain.vercel.app/admin.html`
    *   *Email*: `dahlan_hep@ums.edu.my`
    *   *Password*: `admin123`

---

## 📱 PART 1: Student Portal (User Side)

Have your friends perform these actions on their phones or browsers:

### 1. File a "Lost Item Report" (User loses an item)
1. Navigate to the **Report Lost** tab (magnifying glass with a minus icon).
2. Fill out the step-by-step reporting form:
   - **Item Name**: E.g., *"My Blue Laptop"* or *"Black Nike Wallet"*
   - **Category**: Select the appropriate category (e.g., *Electronics* or *Wallet*)
   - **Last Seen Location**: E.g., *DK 3* or *Library*
   - **Date & Time Lost**: Select today's details
   - **Description**: Add unique details (e.g., *"Has a red sticker on the back"*)
   - **Upload Image**: Tap/click to upload a mockup photo of the lost item.
3. Click **Submit Lost Report**.
4. Go to the **My Reports** tab to check the status. It will show a status badge of **`Submitted`**.

### 2. File a "Found Item Report" (User finds someone else's item)
1. Go to the **Report Found** tab (magnifying glass with a plus icon).
2. Fill out the report details:
   - **Item Name**: E.g., *"Stainless Steel Water Bottle"*
   - **Category**: Select *Bottle*
   - **Found Location**: E.g., *Cafeteria Lobby*
   - **Upload Image**: Upload an image of the item.
   - **Your Information**: Input finder name, matric number, and email.
3. Check the handover confirmation checkbox and click **Submit Found Report**.
4. This item goes to the **Admin queue** for counter verification.

### 3. Track Status & Notifications
1. Click the **Notification Bell** icon at the top right of the student portal to see real-time alert logs.
2. Go to **My Reports**, select your filed report, and click **View Status** to see the interactive progress timeline change colors dynamically based on verification status.

---

## 💻 PART 2: Admin Portal (Management Side)

Open the admin dashboard on a desktop and log in:

### 1. Verify and Intake a Found Report (Counter Handover)
1. Go to the **Found Items Management** tab in the sidebar.
2. Under **Pending Verification**, you will see the *"Stainless Steel Water Bottle"* report submitted in the student step.
3. Click the navy outline **View** button.
4. Verify finder details, tick the checkbox indicating the item was handed over physically, and click the solid navy **Approve Item** button.
5. *Result*: The report disappears from the pending queue and is added to the **Verified Inventory** as **`Available for Claim`**!

### 2. Match a Lost Report with a Verified Item
1. Go to the **Lost Reports** tab in the sidebar.
2. Find the *"My Blue Laptop"* report from the student step.
3. Click the solid navy **Suggest Match** button.
4. The system automatically searches for items in the same category. Select a verified matching item from the dropdown list and click **Submit Match**.
5. *Result*: The student receives a notification, and the report status updates to **`Possible Match Found`** on both student and admin sides.

### 3. Submit & Approve/Reject an Ownership Claim
1. **Student Side**: Open the student portal, tap the **Notification** warning or look under **My Reports** to find the suggestion. Click **Claim This Item**.
2. Fill out the unique details proving ownership, upload a proof receipt or matching photo, and click **Submit Claim**.
3. **Admin Side**: Navigate to the **Claim Requests** tab on the Admin Dashboard.
4. You will see the new claim pending. Click the **Review** button.
5. Look at the gold-bordered **Verification Evidence** box. Click on the proof image thumbnail to open the click-to-zoom **Image Lightbox** overlay.
6. Enter an optional administrator note.
7. Tick the verification checkbox and choose:
   - **Approve**: Marks status as **`Ready for Collection`** (student gets notified to collect it at the counter).
   - **Reject**: Rejects claim (status returns to available, button styled in red with white text).
8. Once collected, click **Mark as Returned** to log the resolved case.

### 4. System Settings (Add Tags)
1. Go to **System Settings** in the admin sidebar.
2. Add a new **Category Tag** or **Location Tag** using the input fields and clicking **Add Tag**.
3. Go back to the Student Report forms; you will see the new options appear instantly in the dropdowns!

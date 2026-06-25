# CHAPTER 4: SYSTEM PROTOTYPE IMPLEMENTATION & USER INTERFACE DESIGN

## 4.1 Introduction to the K-LiSP Prototype
The Keningau Life Safety Dismissal Pipeline (K-LiSP) prototype is implemented as a multi-role web application built on Node.js and Express, utilizing a remote Supabase PostgreSQL database to maintain system state and relational constraints. The user interface is designed using HTML5, Vanilla CSS, and JavaScript, styled with clean, high-contrast layouts.

This section presents the prototype implementation by showcasing each user role's primary dashboard (homepage) and the core coordination functions that drive the safety pipeline flow:
1. **Portal Authentication Gateways** (Figure 4.1)
2. **District Office (DO) Route Status Manager** (Figure 4.2)
3. **PPD School Directory & Route Linkage Dashboard** (Figure 4.3)
4. **School PIC Active Emergency Event Coordinator** (Figure 4.4)
5. **Parent Portal Homepage (Normal State)** (Figure 4.5)
6. **Active Incident Route Advisory & Response Form** (Figure 4.6)
7. **Class Teacher Gate Handover Verification Dashboard** (Figure 4.7)
8. **Post-Event Dismissal Summary and AI-Generated Safety Evaluation** (Figure 4.8)

---

## 4.2 Portal Authentication Gateways
The prototype uses a role-based access control (RBAC) security model to divide administrative and parental workspaces.

As shown in **Figure 4.1**, separate entry portals are provided. The **Staff Portal Login** uses a desktop-oriented design containing email and password inputs restricted to registered DO, PPD, PIC, and Class Teacher credentials. The **Parent Portal Login** is structured with mobile-responsive viewport styling, serving as the secure entry gateway for guardians to access child statuses and coordinate pickups on their mobile devices.

```
[Insert Figure 4.1 here: Staff and Parent Portal Login Interfaces]
Associated Images: staff_login.png, parent_login.png
Caption: Figure 4.1: Staff and Parent Portal Login Interfaces
```

---

## 4.3 District Office (DO) Route Status Manager (Dashboard)
The District Office (DO) acts as the primary coordinator for road safety registries and predefined route advisory logs.

As shown in **Figure 4.2**, the **DO Dashboard** presents the Keningau Route Safety Advisory registry. Key interface widgets include calculated KPI statistics cards (Total Routes, Safe, At Risk, and Blocked Feedback) that pull real-time database counts. The core function of this homepage is the *Route Recommendation Switcher*, allowing DO officers to toggle route statuses (e.g. Safe, Caution, Flooded, Closed). Every status transition writes a mandatory audit log entry to the database and propagates warnings to parent dashboards.

```
[Insert Figure 4.2 here: DO Route Safety Advisory Dashboard]
Associated Image: do_dashboard.png
Caption: Figure 4.2: DO Route Safety Advisory Dashboard
```

---

## 4.4 PPD School Directory & Route Linkage Dashboard
The PPD Officer oversees school records, sub-district areas, and predefined school route links.

As shown in **Figure 4.3**, the **PPD Dashboard** displays the district's school directory alongside route configuration panels. Key widgets include a local search input box that filters school cards instantly by name, and lists of assigned routes. The core function of this interface is to establish school-to-route linkages. By configuring which roads connect to which school grounds, the system can dynamically identify which schools are affected by specific road flooding, even if the school grounds themselves are dry.

```
[Insert Figure 4.3 here: PPD School Directory and Predefined Route Linkage Board]
Associated Image: ppd_directory.png
Caption: Figure 4.3: PPD School Directory and Predefined Route Linkage Board
```

---

## 4.5 School PIC Active Emergency Event Coordinator (Dashboard)
The School Person-in-Charge (PIC) dashboard controls the activation, monitoring, and closure of school-specific emergency events.

As shown in **Figure 4.4**, the **School PIC Dashboard** contains pickup activation controls. When local weather risk increases, the PIC uses this interface to change the school status to "Controlled Pickup" (entering specific dismissal instructions) or "Hold Pickup" (entering a postponement reason if the school grounds are flooded). The core backend trigger of this page is the *Broadcast Notification* action, which issues push notices to all linked parents and shifts student database records to "Notified" status.

```
[Insert Figure 4.4 here: School PIC Event Coordinator Interface]
Associated Image: pic_event_coord.png
Caption: Figure 4.4: School PIC Event Coordinator Interface
```

---

## 4.5 Parent Portal Homepage (Normal State)
The Parent Portal serves as the primary coordination dashboard for guardians and is designed to run efficiently on mobile viewports.

As shown in **Figure 4.5**, in its normal state (when no active emergency event is declared for the child's school), the **Parent Dashboard** displays a list of registered children associated with the logged-in guardian's IC number. Each card displays the child's name, class, and school. The dashboard remains in standby mode, checking for active dismissal events and displaying regular student indicators.

```
[Insert Figure 4.5 here: Parent Multi-Child Portal Homepage (Normal Standby State)]
Associated Image: parent_dashboard_normal.png
Caption: Figure 4.5: Parent Multi-Child Portal Homepage (Normal Standby State)
```

---

## 4.6 Active Incident Route Advisory & Response Form (Core Parent Action)
When a school pickup event is active, the parent portal transitions into coordination mode to acquire live travel plans.

As shown in **Figure 4.6**, the parent dashboard displays a high-visibility warning banner showing school instructions (e.g. controlled gate pickup) and a **Route Advisory List** showing the safety status of assigned roads. Clicking the "Respond" button triggers the **Pickup Response Modal**. Parents select their response option (`I am On The Way` + Selected Travel Route, `Delayed`, `Routes Blocked`, or designating an `Alternate Guardian`). Once submitted, this data propagates to the teacher's gate check terminal.

```
[Insert Figure 4.6 here: Parent Active Advisory Dashboard and Response Form Modal]
Associated Images: parent_advisory_active.png, parent_response_modal.png
Caption: Figure 4.6: Parent Active Advisory Dashboard and Response Form Modal
```

---

## 4.7 Class Teacher Gate Handover Verification Dashboard
The Class Teacher interface is designed for gate-side use to verify parent identities and check-in arrivals.

As shown in **Figure 4.7**, the **Teacher Handover Dashboard** displays a scrollable roster of students. The core function of this interface is physical verification: selecting a student card opens the *Handover Verification Panel*, rendering the parent's registered name and IC number for visual matching. If the parent has submitted a substitute guardian response, the panel displays a red warning banner detailing the alternate delegate's credentials. Clicking "Confirm Handover" logs a verification record and updates the child's status to "Picked Up."

```
[Insert Figure 4.7 here: Class Teacher Gate Handover Verification Workspace]
Associated Image: teacher_handover.png
Caption: Figure 4.7: Class Teacher Gate Handover Verification Workspace
```

---

## 4.8 Post-Event Dismissal Summary & AI Evaluation (Core PIC Action)
Upon closing the dismissal event, the system aggregates data to support future district planning.

As shown in **Figure 4.8**, closing the event triggers the generation of the **Dismissal Evaluation Report**. This screen presents statistics detailing total students safely dismissed, issues resolved, and average pickup durations. An integrated natural language generation module analyses the event logs to produce an **AI Incident Summary**, outlining bottleneck routes and offering recommendations to PPD and DO coordinators for route hazard management.

```
[Insert Figure 4.8 here: AI-Generated Dismissal Summary Evaluation Report]
Associated Image: pic_evaluation_report.png
Caption: Figure 4.8: AI-Generated Dismissal Summary Evaluation Report
```

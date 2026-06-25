# CHAPTER 4: SYSTEM PROTOTYPE IMPLEMENTATION & USER INTERFACE DESIGN

## 4.1 Introduction to the K-LiSP Prototype
The Keningau Life Safety Dismissal Pipeline (K-LiSP) prototype is implemented as a multi-role web application built on Node.js and Express, utilizing a remote Supabase PostgreSQL database to maintain system state and relational constraints. The user interface is designed using HTML5, Vanilla CSS, and JavaScript, styled with clean, high-contrast layouts.

To present the prototype without excessive redundancy, this section highlights the five (5) key interfaces that represent the core safety pipeline flow:
1. **DO Route Status Manager** (Figure 4.1) – Establishing route safety recommendations.
2. **School PIC Event Coordinator** (Figure 4.2) – Initializing the controlled dismissal process.
3. **Parent Advisory & Response Portal** (Figure 4.3) – Transmitting live status updates and travel routes.
4. **Class Teacher Gate Verification** (Figure 4.4) – Authenticating parent identity at the school gate.
5. **Post-Event Summary & AI Evaluation** (Figure 4.5) – Reviewing system analytics and AI incident summaries.

---

## 4.2 Predefined Route Safety Management (District Office)
The District Office (DO) serves as the primary authority for assessing and logging the safety status of Keningau's road network. 

As shown in **Figure 4.1**, the DO Dashboard provides a centralized registry of predefined school routes. The interface calculates key metrics (Total Routes, Safe, Caution, Flooded, Closed) and provides status controls. When a route is marked as "Caution" or "Flooded," the system automatically flags this status on the parent portal and updates school-to-route linkages to reroute parents away from hazard zones.

```
[Insert Figure 4.1 here: DO Route Safety Advisory Dashboard]
Filename: do_dashboard.png
Caption: Figure 4.1: DO Route Safety Advisory Dashboard
```

---

## 4.3 Controlled Dismissal Activation (School PIC)
The School Person-in-Charge (PIC) coordinates school-wide safety responses when weather alerts are issued by the PPD or DO. 

As shown in **Figure 4.2**, the School PIC dashboard enables the active event coordinator to trigger a "Controlled Pickup" or a "Hold Pickup" depending on the conditions of the school grounds and surrounding routes. Activating the event broadcasts instant push notifications to all parents linked to the school, transitioning student statuses in the database from "Supervised" to "Notified" to prompt immediate parental coordination.

```
[Insert Figure 4.2 here: School PIC Event Coordinator Interface]
Filename: pic_event_coord.png
Caption: Figure 4.2: School PIC Event Coordinator Interface
```

---

## 4.4 Parent Portal Active Dashboard & Coordination
The Parent Portal is designed with a responsive, mobile-first card layout to ensure guardians can coordinate pickups while traveling.

As shown in **Figure 4.3**, when a school dismissal event is activated, the Parent Dashboard updates with a high-visibility warning banner showing active instructions. Parents view route safety recommendations synchronized with the DO's logs and use the "Respond" button to select their transit status (e.g., "On the Way" + Selected Route, "Delayed," or designating an alternate guardian's name and IC).

```
[Insert Figure 4.3 here: Parent Portal Active Dashboard with Advisory Banner]
Filename: parent_advisory_active.png
Caption: Figure 4.3: Parent Portal Active Dashboard with Advisory Banner
```

---

## 4.5 Gate Handover Physical Verification (Class Teacher)
During an active dismissal, Class Teachers manage gate-side verification to prevent unauthorized student release or pickup mismatch.

As shown in **Figure 4.4**, the teacher gate verification workspace presents a scrollable list of class students. Selecting a student displays their specific parent verification card. The system renders the registered parent's full name, IC number, and contact details. If the parent has designated an alternate guardian, a red alert banner appears on the teacher's screen containing the delegate's name and IC. Clicking "Confirm Handover" logs a timestamped entry in the system database and marks the student's status as "Picked Up."

```
[Insert Figure 4.4 here: Class Teacher Gate Handover Verification Workspace]
Filename: teacher_handover.png
Caption: Figure 4.4: Class Teacher Gate Handover Verification Workspace
```

---

## 4.6 Post-Event Summary & AI Evaluation (School PIC)
Once all students are safely dismissed or accounted for through emergency contacts, the School PIC closes the event. 

As shown in **Figure 4.5**, the system provides a post-dismissal report summarizing event durations and safety metrics. The prototype features an integrated AI-Powered summary module that evaluates the dismissal operation (calculating average pickup time, summarizing parents' travel blockages, and identifying critical bottleneck routes) to assist in district-level flood response planning.

```
[Insert Figure 4.5 here: AI-Generated Dismissal Summary Evaluation Report]
Filename: pic_evaluation_report.png
Caption: Figure 4.5: AI-Generated Dismissal Summary Evaluation Report
```

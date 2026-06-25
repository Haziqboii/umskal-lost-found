# CHAPTER 4: SYSTEM PROTOTYPE IMPLEMENTATION & USER INTERFACE DESIGN

## 4.1 Introduction to the K-LiSP Prototype
The Keningau Life Safety Dismissal Pipeline (K-LiSP) prototype was implemented using a Node.js Express backend and a responsive front-end designed using HTML5, Vanilla CSS, and JavaScript. The prototype is connected to a remote Supabase PostgreSQL database to manage the system state and relationship constraints.

This section presents the final implementation screens and user interface layouts for each of the five core roles involved in the safety dismissal pipeline:
1. District Office (DO)
2. PPD Officer
3. School Person-in-Charge (PIC)
4. Class Teacher
5. Parent / Guardian

---

## 4.2 Portal Authentication & Entry Points
The prototype is divided into two distinct portals to isolate responsibilities:
1. **The Parent Portal:** Accessible via mobile-responsive layouts, allowing parents to coordinate pickup actions while on the move.
2. **The Staff Portal:** Accessible via desktop-oriented administrative layouts, containing tabbed workspaces for DO, PPD, School PIC, and Teacher roles.

### 4.2.1 Portal Entry Interfaces
The login screens serve as the authentication gate for role-based access control (RBAC). The staff interface restricts administrative actions to authorized accounts.

```
[Insert Figure 4.1 here: Staff Portal Login Interface]
Caption: Figure 4.1: Staff Portal Login Interface
```

```
[Insert Figure 4.2 here: Parent Portal Login Interface]
Caption: Figure 4.2: Parent Portal Login Interface
```

---

## 4.3 District Office (DO) Interface Implementation
The District Office manages the predefined route safety registries.

### 4.3.1 Predefined Route Safety Manager
The DO home dashboard presents the **Keningau Route Safety Advisory List**. This interface contains visual KPI cards calculating *Total Routes*, *Safe Routes*, *At Risk/Flooded*, and *Blocked Feedback*. The DO can add, edit, or deactivate routes, and change their safety recommendation status (e.g. Safe, Caution, Flooded, Closed).

```
[Insert Figure 4.3 here: DO Route Safety Advisory Dashboard]
Caption: Figure 4.3: DO Route Safety Advisory Dashboard
```

### 4.3.2 Route Status Change Audit Trail
To ensure accountability, every route status change requires a written remark and updates the **Route Status Update History** timeline log.

```
[Insert Figure 4.4 here: Route Status Update History (Audit Trail)]
Caption: Figure 4.4: Route Status Update History (Audit Trail)
```

### 4.3.3 Parent Block Reports Review
DO officers review blockage notifications reported by parents. The dashboard tracks parent descriptions, status badges, and reviewer actions.

```
[Insert Figure 4.5 here: DO Parent Block Reports Review Interface]
Caption: Figure 4.5: DO Parent Block Reports Review Interface
```

---

## 4.4 PPD Officer Interface Implementation
The PPD Officer manages school records and assigns routes.

### 4.4.1 School Directory & Route Linkages
The PPD screen displays the **Predefined School Directory** alongside a school-specific route linkages list, with a live local search filter.

```
[Insert Figure 4.6 here: PPD School Directory and Route Assignment Panel]
Caption: Figure 4.6: PPD School Directory and Route Assignment Panel
```

### 4.4.2 Area Alert Dispatcher (Dual-Condition Search)
The PPD can select a sub-district area to find affected schools using **dual-condition safety search logic** (schools located in the area + schools whose assigned routes pass through the area).

```
[Insert Figure 4.7 here: Area-Based School Alert Finder and Broadcast Tool]
Caption: Figure 4.7: Area-Based School Alert Finder and Broadcast Tool
```

---

## 4.5 School PIC Interface Implementation
The School PIC controls school-wide events.

### 4.5.1 Active Event Coordinator
The PIC decides whether to **Activate Controlled Pickup** (routes affected, school safe) or **Hold Pickup** (school grounds flooding).

```
[Insert Figure 4.8 here: School PIC Event Coordinator Interface]
Caption: Figure 4.8: School PIC Event Coordinator Interface
```

### 4.5.2 Live Class Handover Monitoring
When active, the PIC views the **Live School Pickup Progress Panel**, tracking student status metrics grouped by classroom.

```
[Insert Figure 4.9 here: School PIC Live Class Handover Monitoring Panel]
Caption: Figure 4.9: School PIC Live Class Handover Monitoring Panel
```

### 4.5.3 Event Close Resolution Checklist
Before closing an event, the system presents a **Safety Resolution Checklist** requiring actions for any student not marked "Picked Up".

```
[Insert Figure 4.10 here: School PIC Event Close Resolution Modal]
Caption: Figure 4.10: School PIC Event Close Resolution Modal
```

### 4.5.4 AI-Generated Dismissal Summary Evaluation Report
Upon closure, the system uses AI to generate a natural language summary evaluating the dismissal operation.

```
[Insert Figure 4.11 here: AI-Generated Dismissal Summary Report]
Caption: Figure 4.11: AI-Generated Dismissal Summary Report
```

---

## 4.6 Class Teacher Interface Implementation
Class Teachers manage student rosters and verify pickups.

### 4.6.1 Gate Handover Verification Workspace
Teachers open a student's record to view parent name and registered IC. If the parent has designated an alternate guardian, a red warning banner appears. Clicking **"Confirm Handover"** logs the release.

```
[Insert Figure 4.12 here: Class Teacher Gate Handover Verification Workspace]
Caption: Figure 4.12: Class Teacher Gate Handover Verification Workspace
```

### 4.6.2 Class Records & Parent Association
Teachers manage student names, parent contact profiles, and parent-student relationship links.

```
[Insert Figure 4.13 here: Class Student Roster and Parent-Student Linking Board]
Caption: Figure 4.13: Class Student Roster and Parent-Student Linking Board
```

---

## 4.7 Parent / Guardian Portal Interface Implementation
Parents use a mobile-friendly dashboard to view notices and submit responses.

### 4.7.1 Parent Active Status Dashboard
The dashboard displays the active pickup/hold instructions, children's class designations, and live status progress badges.

```
[Insert Figure 4.14 here: Parent Multi-Child Active Status Dashboard]
Caption: Figure 4.14: Parent Multi-Child Active Status Dashboard
```

### 4.7.2 Predefined Route Recommendations
Parents view recommended safe routes and warning tags calculated from DO's status updates.

```
[Insert Figure 4.15 here: Parent Route Advisory List]
Caption: Figure 4.15: Parent Route Advisory List
```

### 4.7.3 Submit Pickup Response Form
Parents select their response type (`On The Way`, `Delayed`, `Routes Blocked`, etc.) and submit, propagating the status to all linked children.

```
[Insert Figure 4.16 here: Parent Pickup Response Form Modal]
Caption: Figure 4.16: Parent Pickup Response Form Modal
```

### 4.7.4 Report Route Blockage
Parents select routes, describe blockage details, and submit reports to the DO.

```
[Insert Figure 4.17 here: Parent Route Blockage Reporting Page]
Caption: Figure 4.17: Parent Route Blockage Reporting Page
```

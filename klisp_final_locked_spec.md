# K-LiSP: Keningau Life Safety Pipeline — FINAL LOCKED SPECIFICATION

> **Document Status: 🔒 LOCKED**
> **Date Locked: 20 June 2026**
> **Purpose: This is the definitive system specification for the FYP report. No further changes.**

---

## 1. System Identity

**Full Name:** K-LiSP: Keningau Life Safety Pipeline

**One-Line Definition:**
> K-LiSP is a flood-based parent pickup route advisory and controlled student pickup coordination system for primary schools in Keningau.

**Extended Definition (for report):**
> K-LiSP allows the District Office (DO) to update official route status during flood risk, the Pejabat Pendidikan Daerah (PPD) to identify and notify affected schools based on area, the School Person-in-Charge (PIC) to activate controlled pickup events and notify parents, parents to view suggested safe routes and submit their pickup response, and Class Teachers to prepare students and verify pickup handover. The system focuses on safe and organized parent pickup during flood-related road disruption.

---

## 2. Problem Statement

During flood risk or road closure in Keningau:

**Parents do not know:**
- Which road is safe to use
- Which road is closed
- Whether the school has started pickup
- Whether their child is ready for pickup
- Which alternate route to use

**Schools do not know:**
- Which parents are coming
- Which parents are delayed or blocked
- Which students should be prepared first
- Which students have been picked up

**K-LiSP connects these users in one coordinated flow:**
> DO road status → PPD area-based school notification → School PIC controlled pickup → Parent route advisory and response → Teacher prepares student → Verified pickup

---

## 3. What K-LiSP Is NOT

| K-LiSP is NOT | Why |
|---|---|
| A flood prediction system | Does not predict weather or flood timing |
| A live GPS tracking system | Does not track real-time vehicle or person location |
| A Waze / Google Maps replacement | Does not provide turn-by-turn navigation |
| A full evacuation system | Does not coordinate rescue or shelter operations |
| A child location tracking system | Does not track where children are inside school |
| A rescue management system | Does not manage emergency responders |

**K-LiSP IS:**
> A controlled pickup and route advisory system for flood-related school dismissal disruption.

---

## 4. Users / Roles (5 Roles)

| # | Role | Primary Responsibility |
|---|---|---|
| 1 | District Office (DO) | Official road/route status management |
| 2 | PPD Officer | School management, route assignment, school notification |
| 3 | School PIC | Pickup event control, parent notification, event monitoring |
| 4 | Class Teacher | Student preparation, parent response monitoring, pickup verification |
| 5 | Parent / Guardian | View route advisory, submit pickup response, pickup handover |

### Why School has two roles (PIC + Teacher)

School PIC controls the whole-school pickup event. Class Teacher manages students in their own class. Without this separation, every teacher could send different instructions, creating confusion. The rule is:

> School PIC sends the official school pickup notice. Class Teachers manage their own students.

### Why PPD exists as a separate role

PPD represents the **education authority layer.** DO handles roads (infrastructure concern). PPD handles schools (education concern). This separation of concern ensures:
- DO does not need knowledge of school operations
- School decisions flow through the proper education authority channel
- PPD maintains oversight of which schools are notified and when

---

## 5. Role Details & CRUD

### 5.1 District Office (DO)

**Main Job:** Manage official road/route status in Keningau during flood events.

**Flow:**
1. Receives flood notification or flood risk information
2. Searches affected area
3. System shows all routes in that area
4. Updates the status of each route
5. Notifies PPD that flood risk has occurred in that area

**CRUD:**

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| Route List | Add route | View/search routes | Edit route info | Deactivate route |
| Route Status | Add status update | View status history | Update status | Delete wrong record |
| Flood Area Notice | Create flood notice | View notices | Update notice | Delete draft |
| PPD Notification | Send notification | View sent notifications | — | — |

**DO does NOT:** manage students, notify parents directly, decide school pickup process.

---

### 5.2 PPD Officer

**Main Job:** Connect flood-affected areas to affected schools. Manage school records and route assignments.

**Flow:**
1. Receives notice from DO
2. Searches the area name
3. System shows all schools in that area
4. Reviews school table
5. Selects affected schools and clicks **Notify School**
6. School PIC receives the flood risk alert

**CRUD:**

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| School Records | Add school | View/search schools | Edit school info | Deactivate school |
| School Route Assignment | Assign routes to school | View assigned routes | Update assignment | Remove route |
| Area-Based School Search | — | Search schools by area | — | — |
| School Notification | Send notice to school | View sent notices | — | — |

**PPD does NOT:** update road status, prepare students, notify parents directly, verify pickup.

---

### 5.3 School PIC

**Main Job:** Control the school-wide pickup event, notify parents, monitor class progress.

**Flow:**
1. Receives flood risk notice from PPD
2. Views the school's assigned route options with latest status from DO
3. **Assesses school ground condition** and decides the appropriate action
4. Takes one of two actions:
   - **Activate Controlled Pickup** → if school is safe but routes are affected
   - **Hold Pickup** → if school area itself is flooding/unsafe
5. Sends notification to all parents (pickup notice OR hold notice)
6. Monitors all class progress
7. Closes the event after pickup is completed

### School PIC Decision: Activate vs Hold

School PIC is the person ON THE GROUND who knows the school's condition. PIC has **two choices**:

| Decision | When to Use | What Happens |
|---|---|---|
| **Activate Controlled Pickup** | School is safe, but surrounding routes are affected | System creates pickup event → parents notified to come via safe route |
| **Hold Pickup** | School area is flooding or unsafe for parent travel | System sends HOLD notice to parents: "Do NOT come. Children are safe and supervised at school. Pickup is postponed." PIC also reports status to PPD. |

**If PIC chooses Hold Pickup:**
1. Parents receive: "Pickup is temporarily on hold. Your child is safe and supervised at school. Do NOT travel to school until further notice."
2. PIC sends a **situation report to PPD** (via notification) explaining why pickup is held
3. PPD is aware and can coordinate with DO if route status needs updating
4. When conditions improve, PIC can **switch from Hold to Activate** and the normal pickup flow begins

This ensures PIC is not forced to start pickup when it's unsafe, and parents are not left wondering what's happening.

**CRUD:**

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| Class Records | Add class | View classes | Edit class / assign teacher | Deactivate class |
| Pickup Event | Create event | View active event | Update event status (active/hold/closed) | Close/cancel event |
| Parent Notice | Send notice (pickup or hold) | View notices | — | — |
| PPD Situation Report | Send report to PPD | View sent reports | Update report | — |
| Event Monitoring | — | View all class progress | Add remarks | — |
| Event Report | Generate report | View report | Add remarks | — |

---

### 5.4 Class Teacher

**Main Job:** Manage students in their own class, monitor parent responses, verify pickup.

**Flow:**
1. Views active flood pickup event
2. Views parent responses for their class (summary dashboard)
3. Prepares students whose parents are on the way
4. Updates student pickup readiness (bulk or individual)
5. Verifies pickup when parent arrives (Name + IC matching)
6. Reports any issue

**CRUD:**

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| Student Records | Add student | View own class students | Edit student info | Deactivate student |
| Parent Account | Add parent | View parent info | Edit parent contact | Deactivate parent |
| Student-Parent Link | Link parent to student | View link | Update link | Remove wrong link |
| Student Pickup Status | Bulk update status | View status | Update selected students | — |
| Pickup Verification | Confirm pickup | View pickup record | Correct with remark | — |
| Issue Report | Create issue | View issue | Update issue status | — |

**Bulk update support:**
- Teacher can update entire class at once (e.g., "Mark all as Ready")
- Teacher can filter by parent response and update selected students
- Individual update only needed for final pickup verification and exceptions

---

### 5.5 Parent / Guardian

**Main Job:** Receive pickup notification, view route advisory, submit pickup response, present for verification.

**Functions:**

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| Pickup Notice | — | View notice | — | — |
| Route Advisory | — | View suggested route | — | — |
| Parent Response | Submit response | View response | Change response | — |
| Route Issue Report | Report blocked route | View report | Update remark | — |
| Guardian Note | Submit alternate guardian name (text) | View | Update before pickup | — |

**Parent response options:**
1. **On The Way** (+ selected route)
2. **Delayed**
3. **Route Blocked**
4. **Cannot Come Now**
5. **Another Guardian Will Pick Up** (+ guardian name as text note)

**Multi-child support:** Parent with multiple children in the same school sees ALL children on one dashboard. One response (e.g., "On The Way") applies to all linked children. Pickup verification is per-child (different teachers may be involved).

**Parent does NOT:** update route status, manage child location, change school data, update student records.

---

## 6. Route Status Options (5 Statuses)

| Status | Meaning | System Action |
|---|---|---|
| **Safe** | Route is clear and usable | Recommend to parents |
| **Caution** | Route may be affected, proceed carefully | Recommend with warning |
| **Flooded** | Route has standing water | Avoid, show warning |
| **Closed** | Route is officially closed | Do not recommend |
| **Resolved** | Previously affected, now clear | Can use again |

---

## 7. Unified Student Pickup Status (6 Statuses)

One single status per student per event. No parallel systems.

| # | Status | Triggered By | Parent Sees | Teacher Sees |
|---|---|---|---|---|
| 1 | **Supervised** | Auto-set when event starts | "Your child is safe at school" | Supervised at School |
| 2 | **Notified** | Auto-set when parent notification sent | "Pickup notice sent" | Pickup Notice Sent |
| 3 | **On The Way** | Parent clicks "On The Way" | "You are on the way" | Parent On The Way (+ route) |
| 4 | **Ready** | Teacher marks student ready | "Your child is ready for pickup" | Ready for Pickup |
| 5 | **Picked Up** | Teacher verifies pickup | "Pickup completed" | Picked Up (+ timestamp + parent name) |
| 6 | **Issue** | Parent or Teacher reports issue | "Issue reported — see details" | Issue (+ sub-reason) |

### Issue Sub-Reasons

When status is "Issue", a sub-reason field captures the detail:
- Delayed
- Route Blocked
- Cannot Come Now
- Another Guardian Coming (+ guardian name note)
- Other (free text)

### State Transition Rules

```
Supervised → Notified (auto, when School PIC notifies parents)
Notified → On The Way (parent clicks On The Way)
Notified → Issue (parent clicks Delayed/Blocked/Cannot Come/Another Guardian)
On The Way → Ready (teacher prepares student)
Ready → Picked Up (teacher verifies pickup)
Issue → On The Way (parent updates response to On The Way)
Issue → Picked Up (teacher verifies if guardian arrives)
Any state → Issue (parent or teacher can report issue at any time)
```

---

## 8. Pickup Verification Mechanism

**Method: Name + IC Visual Matching**

When a parent arrives:
1. Teacher opens the student's pickup record
2. System shows: **registered parent/guardian name** and **IC number**
3. Parent presents their IC
4. Teacher visually confirms name and IC match
5. Teacher taps **Confirm Pickup**
6. System records: student name, parent name, teacher name, timestamp, event ID

For **alternate guardian** (when parent clicked "Another Guardian Will Pick Up"):
- Teacher sees the guardian name note submitted by the parent
- Teacher verifies the person matches the stated name
- Teacher taps **Confirm Pickup** with a remark field noting alternate guardian

---

## 9. Complete System Flow (18 Phases)

### Phase 1: System Setup (Before Any Flood Event)

**DO Setup:**
- Adds route records (e.g., Jalan Bingkor A, Jalan Apin-Apin, Jalan Sook)
- Each route has: name, area, description, default status (Safe)

**PPD Setup:**
- Adds school records (e.g., SK Bingkor, SK Apin-Apin)
- Assigns route options to each school (e.g., SK Bingkor → Route A, B, C)

**School PIC Setup:**
- Adds class records (e.g., Tahun 1 Amanah, Tahun 2 Bestari)
- Assigns class teachers to each class

**Class Teacher Setup:**
- Adds students to their class
- Adds parent/guardian accounts (name, phone, IC)
- Links students to parents

---

### Phase 2: Flood Risk Happens

Flood risk is reported in an area (e.g., "Flood risk in Bingkor").

---

### Phase 3: DO Updates Road Status

DO searches "Bingkor" → System shows all routes in Bingkor → DO updates each route status (e.g., Route A = Closed, Route B = Caution, Route C = Safe) → DO clicks **Notify PPD**.

---

### Phase 4: PPD Receives DO Notice

PPD receives: "Flood risk reported in Bingkor." → PPD searches "Bingkor" → System shows all schools in Bingkor → PPD selects affected schools → PPD clicks **Notify School**.

---

### Phase 5: School PIC Receives Alert

School PIC receives: "Flood risk in your area. Review route status." → Views route advisory page showing route statuses.

---

### Phase 6: School PIC Activates Pickup Event

School PIC clicks **Create Pickup Event** → System creates active event for the school.

---

### Phase 7: School PIC Notifies Parents

School PIC clicks **Notify All Parents** → Parents receive notification → System auto-sets ALL students to **Supervised** status.

---

### Phase 8: Parent Views Route Advisory

Parent logs in → sees: child name, school, pickup notice, recommended route, routes to avoid, route warnings.

---

### Phase 9: Route Recommendation Logic

System uses predefined routes (from PPD setup) + current status (from DO):

| Route Status | Recommendation |
|---|---|
| Safe | ✅ Recommended |
| Caution | ⚠️ Recommended with warning |
| Flooded | ❌ Avoid |
| Closed | ❌ Do not use |
| Resolved | ✅ Can use again |

This is **rule-based route filtering**, not AI. Routes are filtered and ranked by status.

---

### Phase 10: Parent Sends Response

Parent clicks one response option (On The Way / Delayed / Route Blocked / Cannot Come / Another Guardian) → System updates student status accordingly.

---

### Phase 11: Teacher Monitors Parent Responses

Teacher dashboard shows summary:

| Status | Count |
|---|---|
| Total Students | 35 |
| Supervised | 35 |
| On The Way | 12 |
| Issue (Delayed/Blocked/etc.) | 6 |
| Not Responded | 17 |
| Picked Up | 0 |

Teacher can filter by status to see details.

---

### Phase 12: Teacher Prepares Students

Teacher filters "On The Way" → selects students → clicks **Mark as Ready**. Can also bulk-update entire class.

---

### Phase 13: Parent Arrives at School

Parent goes to pickup point, presents IC.

---

### Phase 14: Teacher Verifies Pickup

Teacher checks: parent name + IC matches registered info → clicks **Confirm Pickup** → system records the verified handover → student status becomes **Picked Up**.

---

### Phase 15: School PIC Monitors Event

School PIC sees all-class progress dashboard showing counts per class (On The Way, Ready, Picked Up, Issue).

---

### Phase 16: Route Issue Handling

If parent reports Route Blocked, system records a route issue report with status "Pending Review."

**Feedback loop to DO:**
- When a parent submits a route issue report, the system automatically sends a notification to DO (via the unified `notifications` table, type = `route_issue`)
- If **3 or more parents** report the same route as blocked/flooded within the same event, the system sends a **high-priority alert** to DO flagging that route for urgent review
- DO can then review the reports and decide whether to update the official route status
- Updated route status immediately reflects for School PIC, Teachers, and Parents

School PIC and PPD can also view all route issue reports for situational awareness.

---

### Phase 17: Event Closure

When pickup is complete or under control, School PIC clicks **Close Event**.

**Unresolved student handling (mandatory before closure):**

Before the system allows event closure, it checks for students with status ≠ **Picked Up**. For each unresolved student, School PIC must select a resolution:

| Resolution Option | Meaning |
|---|---|
| **Parent contacted — coming later** | Parent confirmed they will come after the event closes |
| **Emergency contact notified** | School contacted the student's emergency contact |
| **Student remains under school supervision** | Student stays at school until parent/guardian arrives |
| **Handed to authorized guardian** | Another authorized person took the child (logged with name) |

The resolution is logged in the `student_pickup_status` table via the `issue_sub_reason` field.

**The system will NOT allow event closure until every student has either:**
1. Status = **Picked Up**, OR
2. An unresolved case resolution selected by PIC

This ensures no child is "forgotten" when the event closes.

---

### Phase 18: Report Generation

System generates event summary report. **AI (LLM) is used here** to summarize the event data into a natural language report covering: affected area, route statuses, parent responses, pickup counts, delayed cases, issue reports, and verification records.

---

## 10. AI Role — Scoped and Defined

**AI is used ONLY for event report summarization (Phase 18).**

- AI receives structured event data (route statuses, parent responses, pickup counts, issue reports)
- AI generates a natural language summary of the event
- AI does NOT set road status, make route decisions, or control any system flow

**Justification:** Using AI for report summarization is a legitimate use case that adds value without introducing complexity into the real-time safety flow.

**Implementation:** Call an LLM API (e.g., Gemini API) with the structured event data and a prompt template to generate the report text.

---

## 11. Database Tables (Final List — 15 Tables)

| # | Table | Purpose | Key Fields |
|---|---|---|---|
| 1 | **users** | All system users with role | id, name, email, phone, ic_number, role, school_id (nullable) |
| 2 | **areas** | Predefined area lookup | id, name, description |
| 3 | **routes** | Road/route records | id, name, area_id, description, current_status, last_updated_by |
| 4 | **route_status_log** | Audit trail of route changes | id, route_id, old_status, new_status, updated_by, timestamp, remarks |
| 5 | **schools** | School records | id, name, area_id, address, pic_user_id |
| 6 | **school_routes** | Junction: routes assigned to schools | id, school_id, route_id |
| 7 | **classes** | Class records | id, school_id, name, teacher_user_id |
| 8 | **students** | Student records | id, name, class_id, school_id |
| 9 | **student_parent_links** | Junction: students to parents (multi-child) | id, student_id, parent_user_id, relationship |
| 10 | **notifications** | All system notifications (unified) | id, type, recipient_user_id, title, message, is_read, created_at, reference_type, reference_id |
| 11 | **pickup_events** | Pickup event per school | id, school_id, created_by, status (active/hold/closed), started_at, closed_at, remarks |
| 12 | **parent_responses** | Parent pickup response | id, pickup_event_id, parent_user_id, response_type, selected_route_id, guardian_note, timestamp |
| 13 | **student_pickup_status** | Per-student per-event status | id, pickup_event_id, student_id, status, issue_sub_reason, updated_by, timestamp |
| 14 | **pickup_verifications** | Verified pickup records | id, pickup_event_id, student_id, verified_by_teacher_id, parent_user_id, guardian_name_if_alternate, timestamp, remarks |
| 15 | **route_issue_reports** | Parent-reported route issues | id, pickup_event_id, reported_by_user_id, route_id, description, status (pending/reviewed), reviewed_by, timestamp |

### Removed/Merged from original 20:
- `flood_notices` → merged into `notifications` (type = 'flood_notice')
- `school_notifications` → merged into `notifications` (type = 'school_alert')
- `pickup_notices` → merged into `notifications` (type = 'pickup_notice')
- `parents` → merged into `users` (role = 'parent')
- `pickup_zones` → removed (barely discussed, not essential)
- `event_reports` → generated dynamically via query + AI summarization, not stored as a separate table
- `route_status_updates` → renamed to `route_status_log` (clearer purpose)

---

## 12. Known Limitations (For Report)

State these explicitly in your report's "Limitations" section:

1. **Connectivity dependency:** The system requires internet access for all users. During severe flooding, connectivity may be degraded. This is a known limitation.
2. **Not real-time navigation:** The system shows route status, not turn-by-turn directions. Parents must know the physical roads.
3. **Sequential notification chain:** The DO → PPD → School → Parent chain introduces delay. The system assumes pickup begins after formal activation.
4. **Alternate guardian verification is trust-based:** When a parent designates another guardian via text note, verification relies on the teacher matching the stated name. No IC verification is required for alternate guardians.
5. **Single-school scope:** The current design supports one school district (Keningau). Multi-district support is out of scope.

---

## 13. Final One-Line Flow

> **DO receives flood notice → DO updates route status → DO notifies PPD → PPD identifies affected schools → PPD notifies schools → School PIC activates controlled pickup → School PIC notifies parents → Parents view route advisory and respond → Class Teachers prepare students → Teachers verify pickup (Name + IC) → School PIC closes event → AI generates event report.**

---

## 14. Final CRUD Count Summary

| Role | Modules | Create | Read | Update | Delete |
|---|---|---|---|---|---|
| DO | 4 | 4 | 4 | 3 | 2 |
| PPD | 4 | 3 | 4 | 2 | 2 |
| School PIC | 6 | 4 | 6 | 4 | 2 |
| Class Teacher | 6 | 6 | 6 | 6 | 3 |
| Parent | 5 | 2 | 5 | 2 | 0 |
| **Total** | **25 modules** | **19** | **25** | **17** | **9** |

---

> [!IMPORTANT]
> This specification is now **locked**. Use this document as the single source of truth for your FYP report. Any changes from this point should be treated as version updates with clear justification.

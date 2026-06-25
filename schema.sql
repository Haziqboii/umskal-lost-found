-- Clean up existing tables in reverse dependency order
DROP TABLE IF EXISTS route_issue_reports CASCADE;
DROP TABLE IF EXISTS pickup_verifications CASCADE;
DROP TABLE IF EXISTS student_pickup_status CASCADE;
DROP TABLE IF EXISTS parent_responses CASCADE;
DROP TABLE IF EXISTS pickup_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS student_parent_links CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS school_routes CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS route_status_log CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS areas CASCADE;

-- Create tables
CREATE TABLE areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    ic_number TEXT,
    role TEXT NOT NULL,
    school_id TEXT, -- Will refer to schools(id)
    password TEXT NOT NULL
);

CREATE TABLE routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE CASCADE,
    description TEXT,
    current_status TEXT NOT NULL DEFAULT 'Safe',
    last_updated_by TEXT
);

CREATE TABLE route_status_log (
    id TEXT PRIMARY KEY,
    route_id TEXT REFERENCES routes(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    updated_by TEXT,
    timestamp TEXT, -- using TEXT to keep ISO timestamps simple and compatible
    remarks TEXT
);

CREATE TABLE schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    address TEXT,
    pic_user_id TEXT -- Will refer to users(id)
);

CREATE TABLE school_routes (
    id TEXT PRIMARY KEY,
    school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
    route_id TEXT REFERENCES routes(id) ON DELETE CASCADE
);

CREATE TABLE classes (
    id TEXT PRIMARY KEY,
    school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    teacher_user_id TEXT -- Will refer to users(id)
);

CREATE TABLE students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    school_id TEXT REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE student_parent_links (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    recipient_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    recipient_role TEXT,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TEXT,
    reference_type TEXT,
    reference_id TEXT,
    pickup_event_id TEXT -- We won't reference pickup_events(id) directly to avoid cycle issues or can reference if we want
);

CREATE TABLE pickup_events (
    id TEXT PRIMARY KEY,
    school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
    created_by TEXT, -- PIC name or user ID
    status TEXT NOT NULL DEFAULT 'active',
    started_at TEXT,
    closed_at TEXT,
    remarks TEXT,
    pickup_instruction TEXT,
    hold_reason TEXT,
    situation_report_text TEXT,
    situation_report_sent_at TEXT
);

CREATE TABLE parent_responses (
    id TEXT PRIMARY KEY,
    pickup_event_id TEXT REFERENCES pickup_events(id) ON DELETE CASCADE,
    parent_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    response_type TEXT NOT NULL,
    selected_route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    guardian_note TEXT,
    timestamp TEXT
);

CREATE TABLE student_pickup_status (
    id TEXT PRIMARY KEY,
    pickup_event_id TEXT REFERENCES pickup_events(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Supervised',
    issue_sub_reason TEXT,
    updated_by TEXT, -- refer to users(id) or name
    timestamp TEXT
);

CREATE TABLE pickup_verifications (
    id TEXT PRIMARY KEY,
    pickup_event_id TEXT REFERENCES pickup_events(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    verified_by_teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    parent_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    guardian_name_if_alternate TEXT,
    timestamp TEXT,
    remarks TEXT
);

CREATE TABLE route_issue_reports (
    id TEXT PRIMARY KEY,
    pickup_event_id TEXT REFERENCES pickup_events(id) ON DELETE CASCADE,
    reported_by_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    route_id TEXT REFERENCES routes(id) ON DELETE CASCADE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_remarks TEXT,
    reviewed_by TEXT, -- Will refer to users(id) or name
    reviewed_at TEXT,
    timestamp TEXT
);

-- Add post-creation foreign keys to handle cyclic references
ALTER TABLE users ADD CONSTRAINT fk_user_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE schools ADD CONSTRAINT fk_school_pic FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE classes ADD CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- INSERT SEED DATA
-- areas
INSERT INTO areas (id, name, description) VALUES
('A-01', 'Bingkor', 'Bingkor sub-district area, Keningau'),
('A-02', 'Apin-Apin', 'Apin-Apin district area, northern Keningau'),
('A-03', 'Sook', 'Sook sub-district area, southern Keningau');

-- schools (temporarily without pic_user_id to prevent constraint issues until users are inserted)
INSERT INTO schools (id, name, area_id, address, pic_user_id) VALUES
('S-01', 'SK Bingkor', 'A-01', 'Peti Surat 20, 89007 Keningau, Sabah', NULL),
('S-02', 'SK Apin-Apin', 'A-02', 'W.D.T. 14, 89009 Keningau, Sabah', NULL);

-- users (temporarily without school_id to prevent constraint issues)
INSERT INTO users (id, name, email, phone, ic_number, role, school_id, password) VALUES
('U-DO', 'Encik Zul', 'do@klisp.gov.my', '019-8765432', '760512-12-5111', 'do', NULL, 'password123'),
('U-PPD', 'Puan Azimah', 'ppd@klisp.gov.my', '013-8889999', '810214-12-5222', 'ppd', NULL, 'password123'),
('U-PIC-1', 'Cikgu Rosli', 'pic@klisp.edu.my', '012-3456789', '840618-12-5333', 'pic', NULL, 'password123'),
('U-TCH-1', 'Cikgu Aminah', 'teacher1@klisp.edu.my', '014-1112222', '890812-12-5444', 'teacher', NULL, 'password123'),
('U-TCH-2', 'Cikgu Sarah', 'teacher2@klisp.edu.my', '017-3334444', '920315-12-5555', 'teacher', NULL, 'password123'),
('U-PAR-1', 'Encik Haziq', 'parent1@gmail.com', '010-8204841', '831102-12-6111', 'parent', NULL, 'password123'),
('U-PAR-2', 'Puan Siti', 'parent2@gmail.com', '011-2345678', '850410-12-6222', 'parent', NULL, 'password123');

-- Update schools with PIC and users with school
UPDATE schools SET pic_user_id = 'U-PIC-1' WHERE id = 'S-01';
UPDATE users SET school_id = 'S-01' WHERE id IN ('U-PIC-1', 'U-TCH-1', 'U-TCH-2');

-- routes
INSERT INTO routes (id, name, area_id, description, current_status, last_updated_by) VALUES
('R-01', 'Jalan Bingkor Laut', 'A-01', 'Route connecting Bingkor Laut to main town, low-lying near river', 'Closed', 'Encik Zul'),
('R-02', 'Jalan Apin-Apin Bypass', 'A-02', 'Bypass route near hills, prone to landslips during heavy rain', 'Safe', 'Encik Zul'),
('R-03', 'Jalan Sook Utama', 'A-03', 'Main connector road, generally high elevation but bridge is weak', 'Safe', 'Encik Zul'),
('R-04', 'Jalan Bingkor Town Center', 'A-01', 'Urban route through Bingkor center, drainage usually handles normal rain', 'Closed', 'Encik Zul'),
('R-05', 'Jalan Kampung Baru Bingkor', 'A-01', 'Village connector, dirt road sections, prone to muddy conditions', 'Safe', 'Encik Zul');

-- route_status_log
INSERT INTO route_status_log (id, route_id, old_status, new_status, updated_by, timestamp, remarks) VALUES
('RL-01', 'R-01', 'Safe', 'Safe', 'U-DO', '2026-06-20T21:28:39.122Z', 'Initial system startup state'),
('RL-1781991122714', 'R-01', 'Safe', 'Closed', 'Encik Zul', '2026-06-20T21:32:02.714Z', ''),
('RL-1781991132502', 'R-04', 'Safe', 'Closed', 'Encik Zul', '2026-06-20T21:32:12.502Z', '');

-- school_routes
INSERT INTO school_routes (id, school_id, route_id) VALUES
('SR-01', 'S-01', 'R-01'),
('SR-02', 'S-01', 'R-04'),
('SR-03', 'S-01', 'R-05'),
('SR-04', 'S-01', 'R-02'),
('SR-05', 'S-02', 'R-02');

-- classes
INSERT INTO classes (id, school_id, name, teacher_user_id) VALUES
('C-01', 'S-01', 'Tahun 1 Amanah', 'U-TCH-1'),
('C-02', 'S-01', 'Tahun 2 Bestari', 'U-TCH-2');

-- students
INSERT INTO students (id, name, class_id, school_id) VALUES
('ST-01', 'Adam bin Haziq', 'C-01', 'S-01'),
('ST-02', 'Sarah binti Haziq', 'C-02', 'S-01'),
('ST-03', 'Farhan bin Siti', 'C-01', 'S-01');

-- student_parent_links
INSERT INTO student_parent_links (id, student_id, parent_user_id, relationship) VALUES
('SP-01', 'ST-01', 'U-PAR-1', 'Father'),
('SP-02', 'ST-02', 'U-PAR-1', 'Father'),
('SP-03', 'ST-03', 'U-PAR-2', 'Mother');

-- pickup_events
INSERT INTO pickup_events (id, school_id, created_by, status, started_at, closed_at, remarks, pickup_instruction, hold_reason, situation_report_text, situation_report_sent_at) VALUES
('E-7870', 'S-01', 'Cikgu Rosli', 'active', '2026-06-20T21:34:37.870Z', NULL, '', 'Assemble at Block A Multi-purpose Hall. Have parent IC ready for visual check.', '', NULL, NULL);

-- notifications
INSERT INTO notifications (id, type, recipient_user_id, recipient_role, title, message, is_read, created_at, reference_type, reference_id, pickup_event_id) VALUES
('NT-PPD-1781991083071-U-PPD', 'ppd_alert', 'U-PPD', 'ppd', 'FLOOD RISK ALERT: Bingkor', 'District Office has reported flood risk in Bingkor. Remarks: None. Sender: Encik Zul.', FALSE, '2026-06-20T21:31:23.071Z', 'area', 'A-01', NULL),
('NT-PIC-1781991229609-U-PIC-1', 'school_alert', 'U-PIC-1', 'pic', 'FLOOD ALERT FROM PPD: SK Bingkor', 'PPD alert: Flood risk reported around school service routes. Review route status immediately. Remarks: None. Sender: Puan Azimah.', FALSE, '2026-06-20T21:33:49.609Z', 'school', 'S-01', NULL),
('NT-DO-1781991511617-U-DO', 'route_issue', 'U-DO', 'do', 'Parent Route Block Report', 'Parent (Encik Haziq) reported block on Jalan Apin-Apin Bypass: "flooded"', FALSE, '2026-06-20T21:38:31.617Z', 'route', 'R-02', 'E-7870');

-- parent_responses
INSERT INTO parent_responses (id, pickup_event_id, parent_user_id, response_type, selected_route_id, guardian_note, timestamp) VALUES
('PR-1781991382018', 'E-7870', 'U-PAR-1', 'on_the_way', 'R-02', NULL, '2026-06-20T21:36:22.018Z'),
('PR-1781991659017', 'E-7870', 'U-PAR-1', 'cannot_come', NULL, NULL, '2026-06-20T21:40:59.017Z');

-- student_pickup_status
INSERT INTO student_pickup_status (id, pickup_event_id, student_id, status, issue_sub_reason, updated_by, timestamp) VALUES
('SPS-1781991277870-ST-01', 'E-7870', 'ST-01', 'Picked Up', NULL, 'U-TCH-1', '2026-06-20T21:43:03.188Z'),
('SPS-1781991277870-ST-02', 'E-7870', 'ST-02', 'Issue', 'Cannot Come Now', 'U-PAR-1', '2026-06-20T21:40:59.017Z'),
('SPS-1781991277870-ST-03', 'E-7870', 'ST-03', 'Supervised', NULL, 'Cikgu Rosli', '2026-06-20T21:34:37.870Z');

-- pickup_verifications
INSERT INTO pickup_verifications (id, pickup_event_id, student_id, verified_by_teacher_id, parent_user_id, guardian_name_if_alternate, timestamp, remarks) VALUES
('PV-1781991783188', 'E-7870', 'ST-01', 'U-TCH-1', NULL, NULL, '2026-06-20T21:43:03.188Z', '');

-- route_issue_reports
INSERT INTO route_issue_reports (id, pickup_event_id, reported_by_user_id, route_id, description, status, reviewer_remarks, reviewed_by, reviewed_at, timestamp) VALUES
('RI-1781991511617', 'E-7870', 'U-PAR-1', 'R-02', 'flooded', 'pending', NULL, NULL, NULL, '2026-06-20T21:38:31.617Z');

-- 1. Create Tables
DROP TABLE IF EXISTS verified_items CASCADE;
DROP TABLE IF EXISTS lost_reports CASCADE;
DROP TABLE IF EXISTS found_reports CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

CREATE TABLE verified_items (
    id TEXT PRIMARY KEY,
    reference TEXT,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    date TEXT,
    time TEXT,
    image TEXT,
    status TEXT,
    description TEXT
);

CREATE TABLE lost_reports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    date TEXT,
    time TEXT,
    image TEXT,
    status TEXT,
    description TEXT,
    matched_item_id TEXT
);

CREATE TABLE found_reports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    date TEXT,
    time TEXT,
    finder_name TEXT,
    finder_matric TEXT,
    finder_email TEXT,
    description TEXT,
    image TEXT,
    status TEXT
);

CREATE TABLE claims (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    item_name TEXT NOT NULL,
    item_ref TEXT,
    student_name TEXT,
    student_matric TEXT,
    student_email TEXT,
    lost_where TEXT,
    lost_date TEXT,
    lost_time TEXT,
    unique_detail TEXT,
    proof_image TEXT,
    status TEXT,
    admin_note TEXT,
    lost_report_id TEXT
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    time TEXT,
    type TEXT,
    unread BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
    id TEXT PRIMARY KEY,
    time TEXT,
    text TEXT NOT NULL,
    type TEXT,
    ref TEXT,
    timestamp TEXT
);

-- 2. Seed Initial Mock Data
INSERT INTO verified_items (id, reference, name, category, location, date, time, image, status, description)
VALUES 
('LF-1001', 'LF-1001', 'UMSKAL Matric Card', 'Matric Card', 'Library Lobby', '2026-06-24', '10:30', 'seed_matric.png', 'Available for Claim', 'Found on a table near the main entrance.'),
('LF-1002', 'LF-1002', 'Sleek Leather Wallet', 'Wallet', 'Cafeteria', '2026-06-23', '14:15', 'seed_wallet.png', 'Available for Claim', 'Brown leather wallet found on a dining table.'),
('LF-1003', 'LF-1003', 'Stainless Steel Thermos Bottle', 'Bottle', 'DK 3', '2026-06-25', '09:00', 'seed_bottle.png', 'Available for Claim', 'Black vacuum flask left under a seat in Lecture Hall 3.'),
('LF-1004', 'LF-1004', 'Keyring with Car Key', 'Keys', 'Campus Mosque', '2026-06-22', '17:45', 'seed_keys.png', 'Claim Pending', 'Key ring with a car key and a decorative strap.');

INSERT INTO lost_reports (id, name, category, location, date, time, description, image, status, matched_item_id)
VALUES
('LR-1001', 'Leather Wallet', 'Wallet', 'Cafeteria', '2026-06-23', '14:00', 'Brown leather wallet containing some cash and driving license.', 'seed_wallet.png', 'Possible Match Found', 'LF-1002'),
('LR-1002', 'iPhone 13 Pro', 'Electronics', 'Block D Lab', '2026-06-24', '11:30', 'Midnight blue iPhone with a transparent case.', 'seed_phone.png', 'Submitted', NULL),
('LR-1003', 'Matric Card', 'Matric Card', 'Library Lobby', '2026-06-24', '10:00', 'Matric card with name Muhammad Haziq Hazim.', 'seed_matric.png', 'Returned', NULL);

INSERT INTO found_reports (id, name, category, location, date, time, finder_matric, finder_name, finder_email, description, image, status)
VALUES
('FR-1001', 'Adidas Backpack', 'Bag', 'Security Office', '2026-06-25', '11:00', 'BI23110360', 'Muhammad Haziq Hazim bin Amir', 'haxim.2mars@gmail.com', 'Black backpack containing notebook and stationary.', 'seed_backpack.png', 'Submitted'),
('FR-1002', 'Smartphone', 'Electronics', 'Block D Lab', '2026-06-24', '12:00', 'AL230941', 'Aiman bin Abdullah', 'aiman_student@student.ums.edu.my', 'iPhone found near computer desk.', 'seed_phone.png', 'Under Review');

INSERT INTO claims (id, item_id, item_name, item_ref, student_name, student_matric, student_email, lost_where, lost_date, lost_time, unique_detail, proof_image, status)
VALUES
('CL-1001', 'LF-1004', 'Keyring with Car Key', 'LF-1004', 'Muhammad Haziq Hazim bin Amir', 'BI23110360', 'haxim.2mars@gmail.com', 'Campus Mosque', '2026-06-22', '17:30', 'A black leather strap with a Toyota logo on the key ring.', 'seed_keys.png', 'Claim Pending');

INSERT INTO notifications (id, title, message, time, type, unread)
VALUES
('NT-1001', 'Possible Match Found', 'Management has matched your lost report ''Leather Wallet'' with verified found item Ref: #LF-1002. Please check details and submit claim proof.', '10 minutes ago', 'warning', true),
('NT-1002', 'Lost Report Filed', 'Your lost report for ''iPhone 13 Pro'' has been submitted successfully.', '1 hour ago', 'info', false);

INSERT INTO activities (id, time, text, type, ref, timestamp)
VALUES
('AC-1001', '11:15 AM', 'Student <strong>Muhammad Haziq</strong> filed claim request for <strong>''Keyring with Car Key''</strong>.', 'Claim Request', 'CL-1001', '2026-06-25T11:15:00.000Z'),
('AC-1002', '10:45 AM', 'Admin suggested match for Lost Report <strong>LR-1001</strong> with Verified Item <strong>LF-1002</strong>.', 'Match Suggestion', 'LR-1001', '2026-06-25T10:45:00.000Z'),
('AC-1003', '09:30 AM', 'Found Item reported: <strong>Adidas Backpack</strong> by finder <strong>Muhammad Haziq</strong>.', 'Found Report', 'FR-1001', '2026-06-25T09:30:00.000Z');

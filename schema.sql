CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tel TEXT,
  mobile TEXT,
  region TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT,
  responded_at TEXT
);

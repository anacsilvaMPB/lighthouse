-- Migration number: 0001 	 2026-09-24T11:29:08.416Z

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  col INTEGER NOT NULL,
  row INTEGER NOT NULL,
  color TEXT NOT NULL,
  art TEXT NOT NULL,
  UNIQUE (col, row)
);

-- Exits are not stored: two rooms are connected whenever their (col, row)
-- are adjacent, so a new row both adds a room and wires up its doors.
INSERT INTO rooms (name, description, col, row, color, art) VALUES
  ('Spiral Stair', 'A narrow iron staircase spirals upward, worn smooth by generations of keepers'' boots. Cold sea air drifts down from somewhere above.', 0, 0, '#8fa6bd', '/art/spiral-stair.png'),
  ('Lamp Room', 'Glass panels ring the room, and the great lamp sits silent in its brass housing. Far below, whitecaps stretch to the horizon.', 1, 0, '#ffcf6b', '/art/lamp-room.png'),
  ('Keeper''s Kitchen', 'A small stove and a scarred wooden table fill this cramped room. Faded charts and a half-empty tin of lamp oil sit on a shelf.', 0, 1, '#e2955d', '/art/keepers-kitchen.png'),
  ('Rocks', 'Slick black rocks lead down to the pounding surf at the lighthouse''s base. Salt spray stings your face as gulls wheel overhead.', 1, 1, '#5fb8c9', '/art/rocks.png');

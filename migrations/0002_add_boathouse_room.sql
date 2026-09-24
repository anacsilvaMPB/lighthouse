-- Migration number: 0002 	 2026-09-24T16:00:00.000Z

-- The Boathouse room was added to the game's room list (src/game/movement.ts)
-- but was never inserted into this table, so the live site's /api/rooms
-- endpoint never returned it and the room was invisible in production.
INSERT INTO rooms (name, description, col, row, color, art) VALUES
  ('Boathouse', 'A sturdy rowboat rests on its cradle, tools hung neat along the wall. The door stands open to the dock and the sea beyond.', 0, 2, '#a97c50', '/art/boathouse.png');

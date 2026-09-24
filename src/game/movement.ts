export type Direction = "up" | "down" | "left" | "right";

export interface Room {
  name: string;
  description: string;
  col: number;
  row: number;
  color: string;
  art: string;
}

export interface GameState {
  room: Room;
  visitedKitchen: boolean;
  hasKey: boolean;
}

export interface MoveResult {
  state: GameState;
  message: string;
}

interface BlockedReason {
  col: number;
  row: number;
  direction: Direction;
  message: string;
}

// Used when no room list is supplied (e.g. in tests, or before the
// database-backed list has loaded). The live app fetches rooms from D1
// via /api/rooms and threads that list through instead.
export const defaultRooms: Room[] = [
  {
    name: "Spiral Stair",
    description:
      "A narrow iron staircase spirals upward, worn smooth by generations of keepers' boots. Cold sea air drifts down from somewhere above.",
    col: 0,
    row: 0,
    color: "#8fa6bd",
    art: "/art/spiral-stair.png",
  },
  {
    name: "Lamp Room",
    description:
      "Glass panels ring the room, and the great lamp sits silent in its brass housing. Far below, whitecaps stretch to the horizon.",
    col: 1,
    row: 0,
    color: "#ffcf6b",
    art: "/art/lamp-room.png",
  },
  {
    name: "Keeper's Kitchen",
    description:
      "A small stove and a scarred wooden table fill this cramped room. Faded charts and a half-empty tin of lamp oil sit on a shelf.",
    col: 0,
    row: 1,
    color: "#e2955d",
    art: "/art/keepers-kitchen.png",
  },
  {
    name: "Rocks",
    description:
      "Slick black rocks lead down to the pounding surf at the lighthouse's base. Salt spray stings your face as gulls wheel overhead.",
    col: 1,
    row: 1,
    color: "#5fb8c9",
    art: "/art/rocks.png",
  },
  {
    name: "Boathouse",
    description:
      "A sturdy rowboat rests on its cradle, tools hung neat along the wall. The door stands open to the dock and the sea beyond.",
    col: 0,
    row: 2,
    color: "#a97c50",
    art: "/art/boathouse.png",
  },
];

const blockedReasons: BlockedReason[] = [
  {
    col: 0,
    row: 0,
    direction: "up",
    message: "The stair curves up into the lamp's housing — there's no way through here.",
  },
  {
    col: 0,
    row: 0,
    direction: "left",
    message: "Solid stone tower wall. There's no way through.",
  },
  {
    col: 1,
    row: 0,
    direction: "up",
    message: "The lantern glass and open sky are all that lie above.",
  },
  {
    col: 1,
    row: 0,
    direction: "right",
    message: "Only the lamp room's glass wall and open sea lie beyond.",
  },
  {
    col: 0,
    row: 1,
    direction: "left",
    message: "Solid stone tower wall. There's no way through.",
  },
  {
    col: 1,
    row: 1,
    direction: "down",
    message: "Waves crash against the base of the lighthouse. There's nowhere to go.",
  },
  {
    col: 1,
    row: 1,
    direction: "right",
    message: "Jagged rocks and open sea stop you here.",
  },
  {
    col: 0,
    row: 2,
    direction: "down",
    message: "Only the dock and open water lie beyond.",
  },
  {
    col: 0,
    row: 2,
    direction: "left",
    message: "Stacked crates and coiled rope block the way.",
  },
  {
    col: 0,
    row: 2,
    direction: "right",
    message: "Solid timber wall. There's no way through.",
  },
];

export const directionDeltas: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

export const directionLabels: Record<Direction, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
};

export function findRoom(col: number, row: number, rooms: Room[] = defaultRooms): Room | undefined {
  return rooms.find((room) => room.col === col && room.row === row);
}

function findBlockedMessage(col: number, row: number, direction: Direction): string {
  const reason = blockedReasons.find(
    (entry) => entry.col === col && entry.row === row && entry.direction === direction
  );
  return reason ? reason.message : "You can't go that way.";
}

export function findRoomByName(name: string, rooms: Room[] = defaultRooms): Room | undefined {
  return rooms.find((room) => room.name === name);
}

export function createInitialState(rooms: Room[] = defaultRooms): GameState {
  return {
    room: findRoom(1, 1, rooms) as Room, // Rocks
    visitedKitchen: false,
    hasKey: false,
  };
}

export function pickUpKey(state: GameState): GameState {
  return { ...state, hasKey: true };
}

export function attemptMove(
  state: GameState,
  direction: Direction,
  rooms: Room[] = defaultRooms
): MoveResult {
  const { dc, dr } = directionDeltas[direction];
  const nextRoom = findRoom(state.room.col + dc, state.room.row + dr, rooms);

  if (!nextRoom) {
    return {
      state,
      message: findBlockedMessage(state.room.col, state.room.row, direction),
    };
  }

  if (nextRoom.name === "Lamp Room" && !state.visitedKitchen) {
    return { state, message: "The lamp room door is locked." };
  }

  if (nextRoom.name === "Boathouse" && !state.hasKey) {
    return { state, message: "A trapdoor behind the pantry is bolted shut." };
  }

  const visitedKitchen = state.visitedKitchen || nextRoom.name === "Keeper's Kitchen";

  return {
    state: { room: nextRoom, visitedKitchen, hasKey: state.hasKey },
    message: "",
  };
}

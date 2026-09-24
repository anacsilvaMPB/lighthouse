type Direction = "up" | "down" | "left" | "right";

interface Room {
  name: string;
  description: string;
  col: number;
  row: number;
  color: string;
  art: string;
}

interface BlockedReason {
  col: number;
  row: number;
  direction: Direction;
  message: string;
}

const rooms: Room[] = [
  {
    name: "Spiral Stair",
    description:
      "A narrow iron staircase spirals upward, worn smooth by generations of keepers' boots. Cold sea air drifts down from somewhere above.",
    col: 0,
    row: 0,
    color: "#8fa6bd",
    art: "art/spiral-stair.png",
  },
  {
    name: "Lamp Room",
    description:
      "Glass panels ring the room, and the great lamp sits silent in its brass housing. Far below, whitecaps stretch to the horizon.",
    col: 1,
    row: 0,
    color: "#ffcf6b",
    art: "art/lamp-room.png",
  },
  {
    name: "Keeper's Kitchen",
    description:
      "A small stove and a scarred wooden table fill this cramped room. Faded charts and a half-empty tin of lamp oil sit on a shelf.",
    col: 0,
    row: 1,
    color: "#e2955d",
    art: "art/keepers-kitchen.png",
  },
  {
    name: "Rocks",
    description:
      "Slick black rocks lead down to the pounding surf at the lighthouse's base. Salt spray stings your face as gulls wheel overhead.",
    col: 1,
    row: 1,
    color: "#5fb8c9",
    art: "art/rocks.png",
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
    direction: "down",
    message: "Below is only bare rock foundation. No door leads that way.",
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
];

const directionDeltas: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

const directionLabels: Record<Direction, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
};

const keyToDirection: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function findRoom(col: number, row: number): Room | undefined {
  return rooms.find((room) => room.col === col && room.row === row);
}

function findBlockedMessage(col: number, row: number, direction: Direction): string {
  const reason = blockedReasons.find(
    (entry) => entry.col === col && entry.row === row && entry.direction === direction
  );
  return reason ? reason.message : "You can't go that way.";
}

function buildIllustration(room: Room): string {
  return `<img src="${room.art}" alt="${room.name} illustration" width="704" height="294">`;
}

let currentRoom: Room = findRoom(1, 1) as Room; // Rocks
let isTransitioning = false;

const FADE_MS = 220;

const sceneEl = document.getElementById("scene") as HTMLElement;
const illustrationEl = document.getElementById("illustration") as HTMLElement;
const roomNameEl = document.getElementById("room-name") as HTMLElement;
const roomDescriptionEl = document.getElementById("room-description") as HTMLElement;
const exitsEl = document.getElementById("exits") as HTMLElement;
const messageEl = document.getElementById("message") as HTMLElement;
const mapCells = Array.from(document.querySelectorAll<HTMLElement>("#map .cell"));

function render(message: string): void {
  document.documentElement.style.setProperty("--room-color", currentRoom.color);

  illustrationEl.innerHTML = buildIllustration(currentRoom);
  roomNameEl.textContent = currentRoom.name;
  roomDescriptionEl.textContent = currentRoom.description;

  const openDirections = (Object.keys(directionDeltas) as Direction[]).filter((direction) => {
    const { dc, dr } = directionDeltas[direction];
    return findRoom(currentRoom.col + dc, currentRoom.row + dr) !== undefined;
  });

  exitsEl.textContent =
    openDirections.length > 0
      ? "You can go: " + openDirections.map((direction) => directionLabels[direction]).join(", ")
      : "There is nowhere to go from here.";

  mapCells.forEach((cell) => {
    const col = Number(cell.dataset.col);
    const row = Number(cell.dataset.row);
    cell.classList.toggle("current", col === currentRoom.col && row === currentRoom.row);
  });

  messageEl.textContent = message;
}

function move(direction: Direction): void {
  if (isTransitioning) {
    return;
  }

  const { dc, dr } = directionDeltas[direction];
  const nextCol = currentRoom.col + dc;
  const nextRow = currentRoom.row + dr;
  const nextRoom = findRoom(nextCol, nextRow);

  if (!nextRoom) {
    render(findBlockedMessage(currentRoom.col, currentRoom.row, direction));
    return;
  }

  isTransitioning = true;
  sceneEl.classList.add("fade");

  window.setTimeout(() => {
    currentRoom = nextRoom;
    render("");
    sceneEl.classList.remove("fade");
    window.setTimeout(() => {
      isTransitioning = false;
    }, FADE_MS);
  }, FADE_MS);
}

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const direction = keyToDirection[event.key];
  if (!direction) {
    return;
  }
  event.preventDefault();
  move(direction);
});

render("");

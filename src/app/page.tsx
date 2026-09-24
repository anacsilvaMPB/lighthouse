"use client";

import { useEffect, useState, type CSSProperties } from "react";

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

const START_ROOM = findRoom(1, 1) as Room; // Rocks
const FADE_MS = 220;

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<Room>(START_ROOM);
  const [message, setMessage] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = keyToDirection[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      move(direction);
    }

    function move(direction: Direction) {
      if (isTransitioning) {
        return;
      }

      const { dc, dr } = directionDeltas[direction];
      const nextRoom = findRoom(currentRoom.col + dc, currentRoom.row + dr);

      if (!nextRoom) {
        setMessage(findBlockedMessage(currentRoom.col, currentRoom.row, direction));
        return;
      }

      setIsTransitioning(true);
      setIsFading(true);

      window.setTimeout(() => {
        setCurrentRoom(nextRoom);
        setMessage("");
        setIsFading(false);
        window.setTimeout(() => setIsTransitioning(false), FADE_MS);
      }, FADE_MS);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRoom, isTransitioning]);

  const openDirections = (Object.keys(directionDeltas) as Direction[]).filter((direction) => {
    const { dc, dr } = directionDeltas[direction];
    return findRoom(currentRoom.col + dc, currentRoom.row + dr) !== undefined;
  });

  const exitsText =
    openDirections.length > 0
      ? "You can go: " + openDirections.map((direction) => directionLabels[direction]).join(", ")
      : "There is nowhere to go from here.";

  return (
    <main style={{ "--room-color": currentRoom.color } as CSSProperties}>
      <div className="map">
        {rooms.map((room) => (
          <div
            key={room.name}
            className={
              room.col === currentRoom.col && room.row === currentRoom.row ? "cell current" : "cell"
            }
          >
            {room.name}
          </div>
        ))}
      </div>
      <div id="scene" className={isFading ? "fade" : undefined}>
        <div className="illustration">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentRoom.art} alt={`${currentRoom.name} illustration`} width={704} height={294} />
        </div>
        <h1>{currentRoom.name}</h1>
        <p id="room-description">{currentRoom.description}</p>
        <p id="exits">{exitsText}</p>
      </div>
      <p id="message">{message}</p>
      <footer>Use the arrow keys to move.</footer>
    </main>
  );
}

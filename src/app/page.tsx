"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  attemptMove,
  createInitialState,
  directionDeltas,
  directionLabels,
  findRoom,
  rooms,
  type Direction,
} from "@/game/movement";

const keyToDirection: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const FADE_MS = 220;

export default function Home() {
  const [state, setState] = useState(createInitialState);
  const [message, setMessage] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = keyToDirection[event.key];
      if (!direction || isTransitioning) {
        return;
      }
      event.preventDefault();

      const result = attemptMove(state, direction);

      if (result.message) {
        setMessage(result.message);
        return;
      }

      setIsTransitioning(true);
      setIsFading(true);

      window.setTimeout(() => {
        setState(result.state);
        setMessage("");
        setIsFading(false);
        window.setTimeout(() => setIsTransitioning(false), FADE_MS);
      }, FADE_MS);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, isTransitioning]);

  const currentRoom = state.room;

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

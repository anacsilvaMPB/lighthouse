"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  attemptMove,
  createInitialState,
  directionDeltas,
  directionLabels,
  findRoom,
  findRoomByName,
  pickUpKey,
  rooms,
  type Direction,
  type GameState,
} from "@/game/movement";

const keyToDirection: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const FADE_MS = 220;
const STORAGE_KEY = "lighthouse-game-state";

interface SavedState {
  roomName: string;
  visitedKitchen: boolean;
  hasKey: boolean;
}

function KeyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (12 / 24)}
      viewBox="0 0 24 12"
      aria-hidden="true"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="1" y="2" width="8" height="8" fill="none" stroke="#ffd76b" strokeWidth="2" />
      <rect x="9" y="5" width="12" height="2" fill="#ffd76b" />
      <rect x="17" y="7" width="2" height="3" fill="#ffd76b" />
      <rect x="20" y="7" width="2" height="3" fill="#ffd76b" />
    </svg>
  );
}

export default function Home() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [message, setMessage] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [keyPosition, setKeyPosition] = useState<{ top: string; left: string } | null>(null);
  const isFirstSave = useRef(true);

  // Load any saved progress after mount (client-only; keeps the first render
  // identical to the server-rendered HTML, avoiding a hydration mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        const room = findRoomByName(saved.roomName);
        if (room) {
          // Syncing from localStorage, an external system read only once on mount.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({ room, visitedKitchen: saved.visitedKitchen, hasKey: saved.hasKey });
        }
      }
    } catch {
      // ignore unreadable/corrupt saved state
    }
  }, []);

  // Persist on every change, skipping the very first effect pass so it
  // doesn't overwrite a saved state before the load effect above applies it.
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    try {
      const toSave: SavedState = {
        roomName: state.room.name,
        visitedKitchen: state.visitedKitchen,
        hasKey: state.hasKey,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore (e.g. private browsing with storage disabled)
    }
  }, [state]);

  // Give the key a new spot in the Kitchen each time it's entered, until picked up.
  // Reacts to a real change (room or hasKey), not a self-triggered cascade.
  useEffect(() => {
    if (state.room.name === "Keeper's Kitchen" && !state.hasKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeyPosition({
        top: `${15 + Math.random() * 55}%`,
        left: `${10 + Math.random() * 70}%`,
      });
    } else {
      setKeyPosition(null);
    }
  }, [state.room, state.hasKey]);

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

  function handlePickUpKey() {
    setState((current) => pickUpKey(current));
  }

  const currentRoom = state.room;

  const openDirections = (Object.keys(directionDeltas) as Direction[]).filter((direction) => {
    const { dc, dr } = directionDeltas[direction];
    return findRoom(currentRoom.col + dc, currentRoom.row + dr) !== undefined;
  });

  const exitsText =
    openDirections.length > 0
      ? "You can go: " + openDirections.map((direction) => directionLabels[direction]).join(", ")
      : "There is nowhere to go from here.";

  const visibleRooms = rooms.filter((room) => room.name !== "Boathouse" || state.hasKey);

  return (
    <div className="pixel-frame" style={{ "--room-color": currentRoom.color } as CSSProperties}>
      <main>
        <div className="map">
          {visibleRooms.map((room) => (
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
            {keyPosition && (
              <button
                type="button"
                className="key-pickup"
                style={{ top: keyPosition.top, left: keyPosition.left }}
                onClick={handlePickUpKey}
                aria-label="Pick up the key"
              >
                <KeyIcon />
              </button>
            )}
          </div>
          <h1>{currentRoom.name}</h1>
          <div className="textbox">
            <p id="room-description">{currentRoom.description}</p>
            <p id="exits">{exitsText}</p>
          </div>
        </div>
        <div className="inventory" aria-label="Inventory">
          <span className="inventory-label">Inventory</span>
          <div className={state.hasKey ? "inventory-slot filled" : "inventory-slot"}>
            {state.hasKey && <KeyIcon size={20} />}
          </div>
        </div>
        <p id="message">{message}</p>
        <footer>Use the arrow keys to move.</footer>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  attemptMove,
  createInitialState,
  defaultRooms,
  directionDeltas,
  directionLabels,
  findRoom,
  findRoomByName,
  pickUpKey,
  type Direction,
  type GameState,
  type Room,
} from "@/game/movement";

const FADE_MS = 220;
const STORAGE_KEY = "lighthouse-game-state";
const WELCOME_SEEN_KEY = "lighthouse-welcome-seen";
const CONFETTI_COLORS = ["#ffcf6b", "#5fb8c9", "#e2955d", "#a97c50", "#9fd3ff", "#ffd76b"];
const CONFETTI_COUNT = 40;

interface SavedState {
  roomName: string;
  visitedKitchen: boolean;
  hasKey: boolean;
}

interface ConfettiPiece {
  id: number;
  left: number;
  drift: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

function createConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    drift: (Math.random() - 0.5) * 40,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
    delay: Math.random() * 0.5,
    duration: 2.2 + Math.random() * 1.6,
  }));
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
  // Rendered with defaultRooms first so the server-rendered HTML and the
  // client's first paint match; /api/rooms (backed by D1) replaces it after mount.
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [state, setState] = useState<GameState>(createInitialState);
  const [message, setMessage] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [keyPosition, setKeyPosition] = useState<{ top: string; left: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEscape, setShowEscape] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const isFirstSave = useRef(true);

  // Reads localStorage, which only exists client-side, so this can't be
  // decided during the initial (possibly server) render.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowWelcome(true);
      }
    } catch {
      setShowWelcome(true);
    }
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      // ignore (e.g. private browsing with storage disabled)
    }
  }

  // On mount: load the room list from the database, then apply any saved
  // progress against that list. Client-only, so the first paint still
  // matches the server-rendered HTML (no hydration mismatch).
  useEffect(() => {
    let cancelled = false;

    async function init() {
      let loadedRooms = defaultRooms;
      try {
        const response = await fetch("/api/rooms");
        if (response.ok) {
          const data = (await response.json()) as Room[];
          if (Array.isArray(data) && data.length > 0) {
            loadedRooms = data;
          }
        }
      } catch {
        // keep defaultRooms
      }

      if (cancelled) {
        return;
      }

      // Syncing from the database and localStorage, both read once on mount.
      setRooms(loadedRooms);

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as SavedState;
          const room = findRoomByName(saved.roomName, loadedRooms);
          if (room) {
            setState({ room, visitedKitchen: saved.visitedKitchen, hasKey: saved.hasKey });
          }
        }
      } catch {
        // ignore unreadable/corrupt saved state
      }
    }

    init();
    return () => {
      cancelled = true;
    };
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

  // Celebrate every time the Boathouse is reached (state.room only changes
  // reference on an actual room change, so this fires once per arrival).
  useEffect(() => {
    if (state.room.name === "Boathouse") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowEscape(true);
      setConfettiPieces(createConfetti());
    }
  }, [state.room]);

  function dismissEscape() {
    setShowEscape(false);
  }

  function move(direction: Direction) {
    if (isTransitioning) {
      return;
    }

    const result = attemptMove(state, direction, rooms);

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

  function handlePickUpKey() {
    setState((current) => pickUpKey(current));
  }

  const currentRoom = state.room;

  const openDirections = (Object.keys(directionDeltas) as Direction[]).filter((direction) => {
    const { dc, dr } = directionDeltas[direction];
    return findRoom(currentRoom.col + dc, currentRoom.row + dr, rooms) !== undefined;
  });

  const exitsText =
    openDirections.length > 0
      ? "You can go: " + openDirections.map((direction) => directionLabels[direction]).join(", ")
      : "There is nowhere to go from here.";

  const visibleRooms = rooms.filter((room) => room.name !== "Boathouse" || state.hasKey);

  function directionTo(room: Room): Direction | null {
    const dc = room.col - currentRoom.col;
    const dr = room.row - currentRoom.row;
    return (
      (Object.keys(directionDeltas) as Direction[]).find((direction) => {
        const delta = directionDeltas[direction];
        return delta.dc === dc && delta.dr === dr;
      }) ?? null
    );
  }

  return (
    <>
      {showWelcome && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <div className="modal-box">
            <h2 id="welcome-title">Welcome</h2>
            <p>
              You&apos;re trapped at the top of a lighthouse, and the way down is locked tight.
              Search each room for a hidden key — it&apos;s the only thing that will unlock the
              way to a secret room, and your only chance to escape.
            </p>
            <button type="button" className="modal-dismiss" onClick={dismissWelcome}>
              Begin
            </button>
          </div>
        </div>
      )}
      {showEscape && (
        <>
          <div className="confetti" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={
                  {
                    left: `${piece.left}%`,
                    width: piece.size,
                    height: piece.size,
                    backgroundColor: piece.color,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                    "--drift": `${piece.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="escape-title">
            <div className="modal-box">
              <h2 id="escape-title">You Escaped!</h2>
              <p>
                You unlocked the Boathouse, climbed aboard, and rowed clear of the lighthouse.
                The tower shrinks behind you — you made it out.
              </p>
              <button type="button" className="modal-dismiss" onClick={dismissEscape}>
                Nice!
              </button>
            </div>
          </div>
        </>
      )}
      <div className="pixel-frame" style={{ "--room-color": currentRoom.color } as CSSProperties}>
        <main>
          <div className="map" aria-label="Rooms">
            {visibleRooms.map((room) => {
              const isCurrent = room.col === currentRoom.col && room.row === currentRoom.row;
              const direction = isCurrent ? null : directionTo(room);

              return (
                <button
                  key={room.name}
                  type="button"
                  className={isCurrent ? "cell current" : direction ? "cell reachable" : "cell"}
                  onClick={direction ? () => move(direction) : undefined}
                  disabled={direction === null}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  {room.name}
                </button>
              );
            })}
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
          <footer>Tap a nearby room on the map to move there.</footer>
        </main>
      </div>
    </>
  );
}

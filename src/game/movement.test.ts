import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptMove, createInitialState } from "./movement.ts";

test("the Lamp Room door starts locked until the Keeper's Kitchen is visited", () => {
  const state = createInitialState();
  const result = attemptMove(state, "up");

  assert.equal(result.state.room.name, "Rocks");
  assert.equal(result.message, "The lamp room door is locked.");
});

test("visiting the Keeper's Kitchen unlocks the Lamp Room door", () => {
  let state = createInitialState();

  state = attemptMove(state, "left").state; // Rocks -> Keeper's Kitchen
  state = attemptMove(state, "right").state; // Keeper's Kitchen -> Rocks

  const result = attemptMove(state, "up"); // Rocks -> Lamp Room

  assert.equal(result.state.room.name, "Lamp Room");
  assert.equal(result.message, "");
});

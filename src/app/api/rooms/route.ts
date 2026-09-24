import { getCloudflareContext } from "@opennextjs/cloudflare";
import { defaultRooms, type Room } from "@/game/movement";

export const dynamic = "force-dynamic";

interface RoomRow {
  name: string;
  description: string;
  col: number;
  row: number;
  color: string;
  art: string;
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare(
      "SELECT name, description, col, row, color, art FROM rooms ORDER BY id"
    ).all<RoomRow>();

    const rooms: Room[] = results.map((row) => ({
      name: row.name,
      description: row.description,
      col: row.col,
      row: row.row,
      color: row.color,
      art: row.art,
    }));

    return Response.json(rooms);
  } catch {
    // D1 isn't reachable (e.g. local `next dev` without the Cloudflare
    // dev proxy) — fall back to the built-in room list.
    return Response.json(defaultRooms);
  }
}

import { describe, expect, it } from "vitest";
import {
	FACE_HEIGHT,
	FACE_WIDTH,
	FRAME_BOTTOM_CENTER,
	FRAME_BOTTOM_LEFT,
	FRAME_BOTTOM_RIGHT,
	FRAME_STRAIGHT,
	FRAMES,
} from "./robot-frames";

function pixels(rows: string[]): boolean[][] {
	return rows.flatMap((row) => [
		Array.from(row, (cell) => cell === "█" || cell === "▀"),
		Array.from(row, (cell) => cell === "█" || cell === "▄"),
	]);
}

describe("Glyph circular face", () => {
	it("provides every tracking frame in a fixed, aspect-correct canvas", () => {
		expect(FRAMES).toHaveLength(FRAME_BOTTOM_RIGHT + 1);
		expect(FACE_WIDTH).toBe(FACE_HEIGHT * 2);
		for (const frame of FRAMES) {
			expect(frame.rows).toHaveLength(FACE_HEIGHT);
			for (const row of frame.rows) {
				expect(row).toHaveLength(FACE_WIDTH);
				expect(row).toMatch(/^[ █▀▄]+$/);
			}
		}
	});

	it("keeps a complete circular silhouette in every gaze direction", () => {
		const center = (FACE_WIDTH - 1) / 2;
		const radius = FACE_WIDTH / 2;
		for (const frame of FRAMES) {
			const grid = pixels(frame.rows);
			for (let y = 0; y < FACE_WIDTH; y++) {
				const row = grid[y];
				const outline = Array.from(
					{ length: FACE_WIDTH },
					(_, x) => (x - center) ** 2 + (y - center) ** 2 <= radius ** 2,
				);
				expect(row.indexOf(true)).toBe(outline.indexOf(true));
				expect(row.lastIndexOf(true)).toBe(outline.lastIndexOf(true));
				for (let x = 0; x < FACE_WIDTH; x++) {
					if (!outline[x]) expect(row[x]).toBe(false);
				}
			}
		}
	});

	it("has two enclosed eyes, not a gap in the face outline", () => {
		for (const frame of FRAMES) {
			const grid = pixels(frame.rows);
			const visited = new Set<string>();
			const holes: boolean[] = [];
			for (let y = 0; y < FACE_WIDTH; y++) {
				for (let x = 0; x < FACE_WIDTH; x++) {
					if (grid[y][x] || visited.has(`${x},${y}`)) continue;
					const pending = [{ x, y }];
					let touchesEdge = false;
					while (pending.length > 0) {
						const cell = pending.pop();
						if (!cell) break;
						const key = `${cell.x},${cell.y}`;
						if (visited.has(key)) continue;
						visited.add(key);
						touchesEdge ||=
							cell.x === 0 ||
							cell.y === 0 ||
							cell.x === FACE_WIDTH - 1 ||
							cell.y === FACE_WIDTH - 1;
						for (const [dx, dy] of [
							[-1, 0],
							[1, 0],
							[0, -1],
							[0, 1],
						]) {
							const nextX = cell.x + dx;
							const nextY = cell.y + dy;
							if (
								nextX >= 0 &&
								nextX < FACE_WIDTH &&
								nextY >= 0 &&
								nextY < FACE_WIDTH &&
								!grid[nextY][nextX]
							) {
								pending.push({ x: nextX, y: nextY });
							}
						}
					}
					holes.push(!touchesEdge);
				}
			}
			expect(holes.filter(Boolean)).toHaveLength(2);
		}
	});

	it("moves the eyes left, right, and down while keeping the round face", () => {
		const left = FRAMES[FRAME_BOTTOM_LEFT].rows;
		const center = FRAMES[FRAME_BOTTOM_CENTER].rows;
		const right = FRAMES[FRAME_BOTTOM_RIGHT].rows;
		expect(center).not.toEqual(FRAMES[FRAME_STRAIGHT].rows);
		expect(left).not.toEqual(center);
		expect(right).not.toEqual(center);
		expect(left.map((row) => Array.from(row).reverse().join(""))).toEqual(
			right,
		);
	});
});

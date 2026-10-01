import { describe, expect, it } from "vitest";
import { getThinkingOrbFrame } from "./thinking-orb-frames";

describe("thinking orb frames", () => {
	for (const compact of [false, true]) {
		it(`keeps ${compact ? "compact" : "normal"} frames within a fixed canvas`, () => {
			for (let tick = 0; tick < 200; tick++) {
				const rows = getThinkingOrbFrame(tick / 10, compact);
				expect(rows).toHaveLength(compact ? 1 : 3);
				for (const row of rows) {
					expect(row).toHaveLength(compact ? 2 : 6);
					expect(row).toMatch(/^[ \u2801-\u28ff]+$/);
				}
				expect(rows.join("")).toMatch(/[\u2801-\u28ff]/);
			}
		});

		it(`animates deterministically in ${compact ? "compact" : "normal"} mode`, () => {
			const frames = Array.from({ length: 40 }, (_, tick) =>
				getThinkingOrbFrame(tick / 10, compact).join("\n"),
			);
			expect(new Set(frames).size).toBeGreaterThan(compact ? 2 : 5);
			expect(getThinkingOrbFrame(2, compact)).toEqual(
				getThinkingOrbFrame(2, compact),
			);
		});
	}
});

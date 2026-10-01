/*
 * Woven-orbit geometry adapted from https://github.com/Schoolees/thinking-orbs
 * (src/engine/orbits.ts), originally by Jakub Antalik.
 *
 * MIT License
 * Copyright (c) 2026 Jakub Antalik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const BRAILLE_BITS = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80];

export function getThinkingOrbFrame(time: number, compact = false): string[] {
	const width = compact ? 2 : 6;
	const height = compact ? 1 : 3;
	const pixels = width * 2;
	const radius = pixels * 0.41;
	const cells = Array.from({ length: height }, () =>
		Array<number>(width).fill(0),
	);
	const t = time * 1.885;
	const spin = t * 0.08;

	function plot(x: number, y: number, z: number) {
		const rotatedX = x * Math.cos(spin) + z * Math.sin(spin);
		const rotatedZ = -x * Math.sin(spin) + z * Math.cos(spin);
		const rotatedY = y * Math.cos(0.3) - rotatedZ * Math.sin(0.3);
		const px = Math.round((pixels - 1) / 2 + rotatedX * radius);
		const py = Math.round((pixels - 1) / 2 - rotatedY * radius);
		if (px < 0 || px >= pixels || py < 0 || py >= height * 4) return;
		cells[Math.floor(py / 4)][Math.floor(px / 2)] |=
			BRAILLE_BITS[(py % 4) * 2 + (px % 2)];
	}

	for (let band = 0; band < 2; band++) {
		const direction = band === 0 ? 1 : -1;
		const phase = (band * Math.PI) / 2;
		const yaw = phase + t * 0.19 * direction;
		const tilt = 0.5 + band * 0.18 + 0.08 * Math.sin(t * 0.32 + phase);
		const ux = Math.cos(yaw);
		const uz = Math.sin(yaw);
		const vx = -uz * Math.sin(tilt);
		const vy = Math.cos(tilt);
		const vz = ux * Math.sin(tilt);

		for (let segment = 0; segment < 64; segment++) {
			const angle = (segment / 64) * Math.PI * 2;
			const wobble =
				0.105 * Math.sin(angle * 3 - t * 1.35 * direction + phase) +
				0.04 * Math.sin(angle * 5 + t * 0.78 - phase);
			const x = ux * Math.cos(angle) + vx * Math.sin(angle) - uz * vy * wobble;
			const y = vy * Math.sin(angle) + (uz * vx - ux * vz) * wobble;
			const z = uz * Math.cos(angle) + vz * Math.sin(angle) + ux * vy * wobble;
			const length = Math.hypot(x, y, z);
			// Sparse back-facing strands preserve depth at terminal resolution.
			if (z < -0.2 && segment % 3 !== 0) continue;
			plot(x / length, y / length, z / length);
		}
	}

	return cells.map((row) =>
		row
			.map((bits) => (bits ? String.fromCharCode(0x2800 + bits) : " "))
			.join(""),
	);
}

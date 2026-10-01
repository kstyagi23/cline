export interface CroppedFrame {
	rows: string[];
}

// Two square half-cell pixels per terminal row keep the face circular in the
// usual 1:2 terminal cell aspect ratio, rather than stretching it into an oval.
export const FACE_WIDTH = 24;
export const FACE_HEIGHT = 12;
export const FRAME_STRAIGHT = 0;
export const FRAME_BOTTOM_LEFT = 64;
export const FRAME_BOTTOM_CENTER = 96;
export const FRAME_BOTTOM_RIGHT = 128;

const RADIUS = FACE_WIDTH / 2;
const CENTER = (FACE_WIDTH - 1) / 2;
const EYE_SPACING = 4;
const EYE_RADIUS_X = 1.75;
const EYE_RADIUS_Y = 3;

function buildFrame(index: number): CroppedFrame {
	const gazeX =
		index <= FRAME_BOTTOM_LEFT
			? (-2 * index) / FRAME_BOTTOM_LEFT
			: (2 * (index - FRAME_BOTTOM_CENTER)) /
				(FRAME_BOTTOM_RIGHT - FRAME_BOTTOM_CENTER);
	const gazeY = 2 * Math.min(index / FRAME_BOTTOM_LEFT, 1);
	const eyeY = CENTER - 1.5 + gazeY;

	function isFilled(x: number, y: number): boolean {
		if ((x - CENTER) ** 2 + (y - CENTER) ** 2 > RADIUS ** 2) {
			return false;
		}
		return ![-EYE_SPACING, EYE_SPACING].some((offset) => {
			const dx = (x - (CENTER + offset + gazeX)) / EYE_RADIUS_X;
			const dy = (y - eyeY) / EYE_RADIUS_Y;
			return dx ** 2 + dy ** 2 <= 1;
		});
	}

	const rows = Array.from({ length: FACE_HEIGHT }, (_, row) =>
		Array.from({ length: FACE_WIDTH }, (_, col) => {
			const top = isFilled(col, row * 2);
			const bottom = isFilled(col, row * 2 + 1);
			return top ? (bottom ? "█" : "▀") : bottom ? "▄" : " ";
		}).join(""),
	);
	return { rows };
}

// The silhouette stays fixed and fully closed while the eyes follow the cursor.
export const FRAMES: CroppedFrame[] = Array.from(
	{ length: FRAME_BOTTOM_RIGHT + 1 },
	(_, index) => buildFrame(index),
);

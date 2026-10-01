import { useTerminalDimensions } from "@opentui/react";
import { useEffect, useState } from "react";
import {
	type CroppedFrame,
	FACE_HEIGHT,
	FACE_WIDTH,
	FRAME_BOTTOM_CENTER,
	FRAME_BOTTOM_LEFT,
	FRAME_BOTTOM_RIGHT,
	FRAME_STRAIGHT,
	FRAMES,
} from "./robot-frames";

function RobotFrame(props: { frame: CroppedFrame; defaultColor: string }) {
	const { frame, defaultColor } = props;
	return (
		<box
			flexDirection="column"
			width={FACE_WIDTH}
			height={FACE_HEIGHT}
			flexShrink={0}
		>
			{frame.rows.map((row, rowIdx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: animation frames have a fixed row order
				<text
					key={`row-${rowIdx}`}
					fg={defaultColor}
					height={1}
					wrapMode="none"
				>
					{row}
				</text>
			))}
		</box>
	);
}

export function RobotAnimation(props: {
	cursorX: number;
	cursorY: number;
	defaultColor?: string;
}) {
	const [frameIndex, setFrameIndex] = useState(FRAME_STRAIGHT);
	const [targetFrame, setTargetFrame] = useState(FRAME_STRAIGHT);
	const { width, height } = useTerminalDimensions();

	const faceX = Math.floor(width / 2);
	const trackStartY = Math.floor(height / 2) - Math.floor(FACE_HEIGHT / 2);

	useEffect(() => {
		const dx = props.cursorX - faceX;
		const dy = props.cursorY - trackStartY;

		if (dy < 0) {
			setTargetFrame(FRAME_STRAIGHT);
			return;
		}

		const maxTrackY = height - trackStartY;
		if (dy > maxTrackY) {
			setTargetFrame(FRAME_STRAIGHT);
			return;
		}

		const maxOffset = 40;
		const clampedDx = Math.max(-maxOffset, Math.min(maxOffset, dx));
		const normalized = clampedDx / maxOffset;

		let target: number;
		if (normalized <= 0) {
			target = Math.round(
				FRAME_BOTTOM_LEFT +
					(1 + normalized) * (FRAME_BOTTOM_CENTER - FRAME_BOTTOM_LEFT),
			);
		} else {
			target = Math.round(
				FRAME_BOTTOM_CENTER +
					normalized * (FRAME_BOTTOM_RIGHT - FRAME_BOTTOM_CENTER),
			);
		}

		setTargetFrame(target);
	}, [props.cursorX, props.cursorY, faceX, trackStartY, height]);

	useEffect(() => {
		const interval = setInterval(() => {
			setFrameIndex((current) => {
				if (current === targetFrame) return current;
				const diff = targetFrame - current;
				const step =
					Math.sign(diff) * Math.max(Math.abs(Math.round(diff * 0.5)), 1);
				const next = current + step;
				if (
					(diff > 0 && next > targetFrame) ||
					(diff < 0 && next < targetFrame)
				) {
					return targetFrame;
				}
				return next;
			});
		}, 12);

		return () => clearInterval(interval);
	}, [targetFrame]);

	const safeIndex = Math.max(0, Math.min(frameIndex, FRAMES.length - 1));
	const frame = FRAMES[safeIndex];
	if (!frame) return null;

	return (
		<box flexDirection="column" alignItems="center" width="100%">
			<RobotFrame frame={frame} defaultColor={props.defaultColor ?? "white"} />
		</box>
	);
}

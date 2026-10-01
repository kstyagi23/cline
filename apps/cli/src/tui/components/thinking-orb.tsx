import { useTerminalDimensions } from "@opentui/react";
import { useEffect, useState } from "react";
import { getThinkingOrbFrame } from "./thinking-orb-frames";

export function ThinkingIndicator(props: { color: string; label?: string }) {
	const { width, height } = useTerminalDimensions();
	const compact = width < 50 || height < 15;
	const [time, setTime] = useState(0);

	useEffect(() => {
		const started = performance.now();
		const interval = setInterval(() => {
			setTime((performance.now() - started) / 1000);
		}, 100);
		return () => clearInterval(interval);
	}, []);

	const rows = getThinkingOrbFrame(time, compact);
	return (
		<box flexDirection="row" alignItems="center" gap={1}>
			<box width={compact ? 2 : 6} height={rows.length} flexShrink={0}>
				<text fg={props.color} wrapMode="none">
					{rows.join("\n")}
				</text>
			</box>
			<text fg="gray" flexShrink={1}>
				{props.label ?? "Thinking..."}
			</text>
		</box>
	);
}

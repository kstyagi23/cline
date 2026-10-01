import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getComponentCatalogue } from "@opentui/react";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";

const isolatedRoot = mkdtempSync(join(tmpdir(), "cline-tui-smoke-"));
process.env.CLINE_DIR = join(isolatedRoot, ".cline");
process.env.CLINE_DATA_DIR = join(isolatedRoot, "data");
process.env.CLINE_PROVIDER_SETTINGS_PATH = join(isolatedRoot, "providers.json");
process.env.CLINE_HUB_DISCOVERY_PATH = join(isolatedRoot, "hub-discovery.json");
process.env.CLINE_NO_AUTO_UPDATE = "1";
process.env.CLINE_TELEMETRY_DISABLED = "1";

try {
	// Match the CLI's lazy TUI loading and exercise actual loading components.
	const { LoadingDialogContent } = await import(
		"../src/tui/components/dialogs/loading-dialog"
	);
	const { ClineModelPicker } = await import(
		"../src/tui/components/model-selector/cline-model-picker"
	);
	const cases = [
		{
			name: "loading dialog",
			content: <LoadingDialogContent message="Loading provider..." />,
			message: "Loading provider...",
		},
		{
			name: "model picker",
			content: <ClineModelPicker entries={[]} selected={0} loading />,
			message: "Loading models...",
		},
	];
	for (const { name, content, message } of cases) {
		// Registration must work even if an import's side effects were omitted.
		delete getComponentCatalogue().spinner;
		const setup = await testRender(content, { width: 80, height: 5 });
		try {
			await act(async () => {
				await setup.renderOnce();
			});
			const frame = setup.captureCharFrame();
			assert.ok(frame.includes(message), `${name} failed to render:\n${frame}`);
			assert.match(
				frame,
				/[\u2800-\u28ff]/,
				`${name} did not paint its spinner`,
			);
		} finally {
			await act(async () => {
				setup.renderer.destroy();
			});
		}
		console.log(`  Passed: ${name} renders its loading spinner`);
	}

	const { TrackedRobot } = await import("../src/tui/components/tracked-robot");
	const { FACE_HEIGHT, FRAMES } = await import(
		"../src/tui/components/robot-frames"
	);
	const { TerminalColorsContext } = await import("../src/tui/hooks/use-theme");
	const { OnboardingMainMenuScreen } = await import(
		"../src/tui/views/onboarding/screens"
	);
	const { MAIN_MENU } = await import("../src/tui/views/onboarding/model");
	const brandCases = [
		{
			name: "circular face on a dark terminal",
			width: 80,
			height: 24,
			content: (
				<TerminalColorsContext
					value={{ background: "#000000", foreground: "#ffffff" }}
				>
					<TrackedRobot />
				</TerminalColorsContext>
			),
		},
		{
			name: "circular face on a narrow light terminal",
			width: 30,
			height: 24,
			content: (
				<TerminalColorsContext
					value={{ background: "#ffffff", foreground: "#000000" }}
				>
					<TrackedRobot />
				</TerminalColorsContext>
			),
		},
		{
			name: "Glyph onboarding",
			width: 80,
			height: 48,
			content: (
				<OnboardingMainMenuScreen
					contentWidth={60}
					menuOptions={MAIN_MENU}
					menuSelected={0}
					mouse={{ cursor: { x: 0, y: 0 }, onMouseMove: () => {} }}
				/>
			),
		},
	];
	for (const { name, width, height, content } of brandCases) {
		const setup = await testRender(content, { width, height });
		try {
			await act(async () => {
				await setup.renderOnce();
			});
			const frame = setup.captureCharFrame();
			const faceRows = frame.split("\n").filter((row) => /[█▀▄]/.test(row));
			assert.equal(
				faceRows.length,
				FACE_HEIGHT,
				`${name} clipped the face:\n${frame}`,
			);
			assert.deepEqual(
				faceRows.map((row) => row.trim()),
				FRAMES[0].rows.map((row) => row.trim()),
				`${name} did not render the complete circular face`,
			);
			if (name === "Glyph onboarding") {
				assert.ok(frame.includes("Welcome to Glyph"), frame);
				assert.ok(!frame.includes("Welcome to Cline"), frame);
				// Provider brands and IDs are not part of the application rebrand.
				assert.ok(frame.includes("Sign in with Cline"), frame);
			}
			if (process.env.GLYPH_SMOKE_PREVIEW === "1") console.log(frame);
		} finally {
			await act(async () => {
				setup.renderer.destroy();
			});
		}
		console.log(`  Passed: ${name} renders the complete Glyph face`);
	}
} finally {
	rmSync(isolatedRoot, { recursive: true, force: true });
}

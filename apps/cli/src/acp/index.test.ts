import { afterEach, describe, expect, it, vi } from "vitest";

describe("runAcpMode", () => {
	afterEach(() => {
		vi.doUnmock("@agentclientprotocol/sdk");
		vi.doUnmock("./acpAgent");
		vi.restoreAllMocks();
	});

	it("writes the startup diagnostic without labeling it as an error", async () => {
		const stderrWrite = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		vi.doMock("@agentclientprotocol/sdk", () => ({
			ndJsonStream: vi.fn(() => ({})),
			AgentSideConnection: class {
				closed = Promise.resolve();
			},
		}));
		vi.doMock("./acpAgent", () => ({
			AcpAgent: class {},
		}));

		const { runAcpMode } = await import("./index");

		await runAcpMode();

		expect(stderrWrite).toHaveBeenCalledWith(
			"[acp] starting ACP mode over stdio…\n",
		);
		expect(stderrWrite).not.toHaveBeenCalledWith(
			expect.stringContaining("error:"),
		);
	});

	it("advertises Glyph as its display title without renaming ACP or provider IDs", async () => {
		vi.resetModules();
		const { PROTOCOL_VERSION } = await import("@agentclientprotocol/sdk");
		const { AcpAgent } = await import("./acpAgent");
		const response = await AcpAgent.prototype.initialize({
			protocolVersion: PROTOCOL_VERSION,
		});

		expect(response.protocolVersion).toBe(PROTOCOL_VERSION);
		expect(response.agentInfo).toMatchObject({
			name: "cline",
			title: "Glyph",
			version: expect.any(String),
		});
		expect(response.authMethods).toEqual(
			expect.arrayContaining([
				{ id: "cline", name: "Sign in with Cline" },
				{ id: "cline-pass", name: "Sign in with ClinePass" },
			]),
		);
	});
});

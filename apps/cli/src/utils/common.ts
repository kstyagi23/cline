import * as os from "node:os";
import type { RuntimeEnv } from "@cline/shared";
import { version } from "../../package.json";

export function getCliBuildInfo(): RuntimeEnv {
	return {
		// Runtime/telemetry identity and log paths must not follow display branding.
		name: "cline",
		version,
		platform: "terminal",
		platform_version: process.version,
		os_type: os.platform(),
		os_version: os.version(),
	};
}

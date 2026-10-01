const demos = {
	build: {
		command: 'glyph "Add dark mode and test it"',
		mode: "ACT",
		intro:
			"I'll check the theme setup, make the change, and run the relevant tests.",
		steps: [
			"Read   src/styles/theme.ts",
			"Edit   Theme toggle + saved preference",
			"Run    Theme tests",
		],
		result: "Dark mode added. 8 tests passed.",
	},
	review: {
		command: 'git diff | glyph "Review these changes for bugs"',
		mode: "ACT",
		intro: "I'll read the diff and check the surrounding code for regressions.",
		steps: [
			"Read   Staged changes + surrounding code",
			"Check  Error handling and edge cases",
			"Report Findings with file references",
		],
		result: "Review complete. One missing null check identified.",
	},
	plan: {
		command: 'glyph --plan "Propose an auth refactor"',
		mode: "PLAN",
		intro:
			"I'll explore the current auth flow before proposing an implementation.",
		steps: [
			"Read   Auth routes and project rules",
			"Trace  Session lifecycle + dependencies",
			"Plan   Refactor steps and test coverage",
		],
		result: "Plan ready. Switch to Act when you're ready to build.",
	},
};

const installs = {
	source: {
		label: "FROM THE ROOT OF THIS CHECKOUT",
		command: "bun install\nbun run build:sdk\nbun run cli",
		note: "Requires Bun 1.4.2 and Node.js 22+. Build the shared runtime before launching the CLI.",
	},
	windows: {
		label: "BUILD THE PER-USER WINDOWS INSTALLER",
		command: "bun run --cwd apps/cli build:installer:windows",
		note: "After source setup, build on Windows. Output: apps/cli/dist/installers/. Run the generated installer, then reopen your terminal. No administrator access required.",
	},
	native: {
		label: "BUILD FOR YOUR CURRENT PLATFORM",
		command: "bun run --cwd apps/cli build:platforms:single",
		note: "After source setup, build a native artifact. Supported targets: Windows, macOS, and Linux on x64 and arm64. Output: apps/cli/dist/. Internal binaries retain the cline name.",
	},
};

function connectTabs(selector, panelId, dataKey, onSelect) {
	const tabs = Array.from(document.querySelectorAll(selector));
	const panel = document.getElementById(panelId);
	function select(tab) {
		for (const item of tabs) {
			const active = item === tab;
			item.setAttribute("aria-selected", String(active));
			item.tabIndex = active ? 0 : -1;
		}
		panel.setAttribute("aria-labelledby", tab.id);
		onSelect(tab.dataset[dataKey]);
	}
	for (const tab of tabs) {
		tab.addEventListener("click", () => select(tab));
		tab.addEventListener("keydown", (event) => {
			const index = tabs.indexOf(tab);
			let nextIndex;
			if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
			else if (event.key === "ArrowLeft")
				nextIndex = (index - 1 + tabs.length) % tabs.length;
			else if (event.key === "Home") nextIndex = 0;
			else if (event.key === "End") nextIndex = tabs.length - 1;
			else return;
			event.preventDefault();
			tabs[nextIndex].focus();
			select(tabs[nextIndex]);
		});
	}
}

connectTabs("[data-demo]", "terminal-panel", "demo", (key) => {
	const demo = demos[key];
	document.getElementById("demo-command").textContent = demo.command;
	document.querySelector(".agent-heading > span:last-child").textContent =
		demo.mode;
	document.getElementById("demo-intro").textContent = demo.intro;
	document.getElementById("demo-result").textContent = demo.result;
	const steps = demo.steps.map((text) => {
		const line = document.createElement("p");
		const check = document.createElement("span");
		check.textContent = "✓";
		line.append(check, document.createTextNode(text));
		return line;
	});
	document.getElementById("demo-steps").replaceChildren(...steps);
});

let selectedInstall = "source";
connectTabs("[data-install]", "install-panel", "install", (key) => {
	selectedInstall = key;
	const install = installs[key];
	document.getElementById("install-label").textContent = install.label;
	document.getElementById("install-command").textContent = install.command;
	document.getElementById("install-note").textContent = install.note;
});

const copyStatus = document.getElementById("copy-status");
let toastTimer;
function announce(message) {
	window.clearTimeout(toastTimer);
	copyStatus.textContent = message;
	copyStatus.classList.add("visible");
	toastTimer = window.setTimeout(
		() => copyStatus.classList.remove("visible"),
		3500,
	);
}

document.getElementById("copy-command").addEventListener("click", async () => {
	const command = installs[selectedInstall].command;
	try {
		await navigator.clipboard.writeText(command);
		announce("Commands copied to clipboard.");
	} catch {
		// Local files or browsers with clipboard access disabled can still select the commands.
		const range = document.createRange();
		range.selectNodeContents(document.getElementById("install-command"));
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		announce("Commands selected. Press Ctrl+C or Command+C to copy.");
	}
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.getElementById("navigation");
function setMenu(open) {
	menuToggle.setAttribute("aria-expanded", String(open));
	menuToggle.setAttribute(
		"aria-label",
		open ? "Close navigation" : "Open navigation",
	);
	navigation.classList.toggle("is-open", open);
}
menuToggle.addEventListener("click", () =>
	setMenu(menuToggle.getAttribute("aria-expanded") !== "true"),
);
for (const link of navigation.querySelectorAll("a")) {
	link.addEventListener("click", () => setMenu(false));
}
document.addEventListener("keydown", (event) => {
	if (
		event.key === "Escape" &&
		menuToggle.getAttribute("aria-expanded") === "true"
	) {
		setMenu(false);
		menuToggle.focus();
	}
});
document.addEventListener("click", (event) => {
	if (!navigation.contains(event.target) && !menuToggle.contains(event.target))
		setMenu(false);
});
window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
	if (event.matches) setMenu(false);
});

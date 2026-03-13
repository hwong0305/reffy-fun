import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import Header from "./header";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		activeProps: _activeProps,
		children,
		onClick,
		to,
		...props
	}: AnchorHTMLAttributes<HTMLAnchorElement> & {
		activeProps?: unknown;
		children?: ReactNode;
		to?: unknown;
	}) => (
		<a href={typeof to === "string" ? to : "#"} onClick={onClick} {...props}>
			{children}
		</a>
	),
}));

vi.mock("./mode-toggle", () => ({
	ModeToggle: () => <div data-testid="mode-toggle" />,
}));

vi.mock("./user-menu", () => ({
	default: () => <div data-testid="user-menu" />,
}));

const originalMatchMedia = window.matchMedia;

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

afterAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: originalMatchMedia,
	});
});

describe("Header mobile drawer behavior", () => {
	it("opens mobile drawer from menu button", async () => {
		const user = userEvent.setup();
		render(<Header />);

		expect(
			screen.queryByRole("dialog", { name: "Mobile navigation menu" }),
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		expect(
			screen.getByRole("dialog", { name: "Mobile navigation menu" }),
		).toBeInTheDocument();
	});

	it("closes drawer when overlay is clicked", async () => {
		const user = userEvent.setup();
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		await user.click(
			screen.getByRole("button", { name: "Close mobile navigation" }),
		);

		expect(
			screen.queryByRole("dialog", { name: "Mobile navigation menu" }),
		).not.toBeInTheDocument();
	});

	it("closes drawer on Escape and returns focus to trigger", async () => {
		const user = userEvent.setup();
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);
		await user.keyboard("{Escape}");

		await waitFor(() => {
			expect(
				screen.queryByRole("dialog", { name: "Mobile navigation menu" }),
			).not.toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Open mobile navigation menu" }),
			).toHaveFocus();
		});
	});

	it("closes drawer when a drawer link is selected", async () => {
		const user = userEvent.setup();
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		const dialog = screen.getByRole("dialog", {
			name: "Mobile navigation menu",
		});
		await user.click(within(dialog).getByRole("link", { name: "Home" }));

		expect(
			screen.queryByRole("dialog", { name: "Mobile navigation menu" }),
		).not.toBeInTheDocument();
	});

	it("moves focus to first drawer link when opened", async () => {
		const user = userEvent.setup();
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		const dialog = screen.getByRole("dialog", {
			name: "Mobile navigation menu",
		});
		const firstLink = within(dialog).getByRole("link", { name: "Home" });

		await waitFor(() => {
			expect(firstLink).toHaveFocus();
		});
	});

	it("locks body scroll while drawer is open and restores it on close", async () => {
		const user = userEvent.setup();
		document.body.style.overflow = "scroll";
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		expect(document.body.style.overflow).toBe("hidden");

		await user.click(
			screen.getByRole("button", { name: "Close mobile navigation" }),
		);

		await waitFor(() => {
			expect(document.body.style.overflow).toBe("scroll");
		});
	});

	it("keeps Tab navigation contained within the open drawer", async () => {
		const user = userEvent.setup();
		render(<Header />);

		await user.click(
			screen.getByRole("button", { name: "Open mobile navigation menu" }),
		);

		const dialog = screen.getByRole("dialog", {
			name: "Mobile navigation menu",
		});
		const firstLink = within(dialog).getByRole("link", { name: "Home" });
		const lastLink = within(dialog).getByRole("link", { name: "Inbox" });

		await waitFor(() => {
			expect(firstLink).toHaveFocus();
		});

		await user.keyboard("{Shift>}{Tab}{/Shift}");
		expect(lastLink).toHaveFocus();

		await user.keyboard("{Tab}");
		expect(firstLink).toHaveFocus();
	});
});

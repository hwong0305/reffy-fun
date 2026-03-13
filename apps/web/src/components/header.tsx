import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const links = [
	{ to: "/", label: "Home" },
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/documents", label: "Documents" },
	{ to: "/shares", label: "Shares" },
	{ to: "/writer/approvals", label: "Approvals" },
	{ to: "/inbox", label: "Inbox" },
] as const;

const focusableSelector =
	'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Header() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const drawerNavRef = useRef<HTMLElement>(null);
	const drawerId = useId();

	const closeDrawer = useCallback((shouldFocusTrigger = true) => {
		setIsDrawerOpen(false);
		if (shouldFocusTrigger) {
			requestAnimationFrame(() => {
				triggerRef.current?.focus();
			});
		}
	}, []);

	useEffect(() => {
		if (!isDrawerOpen) {
			return;
		}

		const focusables =
			drawerNavRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
		const firstFocusable = focusables?.[0];
		firstFocusable?.focus();

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeDrawer();
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const drawerElement = drawerNavRef.current;
			if (!drawerElement) {
				return;
			}

			const tabOrder =
				drawerElement.querySelectorAll<HTMLElement>(focusableSelector);
			const firstTabStop = tabOrder[0];
			const lastTabStop = tabOrder[tabOrder.length - 1];

			if (!firstTabStop || !lastTabStop) {
				event.preventDefault();
				drawerElement.focus();
				return;
			}

			const activeElement = document.activeElement;
			if (!drawerElement.contains(activeElement)) {
				event.preventDefault();
				(event.shiftKey ? lastTabStop : firstTabStop).focus();
				return;
			}

			if (event.shiftKey && activeElement === firstTabStop) {
				event.preventDefault();
				lastTabStop.focus();
				return;
			}

			if (!event.shiftKey && activeElement === lastTabStop) {
				event.preventDefault();
				firstTabStop.focus();
			}
		};

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleEscape);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", handleEscape);
		};
	}, [isDrawerOpen, closeDrawer]);

	useEffect(() => {
		const mediaQueryList = window.matchMedia("(min-width: 768px)");

		if (mediaQueryList.matches && isDrawerOpen) {
			closeDrawer(false);
		}

		const handleViewportChange = (event: MediaQueryListEvent) => {
			if (event.matches) {
				closeDrawer(false);
			}
		};

		mediaQueryList.addEventListener("change", handleViewportChange);
		return () => {
			mediaQueryList.removeEventListener("change", handleViewportChange);
		};
	}, [isDrawerOpen, closeDrawer]);

	const desktopLinkClassName =
		"rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

	const mobileLinkClassName =
		"block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

	return (
		<header className="relative sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
			<div className="flex flex-row items-center justify-between px-2 py-2 md:px-4">
				<nav
					aria-label="Primary navigation"
					className="hidden items-center gap-1 md:flex"
				>
					{links.map(({ to, label }) => {
						return (
							<Link
								key={to}
								to={to}
								className={desktopLinkClassName}
								activeProps={{
									className: "bg-secondary text-secondary-foreground",
								}}
							>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<button
						ref={triggerRef}
						type="button"
						className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
						aria-expanded={isDrawerOpen}
						aria-controls={drawerId}
						aria-label={
							isDrawerOpen
								? "Close mobile navigation menu"
								: "Open mobile navigation menu"
						}
						onClick={() => {
							if (isDrawerOpen) {
								closeDrawer();
								return;
							}
							setIsDrawerOpen(true);
						}}
					>
						<span className="sr-only">Menu</span>
						<svg
							viewBox="0 0 24 24"
							aria-hidden="true"
							className="h-5 w-5"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
						</svg>
					</button>
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			{isDrawerOpen ? (
				<div
					className="md:hidden"
					role="dialog"
					aria-modal="true"
					aria-label="Mobile navigation menu"
				>
					<button
						type="button"
						aria-label="Close mobile navigation"
						className="fixed inset-0 z-[60] bg-foreground/25 opacity-100 transition-opacity duration-200"
						onClick={() => {
							closeDrawer();
						}}
					/>
					<div className="absolute inset-x-0 top-full z-[70] px-2 pt-2">
						<nav
							ref={drawerNavRef}
							id={drawerId}
							aria-label="Mobile navigation"
							tabIndex={-1}
							className="rounded-lg border bg-card p-2 text-card-foreground shadow-lg"
						>
							<div className="flex flex-col gap-1">
								{links.map(({ to, label }) => {
									return (
										<Link
											key={to}
											to={to}
											className={mobileLinkClassName}
											activeProps={{
												className: "bg-secondary text-secondary-foreground",
											}}
											onClick={() => {
												closeDrawer();
											}}
										>
											{label}
										</Link>
									);
								})}
							</div>
						</nav>
					</div>
				</div>
			) : null}
		</header>
	);
}

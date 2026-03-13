import { Link } from "@tanstack/react-router";

export default function SiteFooter() {
	return (
		<footer className="border-t px-4 py-4 text-muted-foreground text-sm">
			<div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2">
				<p>Reffy helps users share verified application documents.</p>
				<div className="flex items-center gap-4">
					<Link to="/terms" className="hover:underline">
						Terms
					</Link>
					<Link to="/privacy" className="hover:underline">
						Privacy
					</Link>
				</div>
			</div>
		</footer>
	);
}

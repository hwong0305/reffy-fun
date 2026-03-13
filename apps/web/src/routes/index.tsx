import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="container mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8">
			<section className="rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-6 shadow-sm">
				<p className="text-muted-foreground text-sm uppercase tracking-widest">
					Secure document sharing
				</p>
				<h1 className="mt-2 font-semibold text-3xl">
					Share letters, transcripts, and resumes with trust
				</h1>
				<p className="mt-4 max-w-3xl text-muted-foreground">
					Reffy lets writers upload recommendation letters for students and
					professionals. Recommendation letters are sent only after writer
					approval for each recipient. Transcripts and resumes can be shared
					directly by the user.
				</p>
				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
						to="/login"
					>
						Create account
					</Link>
					<Link className="rounded-md border px-4 py-2" to="/dashboard">
						Open dashboard
					</Link>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-lg border p-4">
					<h2 className="font-medium">For writers</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Upload recommendation letters for users and approve each recipient
						before release.
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h2 className="font-medium">For users</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Share resumes and transcripts instantly, or request recipient
						approvals for letters.
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<h2 className="font-medium">For recipients</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Create an account with your invited email to view and download
						shared documents.
					</p>
				</div>
			</section>

			<section className="rounded-lg border p-4">
				<h2 className="mb-2 font-medium">API Status</h2>
				<div className="flex items-center gap-2">
					<div
						className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-muted-foreground text-sm">
						{healthCheck.isLoading
							? "Checking..."
							: healthCheck.data
								? "Connected"
								: "Disconnected"}
					</span>
				</div>
			</section>
		</div>
	);
}

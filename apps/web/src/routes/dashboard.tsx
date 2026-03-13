import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: requireAuth,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	const privateData = useQuery(trpc.privateData.queryOptions());
	const ownedDocuments = useQuery(
		trpc.documents.listOwnedDocuments.queryOptions(),
	);
	const outgoingShares = useQuery(
		trpc.shares.listOutgoingShares.queryOptions(),
	);
	const pendingApprovals = useQuery(
		trpc.approvals.listPendingApprovals.queryOptions(),
	);
	const inboxDocuments = useQuery(
		trpc.documents.listInboxDocuments.queryOptions(),
	);
	const recipientShares = useQuery(
		trpc.shares.listRecipientShares.queryOptions(),
	);
	const recipientSharesReadyToClaim =
		recipientShares.data?.filter((share) => share.shareStatus === "approved")
			.length ?? 0;

	const recommendationSharesPending =
		outgoingShares.data?.filter(
			(share) => share.shareStatus === "pending_writer_approval",
		).length ?? 0;

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<h1 className="font-semibold text-2xl">Dashboard</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Welcome {session.data?.user.name}
			</p>

			<div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Owned documents
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{ownedDocuments.data?.length ?? 0}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Outgoing shares
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{outgoingShares.data?.length ?? 0}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Letters awaiting writer approval
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{recommendationSharesPending}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Pending writer queue
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{pendingApprovals.data?.length ?? 0}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Inbox documents
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{inboxDocuments.data?.length ?? 0}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Recipient timeline entries
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{recipientShares.data?.length ?? 0}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						Ready to claim
					</p>
					<p className="mt-2 font-semibold text-2xl">
						{recipientSharesReadyToClaim}
					</p>
				</div>
			</div>

			<p className="mt-6 text-muted-foreground text-sm">
				API: {privateData.data?.message}
			</p>
		</div>
	);
}

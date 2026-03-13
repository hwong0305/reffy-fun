import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { requireAuth } from "@/lib/require-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/writer/approvals")({
	component: WriterApprovalsRoute,
	beforeLoad: requireAuth,
});

function WriterApprovalsRoute() {
	const queryClient = useQueryClient();
	const pending = useQuery(trpc.approvals.listPendingApprovals.queryOptions());

	const decide = useMutation(
		trpc.approvals.decideShareApproval.mutationOptions({
			onSuccess: async () => {
				toast.success("Decision saved");
				await queryClient.invalidateQueries(
					trpc.approvals.listPendingApprovals.queryFilter(),
				);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="font-semibold text-2xl">Writer approvals</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Approve or reject recommendation-letter shares for each recipient.
			</p>

			<div className="mt-6 space-y-3">
				{pending.data?.map((item) => (
					<div key={item.share.id} className="rounded-lg border p-4">
						<p className="font-medium">
							Recipient: {item.share.recipientEmail}
						</p>
						<p className="text-muted-foreground text-sm">
							Share ID: {item.share.id}
						</p>
						<div className="mt-3 flex gap-2">
							<button
								type="button"
								className="rounded-md bg-primary px-3 py-1 text-primary-foreground text-sm"
								onClick={() =>
									decide.mutate({
										shareId: item.share.id,
										decision: "approved",
									})
								}
							>
								Approve
							</button>
							<button
								type="button"
								className="rounded-md border px-3 py-1 text-sm"
								onClick={() =>
									decide.mutate({
										shareId: item.share.id,
										decision: "rejected",
									})
								}
							>
								Reject
							</button>
						</div>
					</div>
				))}
				{pending.isLoading ? <p>Loading approvals...</p> : null}
				{pending.data?.length === 0 ? (
					<p className="rounded-lg border p-4 text-muted-foreground text-sm">
						No pending approvals right now.
					</p>
				) : null}
			</div>
		</div>
	);
}

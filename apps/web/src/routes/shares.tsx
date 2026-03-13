import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { requireAuth } from "@/lib/require-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/shares")({
	component: SharesRoute,
	beforeLoad: requireAuth,
});

function SharesRoute() {
	const queryClient = useQueryClient();
	const [documentId, setDocumentId] = useState("");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending_writer_approval" | "approved" | "claimed" | "rejected"
	>("all");
	const [searchEmail, setSearchEmail] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [page, setPage] = useState(1);
	const PAGE_SIZE = 10;

	const documents = useQuery(trpc.documents.listOwnedDocuments.queryOptions());
	const shares = useQuery(trpc.shares.listOutgoingShares.queryOptions());
	type OutgoingShare = NonNullable<typeof shares.data>[number];
	const createShare = useMutation(
		trpc.shares.createRecipientShare.mutationOptions({
			onSuccess: async () => {
				setRecipientEmail("");
				toast.success("Recipient share created");
				await queryClient.invalidateQueries(
					trpc.shares.listOutgoingShares.queryFilter(),
				);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const revokeShare = useMutation(
		trpc.shares.revokeShare.mutationOptions({
			onSuccess: async () => {
				toast.success("Share revoked");
				await queryClient.invalidateQueries(
					trpc.shares.listOutgoingShares.queryFilter(),
				);
			},
			onMutate: async ({ shareId }) => {
				await queryClient.cancelQueries(
					trpc.shares.listOutgoingShares.queryFilter(),
				);

				const previous = queryClient.getQueryData<OutgoingShare[]>(
					trpc.shares.listOutgoingShares.queryKey(),
				);

				if (previous) {
					queryClient.setQueryData(
						trpc.shares.listOutgoingShares.queryKey(),
						previous.map((share) =>
							share.id === shareId
								? { ...share, shareStatus: "rejected" as const }
								: share,
						),
					);
				}

				return { previous };
			},
			onError: (error, _input, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.shares.listOutgoingShares.queryKey(),
						context.previous,
					);
				}
				toast.error(error.message);
			},
		}),
	);

	const filteredShares = useMemo(
		() =>
			(shares.data ?? []).filter((item) => {
				const matchesStatus =
					statusFilter === "all" || item.shareStatus === statusFilter;
				const matchesEmail =
					searchEmail.trim().length === 0 ||
					item.recipientEmail
						.toLowerCase()
						.includes(searchEmail.trim().toLowerCase());

				return matchesStatus && matchesEmail;
			}),
		[shares.data, statusFilter, searchEmail],
	);

	const sortedShares = useMemo(() => {
		const data = [...filteredShares];
		data.sort((left, right) => {
			const leftTime = new Date(left.createdAt).getTime();
			const rightTime = new Date(right.createdAt).getTime();

			return sortBy === "newest" ? rightTime - leftTime : leftTime - rightTime;
		});

		return data;
	}, [filteredShares, sortBy]);

	const totalPages = Math.max(1, Math.ceil(sortedShares.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pagedShares = sortedShares.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<h1 className="font-semibold text-2xl">Shares</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Recommendation letters need writer approval for each recipient.
			</p>

			<form
				className="mt-6 grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]"
				onSubmit={(event) => {
					event.preventDefault();
					if (!documentId || !recipientEmail) {
						toast.error("Select a document and recipient email");
						return;
					}

					createShare.mutate({ documentId, recipientEmail });
				}}
			>
				<select
					value={documentId}
					onChange={(event) => setDocumentId(event.target.value)}
					className="rounded-md border bg-background px-2 py-2"
				>
					<option value="">Select document</option>
					{documents.data?.map((item) => (
						<option key={item.id} value={item.id}>
							{item.fileName} ({item.type})
						</option>
					))}
				</select>
				<input
					type="email"
					value={recipientEmail}
					onChange={(event) => setRecipientEmail(event.target.value)}
					placeholder="recipient@example.com"
					className="rounded-md border bg-background px-2 py-2"
				/>
				<button
					type="submit"
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
				>
					Create share
				</button>
			</form>

			<div className="mt-6 grid gap-3 md:grid-cols-2">
				<select
					value={statusFilter}
					onChange={(event) =>
						setStatusFilter(
							event.target.value as
								| "all"
								| "pending_writer_approval"
								| "approved"
								| "claimed"
								| "rejected",
						)
					}
					className="rounded-md border bg-background px-2 py-2"
				>
					<option value="all">All statuses</option>
					<option value="pending_writer_approval">
						Pending writer approval
					</option>
					<option value="approved">Approved</option>
					<option value="claimed">Claimed</option>
					<option value="rejected">Rejected</option>
				</select>
				<input
					type="text"
					value={searchEmail}
					onChange={(event) => setSearchEmail(event.target.value)}
					placeholder="Filter by recipient email"
					className="rounded-md border bg-background px-2 py-2"
				/>
				<select
					value={sortBy}
					onChange={(event) =>
						setSortBy(event.target.value as "newest" | "oldest")
					}
					className="rounded-md border bg-background px-2 py-2"
				>
					<option value="newest">Newest first</option>
					<option value="oldest">Oldest first</option>
				</select>
			</div>

			<div className="mt-3 space-y-3">
				{pagedShares.map((item) => (
					<div
						key={item.id}
						className="flex items-center justify-between rounded-lg border p-4"
					>
						<div>
							<p className="font-medium">{item.document.fileName}</p>
							<p className="text-muted-foreground text-sm">
								{item.recipientEmail} • {item.shareStatus}
							</p>
						</div>
						{item.shareStatus !== "rejected" ? (
							<button
								type="button"
								className="rounded-md border px-3 py-1 text-sm"
								onClick={() => revokeShare.mutate({ shareId: item.id })}
							>
								Revoke
							</button>
						) : null}
					</div>
				))}
				{!shares.isLoading && filteredShares.length === 0 ? (
					<p className="rounded-lg border p-4 text-muted-foreground text-sm">
						No shares match your filters.
					</p>
				) : null}
				{shares.isLoading ? <p>Loading shares...</p> : null}
			</div>

			{filteredShares.length > 0 ? (
				<div className="mt-4 flex items-center justify-between text-sm">
					<p className="text-muted-foreground">
						Page {safePage} of {totalPages}
					</p>
					<div className="flex gap-2">
						<button
							type="button"
							disabled={safePage <= 1}
							onClick={() => setPage((value) => Math.max(1, value - 1))}
							className="rounded-md border px-3 py-1 disabled:opacity-50"
						>
							Previous
						</button>
						<button
							type="button"
							disabled={safePage >= totalPages}
							onClick={() =>
								setPage((value) => Math.min(totalPages, value + 1))
							}
							className="rounded-md border px-3 py-1 disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}

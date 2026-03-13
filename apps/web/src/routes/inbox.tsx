import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { requireAuth } from "@/lib/require-auth";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/inbox")({
	component: InboxRoute,
	beforeLoad: requireAuth,
});

function downloadBase64File(
	fileName: string,
	mimeType: string,
	bytesBase64: string,
) {
	const binary = atob(bytesBase64);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	const blob = new Blob([bytes], { type: mimeType });
	const href = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = href;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(href);
}

function getShareStatusDescription(status: string) {
	if (status === "pending_writer_approval") {
		return "Waiting for writer approval before access is granted.";
	}

	if (status === "approved") {
		return "Approved. Claim this share to activate your access.";
	}

	if (status === "claimed") {
		return "Access has been granted to your account.";
	}

	if (status === "rejected") {
		return "The writer rejected this recipient share request.";
	}

	return "Unknown status";
}

function InboxRoute() {
	const queryClient = useQueryClient();
	const inbox = useQuery(trpc.documents.listInboxDocuments.queryOptions());
	const recipientShares = useQuery(
		trpc.shares.listRecipientShares.queryOptions(),
	);
	type RecipientShare = NonNullable<typeof recipientShares.data>[number];
	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending_writer_approval" | "approved" | "claimed" | "rejected"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [page, setPage] = useState(1);
	const PAGE_SIZE = 10;

	const filteredRecipientShares = useMemo(() => {
		const allShares = recipientShares.data ?? [];

		return allShares.filter((share) => {
			const matchesStatus =
				statusFilter === "all" || share.shareStatus === statusFilter;
			const normalizedSearch = searchQuery.trim().toLowerCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				share.recipientEmail.toLowerCase().includes(normalizedSearch) ||
				share.document.fileName.toLowerCase().includes(normalizedSearch);

			return matchesStatus && matchesSearch;
		});
	}, [recipientShares.data, searchQuery, statusFilter]);

	const sortedRecipientShares = useMemo(() => {
		const data = [...filteredRecipientShares];
		data.sort((left, right) => {
			const leftTime = new Date(left.createdAt).getTime();
			const rightTime = new Date(right.createdAt).getTime();

			return sortBy === "newest" ? rightTime - leftTime : leftTime - rightTime;
		});

		return data;
	}, [filteredRecipientShares, sortBy]);

	const totalPages = Math.max(
		1,
		Math.ceil(sortedRecipientShares.length / PAGE_SIZE),
	);
	const safePage = Math.min(page, totalPages);
	const pagedRecipientShares = sortedRecipientShares.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<h1 className="font-semibold text-2xl">Inbox</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Claim approved shares invited to your email, then download documents.
			</p>

			<section className="mt-6">
				<h2 className="font-medium text-lg">Documents available to you</h2>
				<div className="mt-3 space-y-3">
					{inbox.data?.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<p className="font-medium">{item.fileName}</p>
								<p className="text-muted-foreground text-sm">{item.type}</p>
							</div>
							<button
								type="button"
								className="rounded-md border px-3 py-1 text-sm"
								onClick={async () => {
									try {
										const result =
											await trpcClient.documents.getDownloadTarget.query({
												documentId: item.id,
											});
										downloadBase64File(
											result.fileName,
											result.mimeType,
											result.bytesBase64,
										);
									} catch (error) {
										toast.error(
											error instanceof Error
												? error.message
												: "Download failed",
										);
									}
								}}
							>
								Download
							</button>
						</div>
					))}
					{inbox.data?.length === 0 ? (
						<p className="rounded-lg border p-4 text-muted-foreground text-sm">
							No documents available yet.
						</p>
					) : null}
				</div>
			</section>

			<section className="mt-8">
				<h2 className="font-medium text-lg">Shares you can claim</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					If this account email matches a share recipient email, claim access
					here.
				</p>
				<div className="mt-3 grid gap-3 md:grid-cols-2">
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
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder="Search by recipient or document"
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
					{pagedRecipientShares.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<p className="font-medium">{item.document.fileName}</p>
								<p className="text-muted-foreground text-sm">
									{item.recipientEmail} • {item.shareStatus}
								</p>
								<p className="text-muted-foreground text-xs">
									{getShareStatusDescription(item.shareStatus)}
								</p>
							</div>
							{item.shareStatus === "approved" ? (
								<button
									type="button"
									className="rounded-md border px-3 py-1 text-sm"
									onClick={async () => {
										const previousRecipientShares = queryClient.getQueryData<
											RecipientShare[]
										>(trpc.shares.listRecipientShares.queryKey());
										try {
											if (previousRecipientShares) {
												queryClient.setQueryData(
													trpc.shares.listRecipientShares.queryKey(),
													previousRecipientShares.map((share) =>
														share.id === item.id
															? { ...share, shareStatus: "claimed" as const }
															: share,
													),
												);
											}

											await trpcClient.shares.claimShareByEmail.mutate({
												shareId: item.id,
											});
											toast.success("Share claimed");
											await queryClient.invalidateQueries(
												trpc.documents.listInboxDocuments.queryFilter(),
											);
											await queryClient.invalidateQueries(
												trpc.shares.listRecipientShares.queryFilter(),
											);
										} catch (error) {
											queryClient.setQueryData(
												trpc.shares.listRecipientShares.queryKey(),
												previousRecipientShares,
											);
											toast.error(
												error instanceof Error ? error.message : "Claim failed",
											);
										}
									}}
								>
									Claim
								</button>
							) : null}
						</div>
					))}
					{!recipientShares.isLoading &&
					filteredRecipientShares.length === 0 ? (
						<p className="rounded-lg border p-4 text-muted-foreground text-sm">
							No shares match your current filters.
						</p>
					) : null}
				</div>

				{filteredRecipientShares.length > 0 ? (
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
			</section>
		</div>
	);
}

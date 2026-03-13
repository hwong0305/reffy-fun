import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { requireAuth } from "@/lib/require-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/documents")({
	component: DocumentsRoute,
	beforeLoad: requireAuth,
});

export function DocumentsRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const documents = useQuery(trpc.documents.listOwnedDocuments.queryOptions());

	const deleteDocument = useMutation(
		trpc.documents.deleteOwnedDocument.mutationOptions({
			onSuccess: async () => {
				toast.success("Document deleted");
				await queryClient.invalidateQueries(
					trpc.documents.listOwnedDocuments.queryFilter(),
				);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Documents</h1>
					<p className="text-muted-foreground text-sm">
						Upload and manage your document library.
					</p>
				</div>
				<button
					type="button"
					onClick={() => navigate({ to: "/documents/new" })}
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
				>
					Upload document
				</button>
			</div>

			<div className="space-y-3">
				{documents.isLoading ? <p>Loading...</p> : null}
				{documents.data?.length ? (
					documents.data.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<p className="font-medium">{item.fileName}</p>
								<p className="text-muted-foreground text-sm">
									{item.type} • {Math.round(item.sizeBytes / 1024)} KB •{" "}
									{item.status}
								</p>
							</div>
							<button
								type="button"
								className="rounded-md border px-3 py-1 text-sm"
								onClick={() => deleteDocument.mutate({ documentId: item.id })}
							>
								Delete
							</button>
						</div>
					))
				) : (
					<p className="rounded-lg border p-4 text-muted-foreground text-sm">
						No documents yet.
					</p>
				)}
			</div>

			<Outlet />
		</div>
	);
}

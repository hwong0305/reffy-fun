import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { requireAuth } from "@/lib/require-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/documents/new")({
	component: NewDocumentRoute,
	beforeLoad: requireAuth,
});

function toBase64(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("Failed to read file"));
				return;
			}

			const base64 = result.split(",")[1];
			resolve(base64 || "");
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function NewDocumentRoute() {
	const navigate = useNavigate();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [type, setType] = useState<"recommendation" | "transcript" | "resume">(
		"recommendation",
	);
	const [writerUserId, setWriterUserId] = useState("");

	const createUploadTarget = useMutation(
		trpc.documents.createUploadTarget.mutationOptions(),
	);
	const uploadBytes = useMutation(trpc.documents.uploadBytes.mutationOptions());
	const finalizeUpload = useMutation(
		trpc.documents.finalizeUpload.mutationOptions(),
	);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<h1 className="font-semibold text-2xl">Upload document</h1>
			<p className="mt-1 text-muted-foreground text-sm">
				Recommendation letters need writer approval per recipient share.
			</p>

			<form
				className="mt-6 space-y-4 rounded-lg border p-4"
				onSubmit={async (event) => {
					event.preventDefault();

					if (!selectedFile) {
						toast.error("Please choose a file");
						return;
					}

					if (type === "recommendation" && !writerUserId.trim()) {
						toast.error(
							"Writer user ID is required for recommendation letters",
						);
						return;
					}

					try {
						const upload = await createUploadTarget.mutateAsync({
							fileName: selectedFile.name,
							mimeType: selectedFile.type || "application/octet-stream",
							sizeBytes: selectedFile.size,
						});
						const bytesBase64 = await toBase64(selectedFile);

						await uploadBytes.mutateAsync({
							storageKey: upload.storageKey,
							bytesBase64,
						});

						await finalizeUpload.mutateAsync({
							storageKey: upload.storageKey,
							fileName: selectedFile.name,
							mimeType: selectedFile.type || "application/octet-stream",
							sizeBytes: selectedFile.size,
							type,
							writerUserId:
								type === "recommendation" ? writerUserId : undefined,
						});

						toast.success("Document uploaded");
						navigate({ to: "/documents" });
					} catch (error) {
						toast.error(
							error instanceof Error ? error.message : "Upload failed",
						);
					}
				}}
			>
				<label className="grid gap-1 text-sm">
					Document type
					<select
						value={type}
						onChange={(event) => {
							const value = event.target.value as
								| "recommendation"
								| "transcript"
								| "resume";
							setType(value);
						}}
						className="rounded-md border bg-background px-2 py-2"
					>
						<option value="recommendation">Recommendation letter</option>
						<option value="transcript">Transcript</option>
						<option value="resume">Resume</option>
					</select>
				</label>

				{type === "recommendation" ? (
					<label className="grid gap-1 text-sm">
						Writer user ID
						<input
							type="text"
							value={writerUserId}
							onChange={(event) => setWriterUserId(event.target.value)}
							className="rounded-md border bg-background px-2 py-2"
							placeholder="Writer user ID"
						/>
					</label>
				) : null}

				<label className="grid gap-1 text-sm">
					File
					<input
						type="file"
						onChange={(event) => {
							const file = event.target.files?.[0] ?? null;
							setSelectedFile(file);
						}}
						className="rounded-md border bg-background px-2 py-2"
					/>
				</label>

				<p className="text-muted-foreground text-xs">
					By uploading you agree to the Terms of Use and Privacy Policy.
				</p>

				<button
					type="submit"
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
				>
					Upload
				</button>
			</form>
		</div>
	);
}

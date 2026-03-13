import type {
	CreateDownloadTargetInput,
	CreateDownloadTargetResult,
	CreateUploadTargetInput,
	CreateUploadTargetResult,
	FileStorageProvider,
	FinalizeUploadInput,
	UploadBytesInput,
} from "./provider";

type DbModule = typeof import("@reffy-fun/db");

let dbModulePromise: Promise<DbModule> | undefined;

function getDbModule() {
	if (!dbModulePromise) {
		dbModulePromise = import("@reffy-fun/db");
	}

	return dbModulePromise;
}

export class DatabaseBlobStorageProvider implements FileStorageProvider {
	kind = "database_blob" as const;

	async createUploadTarget(
		_input: CreateUploadTargetInput,
	): Promise<CreateUploadTargetResult> {
		const id = crypto.randomUUID();

		return {
			uploadToken: id,
			storageKey: `db/${id}`,
			expiresAt: new Date(Date.now() + 10 * 60_000),
		};
	}

	async uploadBytes(input: UploadBytesInput): Promise<void> {
		const { db, storedBlob } = await getDbModule();

		await db
			.insert(storedBlob)
			.values({
				storageKey: input.storageKey,
				bytes: Buffer.from(input.bytes),
			})
			.onConflictDoUpdate({
				target: storedBlob.storageKey,
				set: {
					bytes: Buffer.from(input.bytes),
				},
			});
	}

	async finalizeUpload(_input: FinalizeUploadInput): Promise<void> {
		return;
	}

	async createDownloadTarget(
		input: CreateDownloadTargetInput,
	): Promise<CreateDownloadTargetResult> {
		return {
			storageKey: input.storageKey,
		};
	}

	async readBytes(storageKey: string): Promise<Uint8Array> {
		const { db } = await getDbModule();

		const row = await db.query.storedBlob.findFirst({
			where: (table, { eq }) => eq(table.storageKey, storageKey),
		});

		if (!row) {
			throw new Error("Stored file not found");
		}

		return new Uint8Array(row.bytes);
	}
}

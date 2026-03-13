import { DatabaseBlobStorageProvider } from "./database-blob-provider";
import type { FileStorageProvider } from "./provider";
import { S3StorageProvider } from "./s3-provider";

type CreateStorageProviderOptions = {
	kind?: "database_blob" | "s3";
};

export function createStorageProvider(
	options: CreateStorageProviderOptions = {},
): FileStorageProvider {
	if (options.kind === "s3") {
		return new S3StorageProvider();
	}

	return new DatabaseBlobStorageProvider();
}

export * from "./provider";

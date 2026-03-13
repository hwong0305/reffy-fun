import type {
	CreateDownloadTargetInput,
	CreateDownloadTargetResult,
	CreateUploadTargetInput,
	CreateUploadTargetResult,
	FileStorageProvider,
	FinalizeUploadInput,
	UploadBytesInput,
} from "./provider";

export class S3StorageProvider implements FileStorageProvider {
	kind = "s3" as const;

	async createUploadTarget(
		_input: CreateUploadTargetInput,
	): Promise<CreateUploadTargetResult> {
		throw new Error("S3 storage provider is not implemented yet");
	}

	async uploadBytes(_input: UploadBytesInput): Promise<void> {
		throw new Error("S3 storage provider is not implemented yet");
	}

	async finalizeUpload(_input: FinalizeUploadInput): Promise<void> {
		throw new Error("S3 storage provider is not implemented yet");
	}

	async createDownloadTarget(
		_input: CreateDownloadTargetInput,
	): Promise<CreateDownloadTargetResult> {
		throw new Error("S3 storage provider is not implemented yet");
	}

	async readBytes(_storageKey: string): Promise<Uint8Array> {
		throw new Error("S3 storage provider is not implemented yet");
	}
}

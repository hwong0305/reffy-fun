export type StorageKind = "database_blob" | "s3";

export type CreateUploadTargetInput = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type CreateUploadTargetResult = {
	uploadToken: string;
	storageKey: string;
	expiresAt: Date;
};

export type UploadBytesInput = {
	storageKey: string;
	bytes: Uint8Array;
};

export type FinalizeUploadInput = {
	storageKey: string;
	checksum?: string;
};

export type CreateDownloadTargetInput = {
	storageKey: string;
};

export type CreateDownloadTargetResult = {
	storageKey: string;
};

export interface FileStorageProvider {
	kind: StorageKind;
	createUploadTarget(
		input: CreateUploadTargetInput,
	): Promise<CreateUploadTargetResult>;
	uploadBytes(input: UploadBytesInput): Promise<void>;
	finalizeUpload(input: FinalizeUploadInput): Promise<void>;
	createDownloadTarget(
		input: CreateDownloadTargetInput,
	): Promise<CreateDownloadTargetResult>;
	readBytes(storageKey: string): Promise<Uint8Array>;
}

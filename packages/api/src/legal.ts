export const CURRENT_TERMS_VERSION = "2026-03-12-us";
export const CURRENT_PRIVACY_VERSION = "2026-03-12-us";

export type LegalAcceptanceVersionInput = {
	termsVersion: string;
	privacyVersion: string;
};

export function isLegalAcceptanceUpToDate(input: LegalAcceptanceVersionInput) {
	return (
		input.termsVersion === CURRENT_TERMS_VERSION &&
		input.privacyVersion === CURRENT_PRIVACY_VERSION
	);
}

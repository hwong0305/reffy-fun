import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
});

function TermsPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="font-semibold text-3xl">Terms of Use</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				Last updated: March 12, 2026
			</p>

			<div className="mt-6 space-y-6 text-muted-foreground text-sm leading-6">
				<section>
					<h2 className="font-medium text-base text-foreground">
						1. Acceptance of Terms
					</h2>
					<p>
						By accessing or using Reffy, you agree to these Terms of Use. If you
						do not agree, do not use the service.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						2. Service Description
					</h2>
					<p>
						Reffy provides tools to upload, share, view, and download
						recommendation letters, transcripts, and resumes. Recommendation
						letters require writer approval per recipient before access is
						granted.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						3. Account Responsibilities
					</h2>
					<p>
						You are responsible for account security, password confidentiality,
						and ensuring information you provide is accurate. You must only
						share documents you are authorized to share.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						4. Acceptable Use
					</h2>
					<p>
						You may not use Reffy for unlawful, fraudulent, defamatory, or
						abusive conduct, or upload harmful content.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						5. Intellectual Property
					</h2>
					<p>
						You retain ownership of content you upload. You grant Reffy a
						limited license to host and process your content solely to operate
						the service.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						6. Disclaimers
					</h2>
					<p>
						The service is provided "as is" and "as available" without
						warranties of any kind, except where prohibited by law.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						7. Limitation of Liability
					</h2>
					<p>
						To the maximum extent permitted by law, Reffy is not liable for
						indirect, incidental, or consequential damages arising from use of
						the service.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						8. Changes to Terms
					</h2>
					<p>
						We may update these terms from time to time. Continued use after
						updates indicates acceptance of the revised terms.
					</p>
				</section>
			</div>
		</div>
	);
}

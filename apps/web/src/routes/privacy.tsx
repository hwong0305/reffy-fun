import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="font-semibold text-3xl">Privacy Policy</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				Last updated: March 12, 2026
			</p>

			<div className="mt-6 space-y-6 text-muted-foreground text-sm leading-6">
				<section>
					<h2 className="font-medium text-base text-foreground">
						1. Information We Collect
					</h2>
					<p>
						We collect account details (such as name and email), document
						metadata, and activity events needed to provide secure sharing and
						access control.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						2. How We Use Information
					</h2>
					<p>
						We use information to authenticate users, enforce writer approval
						rules, provide document access, and maintain audit logs for security
						and reliability.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						3. Sharing of Information
					</h2>
					<p>
						We do not sell personal information. We share data only as needed to
						operate the service, comply with law, or protect rights and safety.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						4. Data Retention
					</h2>
					<p>
						We retain account and document data while accounts are active and as
						needed for legitimate business, legal, and security purposes.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">5. Security</h2>
					<p>
						We apply reasonable administrative, technical, and physical
						safeguards, but no method of storage or transmission is guaranteed
						100% secure.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">
						6. Your Choices
					</h2>
					<p>
						You may update account information, request account deletion where
						applicable, and choose how you share your documents.
					</p>
				</section>
				<section>
					<h2 className="font-medium text-base text-foreground">7. Contact</h2>
					<p>
						For privacy requests or questions, contact your Reffy administrator
						or support team.
					</p>
				</section>
			</div>
		</div>
	);
}

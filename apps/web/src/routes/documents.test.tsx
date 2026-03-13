import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => () => ({}),
	useNavigate: () => navigateMock,
	Outlet: () => <div data-testid="route-outlet" />,
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({
		invalidateQueries: vi.fn(),
	}),
	useQuery: () => ({
		isLoading: false,
		data: [],
	}),
	useMutation: () => ({
		mutate: vi.fn(),
	}),
}));

vi.mock("@/lib/require-auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/utils/trpc", () => ({
	trpc: {
		documents: {
			listOwnedDocuments: {
				queryOptions: vi.fn(() => ({})),
				queryFilter: vi.fn(() => ({})),
			},
			deleteOwnedDocument: {
				mutationOptions: vi.fn(() => ({})),
			},
		},
	},
}));

import { DocumentsRoute } from "./documents";

describe("Documents route", () => {
	it("navigates to the new document upload route", async () => {
		const user = userEvent.setup();
		render(<DocumentsRoute />);

		await user.click(screen.getByRole("button", { name: "Upload document" }));

		expect(navigateMock).toHaveBeenCalledWith({ to: "/documents/new" });
	});

	it("renders an outlet for nested document routes", () => {
		render(<DocumentsRoute />);

		expect(screen.getByTestId("route-outlet")).toBeInTheDocument();
	});
});

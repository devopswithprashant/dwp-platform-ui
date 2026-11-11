import { render, screen } from "@testing-library/react";
import BlogsPage from "../page";
import { fetchBlogs } from "@/lib/api.server";
import { getAuthUser } from "@/lib/auth/auth.server";
import { getCurrentProfileUserId } from "@/lib/profiles.server";

jest.mock("@/lib/api.server", () => ({
  fetchBlogs: jest.fn(),
}));
jest.mock("@/lib/auth/auth.server", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("@/lib/profiles.server", () => ({
  getCurrentProfileUserId: jest.fn(),
}));

describe("BlogsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBlogs as jest.Mock).mockResolvedValue([
      {
        id: 1,
        title: "Public post",
        slug: "public-post",
        status: "PUBLISHED",
        createdAt: "2026-10-31T12:00:00Z",
        authorUuid: "author-1",
      },
      {
        id: 2,
        title: "Private draft",
        slug: "private-draft",
        status: "DRAFT",
        createdAt: "2026-10-31T12:00:00Z",
        authorUuid: "author-1",
      },
    ]);
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue(null);
  });

  it("shows published posts and hides drafts from the public listing", async () => {
    render(await BlogsPage());

    expect(screen.getByRole("link", { name: "Public post" })).toHaveAttribute(
      "href",
      "/blogs/public-post",
    );
    expect(screen.queryByText("Private draft")).not.toBeInTheDocument();
  });
});

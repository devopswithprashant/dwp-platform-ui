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

  it("shows the create action and identifies the current user's published post", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 1 });
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue("author-1");

    render(await BlogsPage());

    expect(screen.getByRole("link", { name: "Create Blog" })).toHaveAttribute(
      "href",
      "/blogs/new",
    );
    expect(screen.getByText("Your post")).toBeInTheDocument();
  });

  it("shows a sign-in prompt and empty-state copy when no posts are published", async () => {
    (fetchBlogs as jest.Mock).mockResolvedValue([]);

    render(await BlogsPage());

    expect(screen.getByRole("link", { name: "Sign in to create" })).toHaveAttribute(
      "href",
      "/login?callbackUrl=/blogs/new",
    );
    expect(screen.getByText(/No published blogs yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "write one" })).toHaveAttribute(
      "href",
      "/login?callbackUrl=/blogs/new",
    );
  });

  it("reports a blog service error and retains the signed-in create action", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (fetchBlogs as jest.Mock).mockRejectedValue(new Error("Service unavailable"));
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 1 });

    try {
      render(await BlogsPage());
    } finally {
      consoleError.mockRestore();
    }

    expect(screen.getByText("Error loading blogs")).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Blog" })).toBeInTheDocument();
  });
});

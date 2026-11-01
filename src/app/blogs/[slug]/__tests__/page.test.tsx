import { render, screen } from "@testing-library/react";
import BlogPage from "../page";
import { fetchBlogContent, fetchBlogs } from "@/lib/api.server";
import { getAuthUser } from "@/lib/auth/auth.server";
import { getCurrentProfileUserId } from "@/lib/profiles.server";

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
jest.mock("@/lib/api.server", () => ({
  fetchBlogContent: jest.fn(),
  fetchBlogs: jest.fn(),
}));
jest.mock("@/lib/auth/auth.server", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("@/lib/profiles.server", () => ({
  getCurrentProfileUserId: jest.fn(),
}));
jest.mock("@/app/blogs/_components/DeleteBlogButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/blogs/_components/BlogMarkdown", () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <article>{content}</article>,
}));
jest.mock("@/app/blogs/_components/BlogAuthor", () => ({
  __esModule: true,
  default: () => null,
}));

const draft = {
  id: 8,
  title: "Work in progress",
  slug: "work-in-progress",
  status: "DRAFT",
  createdAt: "2026-10-31T12:00:00Z",
  authorUuid: "author-1",
};

describe("BlogPage draft visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBlogs as jest.Mock).mockResolvedValue([draft]);
    (fetchBlogContent as jest.Mock).mockResolvedValue({
      postId: draft.id,
      content: "# Draft content",
      format: "MARKDOWN",
    });
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue(null);
  });

  it("does not fetch or render a draft for a non-owner", async () => {
    await expect(
      BlogPage({ params: Promise.resolve({ slug: draft.slug }) }),
    ).rejects.toThrow("NOT_FOUND");

    expect(fetchBlogContent).not.toHaveBeenCalled();
  });

  it("allows the signed-in author to view their draft", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ username: "ada" });
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue(draft.authorUuid);

    render(await BlogPage({ params: Promise.resolve({ slug: draft.slug }) }));

    expect(screen.getByRole("heading", { name: draft.title })).toBeInTheDocument();
    expect(screen.getByText("# Draft content")).toBeInTheDocument();
    expect(fetchBlogContent).toHaveBeenCalledWith(draft.id);
  });
});

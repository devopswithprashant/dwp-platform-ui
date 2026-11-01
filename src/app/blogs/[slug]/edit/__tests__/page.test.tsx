import { render, screen } from "@testing-library/react";
import EditBlogPage from "../page";
import { fetchBlogContent, fetchBlogs } from "@/lib/api.server";
import { getAuthUser } from "@/lib/auth/auth.server";
import { getCurrentProfileUserId } from "@/lib/profiles.server";

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
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
jest.mock("@/app/blogs/_components/BlogEditor", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="editor-props">{JSON.stringify(props)}</div>
  ),
}));

const slug = "my-blog";
const metadata = {
  id: 12,
  title: "My blog",
  slug,
  status: "DRAFT",
  createdAt: "2026-10-31T12:00:00Z",
  authorUuid: "owner-id",
};

describe("EditBlogPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBlogs as jest.Mock).mockResolvedValue([metadata]);
    (fetchBlogContent as jest.Mock).mockResolvedValue({ content: "# Body" });
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 1 });
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue("owner-id");
  });

  it("redirects anonymous visitors to login with a callback URL", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);

    await expect(EditBlogPage({ params: Promise.resolve({ slug }) })).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Fblogs%2Fmy-blog%2Fedit",
    );
    expect(fetchBlogContent).not.toHaveBeenCalled();
  });

  it("returns not found when the blog slug does not exist", async () => {
    (fetchBlogs as jest.Mock).mockResolvedValue([]);

    await expect(EditBlogPage({ params: Promise.resolve({ slug }) })).rejects.toThrow(
      "NOT_FOUND",
    );
  });

  it("redirects users who do not own the post", async () => {
    (getCurrentProfileUserId as jest.Mock).mockResolvedValue("other-id");

    await expect(EditBlogPage({ params: Promise.resolve({ slug }) })).rejects.toThrow(
      `REDIRECT:/blogs/${slug}`,
    );
    expect(fetchBlogContent).not.toHaveBeenCalled();
  });

  it("loads the content and renders the editor for the owner", async () => {
    render(await EditBlogPage({ params: Promise.resolve({ slug }) }));

    expect(screen.getByRole("heading", { name: "Update blog" })).toBeInTheDocument();
    expect(fetchBlogContent).toHaveBeenCalledWith(metadata.id);
    expect(JSON.parse(screen.getByTestId("editor-props").textContent ?? "")).toEqual({
      mode: "edit",
      blogId: metadata.id,
      status: metadata.status,
      initialTitle: metadata.title,
      initialMarkdown: "# Body",
    });
  });
});

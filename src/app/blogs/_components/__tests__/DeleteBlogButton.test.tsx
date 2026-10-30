import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteBlogButton from "../DeleteBlogButton";
import { BlogServiceError, deleteBlog } from "@/lib/api.client";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockConfirm = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("@/lib/api.client", () => ({
  deleteBlog: jest.fn(),
  BlogServiceError: class BlogServiceError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

describe("DeleteBlogButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    window.confirm = mockConfirm;
  });

  it("hides edit and delete controls after a forbidden delete response", async () => {
    (deleteBlog as jest.Mock).mockRejectedValueOnce(
      new BlogServiceError("forbidden", 403),
    );
    const user = userEvent.setup();
    render(<DeleteBlogButton blogId={42} blogSlug="post" />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You no longer have permission to manage this blog.",
    );
    expect(screen.queryByRole("link", { name: "Update" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("redirects to sign-in on an expired session without retrying the write", async () => {
    (deleteBlog as jest.Mock).mockRejectedValueOnce(
      new BlogServiceError("expired", 401),
    );
    const user = userEvent.setup();
    render(<DeleteBlogButton blogId={42} blogSlug="post" />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/login?callbackUrl=%2Fblogs%2Fpost",
      );
    });
    expect(deleteBlog).toHaveBeenCalledTimes(1);
  });

  it("returns to the blog list after a successful delete", async () => {
    (deleteBlog as jest.Mock).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<DeleteBlogButton blogId={42} blogSlug="post" />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/blogs");
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});

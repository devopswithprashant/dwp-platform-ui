import { render, screen } from "@testing-library/react";
import HomePage from "../page";
import { getAuthUser } from "@/lib/auth/auth.server";

jest.mock("@/lib/auth/auth.server", () => ({
  getAuthUser: jest.fn(),
}));

describe("HomePage", () => {
  it("uses the create-blog route for signed-in authors", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 1 });
    render(await HomePage());

    expect(screen.getByRole("link", { name: "Write a post" })).toHaveAttribute(
      "href",
      "/blogs/new",
    );
    expect(screen.getByRole("link", { name: "Read the blog" })).toHaveAttribute(
      "href",
      "/blogs",
    );
  });

  it("sends anonymous authors to sign in before creating a post", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);
    render(await HomePage());

    expect(screen.getByRole("link", { name: "Write a post" })).toHaveAttribute(
      "href",
      "/login?callbackUrl=/blogs/new",
    );
  });
});

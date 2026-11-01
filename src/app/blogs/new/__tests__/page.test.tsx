import { render, screen } from "@testing-library/react";
import NewBlogPage from "../page";

jest.mock("@/app/blogs/_components/BlogEditor", () => ({
  __esModule: true,
  default: ({ mode }: { mode: string }) => <div data-testid="editor-mode">{mode}</div>,
}));

describe("NewBlogPage", () => {
  it("renders the create editor and draft/publish guidance", () => {
    render(<NewBlogPage />);

    expect(screen.getByRole("heading", { name: "Create a new blog" })).toBeInTheDocument();
    expect(screen.getByText("Write in Markdown, then save as a draft or publish.")).toBeInTheDocument();
    expect(screen.getByTestId("editor-mode")).toHaveTextContent("create");
  });
});

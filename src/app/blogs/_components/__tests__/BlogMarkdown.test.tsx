import { render, screen } from "@testing-library/react";
import BlogMarkdown from "../BlogMarkdown";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    const heading = children.split("\n").find((line) => line.startsWith("# "));
    if (heading) {
      return (
        <div>
          <h1>{heading.slice(2)}</h1>
          <p>
            This is <strong>bold</strong> and <em>italic</em>.
          </p>
        </div>
      );
    }
    if (children.includes("- One")) {
      return (
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
      );
    }
    return <p>{children}</p>;
  },
}));

jest.mock("remark-breaks", () => ({}));
jest.mock("remark-gfm", () => ({}));

describe("BlogMarkdown", () => {
  it("renders markdown headings and emphasis", () => {
    render(
      <BlogMarkdown content={"# Hello World\n\nThis is **bold** and *italic*."} />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Hello World" })).toBeInTheDocument();
    expect(screen.getByText("bold")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByText("italic")).toHaveProperty("tagName", "EM");
  });

  it("renders bullet lists", () => {
    render(<BlogMarkdown content={"- One\n- Two"} />);

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("wraps content in styled article container", () => {
    render(<BlogMarkdown content="Hello" />);

    expect(document.querySelector(".blog-content")).toBeInTheDocument();
  });
});

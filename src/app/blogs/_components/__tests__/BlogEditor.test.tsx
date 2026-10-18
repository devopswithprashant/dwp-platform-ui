import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogEditor from "../BlogEditor";
import { BlogServiceError, createBlog } from "@/lib/api.client";

const mockUseEditor = jest.fn();
const mockPush = jest.fn();
const mockRouter = { push: mockPush, back: jest.fn(), refresh: jest.fn() };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("@/lib/api.client", () => ({
  createBlog: jest.fn().mockResolvedValue(undefined),
  updateBlog: jest.fn().mockResolvedValue(undefined),
  BlogServiceError: class BlogServiceError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));

jest.mock("lowlight", () => ({
  createLowlight: jest.fn(() => ({})),
  common: {},
}));

jest.mock("@tiptap/react", () => ({
  __esModule: true,
  useEditor: (...args: unknown[]) => mockUseEditor(...args),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="editor-content">{editor ? "editor" : "no-editor"}</div>
  ),
}));

jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/extension-link", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/extension-text-align", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/extension-typography", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/extension-code-block-lowlight", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

jest.mock("@tiptap/markdown", () => ({
  __esModule: true,
  Markdown: {},
}));

describe("BlogEditor", () => {
  let editorInstance: {
    chain: jest.Mock;
    getMarkdown: jest.Mock;
    isEmpty: boolean;
    isDestroyed: boolean;
    isActive: jest.Mock;
  };
  let chainApi: {
    focus: jest.Mock;
    toggleBold: jest.Mock;
    toggleItalic: jest.Mock;
    toggleUnderline: jest.Mock;
    toggleHeading: jest.Mock;
    toggleBulletList: jest.Mock;
    toggleOrderedList: jest.Mock;
    toggleBlockquote: jest.Mock;
    toggleCodeBlock: jest.Mock;
    extendMarkRange: jest.Mock;
    setLink: jest.Mock;
    unsetLink: jest.Mock;
    run: jest.Mock;
  };
  let editorOptions: { onUpdate?: (params: { editor: unknown }) => void } | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    chainApi = {
      focus: jest.fn(() => chainApi),
      toggleBold: jest.fn(() => chainApi),
      toggleItalic: jest.fn(() => chainApi),
      toggleUnderline: jest.fn(() => chainApi),
      toggleHeading: jest.fn(() => chainApi),
      toggleBulletList: jest.fn(() => chainApi),
      toggleOrderedList: jest.fn(() => chainApi),
      toggleBlockquote: jest.fn(() => chainApi),
      toggleCodeBlock: jest.fn(() => chainApi),
      extendMarkRange: jest.fn(() => chainApi),
      setLink: jest.fn(() => chainApi),
      unsetLink: jest.fn(() => chainApi),
      run: jest.fn(() => undefined),
    };

    editorInstance = {
      chain: jest.fn(() => chainApi),
      getMarkdown: jest.fn(() => ""),
      isEmpty: true,
      isDestroyed: false,
      isActive: jest.fn(() => false),
    };

    editorOptions = undefined;
    mockUseEditor.mockImplementation((options: { onUpdate?: (params: { editor: unknown }) => void }) => {
      editorOptions = options;
      return editorInstance;
    });
  });

  it("renders the editor toolbar and title input", async () => {
    await act(async () => {
      render(<BlogEditor mode="create" />);
    });

    expect(screen.getByPlaceholderText(/kubernetes/i)).toBeInTheDocument();
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Bullet list")).toBeInTheDocument();
  });

  it("toggles a bullet list from the toolbar", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<BlogEditor mode="create" />);
    });

    await user.click(screen.getByTitle("Bullet list"));

    expect(chainApi.toggleBulletList).toHaveBeenCalled();
  });

  it("enables submit when editor content is present", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<BlogEditor mode="create" />);
    });

    await user.type(screen.getByPlaceholderText(/kubernetes/i), "A new post");
    editorInstance.isEmpty = false;
    editorInstance.getMarkdown.mockReturnValue("Line one\n\nLine two");

    act(() => {
      editorOptions?.onUpdate?.({ editor: editorInstance });
    });

    expect(screen.getByRole("button", { name: /create/i })).not.toBeDisabled();
  });

  it("sends only the post body and title to create", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<BlogEditor mode="create" />);
    });
    await user.type(screen.getByPlaceholderText(/kubernetes/i), "A new post");
    editorInstance.isEmpty = false;
    editorInstance.getMarkdown.mockReturnValue("# Body");
    act(() => {
      editorOptions?.onUpdate?.({ editor: editorInstance });
    });
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(createBlog).toHaveBeenCalledWith({ title: "A new post", markdown: "# Body" });
    });
    expect(mockPush).toHaveBeenCalledWith("/blogs");
  });

  it("shows an access denied message when Blog Service rejects an edit", async () => {
    const user = userEvent.setup();
    const updateBlog = jest.requireMock("@/lib/api.client").updateBlog as jest.Mock;
    updateBlog.mockRejectedValueOnce(new BlogServiceError(
      "You do not have permission to manage this blog.",
      403,
    ));
    await act(async () => {
      render(<BlogEditor mode="edit" blogId={42} initialTitle="Post" initialMarkdown="# Body" />);
    });
    await user.click(screen.getByRole("button", { name: /update/i }));

    expect(await screen.findByText("You do not have permission to manage this blog.")).toBeInTheDocument();
  });

  it("initializes the editor with markdown content type", async () => {
    await act(async () => {
      render(<BlogEditor mode="edit" blogId={1} initialMarkdown="# Hello" />);
    });

    expect(mockUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "# Hello",
        contentType: "markdown",
      }),
      [],
    );
  });
});

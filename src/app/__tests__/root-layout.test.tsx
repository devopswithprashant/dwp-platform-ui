/** @jest-environment node */

import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "../layout";
import { getAuthUser } from "@/lib/auth/auth.server";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));
jest.mock("@/lib/auth/auth.server", () => ({
  getAuthUser: jest.fn(),
}));
jest.mock("../_components/AuthNav", () => ({
  __esModule: true,
  default: ({ initialUser }: { initialUser: { username: string } | null }) => (
    <div data-testid="auth-nav">{initialUser?.username ?? "anonymous"}</div>
  ),
}));
jest.mock("../_components/ThemeToggle", () => ({
  __esModule: true,
  default: () => <button type="button">Theme</button>,
}));

describe("RootLayout", () => {
  it("renders navigation and children with the current user", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 8, username: "ada" });

    const markup = renderToStaticMarkup(
      await RootLayout({ children: <h1>Page content</h1> }),
    );

    expect(markup).toContain('href="/">DevOps With Prashant</a>');
    expect(markup).toContain('href="/">Home</a>');
    expect(markup).toContain('href="/blogs">Blog</a>');
    expect(markup).toContain('data-testid="auth-nav">ada</div>');
    expect(markup).toContain(">Theme</button>");
    expect(markup).toContain("<h1>Page content</h1>");
  });

  it("renders the anonymous navigation when no user is signed in", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);

    const markup = renderToStaticMarkup(
      await RootLayout({ children: <main>Anonymous content</main> }),
    );

    expect(markup).toContain('data-testid="auth-nav">anonymous</div>');
    expect(markup).toContain("<main>Anonymous content</main>");
  });
});

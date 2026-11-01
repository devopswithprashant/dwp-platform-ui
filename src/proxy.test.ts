import { NextResponse, type NextRequest } from "next/server";
import { config, proxy } from "./proxy";

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ kind: "next" })),
    redirect: jest.fn((url: URL) => ({ kind: "redirect", url })),
  },
}));

function request(pathname: string, token?: string): NextRequest {
  const searchParams = new URLSearchParams("existing=kept");
  const url = new URL(`https://example.test${pathname}?existing=kept`);
  return {
    nextUrl: {
      pathname,
      searchParams,
      clone: () => new URL(url),
    },
    cookies: {
      get: () => token ? { name: "access_token", value: token } : undefined,
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes through paths outside protected blog writes", () => {
    expect(proxy(request("/blogs"))).toEqual({ kind: "next" });
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it.each(["/blogs/new", "/blogs/slug/edit", "/blogs/slug/edit/"])(
    "allows an authenticated request to %s",
    (path) => {
      expect(proxy(request(path, "token"))).toEqual({ kind: "next" });
    },
  );

  it("redirects unauthenticated write requests and preserves callback path", () => {
    const result = proxy(request("/blogs/a-post/edit")) as unknown as {
      kind: string;
      url: URL;
    };

    expect(result.kind).toBe("redirect");
    expect(result.url.pathname).toBe("/login");
    expect(result.url.searchParams.get("callbackUrl")).toBe("/blogs/a-post/edit");
    expect(result.url.searchParams.get("existing")).toBe("kept");
  });

  it("publishes matcher paths only for blog creation and editing", () => {
    expect(config.matcher).toEqual(["/blogs/new", "/blogs/:slug/edit"]);
  });
});

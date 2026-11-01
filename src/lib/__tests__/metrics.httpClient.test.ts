/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockMetrics = {
  httpClientRequestsTotal: { inc: jest.fn() },
  httpClientRequestDurationSeconds: { observe: jest.fn() },
  httpClientErrorsTotal: { inc: jest.fn() },
};

jest.mock("../metrics/server", () => ({
  getUiMetrics: () => mockMetrics,
}));

import { recordHttpClientMetrics } from "../metrics/httpClient";

describe("recordHttpClientMetrics", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    jest.clearAllMocks();
  });

  it("does not record metrics in tests", () => {
    Reflect.set(process.env, "NODE_ENV", "test");
    recordHttpClientMetrics("fetchBlogs", "GET", 200, 0.1);

    expect(mockMetrics.httpClientRequestsTotal.inc).not.toHaveBeenCalled();
  });

  it("records response count, duration, and errors outside tests", () => {
    Reflect.set(process.env, "NODE_ENV", "production");

    recordHttpClientMetrics("fetchBlogs", "GET", 200, 0.1);
    recordHttpClientMetrics("createBlog", "POST", "error", 0.25);

    expect(mockMetrics.httpClientRequestsTotal.inc).toHaveBeenNthCalledWith(1, {
      operation: "fetchBlogs",
      method: "GET",
      status_code: "200",
    });
    expect(mockMetrics.httpClientRequestDurationSeconds.observe).toHaveBeenNthCalledWith(
      2,
      { operation: "createBlog", method: "POST" },
      0.25,
    );
    expect(mockMetrics.httpClientErrorsTotal.inc).toHaveBeenCalledWith({
      operation: "createBlog",
      method: "POST",
    });
  });
});

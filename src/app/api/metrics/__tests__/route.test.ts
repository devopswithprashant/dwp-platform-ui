/** @jest-environment node */

import { GET } from "../route";
import {
  getMetricsContentType,
  getMetricsPayload,
} from "@/lib/metrics/server";

jest.mock("@/lib/metrics/server", () => ({
  getMetricsContentType: jest.fn(),
  getMetricsPayload: jest.fn(),
}));

describe("metrics GET route", () => {
  it("returns metrics with the correct content type and no-store caching", async () => {
    (getMetricsPayload as jest.Mock).mockResolvedValue("ui_requests_total 2");
    (getMetricsContentType as jest.Mock).mockReturnValue("text/plain; version=0.0.4");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ui_requests_total 2");
    expect(response.headers.get("Content-Type")).toBe("text/plain; version=0.0.4");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

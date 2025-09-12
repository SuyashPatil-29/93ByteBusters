import { describe, it, expect, vi } from "vitest";
import { INGRESApiClient } from "@/services/ingres-api";

const sampleAssessment = {
  region: { level: "state", name: "Telangana" },
  level: "state",
  assessmentYear: 2023,
  metrics: {
    annualRechargeBcm: 12.3,
    extractableResourcesBcm: 9.8,
    totalExtractionBcm: 7.1,
    stageOfExtractionPercent: 72,
    category: "Semi-Critical",
  },
};

describe("INGRESApiClient", () => {
  it("fetches and validates assessment data", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(sampleAssessment), { status: 200 })
    );
    const client = new INGRESApiClient({ fetchImpl, baseUrl: "https://example.test" });
    const data = await client.getAssessment({ region: { level: "state", name: "Telangana" }, year: 2023 });
    expect(data.metrics.stageOfExtractionPercent).toBe(72);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries on failure", async () => {
    const fail = new Response("boom", { status: 500 });
    const ok = new Response(JSON.stringify(sampleAssessment), { status: 200 });
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fail)
      .mockResolvedValueOnce(ok);
    const client = new INGRESApiClient({ fetchImpl, baseUrl: "https://example.test", maxRetries: 1 });
    const data = await client.getAssessment({ region: { level: "state", name: "Telangana" }, year: 2023 });
    expect(data.metrics.category).toBe("Semi-Critical");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});



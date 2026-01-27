import { describe, it, expect } from "vitest";

// This test exists to force Vite/Vitest to compile the full app graph.
// Production publish can fail due to TS/module resolution issues that won't be
// caught by unit tests that don't import the application.
import App from "@/App";

describe("build smoke", () => {
  it("compiles App", () => {
    expect(App).toBeTruthy();
  });
});

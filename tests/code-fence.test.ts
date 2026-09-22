import { describe, expect, it } from "vitest";
import { parseCodeFence } from "../src/lib/code-fence";

describe("parseCodeFence", () => {
  it("splits language and file path on pipe", () => {
    expect(parseCodeFence("language-rust|sandbox.rs")).toEqual({
      language: "rust",
      filePath: "sandbox.rs",
    });
  });

  it("treats path-only fences as file paths", () => {
    expect(parseCodeFence("language-data-plane/compute/ec2-agent/src/sandbox.rs")).toEqual({
      filePath: "data-plane/compute/ec2-agent/src/sandbox.rs",
    });
  });

  it("treats plain language fences as language only", () => {
    expect(parseCodeFence("language-rust")).toEqual({
      language: "rust",
    });
  });
});

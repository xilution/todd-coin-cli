import { cli } from "../src/cli";

describe("CLI Tests", () => {
  it("should export the cli", () => {
    expect(cli).toBeTruthy();
  });
});

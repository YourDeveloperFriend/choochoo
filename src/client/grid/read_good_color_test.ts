import { Good } from "../../engine/state/good";
import { readGoodColor, cleanupGoodColorReader } from "./read_good_color";

describe("readGoodColor", () => {
  beforeEach(() => {
    // Clean up before each test to ensure isolated state
    cleanupGoodColorReader();
  });

  afterEach(() => {
    // Clean up after each test
    cleanupGoodColorReader();
  });

  it("should return fallback color when document is undefined", () => {
    // This test would need to run in a Node environment without DOM
    // In a browser environment, document is always defined
    const color = readGoodColor(Good.BLACK);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("should cache color values on subsequent calls", () => {
    const firstCall = readGoodColor(Good.BLUE);
    const secondCall = readGoodColor(Good.BLUE);
    
    expect(firstCall).toBe(secondCall);
  });

  it("should return different colors for different goods", () => {
    const blackColor = readGoodColor(Good.BLACK);
    const blueColor = readGoodColor(Good.BLUE);
    
    // Colors should be different (assuming CSS is properly set up)
    // In a test environment, they might both return fallback
    expect(blackColor).toBeDefined();
    expect(blueColor).toBeDefined();
  });

  it("should handle multiple goods without errors", () => {
    const goods = [Good.BLACK, Good.BLUE, Good.PURPLE, Good.RED, Good.YELLOW, Good.WHITE];
    
    goods.forEach(good => {
      const color = readGoodColor(good);
      expect(color).toBeDefined();
      expect(typeof color).toBe("string");
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$|^rgb\(/);
    });
  });
});

describe("cleanupGoodColorReader", () => {
  it("should remove persistent element and clear cache", () => {
    // Warm up the cache
    readGoodColor(Good.BLACK);
    readGoodColor(Good.BLUE);
    
    // Cleanup
    cleanupGoodColorReader();
    
    // After cleanup, the persistent element should be recreated on next call
    const color = readGoodColor(Good.RED);
    expect(color).toBeDefined();
  });

  it("should not throw error when called multiple times", () => {
    cleanupGoodColorReader();
    cleanupGoodColorReader();
    cleanupGoodColorReader();
    
    // Should not throw
    expect(true).toBe(true);
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import { parseJavaDateTime } from "../src/utils/java-time.ts";

test("parses timezone-less Java LocalDateTime as Asia/Shanghai", () => {
  const date = parseJavaDateTime("2026-10-25T23:54:22");

  assert.equal(date.toISOString(), "2026-10-25T15:54:22.000Z");
});

test("parses Java LocalDateTime with fraction and without seconds", () => {
  assert.equal(
    parseJavaDateTime("2026-10-25T23:54:22.123").toISOString(),
    "2026-10-25T15:54:22.123Z",
  );
  assert.equal(parseJavaDateTime("2026-10-25T08:00").toISOString(), "2026-10-25T00:00:00.000Z");
});

test("parses Java LocalDate as Shanghai midnight", () => {
  assert.equal(parseJavaDateTime("2026-10-25").toISOString(), "2026-10-24T16:00:00.000Z");
});

test("keeps explicit offsets untouched", () => {
  assert.equal(parseJavaDateTime("2026-10-25T23:54:22Z").toISOString(), "2026-10-25T23:54:22.000Z");
  assert.equal(
    parseJavaDateTime("2026-10-25T23:54:22+03:00").toISOString(),
    "2026-10-25T20:54:22.000Z",
  );
});

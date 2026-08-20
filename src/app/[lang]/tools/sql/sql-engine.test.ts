import { describe, expect, it } from "vitest";
import { formatSql } from "./sql-engine";

describe("sql engine", () => {
  it("formats a simple select statement", () => {
    const result = formatSql("select id,name from users where status='active' and score>=100 order by created_at desc;");
    expect(result.ok).toBe(true);
    expect(result.formatted).toContain("SELECT");
    expect(result.formatted).toContain("FROM users");
    expect(result.formatted).toContain("ORDER BY");
    expect(result.formatted).toContain("WHERE");
    expect(result.formatted.trim().endsWith(";")).toBe(true);
  });

  it("reports empty input", () => {
    const result = formatSql("   ");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("empty_input");
  });

  it("returns parse error for unterminated quote", () => {
    const result = formatSql("SELECT * FROM users WHERE name = 'alice");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("unterminated_string");
  });

  it("preserves doubled quote escapes inside SQL string literals", () => {
    const result = formatSql("SELECT 'It''s' AS label;");
    expect(result.ok).toBe(true);
    expect(result.formatted).toContain("'It''s'");
    expect(result.formatted).not.toContain("'It' 's'");
  });

  it("preserves named and PostgreSQL-style parameters", () => {
    const result = formatSql("SELECT payload::jsonb FROM events WHERE id = :id;");
    expect(result.ok).toBe(true);
    expect(result.formatted).toContain("payload::jsonb");
    expect(result.formatted).toContain(":id");
    expect(result.formatted).not.toContain(": id");
  });
});

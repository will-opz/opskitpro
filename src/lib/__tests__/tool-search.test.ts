import { describe, expect, it } from "vitest";
import { searchTools } from "../tool-search";
import { productTools, toolCategoryOrder } from "../tool-catalog";

describe("shared task search",()=>{
  it.each([
    ["ssl","website-check"],["SSL/TLS","website-check"],["certificate","website-check"],["证书过期","website-check"],["网站打不开","website-check"],
    ["解析慢","network-doctor"],["json format","json"],["json 格式化","json"],["ＪＳＯＮ 格式化","json"],["脱敏","sensitive-data"],["redact logs","sensitive-data"],
    ["ip归属","ip-lookup"],["查 ip 属地","ip-lookup"],["帮我查ip属地","ip-lookup"],["DNSSEC","dns-security"],["sha256","hash"],["GUID","uuid"],
  ])("%s prioritizes %s in either locale",(query,id)=>{for(const lang of ["zh","en"] as const) expect(searchTools(query,{lang})[0]?.tool.id).toBe(id);});
  it("keeps relevance order across categories and locales",()=>{
    const ids=(lang:"zh"|"en")=>searchTools("format",{lang}).map(result=>result.tool.id);
    expect(ids("zh")).toEqual(ids("en"));expect(ids("zh").slice(0,3)).toEqual(["json","yaml","sql"]);
  });
  it("filters without changing ranking and returns no unrelated fallback",()=>{
    expect(searchTools("ssl",{mode:"local"})).toEqual([]);
    expect(searchTools("json",{category:"secure"})).toEqual([]);
    expect(searchTools("quantum-banana-xyz")).toEqual([]);
    expect(searchTools("",{category:"generate"}).every(r=>r.tool.primaryCategory==="generate")).toBe(true);
  });
  it("marks DNSSEC as related discovery, not a supported validator",()=>expect(searchTools("dnssec",{lang:"zh"})[0].note).toContain("不支持 DNSSEC 验证"));
  it("covers all registry tools in one bilingual metadata model",()=>{
    expect(searchTools("")).toHaveLength(productTools.length);
    for(const tool of productTools){expect(toolCategoryOrder).toContain(tool.primaryCategory);expect(tool.tags.length).toBeGreaterThan(0);expect(tool.aliases.zh.length).toBeGreaterThan(0);expect(tool.aliases.en.length).toBeGreaterThan(0);expect(tool.acceptedInputTypes.length).toBeGreaterThan(0);expect(tool.processingLocations.length).toBeGreaterThan(0);}
  });
});

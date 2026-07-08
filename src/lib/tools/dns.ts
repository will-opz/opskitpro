const TYPE_MAP: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

const REVERSE_TYPE_MAP: Record<string, number> = Object.entries(
  TYPE_MAP,
).reduce(
  (acc, [k, v]) => {
    acc[v] = parseInt(k, 10);
    return acc;
  },
  {} as Record<string, number>,
);

const STATUS_CODES: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
};

export async function performDnsLookup(domain: string, type: string) {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", domain);

  if (type !== "ALL") {
    url.searchParams.set("type", type);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/dns-json",
    },
  });

  if (!response.ok) {
    throw new Error(`DNS server returned ${response.status}`);
  }

  const data = await response.json();

  // Format the answers to return a cleaner object as per user requirement
  // e.g. { "a": ["1.1.1.1"], "aaaa": [], "mx": [] }
  const result: Record<string, any[]> = {};

  if (type === "ALL") {
    result["a"] = [];
    result["aaaa"] = [];
    result["cname"] = [];
    result["mx"] = [];
    result["txt"] = [];
    result["ns"] = [];
  } else {
    result[type.toLowerCase()] = [];
  }

  if (data.Answer) {
    for (const a of data.Answer) {
      const recordType = TYPE_MAP[a.type]?.toLowerCase() || a.type.toString();
      if (!result[recordType]) {
        result[recordType] = [];
      }

      let rData = a.data;
      // Clean up MX
      if (a.type === 15) {
        rData = a.data.split(" ").slice(1).join(" "); // Remove priority to simplify, or keep it if needed.
      }

      // Clean up TXT (remove quotes)
      if (a.type === 16) {
        rData = rData.replace(/^"|"$/g, "");
      }

      result[recordType].push(rData);
    }
  }

  return {
    status: STATUS_CODES[data.Status] || `UNKNOWN(${data.Status})`,
    records: result,
    raw: data,
  };
}

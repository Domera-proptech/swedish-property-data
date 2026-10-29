// Rebuilds data/kpi-monthly.csv from SCB's open API (GET, no key, no account).
//   node scripts/update-kpi.mjs
// TAB5737: KPI, fastställda tal, 1980=100 (SCB stopped updating it after 2025M12).
// TAB6792: fastställda KPI-tal 2020=100 rebased to 1980=100, used from 2026M01 on.
// The two series meet at 2025-12 / 2026-01; the test suite checks that the join is smooth.
import { writeFileSync } from "node:fs";

const BASE = "https://statistikdatabasen.scb.se/api/v2/tables";

async function series(table, contents) {
  const url = `${BASE}/${table}/data?lang=sv&outputFormat=json-stat2&valueCodes[ContentsCode]=${contents}&valueCodes[Tid]=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  const json = await res.json();
  const months = Object.keys(json.dimension.Tid.category.index);
  return new Map(months.map((m, i) => [m, json.value[i]]));
}

const historic = await series("TAB5737", "000004VU");
const rebased = await series("TAB6792", "000007MM");
const rows = [];
for (const month of [...new Set([...historic.keys(), ...rebased.keys()])].sort()) {
  const label = `${month.slice(0, 4)}-${month.slice(5)}`;
  if (month <= "2025M12" && historic.get(month) != null) rows.push([label, historic.get(month), "TAB5737"]);
  else if (rebased.get(month) != null) rows.push([label, rebased.get(month), "TAB6792"]);
}
writeFileSync(new URL("../data/kpi-monthly.csv", import.meta.url), ["month,kpi_1980_100,scb_table", ...rows.map((r) => r.join(","))].join("\n") + "\n");
console.log(`${rows.length} months, ${rows[0][0]} to ${rows.at(-1)[0]}`);

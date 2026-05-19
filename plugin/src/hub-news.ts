import { bootstrap, run } from "./lib/bootstrap.js";
import { loadNews } from "./lib/content.js";
import { filterByAudience, badge } from "./lib/audience.js";
import {
  DIVIDER,
  renderSnapshotFooter,
  renderEmptyPillar,
} from "./lib/output.js";

type Window = "today" | "week" | "all";

function parseWindow(argv: string[]): Window {
  if (argv.includes("--today")) return "today";
  if (argv.includes("--week")) return "week";
  return "week";
}

function isWithinDays(authored: string, days: number, today = new Date()): boolean {
  const d = new Date(`${authored}T00:00:00Z`);
  if (Number.isNaN(d.valueOf())) return false;
  const ms = today.valueOf() - d.valueOf();
  return ms <= days * 24 * 60 * 60 * 1000 && ms >= 0;
}

run(() => {
  const win = parseWindow(process.argv.slice(2));
  const { snapshotPath, meta, state } = bootstrap();
  const all = loadNews(snapshotPath);
  const audienceFiltered = filterByAudience(all, state.audience);

  let filtered = audienceFiltered;
  if (win === "today") filtered = audienceFiltered.filter((n) => isWithinDays(n.data.authored, 1));
  else if (win === "week") filtered = audienceFiltered.filter((n) => isWithinDays(n.data.authored, 7));

  filtered.sort((a, b) => b.data.authored.localeCompare(a.data.authored));

  const out: string[] = [];
  out.push(`News — window: ${win} (${filtered.length})`);
  out.push(DIVIDER);
  if (filtered.length === 0) {
    out.push(renderEmptyPillar("news in this window"));
  } else {
    for (const n of filtered) {
      const link = n.data.external_link ? ` ${n.data.external_link}` : "";
      const confidence = `[confidence: ${n.data.editor_confidence}]`;
      out.push(`${n.data.authored} — ${n.data.title} ${badge(n.data.audience)} ${confidence}`);
      out.push(`  source: ${n.data.source}  topics: ${n.data.topics.join(", ") || "—"}`);
      out.push(`  ${n.data.ai_summary}`);
      if (link) out.push(`  read on source:${link}`);
      out.push("");
    }
  }
  out.push(renderSnapshotFooter(meta));
  process.stdout.write(out.join("\n") + "\n");
});

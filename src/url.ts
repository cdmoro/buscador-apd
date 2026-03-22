import { SERVICE_URL } from "./contstans";
import { buildFilters } from "./filters";
import { store } from "./store";
import type { APDSearchParams, FilterForm } from "./types";
import { escapeSolr } from "./utils";

const filtersForm = document.getElementById("filters") as FilterForm;

export function buildFetchURL(apdSearchParams: Partial<APDSearchParams> = {}): string {
  const { start, rows, sort } = store.getState();
  const url = new URL(SERVICE_URL);
  let q = "*:*";
  const palabraClave = filtersForm.palabraClave.value.trim();

  if (palabraClave) {
    if (palabraClave.startsWith('"') && palabraClave.endsWith('"')) {
      q = `"${escapeSolr(palabraClave.slice(1, -1))}"`;
    } else {
      q = escapeSolr(palabraClave.split(/\s+/).join(" OR "));
    }
  }

  const searchParams: APDSearchParams = {
    q,
    rows,
    start,
    sort,
    ...apdSearchParams,
  };

  url.searchParams.set("q", searchParams.q);
  url.searchParams.set("rows", searchParams.rows.toString());
  url.searchParams.set("start", searchParams.start.toString());
  url.searchParams.set("sort", searchParams.sort);
  url.searchParams.set("wt", "json");

  for (const filter of buildFilters()) {
    url.searchParams.append("fq", filter);
  }

  return url.toString();
}
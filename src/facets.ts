import { FACET_PARAMS, SERVICE_URL } from "./contstans";
import type { FacetResponse } from "./types";
import { numberFormatter } from "./utils";

function applyFacet(filter: string, facetData: Record<string, number>) {
  const select = document.getElementById(filter) as HTMLSelectElement;
  const options = [...select.options];

  Object.entries(facetData).forEach(([key, count]) => {
    const option = options.find((o) => o.dataset.key === key);
    if (option) {
      option.textContent = `${option.dataset.label} — ${numberFormatter.format(count)}`;
      option.disabled = false;
    }
  });
}

export async function fetchFacets() {
  try {
    const res = await fetch(`${SERVICE_URL}?${FACET_PARAMS}`);
    const buffer = await res.arrayBuffer();

    const decoder = new TextDecoder("iso-8859-1");
    const text = decoder.decode(buffer);

    const { facet_counts } = JSON.parse(text) as FacetResponse;
    const { facet_fields } = facet_counts;

    applyFacet("modalidad", facet_fields.descnivelmodalidad);
    applyFacet("distrito", facet_fields.descdistrito);
    applyFacet("cargo", facet_fields.cargo);
    applyFacet("estado", facet_fields.estado);
  } catch {
    return;
  }
}

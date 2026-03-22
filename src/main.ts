import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import type {
  FacetResponse,
  FilterForm,
} from "./types";
import {
  numberFormatter,
} from "./utils";
import { CARGO_KEYS, CARGO_LABELS, DISTRITO_KEYS, DISTRITO_LABELS, ESTADO_KEYS, ESTADO_LABELS, FACET_PARAMS, MODALIDAD_KEYS, MODALIDAD_LABELS, SERVICE_URL } from "./contstans";
import { store } from "./store";
import { showToast } from "./toastService";
import { search } from "./search";
import { applyFiltersFromURL, clearInputFilter, clearSelectFilter, createFilters, loadFilters, updateActiveFilters, updateAllActiveFilters } from "./filters";
import { buildFetchURL } from "./url";

const filtersForm = document.getElementById("filters") as FilterForm;
const estadoSelect = filtersForm.elements.estado;
const estadoNotCheckbox = filtersForm.elements.estadoNot;
const distritoSelect = filtersForm.elements.distrito;
const distritoNotCheckbox = filtersForm.elements.distritoNot;
const cargoSelect = filtersForm.elements.cargo;
const cargoNotCheckbox = filtersForm.elements.cargoNot;
const modalidadSelect = filtersForm.elements.modalidad;
const modalidadNotCheckbox = filtersForm.elements.modalidadNot;
const cierreModeSelect = filtersForm.elements.cierreMode;
const cierreDateInput = filtersForm.elements.cierreDate;
const cierreTimeInput = filtersForm.elements.cierreTime;
const copyShareSearchBtn =
  document.querySelector<HTMLButtonElement>("#copy-search")!;

const sentinel = document.querySelector<HTMLElement>(".sticky-sentinel")!;
const activeFiltersCard = document.querySelector<HTMLElement>("#active-filters")!;

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.boundingClientRect.top < 0) {
      activeFiltersCard.classList.add("container");
    } else {
      activeFiltersCard.classList.remove("container");
    }
  },
  { threshold: [0] },
)

const cardResults = document.querySelector("#results") as HTMLDivElement;
const filtersFormCard = document.querySelector(
  "#filters-form",
) as HTMLFormElement;

const themeSelect = document.getElementById("theme") as HTMLSelectElement;
function applyTheme(value: string) {
  if (value === "auto") {
    document.documentElement.setAttribute(
      "data-bs-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  } else {
    document.documentElement.setAttribute("data-bs-theme", value);
  }
  localStorage.setItem("apdTheme", value);
}

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

async function fetchFacets() {
  try {
    const res = await fetch(`${SERVICE_URL}?${FACET_PARAMS}`);
    const buffer = await res.arrayBuffer();

    const decoder = new TextDecoder("iso-8859-1");
    const text = decoder.decode(buffer);

    const data = JSON.parse(text) as FacetResponse;

    applyFacet("modalidad", data.facet_counts.facet_fields.descnivelmodalidad);
    applyFacet("distrito", data.facet_counts.facet_fields.descdistrito);
    applyFacet("cargo", data.facet_counts.facet_fields.cargo);
    applyFacet("estado", data.facet_counts.facet_fields.estado);
  } catch {
    return;
  }
}

function main() {
  themeSelect.addEventListener("change", (e) =>
    applyTheme((e.target as HTMLSelectElement).value),
  );
  const savedTheme = localStorage.getItem("apdTheme") || "auto";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  createFilters(modalidadSelect, MODALIDAD_KEYS, MODALIDAD_LABELS);
  createFilters(estadoSelect, ESTADO_KEYS, ESTADO_LABELS);
  createFilters(distritoSelect, DISTRITO_KEYS, DISTRITO_LABELS);
  createFilters(cargoSelect, CARGO_KEYS, CARGO_LABELS);

  fetchFacets();

  if (navigator.share !== undefined) {
    copyShareSearchBtn.innerHTML = `<svg class="icon" aria-hidden="true">
      <use href="/icons.svg#share-icon"></use>
    </svg> <span class="d-none d-sm-inline-block">Compartir búsqueda</span>`;
  }

  const params = new URLSearchParams(window.location.search);

  if (params.has("id") && params.get("preview") === "true") {
    document.body.classList.add("preview");
  }

  if (params.size > 0) {
    applyFiltersFromURL(params);
  } else {
    loadFilters();
  }

  cargoSelect.addEventListener("change", () => updateActiveFilters("cargo"));
  cargoNotCheckbox.addEventListener("change", () =>
    updateActiveFilters("cargo"),
  );
  distritoSelect.addEventListener("change", () =>
    updateActiveFilters("distrito"),
  );
  distritoNotCheckbox.addEventListener("change", () =>
    updateActiveFilters("distrito"),
  );
  modalidadSelect.addEventListener("change", () =>
    updateActiveFilters("modalidad"),
  );
  modalidadNotCheckbox.addEventListener("change", () =>
    updateActiveFilters("modalidad"),
  );
  estadoSelect.addEventListener("change", () => updateActiveFilters("estado"));
  estadoNotCheckbox.addEventListener("change", () =>
    updateActiveFilters("estado"),
  );

  updateAllActiveFilters();
  search();;

  observer.observe(sentinel);

  document.getElementById("new-search")?.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });

    if (document.body.classList.contains("preview")) {
      filtersForm.reset();
      updateAllActiveFilters();
      document.body.classList.remove("preview");
      history.replaceState(null, "", location.pathname);
    }
    filtersFormCard.style.display = "block";
    cardResults.style.display = "none";
  });

  document.getElementById("reset-form")?.addEventListener("click", () => {
    (document.getElementById("filters") as HTMLFormElement).reset();
    updateAllActiveFilters();
  });
  filtersForm.addEventListener("submit", (e) => {
    e.preventDefault();
    store.setState({ start: 0 });
    search();
  });
  document
    .querySelectorAll(".clear-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearSelectFilter((e.currentTarget as HTMLButtonElement).value),
      ),
    );
  document
    .querySelectorAll(".clear-input-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearInputFilter((e.currentTarget as HTMLButtonElement).value),
      ),
    );

  document.querySelector("#clear-date-input")?.addEventListener("click", () => {
    cierreModeSelect.value = "0";
    cierreDateInput.value = "";
    cierreTimeInput.value = "";
  });

  copyShareSearchBtn.addEventListener("click", () => {
    const url = new URL(window.location.href);

    if (navigator.share !== undefined) {
      navigator.share({
        title: "Resultados de búsqueda en APD",
        text: "¡Mirá los resultados que encontré en Actos Públicos Digitales!",
        url: url.toString(),
      });
      return;
    }

    navigator.clipboard.writeText(url.toString());
    showToast("¡URL de búsqueda copiada al portapapeles!");
  });
  document.querySelector("#copy-url")?.addEventListener("click", () => {
    navigator.clipboard.writeText(buildFetchURL({ rows: 1, start: 0 }));
    showToast("¡URL del servicio copiada al portapapeles!");
  });
}

document.addEventListener("DOMContentLoaded", () => main());

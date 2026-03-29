import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/js/dist/modal";
import Tooltip from "bootstrap/js/dist/tooltip";
import "./style.css";
import type { FilterForm } from "./types";
import {
  CARGO_KEYS,
  CARGO_LABELS,
  DISTRITO_KEYS,
  DISTRITO_LABELS,
  ESTADO_KEYS,
  ESTADO_LABELS,
  MODALIDAD_KEYS,
  MODALIDAD_LABELS,
} from "./contstans";
import { store } from "./store";
import { showToast } from "./toastService";
import { search } from "./search";
import {
  applyFiltersFromURL,
  clearDateInputFilter,
  clearInputFilter,
  clearSelectFilter,
  createFormFilter,
  loadFilters,
  saveFiltersToLocalStorage,
  updateActiveFilters,
  updateAllActiveFilters,
} from "./filters";
import { buildFetchURL } from "./url";
import { fetchFacets } from "./facets";
import { handleSchoolClick } from "./school";
import { handlePostulacionClick } from "./postulaciones";

const filtersForm = document.getElementById("filters") as FilterForm;
const {
  estado,
  estadoNot,
  distrito,
  distritoNot,
  cargo,
  cargoNot,
  modalidad,
  modalidadNot,
  resetForm,
} = filtersForm.elements;

const copyShareSearchBtn =
  document.querySelector<HTMLButtonElement>("#copy-search")!;

const sentinel = document.querySelector<HTMLElement>(".sticky-sentinel")!;
const activeFiltersCard =
  document.querySelector<HTMLElement>("#active-filters")!;

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.boundingClientRect.top < 0) {
      activeFiltersCard.classList.add("container");
      activeFiltersCard.querySelector(".card-body")?.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      activeFiltersCard.classList.remove("container");
    }
  },
  { threshold: [0] },
);

const cardResults = document.querySelector<HTMLDivElement>("#results")!;
const filtersFormCard =
  document.querySelector<HTMLFormElement>("#filters-form")!;

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

function main() {
  window.__internal__ = {
    apiUrl: "",
  };

  themeSelect.addEventListener("change", (e) =>
    applyTheme((e.target as HTMLSelectElement).value),
  );
  const savedTheme = localStorage.getItem("apdTheme") || "auto";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  createFormFilter(modalidad, MODALIDAD_KEYS, MODALIDAD_LABELS);
  createFormFilter(estado, ESTADO_KEYS, ESTADO_LABELS);
  createFormFilter(distrito, DISTRITO_KEYS, DISTRITO_LABELS);
  createFormFilter(cargo, CARGO_KEYS, CARGO_LABELS);

  fetchFacets();

  if (navigator.share !== undefined) {
    copyShareSearchBtn.innerHTML = `<svg class="icon" aria-hidden="true">
      <use href="/icons.svg#share-icon"></use>
    </svg> <span class="visually-hidden">Compartir</span>`;
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

  cargo.addEventListener("change", () => updateActiveFilters("cargo"));
  cargoNot.addEventListener("change", () => updateActiveFilters("cargo"));
  distrito.addEventListener("change", () => updateActiveFilters("distrito"));
  distritoNot.addEventListener("change", () => updateActiveFilters("distrito"));
  modalidad.addEventListener("change", () => updateActiveFilters("modalidad"));
  modalidadNot.addEventListener("change", () =>
    updateActiveFilters("modalidad"),
  );
  estado.addEventListener("change", () => updateActiveFilters("estado"));
  estadoNot.addEventListener("change", () => updateActiveFilters("estado"));

  updateAllActiveFilters();
  search();

  observer.observe(sentinel);

  new Tooltip(document.body, {
    selector: '[data-bs-toggle="tooltip"]',
    html: true,
  });

  document.getElementById("new-search")?.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });

    filtersForm.reset();
    window.__internal__.apiUrl = "";
    updateAllActiveFilters();
    saveFiltersToLocalStorage();

    if (document.body.classList.contains("preview")) {
      document.body.classList.remove("preview");
    }

    history.replaceState(null, "", location.pathname);
    filtersFormCard.style.display = "block";
    cardResults.style.display = "none";
  });

  document.getElementById("edit-search")?.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });

    if (document.body.classList.contains("preview")) {
      filtersForm.reset();
      updateAllActiveFilters();
      saveFiltersToLocalStorage();

      document.body.classList.remove("preview");
      history.replaceState(null, "", location.pathname);
    }

    filtersFormCard.style.display = "block";
    cardResults.style.display = "none";
  });

  resetForm.addEventListener("click", () => {
    filtersForm.reset();
    updateAllActiveFilters();
  });
  filtersForm.addEventListener("submit", (e) => {
    e.preventDefault();
    store.setState({ start: 0 });
    search();
  });
  document
    .querySelectorAll<HTMLElement>(".clear-filter")
    .forEach(
      (btn) =>
        (btn.onclick = (e) =>
          clearSelectFilter((e.currentTarget as HTMLButtonElement).value)),
    );
  document
    .querySelectorAll<HTMLElement>(".clear-input-filter")
    .forEach(
      (btn) =>
        (btn.onclick = (e) =>
          clearInputFilter((e.currentTarget as HTMLButtonElement).value)),
    );

  document.querySelector("#clear-date-input")?.addEventListener("click", () => {
    clearDateInputFilter();
  });

  copyShareSearchBtn.addEventListener("click", () => {
    const url = new URL(window.location.href);

    if (navigator.share !== undefined) {
      navigator.share({
        title: "Ofertas de búsqueda en APD",
        text: "¡Mirá las ofertas que encontré en Actos Públicos Digitales!",
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

  const schoolModalEl = document.getElementById("school-modal")!;
  schoolModalEl.addEventListener("show.bs.modal", e => {
    handleSchoolClick(schoolModalEl, e);
  });

  const postulacionModalEl = document.getElementById("postulacion-modal")!;
  postulacionModalEl.addEventListener("show.bs.modal", e => {
    handlePostulacionClick(postulacionModalEl, e);
  });
}

document.addEventListener("DOMContentLoaded", main);

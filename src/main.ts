import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import type { APDSearchParams, CourseStatus, FacetResponse, Response } from "./types";
import {
  DISTRITO_KEYS,
  DISTRITO_LABELS,
  MODALIDAD_KEYS,
  MODALIDAD_LABELS,
  ESTADO_KEYS,
  ESTADO_LABELS,
  CARGO_KEYS,
  CARGO_LABELS,
} from "./filters";
import { dateFormatter, dateTimeFormatter, getCourseVariant, numberFormatter } from "./utils";
import { renderCards } from "./render";

const SERVICE_URL =
  "https://servicios3.abc.gob.ar/valoracion.docente/api/apd.oferta.encabezado/select";
const FACET_PARAMS =
  "rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map&facet.field=cargo&facet.field=estado&facet.field=descnivelmodalidad&facet.field=descdistrito&q=*:*&wt=json";
let start = 0;
const rows = 18;
let sort = "ult_movimiento desc";

const filtersForm = document.getElementById("filters") as HTMLFormElement;
const estadoSelect = document.querySelector<HTMLSelectElement>("#estado")!;
const estadoNotCheckbox =
  document.querySelector<HTMLInputElement>("#estadoNot")!;
const distritoSelect = document.querySelector<HTMLSelectElement>("#distrito")!;
const distritoNotCheckbox =
  document.querySelector<HTMLInputElement>("#distritoNot")!;
const cargoSelect = document.querySelector<HTMLSelectElement>("#cargo")!;
const cargoNotCheckbox = document.querySelector<HTMLInputElement>("#cargoNot")!;
const modalidadSelect =
  document.querySelector<HTMLSelectElement>("#modalidad")!;
const modalidadNotCheckbox =
  document.querySelector<HTMLInputElement>("#modalidadNot")!;
const escuelaInput = document.querySelector<HTMLInputElement>("#escuela")!;
const igeInput = document.querySelector<HTMLInputElement>("#ige")!;
const idInput = document.querySelector<HTMLInputElement>("#id")!;
const cierreModeSelect =
  document.querySelector<HTMLSelectElement>("#cierre-mode")!;
const cierreDateInput =
  document.querySelector<HTMLInputElement>("#cierre-date")!;
const cierreTimeInput =
  document.querySelector<HTMLInputElement>("#cierre-time")!;
const copyShareSearchBtn = document.querySelector<HTMLButtonElement>("#copy-search")!;

const cardResults = document.querySelector("#results") as HTMLDivElement;
const cardResultsGrid = document.querySelector(
  ".card-results",
) as HTMLDivElement;
const filtersFormCard = document.querySelector(
  "#filters-form",
) as HTMLFormElement;
const filterCardGroup = document.querySelector(
  "#filter-card-group",
) as HTMLDivElement;

// --- Theme ---
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

// --- Filters ---
function buildFilters() {
  let fq = [];
  const activeFilters: {
    title: string;
    filters: string;
  }[] = [];

  const modalidad = [...modalidadSelect.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (modalidad.length) {
    let q = `descnivelmodalidad:(${modalidad.join(" OR ")})`;
    if (modalidadNotCheckbox.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Niveles o Modalidades",
    filters: getActiveFiltersText("modalidad"),
  });

  const distrito = [...distritoSelect.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (distrito.length) {
    let q = `descdistrito:(${distrito.join(" OR ")})`;
    if (distritoNotCheckbox.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Distrito",
    filters: getActiveFiltersText("distrito"),
  });

  const cargo = [...cargoSelect.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (cargo.length) {
    let q = `cargo:(${cargo.join(" OR ")})`;
    if (cargoNotCheckbox.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Cargo",
    filters: getActiveFiltersText("cargo"),
  });

  const estado = [...estadoSelect.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (estado.length) {
    let q = `estado:(${estado.join(" OR ")})`;
    if (estadoNotCheckbox.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Estado",
    filters: getActiveFiltersText("estado"),
  });

  const escuela = escuelaInput.value;
  if (escuela) {
    fq.push(`escuela:${escuela}`);
    activeFilters.push({
      title: "Escuela",
      filters: `<span class="badge text-bg-info">${escuela}</span>`,
    });
  }

  const ige = igeInput.value;
  if (ige) {
    fq.push(`ige:${ige}`);
    activeFilters.push({
      title: "IGE",
      filters: `<span class="badge text-bg-info">${ige}</span>`,
    });
  }

  const id = idInput.value;
  if (id) {
    fq.push(`id:${id}`);
    activeFilters.push({
      title: "ID",
      filters: `<span class="badge text-bg-info">${id}</span>`,
    });
  }

  const cierreDate = cierreDateInput.value;
  if (cierreDate) {
    const cierreMode = parseInt(cierreModeSelect.value);
    const cierreTime = cierreTimeInput.value;
    const cierreModeLabels = ["Exacta", "Desde", "Hasta"];
    const finOfertaDateFrom = `${cierreDate}${cierreTime ? `T${cierreTime}:00` : "T00:00:00"}Z`;
    const finOfertaDateTo = `${cierreDate}${cierreTime ? `T${cierreTime}:00` : "T23:59:59"}Z`;
    let finoferta = `["${finOfertaDateFrom}" TO "${finOfertaDateTo}"]`;

    if (cierreMode === 1) {
      finoferta = `["${finOfertaDateFrom}" TO *]`;
    }

    if (cierreMode === 2) {
      finoferta = `[* TO "${finOfertaDateTo}"]`;
    }

    fq.push(`finoferta:${finoferta}`);

    let text = "";

    if (cierreMode !== 0) {
      text = `${cierreModeLabels[cierreMode]} el `;
    }

    if (cierreTime) {
      text += `${dateTimeFormatter.format(new Date(`${cierreDate} ${cierreTime}`))}`;
    } else {
      text += `${dateFormatter.format(new Date(cierreDate))} (${cierreMode !== 0 ? "incluido" : "todo el día"})`;
    }

    activeFilters.push({
      title: "Cierre de Oferta",
      filters: `<span class="badge text-bg-info">${text}</span>`,
    });
  }

  filterCardGroup.innerHTML = `<tr>${activeFilters
    .map(
      (af) => `<td class="bg-transparent">
      <small class="text-muted text-nowrap">${af.title}</small>
      <div class="active-filters flex-nowrap text-nowrap">${af.filters}</div>
  </td>`,
    )
    .join("")}</tr>`;

  return fq;
}

function buildFetchURL(apdSearchParams: Partial<APDSearchParams> = {}): string {
  const url = new URL(SERVICE_URL);
  const searchParams: APDSearchParams = {
    q: "*:*",
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

function saveFilters() {
  const data = {
    modalidad: [...modalidadSelect.selectedOptions].map((o) => o.value),
    modalidadNot: modalidadNotCheckbox.checked,

    distrito: [...distritoSelect.selectedOptions].map((o) => o.value),
    distritoNot: distritoNotCheckbox.checked,

    cargo: [...cargoSelect.selectedOptions].map((o) => o.value),
    cargoNot: cargoNotCheckbox.checked,

    estado: [...estadoSelect.selectedOptions].map((o) => o.value),
    estadoNot: estadoNotCheckbox.checked,

    ige: igeInput.value,
    escuela: escuelaInput.value,
    id: idInput.value,
    cierreMode: cierreModeSelect.value,
    cierreDate: cierreDateInput.value,
    cierreTime: cierreTimeInput.value,
  };
  localStorage.setItem("apdFilters", JSON.stringify(data));
}

function loadFilters() {
  const saved = localStorage.getItem("apdFilters");
  if (!saved) return;

  const data = JSON.parse(saved);

  [...modalidadSelect.options].forEach((o) => {
    if (data.modalidad.includes(o.value)) o.selected = true;
  });

  modalidadNotCheckbox.checked = data.modalidadNot;

  [...distritoSelect.options].forEach((o) => {
    if (data.distrito.includes(o.value)) o.selected = true;
  });
  distritoNotCheckbox.checked = data.distritoNot;

  [...cargoSelect.options].forEach((o) => {
    if (data.cargo.includes(o.value)) o.selected = true;
  });
  cargoNotCheckbox.checked = data.cargoNot;

  [...estadoSelect.options].forEach((o) => {
    if (data.estado.includes(o.value)) o.selected = true;
  });
  estadoNotCheckbox.checked = data.estadoNot;

  igeInput.value = data.ige;
  escuelaInput.value = data.escuela;
  idInput.value = data.id;
  cierreModeSelect.value = data.cierreMode;
  cierreDateInput.value = data.cierreDate;
  cierreTimeInput.value = data.cierreTime;
}

function updateURL() {
  const params = new URLSearchParams();

  // params.set("rows", rows.toString());
  // params.set("sort", sort)

  const modalidad = [...modalidadSelect.selectedOptions].map((o) => o.value);
  if (modalidad.length) {
    params.set(
      "modalidad",
      (modalidadNotCheckbox.checked ? "-" : "") + modalidad.join(","),
    );
  }

  const distrito = [...distritoSelect.selectedOptions].map((o) => o.value);
  if (distrito.length) {
    params.set(
      "distrito",
      (distritoNotCheckbox.checked ? "-" : "") + distrito.join(","),
    );
  }

  const cargo = [...cargoSelect.selectedOptions].map((o) => o.value);
  if (cargo.length) {
    params.set(
      "cargo",
      (cargoNotCheckbox.checked ? "-" : "") + cargo.join(","),
    );
  }

  const estado = [...estadoSelect.selectedOptions].map((o) => o.value);
  if (estado.length) {
    params.set(
      "estado",
      (estadoNotCheckbox.checked ? "-" : "") + estado.join(","),
    );
  }

  const escuela = escuelaInput.value;
  if (escuela) {
    params.set("escuela", escuela);
  }

  const ige = igeInput.value;
  if (ige) {
    params.set("ige", ige);
  }

  const id = idInput.value;
  if (id) {
    params.set("id", id);
  }

  const cierreDate = cierreDateInput.value;
  if (cierreDate) {
    params.set("cmode", cierreModeSelect.value);
    params.set("cfecha", cierreDate);

    const cierreTime = cierreTimeInput.value;
    if (cierreTime) {
      params.set("chora", cierreTime);
    }
  }

  if (params.size > 0) {
    params.set("start", start.toString());
    history.replaceState(null, "", "?" + params.toString());
  } else {
    history.replaceState(null, "", location.pathname);
  }
}

async function search() {
  document.body.classList.add("loading");
  filtersFormCard.style.display = "none";
  cardResults.style.display = "block";
  cardResultsGrid.innerHTML = `<div class="d-flex justify-content-center mt-5 mb-4 w-100">
    <div class="spinner-border text-info" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>`;

  updateURL();
  saveFilters();

  document
    .querySelectorAll(".card button")
    .forEach((el) => ((el as HTMLInputElement).disabled = true));

  const url = buildFetchURL();

  document
    .querySelectorAll<HTMLElement>(
      "#active-filters .clear-active-filter-button-container",
    )
    .forEach((el) => {
      const link = document.createElement("a");
      link.className = "link-info";
      link.href = "#";
      link.title = "Limpiar filtro";
      link.innerHTML = `<svg class="icon" aria-hidden="true">
      <use href="/icons.svg#clear-filter-icon"></use>
    </svg>`;
      link.onclick = (e) => {
        e.preventDefault();
        if (document.body.classList.contains("loading")) return;
        clearSelectFilter(el.dataset.filter!);
        search();
      };
      el.appendChild(link);
    });

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  const decoder = new TextDecoder("iso-8859-1");
  const text = decoder.decode(buffer);

  const data = JSON.parse(text) as Response;

  document.body.classList.remove("loading");

  if (data.error) {
    console.error("Error:", data.error.msg);
    filtersFormCard.style.display = "block";
    document
      .querySelectorAll(".card input, .card select, .card button")
      .forEach((el) => ((el as HTMLInputElement).disabled = false));
    alert(
      "Hubo un error al obtener los datos. Por favor, revisá que el formulario esté completo y correcto.",
    );
    return;
  }

  const docs = data.response.docs;
  const total = data.response.numFound;

  (document.getElementById("count") as HTMLInputElement).innerText =
    `Mostrando ${start + 1} a ${start + docs.length} de ${numberFormatter.format(total)} resultados`;

  cardResults.classList.remove("card-results-empty");
  cardResultsGrid.innerHTML = "";

  renderCards(docs, cardResultsGrid);
  renderPagination("pagination", total, rows, start);
  renderPagination("pagination-bottom", total, rows, start);

  document
    .querySelectorAll(".card button")
    .forEach((el) => ((el as HTMLInputElement).disabled = false));
}

function getAllText(filter: string) {
  if (filter === "modalidad") {
    return "Todas";
  }

  return "Todos";
}

function clearInputFilter(filter: string) {
  (document.getElementById(filter) as HTMLInputElement).value = "";
}

function clearSelectFilter(filter: string) {
  [...(document.getElementById(filter) as HTMLSelectElement).options].forEach(
    (o) => (o.selected = false),
  );
  (document.getElementById(`${filter}Not`) as HTMLInputElement).checked = false;
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML =
    `<span class="badge text-bg-info">${getAllText(filter)}</span>`;
}

function truncateActiveFilterLabel(label: string) {
  if (label.length <= 20) {
    return label;
  }

  return label.slice(0, 10) + "…" + label.slice(label.length - 10);
}

function getActiveFiltersText(filter: string) {
  const selected = [
    ...(document.getElementById(filter) as HTMLSelectElement).selectedOptions,
  ].map(
    (o) =>
      `<span class="badge text-bg-${filter === "estado" ? getCourseVariant(o.dataset.label as CourseStatus) : "info"}" title="${o.dataset.label!}">${truncateActiveFilterLabel(o.dataset.label!)}</span>`,
  );
  let text = `<span class="badge text-bg-info">${getAllText(filter)}</span>`;

  if (selected.length > 0) {
    if ((document.getElementById(`${filter}Not`) as HTMLInputElement).checked) {
      text =
        `<span class="badge text-bg-info">${getAllText(filter)}</span> excepto ` +
        selected.join("");
    } else {
      text = selected.join("");
    }
    text += `<span class="clear-active-filter-button-container" data-filter="${filter}"></span>`;
  }

  return text;
}

function updateActiveFilters(filter: string) {
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML =
    getActiveFiltersText(filter);
}

function updateAllActiveFilters() {
  ["modalidad", "distrito", "cargo", "estado"].forEach(updateActiveFilters);
}

function renderPagination(
  id: string,
  total: number,
  rows: number,
  start: number,
) {
  const container = document.getElementById(id)!;
  container.innerHTML = "";

  const totalPages = Math.ceil(total / rows);
  const currentPage = Math.floor(start / rows) + 1;

  function createItem(
    page: number,
    label?: string,
    disabled = false,
    active = false,
  ) {
    const li = document.createElement("li");
    li.className = "page-item";

    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label ?? page.toString();

    if (disabled) li.classList.add("disabled");
    else if (active) {
      li.classList.add("active");
      a.classList.add("bg-info", "text-bg-info", "border-info");
    } else {
      a.classList.add("text-info");
    }

    a.onclick = (e) => {
      e.preventDefault();
      scrollTo({ top: 0, behavior: "smooth" });
      goToPage(page);
    };

    li.appendChild(a);
    container.appendChild(li);
  }

  function createDots() {
    const li = document.createElement("li");
    li.className = "page-item disabled";
    li.innerHTML = `<span class="page-link">...</span>`;
    container.appendChild(li);
  }

  createItem(currentPage - 1, "«", currentPage === 1);

  const window = 1;
  let startPage = Math.max(1, currentPage - window);
  let endPage = Math.min(totalPages, currentPage + window);

  if (startPage > 1) {
    createItem(1);

    if (startPage > 2) createDots();
  }

  for (let p = startPage; p <= endPage; p++) {
    createItem(p, undefined, false, p === currentPage);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) createDots();

    createItem(totalPages);
  }

  createItem(currentPage + 1, "»", currentPage === totalPages);
}

function goToPage(page: number) {
  start = (page - 1) * rows;
  search();
}

function applyFiltersFromURL(params: URLSearchParams) {
  const startParam = params.get("start");
  if (startParam) {
    start = parseInt(startParam);
  }

  const modalidad = params.get("modalidad");
  if (modalidad) {
    modalidad.split(",").forEach((m) => {
      const option = [...modalidadSelect.options].find(
        (o) => o.value === m.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    modalidadNotCheckbox.checked = modalidad.startsWith("-");
  }

  const distrito = params.get("distrito");
  if (distrito) {
    distrito.split(",").forEach((d) => {
      const option = [...distritoSelect.options].find(
        (o) => o.value === d.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    distritoNotCheckbox.checked = distrito.startsWith("-");
  }

  const cargo = params.get("cargo");
  if (cargo) {
    cargo.split(",").forEach((c) => {
      const option = [...cargoSelect.options].find(
        (o) => o.value === c.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    cargoNotCheckbox.checked = cargo.startsWith("-");
  }

  const estado = params.get("estado");
  if (estado) {
    estado.split(",").forEach((e) => {
      const option = [...estadoSelect.options].find(
        (o) => o.value === e.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    estadoNotCheckbox.checked = estado.startsWith("-");
  }

  const escuela = params.get("escuela");
  if (escuela) {
    escuelaInput.value = escuela;
  }

  const ige = params.get("ige");
  if (ige) {
    igeInput.value = ige;
  }

  const id = params.get("id");
  if (id) {
    idInput.value = id;
  }

  const cierreMode = params.get("cmode");
  if (cierreMode) {
    cierreModeSelect.value = cierreMode;
  }

  const cierreDate = params.get("cfecha");
  if (cierreDate) {
    cierreDateInput.value = cierreDate;
  }

  const cierreTime = params.get("chora");
  if (cierreTime) {
    cierreTimeInput.value = cierreTime;
  }

  saveFilters();
  filtersFormCard.style.display = "none";
  // search();
}

function createFilters(el: HTMLElement, values: string[], labels?: string[]) {
  values.forEach((v, i) => {
    const option = document.createElement("option");
    option.value = i.toString();
    option.dataset.key = v;
    option.dataset.label = labels ? labels[i] : v;
    option.textContent = labels ? labels[i] : v;
    el.appendChild(option);
  });
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

function updateButtonLabel(btn: HTMLButtonElement, msg: string) {
  const prevText = btn.innerHTML;
  btn.innerText = msg;

  setTimeout(() => {
    btn.innerHTML = prevText;
  }, 1000);
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
  search();

  document.getElementById("new-search")?.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });
    document.body.classList.remove("preview");
    filtersFormCard.style.display = "block";
    cardResults.style.display = "none";
  });

  document.getElementById("reset-form")?.addEventListener("click", () => {
    (document.getElementById("filters") as HTMLFormElement).reset();
    updateAllActiveFilters();
  });
  filtersForm.addEventListener("submit", (e) => {
    e.preventDefault();
    start = 0;
    search();
  });
  document
    .querySelectorAll(".clear-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearSelectFilter((e.target as HTMLButtonElement).value),
      ),
    );
  document
    .querySelectorAll(".clear-input-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearInputFilter((e.target as HTMLButtonElement).value),
      ),
    );

  document.querySelector("#clear-date-input")?.addEventListener("click", () => {
    cierreModeSelect.value = "0";
    cierreDateInput.value = "";
    cierreTimeInput.value = "";
  });

  copyShareSearchBtn.addEventListener("click", (e) => {
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
    updateButtonLabel(e.target as HTMLButtonElement, "¡Búsqueda copiada!");
  });
  document.querySelector("#copy-url")?.addEventListener("click", (e) => {
    navigator.clipboard.writeText(buildFetchURL({ rows: 1, start: 0 }));
    updateButtonLabel(e.target as HTMLButtonElement, "¡URL copiada!");
  });
}

document.addEventListener("DOMContentLoaded", () => main());

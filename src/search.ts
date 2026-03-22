import { clearSelectFilter, saveFilters } from "./filters";
import { renderCards, renderPagination } from "./render";
import { store } from "./store";
import type { FilterForm, Response } from "./types";
import { buildFetchURL } from "./url";
import { numberFormatter } from "./utils";

const cardResultsGrid = document.querySelector<HTMLElement>(".card-results")!;
const cardResults = document.querySelector<HTMLElement>("#results")!;
const filtersFormCard =
  document.querySelector<HTMLFormElement>("#filters-form")!;
const countResults = document.querySelector<HTMLElement>("#count")!;

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
  escuela,
  ige,
  palabraClave,
  id,
  cierreMode,
  cierreDate,
  cierreTime,
} = filtersForm.elements;

function updateURL() {
  const params = new URLSearchParams();

  // params.set("rows", rows.toString());
  // params.set("sort", sort)

  const modalidadSelected = [...modalidad.selectedOptions].map((o) => o.value);
  if (modalidadSelected.length) {
    params.set(
      "modalidad",
      (modalidadNot.checked ? "-" : "") + modalidadSelected.join(","),
    );
  }

  const distritoSelected = [...distrito.selectedOptions].map((o) => o.value);
  if (distritoSelected.length) {
    params.set(
      "distrito",
      (distritoNot.checked ? "-" : "") + distritoSelected.join(","),
    );
  }

  const cargoSelected = [...cargo.selectedOptions].map((o) => o.value);
  if (cargoSelected.length) {
    params.set(
      "cargo",
      (cargoNot.checked ? "-" : "") + cargoSelected.join(","),
    );
  }

  const estadoSelected = [...estado.selectedOptions].map((o) => o.value);
  if (estadoSelected.length) {
    params.set(
      "estado",
      (estadoNot.checked ? "-" : "") + estadoSelected.join(","),
    );
  }

  const escuelaValue = escuela.value;
  if (escuelaValue) {
    params.set("escuela", escuelaValue);
  }

  const igeValue = ige.value;
  if (igeValue) {
    params.set("ige", igeValue);
  }

  const palabraClaveValue = palabraClave.value;
  if (palabraClaveValue) {
    params.set("palabraClave", palabraClaveValue);
  }

  const idValue = id.value;
  if (idValue) {
    params.set("id", idValue);
  }

  const cierreDateValue = cierreDate.value;
  if (cierreDateValue) {
    params.set("cmode", cierreMode.value);
    params.set("cfecha", cierreDateValue);

    const cierreTimeValue = cierreTime.value;
    if (cierreTimeValue) {
      params.set("chora", cierreTimeValue);
    }
  }

  if (params.size > 0) {
    const { start } = store.getState();

    params.set("start", start.toString());
    history.replaceState(null, "", "?" + params.toString());
  } else {
    history.replaceState(null, "", location.pathname);
  }
}

export async function search() {
  document.body.classList.add("loading");

  const { start, rows } = store.getState();
  
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

  countResults.innerText =
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

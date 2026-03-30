import { renderActiveFilters, saveFiltersToLocalStorage } from "./filters";
import { renderCards, renderPagination } from "./render";
import { store } from "./store";
import type { Course, FilterForm, ApacheResponse } from "./types";
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

  const { start } = store.getState();

  params.set("start", start.toString());
  history.replaceState(null, "", "?" + params.toString());
}

export async function search() {
  renderActiveFilters();
  updateURL();
  saveFiltersToLocalStorage();

  document.body.classList.add("loading");
  store.setState({ loading: true });

  const { start, rows } = store.getState();

  const createPlaceholderCardLayout = (cards: number) => {
    let layout = "";
    for (let i = 0; i < cards; i++) {
      layout += `
        <div class="col placeholder-wave">
          ${createPlaceholderCard()}
        </div>`;
    }
    return layout;
  };

  const createPlaceholderCard = () => `
      <div class="card card-placeholder border-success">
        <div class="card-header d-flex justify-content-between align-items-center text-bg-success">
          <span class="placeholder rounded-1 col-4"></span>
          <span class="placeholder rounded-1 col-2"></span>
        </div>
        <div class="card-body d-flex flex-column gap-2">
          <div class="placeholder rounded-1 mb-2 col-3"></div>
          <div class="placeholder rounded-1 col-9 bg-info"></div>
          <div class="placeholder rounded-1 col-8 bg-info mb-2"></div>
          <div class="placeholder rounded-1 col-5"></div>
          <div class="placeholder rounded-1 col-7"></div>
          <div class="placeholder rounded-1 col-6"></div>
          <div class="placeholder rounded-1 col-4"></div>
          <div class="placeholder rounded-1 col-5 mb-2"></div>
          <div class="placeholder rounded-1 col-3"></div>
        </div>
        <div class="card-footer d-flex align-items-center" style="min-height: 41px;">
          <span class="placeholder bg-secondary rounded-1 col-8"></span>
        </div>
      </div>`;

  filtersFormCard.style.display = "none";
  cardResults.style.display = "block";
  cardResultsGrid.innerHTML = createPlaceholderCardLayout(6);

  document
    .querySelectorAll(".card button")
    .forEach((el) => ((el as HTMLInputElement).disabled = true));

  const url = buildFetchURL();
  window.__internal__.apiUrl = url;

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  const decoder = new TextDecoder("iso-8859-1");
  const text = decoder.decode(buffer);

  const data = JSON.parse(text) as ApacheResponse<Course>;

  document.body.classList.remove("loading");
  store.setState({ loading: false });

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

  countResults.innerText = `Mostrando ${numberFormatter.format(start + 1)} a ${numberFormatter.format(start + docs.length)} de ${numberFormatter.format(total)} ofertas`;

  cardResults.classList.remove("card-results-empty");
  cardResultsGrid.innerHTML = "";

  renderCards(docs, cardResultsGrid);
  renderPagination("pagination", total, rows, start);
  renderPagination("pagination-bottom", total, rows, start);

  document
    .querySelectorAll(".card button")
    .forEach((el) => ((el as HTMLInputElement).disabled = false));
}

import { search } from "./search";
import { store } from "./store";
import type { CourseStatus, FilterForm, FilterFormElements } from "./types";
import { dateFormatter, dateTimeFormatter, getCourseVariant } from "./utils";

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
const filterCardGroup =
  document.querySelector<HTMLElement>("#filter-card-group")!;
const filtersFormCard =
  document.querySelector<HTMLFormElement>("#filters-form")!;
const cardResults = document.querySelector<HTMLDivElement>("#results")!;

export function saveFiltersToLocalStorage() {
  const data = {
    modalidad: [...modalidad.selectedOptions].map((o) => o.value),
    modalidadNot: modalidadNot.checked,

    distrito: [...distrito.selectedOptions].map((o) => o.value),
    distritoNot: distritoNot.checked,

    cargo: [...cargo.selectedOptions].map((o) => o.value),
    cargoNot: cargoNot.checked,

    estado: [...estado.selectedOptions].map((o) => o.value),
    estadoNot: estadoNot.checked,

    ige: ige.value,
    escuela: escuela.value,
    palabraClave: palabraClave.value,
    id: id.value,
    cierreMode: cierreMode.value,
    cierreDate: cierreDate.value,
    cierreTime: cierreTime.value,
  };
  localStorage.setItem("apdFilters", JSON.stringify(data));
}

export function clearDateInputFilter() {
  cierreMode.value = "0";
  cierreDate.value = "";
  cierreTime.value = "";
}

export function clearAllFilters() {
  filtersForm.reset();
  updateAllActiveFilters();
  cardResults.classList.remove("card-results-empty");
  search();
}

export function clearSelectFilter(filter: string) {
  [
    ...(
      filtersForm.elements[
        filter as keyof FilterFormElements
      ] as HTMLSelectElement
    ).options,
  ].forEach((o) => (o.selected = false));
  (
    filtersForm.elements[
      `${filter}Not` as keyof FilterFormElements
    ] as HTMLInputElement
  ).checked = false;
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML =
    `<span class="badge text-bg-info">Todos</span>`;
}

export function buildFiltersParams() {
  let fq = [];

  const modalidadSelected = [...modalidad.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (modalidadSelected.length) {
    let q = `descnivelmodalidad:(${modalidadSelected.join(" OR ")})`;
    if (modalidadNot.checked) q = "-" + q;
    fq.push(q);
  }

  const distritoSelected = [...distrito.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (distritoSelected.length) {
    let q = `descdistrito:(${distritoSelected.join(" OR ")})`;
    if (distritoNot.checked) q = "-" + q;
    fq.push(q);
  }

  const cargoSelected = [...cargo.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (cargoSelected.length) {
    let q = `cargo:(${cargoSelected.join(" OR ")})`;
    if (cargoNot.checked) q = "-" + q;
    fq.push(q);
  }

  const estadoSelected = [...estado.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (estadoSelected.length) {
    let q = `estado:(${estadoSelected.join(" OR ")})`;
    if (estadoNot.checked) q = "-" + q;
    fq.push(q);
  }

  const escuelaValue = escuela.value;
  if (escuelaValue) {
    fq.push(`escuela:${escuelaValue}`);
  }

  const igeValue = ige.value;
  if (igeValue) {
    fq.push(`ige:${igeValue}`);
  }

  const palabraClaveValue = palabraClave.value;
  if (palabraClaveValue) {
  }

  const idValue = id.value;
  if (idValue) {
    fq.push(`id:${idValue}`);
  }

  const cierreDateValue = cierreDate.value;
  if (cierreDateValue) {
    const cierreModeValue = parseInt(cierreMode.value);
    const cierreTimeValue = cierreTime.value;
    const cierreModeLabels = ["Exacta", "Desde", "Hasta"];
    const finOfertaDateFrom = `${cierreDateValue}${cierreTimeValue ? `T${cierreTimeValue}:00` : "T00:00:00"}Z`;
    const finOfertaDateTo = `${cierreDateValue}${cierreTimeValue ? `T${cierreTimeValue}:00` : "T23:59:59"}Z`;
    let finoferta = `["${finOfertaDateFrom}" TO "${finOfertaDateTo}"]`;

    if (cierreModeValue === 1) {
      finoferta = `["${finOfertaDateFrom}" TO *]`;
    }

    if (cierreModeValue === 2) {
      finoferta = `[* TO "${finOfertaDateTo}"]`;
    }

    fq.push(`finoferta:${finoferta}`);

    let text = "";

    if (cierreModeValue !== 0) {
      text = `${cierreModeLabels[cierreModeValue]} el `;
    }

    if (cierreTimeValue) {
      text += `${dateTimeFormatter.format(new Date(`${cierreDateValue} ${cierreTimeValue}`))}`;
    } else {
      text += `${dateFormatter.format(new Date(cierreDateValue))} (${cierreModeValue !== 0 ? "incluido" : "todo el día"})`;
    }
  }

  document.getElementById("edit-search")!.style.display =
    fq.length > 0 || palabraClave.value.length > 0 ? "inline-block" : "none";

  return fq;
}

export function loadFilters() {
  const saved = localStorage.getItem("apdFilters");
  if (!saved) return;

  const data = JSON.parse(saved);

  [...modalidad.options].forEach((o) => {
    if (data.modalidad.includes(o.value)) o.selected = true;
  });

  modalidadNot.checked = data.modalidadNot;

  [...distrito.options].forEach((o) => {
    if (data.distrito.includes(o.value)) o.selected = true;
  });
  distritoNot.checked = data.distritoNot;

  [...cargo.options].forEach((o) => {
    if (data.cargo.includes(o.value)) o.selected = true;
  });
  cargoNot.checked = data.cargoNot;

  [...estado.options].forEach((o) => {
    if (data.estado.includes(o.value)) o.selected = true;
  });
  estadoNot.checked = data.estadoNot;

  ige.value = data.ige || "";
  escuela.value = data.escuela || "";
  palabraClave.value = data.palabraClave || "";
  id.value = data.id || "";
  cierreMode.value = data.cierreMode || "0";
  cierreDate.value = data.cierreDate || "";
  cierreTime.value = data.cierreTime || "";
}

export function clearInputFilter(filter: string) {
  (
    filtersForm.elements[filter as keyof FilterFormElements] as HTMLInputElement
  ).value = "";
}

function truncateActiveFilterLabel(label: string) {
  if (label.length <= 20) {
    return label;
  }

  return label.slice(0, 10) + "…" + label.slice(label.length - 10);
}

function getActiveSelectFiltersText(filter: string) {
  const selected = [
    ...(
      filtersForm.elements[
        filter as keyof FilterFormElements
      ] as HTMLSelectElement
    ).selectedOptions,
  ].map(
    (o) =>
      `<span class="badge text-bg-${filter === "estado" ? getCourseVariant(o.dataset.label as CourseStatus) : "info"}" title="${o.dataset.label!}">${truncateActiveFilterLabel(o.dataset.label!)}</span>`,
  );
  let text = `<span class="badge text-bg-info badge-no-filter">Todos</span>`;

  if (selected.length > 0) {
    if (
      (
        filtersForm.elements[
          `${filter}Not` as keyof FilterFormElements
        ] as HTMLInputElement
      ).checked
    ) {
      text =
        `<span class="badge text-bg-info">Todos</span> excepto ` +
        selected.join("");
    } else {
      text = selected.join("");
    }
  }

  return text;
}

function getActiveInputFilterText(value: string) {
  return `<span class="badge text-bg-info">${value}</span>`;
}

export function updateActiveFilters(filter: string) {
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML =
    getActiveSelectFiltersText(filter);
}

export function updateAllActiveFilters() {
  ["modalidad", "distrito", "cargo", "estado"].forEach(updateActiveFilters);
}

export function applyFiltersFromURL(params: URLSearchParams) {
  const startParam = params.get("start");
  if (startParam) {
    store.setState({ start: parseInt(startParam) });
  }

  const modalidadParam = params.get("modalidad");
  if (modalidadParam) {
    modalidadParam.split(",").forEach((m) => {
      const option = [...modalidad.options].find(
        (o) => o.value === m.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    modalidadNot.checked = modalidadParam.startsWith("-");
  }

  const distritoParam = params.get("distrito");
  if (distritoParam) {
    distritoParam.split(",").forEach((d) => {
      const option = [...distrito.options].find(
        (o) => o.value === d.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    distritoNot.checked = distritoParam.startsWith("-");
  }

  const cargoParam = params.get("cargo");
  if (cargoParam) {
    cargoParam.split(",").forEach((c) => {
      const option = [...cargo.options].find(
        (o) => o.value === c.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    cargoNot.checked = cargoParam.startsWith("-");
  }

  const estadoParam = params.get("estado");
  if (estadoParam) {
    estadoParam.split(",").forEach((e) => {
      const option = [...estado.options].find(
        (o) => o.value === e.replace("-", ""),
      );
      if (option) option.selected = true;
    });
    estadoNot.checked = estadoParam.startsWith("-");
  }

  const escuelaParam = params.get("escuela");
  if (escuelaParam) {
    escuela.value = escuelaParam;
  }

  const igeParam = params.get("ige");
  if (igeParam) {
    ige.value = igeParam;
  }

  const palabraClaveParam = params.get("palabraClave");
  if (palabraClaveParam) {
    palabraClave.value = palabraClaveParam;
  }

  const idParam = params.get("id");
  if (idParam) {
    id.value = idParam;
  }

  const cierreModeParam = params.get("cmode");
  if (cierreModeParam) {
    cierreMode.value = cierreModeParam;
  }

  const cierreDateParam = params.get("cfecha");
  if (cierreDateParam) {
    cierreDate.value = cierreDateParam;
  }

  const cierreTimeParam = params.get("chora");
  if (cierreTimeParam) {
    cierreTime.value = cierreTimeParam;
  }

  saveFiltersToLocalStorage();
  filtersFormCard.style.display = "none";
}

export function createFormFilter(
  el: HTMLElement,
  values: string[],
  labels?: string[],
) {
  values.forEach((v, i) => {
    const option = document.createElement("option");
    option.value = i.toString();
    option.dataset.key = v;
    option.dataset.label = labels ? labels[i] : v;
    option.textContent = labels ? labels[i] : v;
    el.appendChild(option);
  });
}

export function renderActiveFilters() {
  filterCardGroup.innerHTML = "";

  const tbody = document.createElement("tbody");
  const tr = document.createElement("tr");

  const activeFilters: {
    title: string;
    type: "select" | "input" | "date";
    name: string;
    filters: string;
  }[] = [];

  ["modalidad", "distrito", "cargo", "estado"].forEach((filter) => {
    activeFilters.push({
      title:
        filter === "modalidad"
          ? "Niveles o Modalidades"
          : filter.charAt(0).toUpperCase() + filter.slice(1),
      type: "select",
      name: filter,
      filters: getActiveSelectFiltersText(filter),
    });
  });

  if (escuela.value) {
    activeFilters.push({
      title: "Escuela",
      type: "input",
      name: "escuela",
      filters: getActiveInputFilterText(escuela.value),
    });
  }

  if (ige.value) {
    activeFilters.push({
      title: "IGE",
      type: "input",
      name: "ige",
      filters: getActiveInputFilterText(ige.value),
    });
  }

  const palabraClaveValue = palabraClave.value;
  if (palabraClaveValue) {
    activeFilters.push({
      title: "Palabra Clave",
      type: "input",
      name: "palabraClave",
      filters: getActiveInputFilterText(palabraClaveValue),
    });
  }

  const idValue = id.value;
  if (idValue) {
    activeFilters.push({
      title: "ID",
      type: "input",
      name: "id",
      filters: getActiveInputFilterText(idValue),
    });
  }

  const cierreDateValue = cierreDate.value;
  if (cierreDateValue) {
    const cierreModeValue = parseInt(cierreMode.value);
    const cierreTimeValue = cierreTime.value;
    const cierreModeLabels = ["Exacta", "Desde", "Hasta"];

    activeFilters.push({
      title: "Cierre de Oferta",
      type: "date",
      name: "cierreDate",
      filters: `<span class="badge text-bg-info">${cierreModeLabels[cierreModeValue]} ${cierreTimeValue ? dateTimeFormatter.format(new Date(`${cierreDateValue} ${cierreTimeValue}`)) : dateFormatter.format(new Date(cierreDateValue))}</span>`,
    });
  }

  activeFilters.forEach((af) => {
    const td = document.createElement("td");
    td.classList.add("bg-transparent");

    const small = document.createElement("small");
    small.classList.add("text-muted", "text-nowrap");
    small.textContent = af.title;

    const div = document.createElement("div");
    div.classList.add("active-filters", "flex-nowrap", "text-nowrap");
    div.innerHTML = af.filters;

    if (!af.filters.includes("badge-no-filter")) {
      const clearBtn = document.createElement("a");
      clearBtn.href = "#";
      clearBtn.title = `Limpiar filtro`;
      clearBtn.classList.add("link-info");
      clearBtn.innerHTML = `<svg class="icon" aria-hidden="true">
        <use href="/icons.svg#clear-filter-icon"></use>
      </svg>`;
      clearBtn.onclick = (e) => {
        e.preventDefault();
        if (af.type === "select") {
          clearSelectFilter(af.name);
        } else if (af.type === "input") {
          clearInputFilter(af.name);
        } else if (af.type === "date") {
          clearDateInputFilter();
        }
        search();
      };

      div.appendChild(clearBtn);
    }

    td.appendChild(small);
    td.appendChild(div);
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
  filterCardGroup.appendChild(tbody);
}

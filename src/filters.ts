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

export function saveFilters() {
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

export function buildFilters() {
  let fq = [];
  const activeFilters: {
    title: string;
    filters: string;
  }[] = [];

  const modalidadSelected = [...modalidad.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (modalidadSelected.length) {
    let q = `descnivelmodalidad:(${modalidadSelected.join(" OR ")})`;
    if (modalidadNot.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Niveles o Modalidades",
    filters: getActiveSelectFiltersText("modalidad"),
  });

  const distritoSelected = [...distrito.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (distritoSelected.length) {
    let q = `descdistrito:(${distritoSelected.join(" OR ")})`;
    if (distritoNot.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Distrito",
    filters: getActiveSelectFiltersText("distrito"),
  });

  const cargoSelected = [...cargo.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (cargoSelected.length) {
    let q = `cargo:(${cargoSelected.join(" OR ")})`;
    if (cargoNot.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Cargo",
    filters: getActiveSelectFiltersText("cargo"),
  });

  const estadoSelected = [...estado.selectedOptions].map(
    (o) => `"${o.dataset.key}"`,
  );
  if (estadoSelected.length) {
    let q = `estado:(${estadoSelected.join(" OR ")})`;
    if (estadoNot.checked) q = "-" + q;
    fq.push(q);
  }

  activeFilters.push({
    title: "Estado",
    filters: getActiveSelectFiltersText("estado"),
  });

  const escuelaValue = escuela.value;
  if (escuelaValue) {
    fq.push(`escuela:${escuelaValue}`);
    activeFilters.push({
      title: "Escuela",
      filters: getActiveInputFilterText(escuelaValue, "escuela"),
    });
  }

  const igeValue = ige.value;
  if (igeValue) {
    fq.push(`ige:${igeValue}`);
    activeFilters.push({
      title: "IGE",
      filters: getActiveInputFilterText(igeValue, "ige"),
    });
  }

  const palabraClaveValue = palabraClave.value;
  if (palabraClaveValue) {
    activeFilters.push({
      title: "Palabra Clave",
      filters: getActiveInputFilterText(palabraClaveValue, "palabraClave"),
    });
  }

  const idValue = id.value;
  if (idValue) {
    fq.push(`id:${idValue}`);
    activeFilters.push({
      title: "ID",
      filters: getActiveInputFilterText(idValue, "id"),
    });
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
  let text = `<span class="badge text-bg-info">Todos</span>`;

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
    text += `<span class="clear-active-filter-button-container" data-filter="${filter}"></span>`;
  }

  return text;
}

function getActiveInputFilterText(value: string, _filter: string) {
  return `<span class="badge text-bg-info">${value}</span>`;
  // return `<span class="badge text-bg-info">${value}</span> <span class="clear-active-filter-button-container" data-filter="${filter}"></span>`;
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

  saveFilters();
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

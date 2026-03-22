import { search, updateAllActiveFilters } from "./main";
import { store } from "./store";
import { showToast } from "./toastService";
import type { Course, DesignadaCourse, FilterForm } from "./types";
import {
  cuitFormatter,
  dateFormatter,
  dateTimeFormatter,
  getCourseVariant,
} from "./utils";

const filtersForm = document.getElementById("filters") as FilterForm;

function resolveTomaDePosesion(tomaPosesion: string) {
  if (!tomaPosesion) return "No especificada";
  const date = new Date(tomaPosesion);

  if (date <= new Date()) {
    return "INMEDIATA";
  }

  if (isNaN(date.getTime())) {
    return tomaPosesion;
  }

  return dateTimeFormatter.format(date);
}

function renderDesignada(d: DesignadaCourse) {
  return `
  <div class="alert alert-secondary alert-designada position-absolute top-0 start-0 end-0 bottom-0 text-center text-light justify-content-center mb-0 d-flex flex-column" role="alert">
    <h5>Adjudicado a<br>${d.nombreganador}</h5>
    <div>CUIL: ${cuitFormatter(d.cuilganador)}</div>
    <div class="mt-2">
      <div><small>Toma posesión: ${d.tomaposesion ? dateFormatter.format(new Date(d.tomaposesion)) : "-"}</small></div>
      <div><small>Listado origen: ${d.listadoorigenganador}</small></div>
      <div><small>Puntaje: ${d.puntajeganador}</small></div>
      <div><small>Vuelta: ${d.vuelta}</small></div>
    </div>
  </div>`;
}

function renderDetails(d: Course, daysFiltered: string) {
  return `
      ${d.id && `<div><strong>ID</strong>: ${d.id}</div>`}
      ${d.descnivelmodalidad && `<div><strong>Nivel</strong>: ${d.descnivelmodalidad}</div>`}
      ${d.descdistrito && `<div><strong>Distrito</strong>: ${d.descdistrito}</div>`}
      ${d.domiciliodesempeno && `<div><strong>Domicilio</strong>: ${d.domiciliodesempeno}</div>`}
      <div><hr></div>
      ${d.areaincumbencia && `<div><strong>Área</strong>: ${d.areaincumbencia}</div>`}
      ${d.acargodireccion && `<div><strong>Dirección a cargo</strong>: ${d.acargodireccion}</div>`}
      ${d.cursodivision && `<div><strong>Curso/División</strong>: ${d.cursodivision}</div>`}
      ${d.turno && `<div><strong>Turno</strong>: ${d.turno}</div>`}
      ${d.jornada && `<div><strong>Jornada</strong>: ${d.jornada}</div>`}
      ${d.supl_revista && `<div><strong>Revista</strong>: ${d.supl_revista}</div>`}
      ${d.infectocontagiosa !== undefined && `<div><strong>Infectocontagiosa en el establecimiento</strong>: ${d.infectocontagiosa ? "Sí" : "No"}</div>`}
      <div><hr></div>
      ${d.tomaposesion && `<div><strong>Toma de posesión</strong>: ${resolveTomaDePosesion(d.tomaposesion)}</div>`}
      ${d.iniciooferta && `<div><strong>Inicio oferta</strong>: ${dateTimeFormatter.format(new Date(d.iniciooferta))}</div>`}
      ${!d.supl_desde || d.supl_desde.startsWith("9999") ? "" : `<div><strong>Desde</strong>: ${dateFormatter.format(new Date(d.supl_desde))}</div>`}
      ${!d.supl_hasta || d.supl_hasta.startsWith("9999") ? "" : `<div><strong>Hasta</strong>: ${dateFormatter.format(new Date(d.supl_hasta))}</div>`}
      ${daysFiltered || ""}`;
}

export function renderCards(docs: Course[], container: HTMLElement) {
  if (docs.length === 0) {
    document.body.classList.add("card-results-empty");
    const alertWrapper = document.createElement("div");
    alertWrapper.className = "w-100";

    const alert = document.createElement("div");
    alert.className = "alert alert-info mb-0";
    alert.role = "alert";
    alert.textContent =
      "No se encontraron resultados para los filtros seleccionados. ";
    
    const clearFiltersBtn = document.createElement("a");
    clearFiltersBtn.href = "#";
    clearFiltersBtn.className = "alert-link";
    clearFiltersBtn.textContent = "Limpiar todos los filtros";
    clearFiltersBtn.onclick = () => {
      filtersForm.reset();
      updateAllActiveFilters();
      document.body.classList.remove("card-results-empty");
      search();
    }
    alert.appendChild(clearFiltersBtn);

    alertWrapper.appendChild(alert);
    container.appendChild(alertWrapper);

    return;
  }

  const isPreview = document.body.classList.contains("preview");
  const isSingleResult = docs.length === 1;

  if (isSingleResult) {
    document.body.classList.add("card-results-single");
  }

  docs.forEach((d) => {
    const courseStatus = getCourseVariant(d.estado);

    const days = {
      Lunes: d.lunes,
      Martes: d.martes,
      Miércoles: d.miercoles,
      Jueves: d.jueves,
      Viernes: d.viernes,
    };

    const daysTable = `<div class="day-preview-table card text-center w-auto d-flex flex-row d-inline-flex overflow-hidden rounded-1">${Object.entries(
      days,
    )
      .map(
        ([k, v]) =>
          `<div title="${v || ""}" class="${!!v ? "bg-info text-bg-info" : "text-muted"}">${k[0]}</div>`,
      )
      .join("")}</div>`;

    const daysFiltered = Object.entries(days)
      .filter(([_, v]) => !!v)
      .map(([k, v]) => `<div><strong>${k}</strong>: ${v}</div>`)
      .join("");

    const fragment = document.createDocumentFragment();

    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("div");
    card.className = `card card-course ${courseStatus} border-${courseStatus} h-100`;

    const cardHeader = document.createElement("div");
    cardHeader.className = `card-header bg-${courseStatus} text-bg-${courseStatus} d-flex justify-content-between gap-2`;
    cardHeader.innerHTML = `<span class="flex-grow-1">${d.estado || ""}</span>`;

    const copyCourseLink = document.createElement("a");
    copyCourseLink.title = "Copiar URL del curso";
    copyCourseLink.className = `text-bg-${courseStatus}`;
    copyCourseLink.href = "#";
    copyCourseLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(
        `https://buscador-apd.netlify.app/?id=${d.id}&preview=true`,
      );
      showToast("URL del curso copiada al portapapeles");
    });
    copyCourseLink.innerHTML = `<svg class="icon" aria-hidden="true">
        <use href="/icons.svg#copy-icon"></use>
      </svg>`;

    cardHeader.appendChild(copyCourseLink);

    if (navigator.share != undefined) {
      const shareCourseLink = document.createElement("a");
      shareCourseLink.title = "Compartir curso";
      shareCourseLink.className = `text-bg-${courseStatus}`;
      shareCourseLink.href = "#";
      shareCourseLink.onclick = async (e) => {
        e.preventDefault();

        try {
          await navigator.share({
            title: `Oferta ${d.cargo} en ${d.escuela}`,
            text: `Oferta de ${d.cargo} en ${d.escuela} (${d.descdistrito}) \nModalidad: ${d.descnivelmodalidad} ${
              d.finoferta
                ? `\nCierre de oferta: ${dateTimeFormatter.format(new Date(d.finoferta))}`
                : ""
            }`,
            url: `https://buscador-apd.netlify.app/?id=${d.id}&preview=true`,
          });
        } catch (err) {
          console.error("Error compartiendo la oferta:", err);
        }
      };
      shareCourseLink.innerHTML = `<svg class="icon" aria-hidden="true">
            <use href="/icons.svg#share-icon"></use>
        </svg>`;

      cardHeader.appendChild(shareCourseLink);
    }

    const listLink = document.createElement("a");
    listLink.title = "Listar postulados";
    listLink.className = `text-bg-${courseStatus}`;
    listLink.href = `http://servicios.abc.gov.ar/actos.publicos.digitales/postulantes/?oferta=${d.ige}&detalle=${d.id}&_t=${new Date(d.timestamp).getTime()}`;
    listLink.target = "_blank";
    listLink.innerHTML = `<svg class="icon" aria-hidden="true">
        <use href="/icons.svg#list-icon"></use>
      </svg>`;

    cardHeader.appendChild(listLink);

    const observaciones = d.observaciones ? `<div><hr></div><div><strong>Observaciones</strong></div><div>${d.observaciones}</div>` : "";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.innerHTML = `${d.estado === "DESIGNADA" ? renderDesignada(d) : ""}
      <div class="card-subtitle mb-2 text-muted">${d.escuela || ""}</div>
      <h5 class="card-title text-info">${d.cargo || ""}</h5>
      <h6 class="card-subtitle mb-2 text-muted">${d.descdistrito || ""} | ${d.descnivelmodalidad || ""}</h6>
      <div class="card-text mb-1">
          ${d.finoferta && `<div>Cierre de Oferta: <span class="text-info">${dateTimeFormatter.format(new Date(d.finoferta))}</span></div>`}
          <div>IGE: <span class="text-info">${d.ige || ""}</span> — Área: <span class="text-info">${d.areaincumbencia || ""}</span></div>
          ${daysTable && `<div>${daysTable}</div>`}
      </div>
      
      <div class="card-details mt-3">
      ${
        isPreview
          ? `
            <div class="row row-cols-1 row-cols-md-2">
              ${renderDetails(d, daysFiltered)}
            </div>
            ${observaciones}`
          : `
            <details>
              <summary>Detalles</summary>
              ${renderDetails(d, daysFiltered)}
              ${observaciones}
            </details>`
      }
      </div>`;

    const cardFooter = document.createElement("div");
    cardFooter.className = "card-footer text-muted";
    cardFooter.innerHTML = `<small>Última actualización: ${d.ult_movimiento ? dateTimeFormatter.format(new Date(d.ult_movimiento)) : ""}</small>`;

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    col.appendChild(card);
    fragment.appendChild(col);

    container.appendChild(fragment);
  });
}

export function renderPagination(
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
  store.setState({ start: (page - 1) * store.getKey("rows") });
  search();
}

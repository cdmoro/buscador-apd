import { clearAllFilters } from "./filters";
import { getSchoolById } from "./school";
import { search } from "./search";
import { store } from "./store";
import { showToast } from "./toastService";
import type { Course, DesignadaCourse } from "./types";
import {
  cuitFormatter,
  dateFormatter,
  dateTimeFormatter,
  getCourseVariant,
  numberFormatter,
} from "./utils";
// import Tooltip from "bootstrap/js/dist/tooltip";

const cardResults = document.querySelector<HTMLDivElement>("#results")!;
const turnos = {
  M: "Mañana",
  T: "Tarde",
  V: "Vespertino",
  A: "Alternado",
  MT: "Mañana y Tarde",
  N: "Noche",
} as const;
const jornadas = {
  JS: "Jornada Simple",
  JC: "Jornada Completa",
} as const;
const revista = {
  S: "Suplencia",
  P: "Provisionalidad",
} as const;

function resolveTomaDePosesion(tomaPosesion: string) {
  if (!tomaPosesion) return "No especificada";
  const date = new Date(tomaPosesion);

  if (date <= new Date()) {
    return '<span class="badge text-bg-info">INMEDIATA</span>';
  }

  if (isNaN(date.getTime())) {
    return tomaPosesion;
  }

  return dateTimeFormatter.format(date);
}

function renderDesignada(d: DesignadaCourse) {
  return `
  <div class="alert-designada position-absolute start-0 end-0 bottom-0 top-0 text-center text-light justify-content-center mb-0 d-flex flex-column p-3 z-1 text-body" role="alert">
    <div>Adjudicado a</div>
    <h5 class="mb-0 mt-1">${d.nombreganador.toLocaleUpperCase()}</h5>
    <div class="text-muted">${cuitFormatter(d.cuilganador)}</div>
    <div class="mt-3">
      <div>Toma posesión: ${d.tomaposesion ? dateFormatter.format(new Date(d.tomaposesion)) : "—"}</div>
      <div>Listado: ${decodeURIComponent(d.listadoorigenganador)}</div>
      <div>Puntaje: ${d.puntajeganador ? `<span class="badge text-bg-info">${numberFormatter.format(parseFloat(d.puntajeganador))}</span>` : "—"}</div>
      <div>Vuelta: ${d.vuelta}</div>
    </div>
  </div>`;
}

function renderDetails(d: Course, daysFiltered: string) {
  return `
      ${d.descnivelmodalidad && `<div class="mt-2"><strong>Nivel</strong>: ${d.descnivelmodalidad}</div>`}
      ${d.descdistrito && `<div><strong>Distrito</strong>: ${d.descdistrito}</div>`}
      ${d.domiciliodesempeno && `<div><strong>Domicilio</strong>: ${d.domiciliodesempeno}</div>`}
      <div><hr></div>
      ${d.areaincumbencia && `<div><strong>Área</strong>: ${d.areaincumbencia}</div>`}
      ${d.acargodireccion && `<div><strong>Dirección a cargo</strong>: ${d.acargodireccion}</div>`}
      ${d.cursodivision && `<div><strong>Curso/División</strong>: ${d.cursodivision}</div>`}
      ${d.turno && `<div><strong>Turno</strong>: ${turnos[d.turno as keyof typeof turnos] || d.turno}</div>`}
      ${d.jornada && `<div><strong>Jornada</strong>: ${jornadas[d.jornada as keyof typeof jornadas] || d.jornada}</div>`}
      ${d.supl_revista && `<div><strong>Revista</strong>: ${revista[d.supl_revista as keyof typeof revista] || d.supl_revista}</div>`}
      ${d.infectocontagiosa !== undefined && `<div><strong>Infectocontagiosa en el establecimiento</strong>: ${d.infectocontagiosa ? "Sí" : "No"}</div>`}
      <div><hr></div>
      ${d.iniciooferta && `<div><strong>Inicio oferta</strong>: ${dateTimeFormatter.format(new Date(d.iniciooferta))}</div>`}
      ${!d.supl_desde || d.supl_desde.startsWith("9999") ? "" : `<div><strong>Desde</strong>: ${dateFormatter.format(new Date(d.supl_desde))}</div>`}
      ${!d.supl_hasta || d.supl_hasta.startsWith("9999") ? "" : `<div><strong>Hasta</strong>: ${dateFormatter.format(new Date(d.supl_hasta))}</div>`}
      ${daysFiltered ? `<div><hr></div>${daysFiltered}` : ""}`;
}

function isValidWeekday(value: string) {
  if (!value) return false;

  const numbers = value
    .split("")
    .map((v) => v.trim())
    .filter((v) => /^\d+$/.test(v));

  if (numbers.join("") === "0") {
    return false;
  }

  return numbers.length > 0;
}

function getDurationLegend(start: string, end: string) {
  if (start.startsWith("9999") || end.startsWith("9999")) {
    return "Indefinida";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null;
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${days} día${days > 1 ? "s" : ""}`;
}

export function renderCards(docs: Course[], container: HTMLElement) {
  if (docs.length === 0) {
    container.innerHTML = "";
    cardResults.classList.add("card-results-empty");
    const alertWrapper = document.createElement("div");
    alertWrapper.className = "w-100";

    const alert = document.createElement("div");
    alert.className = "alert alert-info mb-0";
    alert.role = "alert";
    alert.textContent =
      "No se encontraron ofertas para los filtros seleccionados. ";

    const clearFiltersBtn = document.createElement("a");
    clearFiltersBtn.href = "#";
    clearFiltersBtn.className = "alert-link";
    clearFiltersBtn.textContent = "Limpiar filtros";
    clearFiltersBtn.onclick = () => clearAllFilters();
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

    const daysFiltered = Object.entries(days)
      .filter(([_, v]) => isValidWeekday(v))
      .map(([k, v]) => `<div><strong>${k}</strong>: ${v}</div>`)
      .join("");

    const daysCard = `<div 
      class="card card-days text-center w-auto d-flex flex-row d-inline-flex overflow-hidden rounded-1 border-secondary"
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      data-bs-title="${daysFiltered}"
    >${Object.entries(days)
      .map(
        ([k, v]) =>
          `<div class="${isValidWeekday(v) ? "bg-info text-bg-info" : "text-muted"}">${k[0]}</div>`,
      )
      .join("")}</div>`;

    function renderTurnoCard(turno: string) {
      const turnoArr = turno.split("");

      if (!Object.keys(turnos).some((t) => turnoArr.includes(t))) return "";

      return `<div 
          class="card card-turnos text-center w-auto d-flex flex-row d-inline-flex rounded-1 overflow-hidden border-secondary ${turnoArr.map((t) => `card-turnos-${t.toLowerCase()}`).join(" ")}"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          data-bs-title="${turnoArr.map((t) => `<div>${turnos[t as keyof typeof turnos]}</div>`).join("")}"
        >
        ${Object.keys(turnos)
          .map(
            (key) =>
              `<div class="${turnoArr.includes(key) ? "bg-info text-bg-info" : "text-muted"} pill-turno-${key.toLowerCase()}">${key}</div>`,
          )
          .join("")}
      </div>`;
    }

    const observaciones =
      d.observaciones.trim() !== ""
        ? `<hr><div><strong>Observaciones</strong></div><div>${d.observaciones}</div>`
        : "";

    const fragment = document.createDocumentFragment();

    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("div");
    card.className = `card card-suplencia ${courseStatus} border-${courseStatus} h-100 overflow-hidden`;

    const cardHeader = document.createElement("div");
    cardHeader.className = `card-header text-bg-${courseStatus} d-flex justify-content-between gap-2`;
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
        let escuela;

        try {
          const datosEscuela = await getSchoolById(d.escuela);
          escuela = datosEscuela.NOMBRE;
        } catch (err) {
          console.error(
            "Error obteniendo datos de la escuela para compartir la oferta:",
            err,
          );
          escuela = d.escuela;
        }

        try {
          await navigator.share({
            title: `Oferta ${d.cargo} en ${escuela}`,
            text: `Oferta de ${d.cargo} en ${escuela} (${d.descdistrito}) \nModalidad: ${d.descnivelmodalidad} ${
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
    // listLink.href = `http://servicios.abc.gov.ar/actos.publicos.digitales/postulantes/?oferta=${d.ige}&detalle=${d.id}&_t=${new Date(d.timestamp).getTime()}`;
    listLink.href = "#";
    listLink.dataset.bsToggle = "modal";
    listLink.dataset.bsTarget = "#postulacion-modal";
    listLink.dataset.bsIge = d.ige.toString();
    listLink.dataset.bsId = d.id;
    listLink.dataset.bsEstado = d.estado;
    listLink.dataset.bsEscuela = d.escuela;
    listLink.dataset.bsCargo = d.cargo;
    listLink.target = "_blank";
    listLink.innerHTML = `<svg class="icon" aria-hidden="true">
        <use href="/icons.svg#list-icon"></use>
      </svg>`;

    cardHeader.appendChild(listLink);

    const duration = getDurationLegend(d.supl_desde, d.supl_hasta);
    const jornada = jornadas[d.jornada as keyof typeof jornadas]
      ? jornadas[d.jornada as keyof typeof jornadas]
      : "";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body position-relative";
    cardBody.innerHTML = `${d.estado === "DESIGNADA" ? renderDesignada(d) : ""}
      <div class="d-flex gap-2 align-items-center justify-content-between mb-2">
        ${
          d.escuela &&
          `<div class="card-subtitle text-muted">
            <a href="#" class="link-body-emphasis" data-bs-toggle="modal" data-bs-target="#school-modal" data-bs-escuela="${d.escuela}" title="Ver detalles de la institución">${d.escuela}</a>
           </div>`
        }
        ${
          observaciones
            ? `
          <svg
            class="icon icon-md text-warning"
            aria-hidden="true"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            data-bs-title="<strong>Observaciones</strong><br>${d.observaciones.replace(/"/g, "&quot;")}"
          >
          <use href="/icons.svg#warning-icon"></use>
        </svg>`
            : ""
        }
      </div>
      <h5 class="card-title text-info">${d.cargo || ""}</h5>
      <h6 class="card-subtitle mb-2 text-muted">${d.descdistrito || ""} | ${d.descnivelmodalidad || ""}</h6>
      <div class="card-text mb-1">
          <div class="mb-2">IGE: <span class="text-info">${d.ige || ""}</span> — Área: <span class="text-info">${d.areaincumbencia || ""}</span></div>
          ${d.finoferta && d.estado !== "DESIGNADA" ? `<div class="d-flex justify-content-between small">Cierre oferta <span class="text-info">${dateTimeFormatter.format(new Date(d.finoferta))}</span></div>` : ""}
          ${d.tomaposesion && d.estado !== "DESIGNADA" ? `<div class="d-flex justify-content-between small">Toma posesión <span>${resolveTomaDePosesion(d.tomaposesion)}</span></div>` : ""}
          ${duration && `<div class="d-flex justify-content-between small">Duración <span>${duration}</span></div>`}
          <div class="mt-2 d-flex flex-wrap gap-2 align-items-center">
            ${daysCard ? daysCard : ""}
            ${renderTurnoCard(d.turno)}
            ${
              d.jornada
                ? `
              <!--div 
                class="card card-jornada text-center w-auto flex-row d-inline-flex rounded-1 overflow-hidden border-secondary"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-title="${jornada}"
              >
                <div class="bg-info text-bg-info">${d.jornada}</div>
              </div-->`
                : ""
            }
            ${
              d.supl_revista
                ? `
              <div 
                class="card card-revista text-center w-auto flex-row d-inline-flex rounded-1 overflow-hidden border-secondary px-2 bg-info"
              >
                <div class="bg-info text-bg-info w-auto">${revista[d.supl_revista as keyof typeof revista].toLocaleUpperCase() || d.supl_revista}</div>
              </div>`
                : ""
            }
          </div>
      </div>
      
      <div class="card-details mt-2">
      ${
        isPreview
          ? `
            <div class="card-details-rows row row-cols-1 row-cols-md-2">
              ${renderDetails(d, daysFiltered)}
            </div>
            ${observaciones}`
          : `
            <div>
              <a href="#" class="link-body-emphasis" data-bs-toggle="collapse" data-bs-target="#details-${d.id}" aria-expanded="false" aria-controls="details-${d.id}"><small>Ver detalles</small></a>
              <div class="collapse" id="details-${d.id}">
                ${renderDetails(d, daysFiltered)}
                ${observaciones}
              </div>
            </div>`
      }
      </div>`;

    const cardFooter = document.createElement("div");
    cardFooter.className = "card-footer text-muted";
    cardFooter.innerHTML = `<small>Últ. act.: ${d.ult_movimiento ? dateTimeFormatter.format(new Date(d.ult_movimiento)) : ""}</small>`;

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    col.appendChild(card);
    fragment.appendChild(col);

    container.appendChild(fragment);
  });

  // [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(
  //   (tooltipTriggerEl) =>
  //     new Tooltip(tooltipTriggerEl, {
  //       html: true,
  //     }),
  // );
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
    a.textContent = label ?? numberFormatter.format(page);

    if (disabled) li.classList.add("disabled");
    else if (active) {
      li.classList.add("active");
      a.classList.add("bg-info", "text-bg-info", "border-info");
    } else {
      a.classList.add("text-info");
    }

    a.onclick = (e) => {
      e.preventDefault();

      const loading = store.getKey("loading");

      if (loading) return;

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

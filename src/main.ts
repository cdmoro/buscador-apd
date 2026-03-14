import 'bootstrap/dist/css/bootstrap.min.css'
import "./style.css";
import type { CourseStatus, Response } from "./types";
import { DISTRITOS, MODALIDADES, ESTADOS, CARGOS } from './filters';

const endpoint =
  "https://servicios3.abc.gob.ar/valoracion.docente/api/apd.oferta.encabezado/select";
let start = 0;
const rows = 20;

const estadoSelect = document.querySelector<HTMLSelectElement>("#estado")!;
const estadoNotCheckbox =
  document.querySelector<HTMLInputElement>("#estadoNot")!;
const distritoSelect = document.querySelector<HTMLSelectElement>("#distrito")!;
const distritoNotCheckbox = document.querySelector<HTMLInputElement>("#distritoNot")!;
const cargoSelect = document.querySelector<HTMLSelectElement>("#cargo")!;
const cargoNotCheckbox = document.querySelector<HTMLInputElement>("#cargoNot")!;
const modalidadSelect = document.querySelector<HTMLSelectElement>("#modalidad")!;
const modalidadNotCheckbox = document.querySelector<HTMLInputElement>("#modalidadNot")!;

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
themeSelect.addEventListener("change", (e) =>
  applyTheme((e.target as HTMLSelectElement).value),
);
const savedTheme = localStorage.getItem("apdTheme") || "auto";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

// --- Filters ---
function buildFilters() {
  let fq = [];

  const modalidad = [
    ...(document.getElementById("modalidad") as HTMLSelectElement)
      .selectedOptions,
  ].map((o) => `"${o.textContent}"`);

  if (modalidad.length) {
    let q = `descnivelmodalidad:(${modalidad.join(" OR ")})`;
    if ((document.getElementById("modalidadNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const distrito = [
    ...(document.getElementById("distrito") as HTMLSelectElement)
      .selectedOptions,
  ].map((o) => `"${o.textContent}"`);
  if (distrito.length) {
    let q = `descdistrito:(${distrito.join(" OR ")})`;
    if ((document.getElementById("distritoNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const cargo = [
    ...(document.getElementById("cargo") as HTMLSelectElement).selectedOptions,
  ].map((o) => `"${o.textContent}"`);
  if (cargo.length) {
    let q = `cargo:(${cargo.join(" OR ")})`;
    if ((document.getElementById("cargoNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const estado = [...estadoSelect.selectedOptions].map((o) => `"${o.value}"`);
  if (estado.length) {
    let q = `estado:(${estado.join(" OR ")})`;
    if (estadoNotCheckbox.checked) q = "-" + q;
    fq.push(q);
  }

  const escuela = (document.getElementById("escuela") as HTMLInputElement)
    .value;
  if (escuela) fq.push(`escuela:${escuela}`);

  const ige = (document.getElementById("ige") as HTMLInputElement).value;
  if (ige) fq.push(`ige:${ige}`);

  return fq;
}

function buildURL() {
  const fq = buildFilters();
  let url =
    endpoint + `?q=*:*&rows=${rows}&start=${start}&sort=finoferta desc&wt=json`;
  fq.forEach((f) => (url += "&fq=" + encodeURIComponent(f)));
  return url;
}

function saveFilters() {
  const data = {
    modalidad: [
      ...(document.getElementById("modalidad") as HTMLSelectElement)
        .selectedOptions,
    ].map((o) => o.value),
    modalidadNot: (document.getElementById("modalidadNot") as HTMLInputElement)
      .checked,

    distrito: [
      ...(document.getElementById("distrito") as HTMLSelectElement)
        .selectedOptions,
    ].map((o) => o.value),
    distritoNot: (document.getElementById("distritoNot") as HTMLInputElement)
      .checked,

    cargo: [
      ...(document.getElementById("cargo") as HTMLSelectElement)
        .selectedOptions,
    ].map((o) => o.value),
    cargoNot: (document.getElementById("cargoNot") as HTMLInputElement).checked,

    estado: [...estadoSelect.selectedOptions].map((o) => o.value),
    estadoNot: estadoNotCheckbox.checked,

    ige: (document.getElementById("ige") as HTMLInputElement).value,
    escuela: (document.getElementById("escuela") as HTMLInputElement).value,
  };
  localStorage.setItem("apdFilters", JSON.stringify(data));
}

function loadFilters() {
  const saved = localStorage.getItem("apdFilters");
  if (!saved) return;

  const data = JSON.parse(saved);

  [
    ...(document.getElementById("modalidad") as HTMLSelectElement).options,
  ].forEach((o) => {
    if (data.modalidad.includes(o.value)) o.selected = true;
  });

  (document.getElementById("modalidadNot") as HTMLInputElement).checked =
    data.modalidadNot;

  [
    ...(document.getElementById("distrito") as HTMLSelectElement).options,
  ].forEach((o) => {
    if (data.distrito.includes(o.value)) o.selected = true;
  });
  (document.getElementById("distritoNot") as HTMLInputElement).checked =
    data.distritoNot;

  [...(document.getElementById("cargo") as HTMLSelectElement).options].forEach(
    (o) => {
      if (data.cargo.includes(o.value)) o.selected = true;
    },
  );

  (document.getElementById("cargoNot") as HTMLInputElement).checked =
    data.cargoNot;
  [...estadoSelect.options].forEach((o) => {
    if (data.estado.includes(o.value)) o.selected = true;
  });
  estadoNotCheckbox.checked = data.estadoNot;
  (document.getElementById("ige") as HTMLInputElement).value = data.ige;
  (document.getElementById("escuela") as HTMLInputElement).value = data.escuela;
}

function getCourseVariant(status: CourseStatus) {
  switch (status) {
    case "Publicada":
      return "success";
    case "Anulada":
      return "warning";
    default:
      return "secondary";
  }
}

async function search() {
  saveFilters();

  const url = buildURL();
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  const decoder = new TextDecoder("iso-8859-1");
  const text = decoder.decode(buffer);

  const data = JSON.parse(text) as Response;

  const docs = data.response.docs;
  const total = data.response.numFound;
  const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  (document.getElementById("count") as HTMLInputElement).innerText =
    `Mostrando ${start + 1} a ${start + docs.length} de ${new Intl.NumberFormat("es-AR").format(total)} resultados`;
  // const tbody = document.getElementById(
  //   "table-results",
  // ) as HTMLTableSectionElement;
  // tbody.innerHTML = "";

  const cardResults = document.querySelector(".card-results") as HTMLDivElement;
  cardResults.innerHTML = "";

  docs.forEach((d) => {
    const courseStatus = getCourseVariant(d.estado);

    // tbody.innerHTML += `
    //     <tr class="${courseStatus}">
    //       <td><span class="badge text-bg-${courseStatus}">${d.estado || ""}</span></td>
    //       <td>${d.cargo || ""}</td>
    //       <td>${d.descdistrito || ""}</td>
    //       <td>${d.escuela || ""}</td>
    //       <td>${d.descnivelmodalidad || ""}</td>
    //       <td>${d.finoferta ? dateFormatter.format(new Date(d.finoferta)) : ""}</td>
    //     </tr>`;
      
    cardResults.innerHTML += `
      <div class="col">
        <div class="card ${courseStatus} border-${courseStatus} h-100">
          <div class="card-header bg-${courseStatus} text-bg-${courseStatus} d-flex justify-content-between">${d.estado || ""} <a class="text-bg-${courseStatus}" href="http://servicios.abc.gov.ar/actos.publicos.digitales/postulantes/?oferta=${d.ige}&detalle=${d.id}&_t=${new Date(d.timestamp).getTime()}" target="_blank">Postulados</a></div>
          <div class="card-body">
            <div class="card-subtitle mb-2 text-muted">${d.escuela || ""}</div>
            <h5 class="card-title">${d.cargo || ""}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${d.descdistrito || ""} | ${d.descnivelmodalidad || ""}</h6>
            <p class="card-text">Cierre de oferta: ${d.finoferta ? dateFormatter.format(new Date(d.finoferta)) : ""}</p>
          </div>
        </div>
      </div>
    `;
  });

  renderPagination(total, rows, start);
  document.getElementById("results")!.style.display = "block";
}

function clearFilter(filter: string) {
  [...(document.getElementById(filter) as HTMLSelectElement).options].forEach(
    (o) => (o.selected = false),
  );
  (document.getElementById(`${filter}Not`) as HTMLInputElement).checked = false;
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML = "<span class=\"badge text-bg-primary\">Todos</span>";
}

function updateActiveFilters(filter: string) {
  const selected = [...(document.getElementById(filter) as HTMLSelectElement).selectedOptions].map(o => `<span class="badge text-bg-primary" title="${o.textContent}">${o.textContent}</span>`);
  let text = "<span class=\"badge text-bg-primary\">Todos</span>";

  if (selected.length > 0) {
    if ((document.getElementById(`${filter}Not`) as HTMLInputElement).checked) {
      text = "<span class=\"badge text-bg-primary\">Todos</span> excepto " + selected.join("");
    } else {
      text = selected.join("");
    }
  }
  document.querySelector<HTMLInputElement>(`#${filter}-filters`)!.innerHTML = text;
}

function updateAllActiveFilters() {
  ["modalidad", "distrito", "cargo", "estado"].forEach(updateActiveFilters);
}

function renderPagination(total: number, rows: number, start: number) {
  const container = document.getElementById("pagination")!
  container.innerHTML = ""

  const totalPages = Math.ceil(total / rows)
  const currentPage = Math.floor(start / rows) + 1

  function createItem(page: number, label?: string, disabled = false, active = false) {

    const li = document.createElement("li")
    li.className = "page-item"

    if (disabled) li.classList.add("disabled")
    if (active) li.classList.add("active")

    const a = document.createElement("a")
    a.className = "page-link"
    a.href = "#"
    a.textContent = label ?? page.toString()

    a.onclick = (e) => {
      e.preventDefault()
      goToPage(page)
    }

    li.appendChild(a)
    container.appendChild(li)
  }

  function createDots() {
    const li = document.createElement("li")
    li.className = "page-item disabled"
    li.innerHTML = `<span class="page-link">...</span>`
    container.appendChild(li)
  }

  createItem(currentPage - 1, "«", currentPage === 1)

  const window = 2
  let startPage = Math.max(1, currentPage - window)
  let endPage = Math.min(totalPages, currentPage + window)

  if (startPage > 1) {
    createItem(1)

    if (startPage > 2) createDots()
  }

  for (let p = startPage; p <= endPage; p++) {
    createItem(p, undefined, false, p === currentPage)
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) createDots()

    createItem(totalPages)
  }

  createItem(currentPage + 1, "»", currentPage === totalPages)
}

function goToPage(page: number) {
  start = (page - 1) * rows;
  search();
}

function createFilters(el: HTMLElement, values: string[]) {
  values.forEach((v, i) => {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = v;
    el.appendChild(option);
  });
}

function main() {
  createFilters(modalidadSelect, MODALIDADES);
  createFilters(estadoSelect, ESTADOS);
  createFilters(distritoSelect, DISTRITOS);
  createFilters(cargoSelect, CARGOS);
  loadFilters();

  cargoSelect.addEventListener("change", () => updateActiveFilters("cargo"));
  cargoNotCheckbox.addEventListener("change", () => updateActiveFilters("cargo"));
  distritoSelect.addEventListener("change", () => updateActiveFilters("distrito"));
  distritoNotCheckbox.addEventListener("change", () => updateActiveFilters("distrito"));
  modalidadSelect.addEventListener("change", () => updateActiveFilters("modalidad"));
  modalidadNotCheckbox.addEventListener("change", () => updateActiveFilters("modalidad"));
  estadoSelect.addEventListener("change", () => updateActiveFilters("estado"));
  estadoNotCheckbox.addEventListener("change", () => updateActiveFilters("estado"));

  updateAllActiveFilters();

  document.getElementById("reset-form")?.addEventListener("click", () => {
    (document.getElementById("filters") as HTMLFormElement).reset();
    updateAllActiveFilters();
  });
  document.getElementById("search")?.addEventListener("click", () => {
    start = 0;
    search();
  });
  document
    .querySelectorAll(".clear-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearFilter((e.target as HTMLButtonElement).value),
      ),
    );
}

document.addEventListener("DOMContentLoaded", () => main());

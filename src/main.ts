import "./style.css";
import type { Response } from "./types";

const endpoint =
  "https://servicios3.abc.gob.ar/valoracion.docente/api/apd.oferta.encabezado/select";
let start = 0;
const rows = 20;

// --- Theme ---
const themeSelect = document.getElementById("theme") as HTMLSelectElement;
function applyTheme(value: string) {
  if (value === "auto") {
    document.documentElement.setAttribute(
      "data-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  } else {
    document.documentElement.setAttribute("data-theme", value);
  }
  localStorage.setItem("apdTheme", value);
}
themeSelect.addEventListener("change", (e) => applyTheme((e.target as HTMLSelectElement).value));
const savedTheme = localStorage.getItem("apdTheme") || "auto";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

// --- Filters ---
function buildFilters() {
  let fq = [];

  const modalidad = [
    ...(document.getElementById("modalidad") as HTMLSelectElement).selectedOptions,
  ].map((o) => `"${o.value}"`);
  if (modalidad.length) {
    let q = `descnivelmodalidad:(${modalidad.join(" OR ")})`;
    if ((document.getElementById("modalidadNot") as HTMLInputElement).checked) q = "-" + q;
    fq.push(q);
  }
  const distrito = (document.getElementById("distrito") as HTMLInputElement).value;
  if (distrito) fq.push(`descdistrito:"${distrito}"`);

  const cargo = [...(document.getElementById("cargo") as HTMLSelectElement).selectedOptions].map(
    (o) => `"${o.value}"`,
  );
  if (cargo.length) {
    let q = `cargo:(${cargo.join(" OR ")})`;
    if ((document.getElementById("cargoNot") as HTMLInputElement).checked) q = "-" + q;
    fq.push(q);
  }

  const estado = (document.getElementById("estado") as HTMLInputElement).value;
  if (estado) fq.push(`estado:${estado}`);
  const escuela = (document.getElementById("escuela") as HTMLInputElement).value;
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
    modalidad: [...(document.getElementById("modalidad") as HTMLSelectElement).selectedOptions].map(
      (o) => o.value,
    ),
    modalidadNot: (document.getElementById("modalidadNot") as HTMLInputElement).checked,
    distrito: (document.getElementById("distrito") as HTMLInputElement).value,
    cargo: [...(document.getElementById("cargo") as HTMLSelectElement).selectedOptions].map(
      (o) => o.value,
    ),
    cargoNot: (document.getElementById("cargoNot") as HTMLInputElement).checked,
    estado: (document.getElementById("estado") as HTMLInputElement).value,
    ige: (document.getElementById("ige") as HTMLInputElement).value,
    escuela: (document.getElementById("escuela") as HTMLInputElement).value,
  };
  localStorage.setItem("apdFilters", JSON.stringify(data));
}

function loadFilters() {
  const saved = localStorage.getItem("apdFilters");
  if (!saved) return;
  const data = JSON.parse(saved);
  [...(document.getElementById("modalidad") as HTMLSelectElement).options].forEach((o) => {
    if (data.modalidad.includes(o.value)) o.selected = true;
  });
  (document.getElementById("modalidadNot") as HTMLInputElement).checked = data.modalidadNot;
  (document.getElementById("distrito") as HTMLInputElement).value = data.distrito;
  [...(document.getElementById("cargo") as HTMLSelectElement).options].forEach((o) => {
    if (data.cargo.includes(o.value)) o.selected = true;
  });
  (document.getElementById("cargoNot") as HTMLInputElement).checked = data.cargoNot;
  (document.getElementById("estado") as HTMLInputElement).value = data.estado;
  (document.getElementById("ige") as HTMLInputElement).value = data.ige;
  (document.getElementById("escuela") as HTMLInputElement).value = data.escuela;
}

function search() {
  saveFilters();
  const url = buildURL();
  fetch(url)
    .then((r) => r.json())
    .then((data: Response) => {
      const docs = data.response.docs;
      const total = data.response.numFound;
      (document.getElementById("count") as HTMLInputElement).innerText = `Resultados: ${total}`;
      const tbody = document.getElementById("results") as HTMLTableSectionElement;
      tbody.innerHTML = "";
      docs.forEach((d) => {
        tbody.innerHTML += `
        <tr class="${d.estado.toLowerCase().replace(/\s/g, "-")}">
          <td>${d.descdistrito || ""}</td>
          <td>${d.escuela || ""}</td>
          <td>${d.cargo || ""}</td>
          <td>${d.estado || ""}</td>
          <td>${d.descnivelmodalidad || ""}</td>
          <td>${d.finoferta || ""}</td>
        </tr>`;
      });
    });
}

function next() {
  start += rows;
  search();
}
function prev() {
  start = Math.max(0, start - rows);
  search();
}

function main() {
  loadFilters();

  document.getElementById("search")?.addEventListener("click", () => {
    start = 0;
    search();
  });
  document.getElementById("next")?.addEventListener("click", next);
  document.getElementById("prev")?.addEventListener("click", prev);
}

document.addEventListener("DOMContentLoaded", () => main());
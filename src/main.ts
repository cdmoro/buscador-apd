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
  ].map((o) => `"${o.value}"`);

  if (modalidad.length) {
    let q = `descnivelmodalidad:(${modalidad.join(" OR ")})`;
    if ((document.getElementById("modalidadNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const distrito = [
    ...(document.getElementById("distrito") as HTMLSelectElement)
      .selectedOptions,
  ].map((o) => `"${o.value}"`);
  if (distrito.length) {
    let q = `descdistrito:(${distrito.join(" OR ")})`;
    if ((document.getElementById("distritoNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const cargo = [
    ...(document.getElementById("cargo") as HTMLSelectElement).selectedOptions,
  ].map((o) => `"${o.value}"`);
  if (cargo.length) {
    let q = `cargo:(${cargo.join(" OR ")})`;
    if ((document.getElementById("cargoNot") as HTMLInputElement).checked)
      q = "-" + q;
    fq.push(q);
  }

  const estado = [
    ...(document.getElementById("estado") as HTMLSelectElement).selectedOptions,
  ].map((o) => `"${o.value}"`);
  if (estado.length) {
    let q = `estado:(${estado.join(" OR ")})`;
    if ((document.getElementById("estadoNot") as HTMLInputElement).checked)
      q = "-" + q;
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

    estado: [
      ...(document.getElementById("estado") as HTMLSelectElement)
        .selectedOptions,
    ].map((o) => o.value),
    estadoNot: (document.getElementById("estadoNot") as HTMLInputElement)
      .checked,

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
  [...(document.getElementById("estado") as HTMLSelectElement).options].forEach(
    (o) => {
      if (data.estado.includes(o.value)) o.selected = true;
    },
  );
  (document.getElementById("estadoNot") as HTMLInputElement).checked =
    data.estadoNot;
  (document.getElementById("ige") as HTMLInputElement).value = data.ige;
  (document.getElementById("escuela") as HTMLInputElement).value = data.escuela;
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

  (document.getElementById("count") as HTMLInputElement).innerText =
    `Mostrando ${start + 1} a ${start + docs.length} de ${total}`;
  const tbody = document.getElementById(
    "table-results",
  ) as HTMLTableSectionElement;
  tbody.innerHTML = "";
  docs.forEach((d) => {
    tbody.innerHTML += `
        <tr class="${d.estado.toLowerCase().replace(/\s/g, "-")}">
          <td>${d.cargo || ""}</td>
          <td>${d.descdistrito || ""}</td>
          <td>${d.escuela || ""}</td>
          <td>${d.estado || ""}</td>
          <td>${d.descnivelmodalidad || ""}</td>
          <td>${d.finoferta || ""}</td>
        </tr>`;
  });

  document.getElementById("results")!.style.display = "block";
}

function next() {
  start += rows;
  search();
}
function prev() {
  start = Math.max(0, start - rows);
  search();
}

function clearFilter(filter: string) {
    [...(document.getElementById(filter) as HTMLSelectElement).options].forEach(
      (o) => (o.selected = false),
    );
    (document.getElementById(`${filter}Not`) as HTMLInputElement).checked =
      false;
}

function main() {
  loadFilters();

  document.getElementById("search")?.addEventListener("click", () => {
    start = 0;
    search();
  });
  document.getElementById("next")?.addEventListener("click", next);
  document.getElementById("prev")?.addEventListener("click", prev);
  document
    .querySelectorAll(".clear-filter")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        clearFilter((e.target as HTMLButtonElement).value),
      ),
    );
}

document.addEventListener("DOMContentLoaded", () => main());

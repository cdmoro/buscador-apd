import { SCHOOL_SERVICE_URL } from "./contstans";
import { showToast } from "./toastService";
import type { School } from "./types";
import Modal from "bootstrap/js/dist/modal";

export async function handleSchoolClick(modal: HTMLElement, event: Event) {
  const trigger = (event as MouseEvent).relatedTarget as HTMLElement;
  const schoolId = trigger.getAttribute("data-bs-school")!;
  const modalTitle = modal.querySelector(".modal-title")!;
  modalTitle.textContent = `Escuela ${schoolId}`;
  const modalBody = modal.querySelector(".modal-body")!;
  modalBody.innerHTML = `<div class="d-flex justify-content-center mt-3 mb-3 w-100">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>`;
  if (!schoolId) return;

  try {
    const res = await fetch(
      `${SCHOOL_SERVICE_URL}?q=*%3A*&fq=CLAVEESTAB%3A${schoolId}&wt=json`,
    );
    const data = await res.json();

    if (data.response.numFound === 0) {
      throw new Error(`No se encontraron datos para la escuela ${schoolId}.`);
    }

    const details = data.response.docs[0] as School;

    modalBody.innerHTML = `
    <h6>${details.RAMA} ${details.CLAVEESTAB.slice(-4)}</h6>
    <h5 class="mb-4 text-info">${details.NOMBRE}</h5>
    <div><strong>Calle:</strong> ${details.CALLE} — <strong>Número:</strong> ${details.NRODIRECCION}</div>
    <div><strong>Localidad:</strong> ${details.DESCRLOCALIDAD}</div>
    <div><strong>Distrito:</strong> ${details.DESC_DISTRITO}</div>
    <div><a class="link-info" href="https://maps.google.com/?q=${details.LATITUD},${details.LONGITUD}" target="_blank">Ver en Google Maps</a></div>
    <hr>
    <div><strong>Rama:</strong> ${details.RAMA}</div>
    <div><strong>Nivel:</strong> ${details.NIVEL}</div>
    <div><strong>Modalidad:</strong> ${details.MODALIDAD}</div>
    <div><strong>Jornada:</strong> ${details.JORNADA}</div>
    <div><strong>CUE:</strong> ${details.CUE}</div>
    `;
  } catch (error) {
    Modal.getOrCreateInstance(modal).hide();
    showToast(
      error instanceof Error ? error.message : "Error al cargar los detalles de la institución educativa.",
      { type: "warning" },
    );
  }
}

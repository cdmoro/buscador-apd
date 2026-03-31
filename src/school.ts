import { SCHOOL_SERVICE_URL } from "./contstans";
import { showToast } from "./toastService";
import type { School, SchoolResponse } from "./types";
import Modal from "bootstrap/js/dist/modal";

export async function getSchoolById(escuela: string): Promise<School> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(SCHOOL_SERVICE_URL);
      url.searchParams.set("q", `*:*`);
      url.searchParams.append("fq", `CLAVEESTAB:${escuela}`);
      url.searchParams.set("wt", "json");
      url.searchParams.set("rows", "1");
      
      const res = await fetch(url.toString());
      const data = await res.json() as SchoolResponse;

      if (data.response.numFound === 0) {
        reject(new Error(`No se encontraron datos para la escuela ${escuela}.`));
      }

      resolve(data.response.docs[0]);
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error("Error al cargar los detalles de la escuela."),
      );
    }
  });
}

export async function handleSchoolClick(modal: HTMLElement, event: Event) {
  const trigger = (event as MouseEvent).relatedTarget as HTMLElement;
  const escuela = trigger.getAttribute("data-bs-escuela")!;
  const id = trigger.getAttribute("data-bs-id");
  const ige = trigger.getAttribute("data-bs-ige");
  const cargo = trigger.getAttribute("data-bs-cargo");
  const estado = trigger.getAttribute("data-bs-estado");
  const modalTitle = modal.querySelector(".modal-title")!;
  modalTitle.innerHTML = 'Cargando detalles de la escuela...';
  const modalBody = modal.querySelector(".modal-body")!;
  modalBody.innerHTML = `<div class="d-flex justify-content-center mt-3 mb-3 w-100">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Cargando detalles de la escuela...</span>
      </div>
    </div>`;
  const modalFooter = modal.querySelector(".modal-footer")!;
  modalFooter.innerHTML = `
    <button
      type="button"
      class="btn btn-secondary"
      ${
        id && ige && cargo && estado
          ? `
        data-bs-toggle="modal"
        data-bs-target="#postulacion-modal"
        data-bs-id="${id}"
        data-bs-ige="${ige}"
        data-bs-cargo="${cargo}"
        data-bs-estado="${estado}"
        data-bs-escuela="${escuela}">
        Volver
      `
          : `data-bs-dismiss="modal">
          Cerrar`
      }
    </button>`;

  if (!escuela) return;

  try {
    const details = await getSchoolById(escuela);

    modalTitle.innerHTML = `
      <h6>${details.RAMA} ${details.CLAVEESTAB.slice(-4)}</h6>
      <h5 class="mb-0 text-info">${details.NOMBRE}</h5>`;

    modalBody.innerHTML = `
      <div class="d-flex column-gap-4 flex-wrap">
        <div><strong>Calle:</strong> ${details.CALLE}</div>
        <div><strong>Número:</strong> ${details.NRODIRECCION?.trim() !== "" ? details.NRODIRECCION : "N/A"}</div>
      </div>
      <div><strong>Localidad:</strong> ${details.DESCRLOCALIDAD}</div>
      <div><strong>Distrito:</strong> ${details.DESC_DISTRITO}</div>
      ${
        details.LATITUD && details.LONGITUD
          ? `
          <div class="mt-2 card overflow-hidden"><iframe width="100%" height="200" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=${details.LATITUD},${details.LONGITUD}&hl=es;z=14&output=embed" allowfullscreen></iframe></div>
          <div class="text-end"><a class="link-info" href="https://maps.google.com/?q=${details.LATITUD},${details.LONGITUD}" target="_blank"><small>Abrir en Google Maps</small></a></div>`
          : ""
      }
      <hr>
      <div><strong>Rama:</strong> ${details.RAMA}</div>
      <div><strong>Nivel:</strong> ${details.NIVEL}</div>
      <div><strong>Modalidad:</strong> ${details.MODALIDAD}</div>
      <div><strong>Jornada:</strong> ${details.JORNADA}</div>
      <div><strong>CUE:</strong> ${details.CUE}</div>
    `;
  } catch (error) {
    Modal.getOrCreateInstance(modal).hide();

    if (id && ige && cargo && estado) {
      const postulacionModal = document.getElementById(
        "postulacion-modal",
      ) as HTMLElement;
      const modalInstance = Modal.getOrCreateInstance(postulacionModal);
      modalInstance.show(trigger);
    }

    showToast(
      error instanceof Error
        ? error.message
        : "Error al cargar los detalles de la escuela.",
      { type: "warning" },
    );
  }
}

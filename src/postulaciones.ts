import { Modal } from "bootstrap";
import { showToast } from "./toastService";
import type { Response, Postulacion, CourseStatus } from "./types";
import { POSTULANTES_SERVICE_URL } from "./contstans";
import { cuitFormatter, dateTimeFormatter } from "./utils";

export async function handlePostulacionClick(modal: HTMLElement, event: Event) {
  const trigger = (event as MouseEvent).relatedTarget as HTMLElement;
  const ige = trigger.getAttribute("data-bs-ige")!;
  const id = trigger.getAttribute("data-bs-id")!;
  const estado = trigger.getAttribute("data-bs-estado")! as CourseStatus;
  const escuela = trigger.getAttribute("data-bs-escuela")!;
  const cargo = trigger.getAttribute("data-bs-cargo")!;

  const modalTitle = modal.querySelector(".modal-title")!;
  modalTitle.innerHTML = `<small class="text-muted">Postulaciones para</small><br><span class="text-info">${cargo}</span>`;
  const modalBody = modal.querySelector(".modal-body")!;
  modalBody.innerHTML = `<div class="d-flex justify-content-center mt-3 mb-3 w-100">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>`;

  if (!ige || !id) return;

  try {
    const url = new URL(POSTULANTES_SERVICE_URL);
    url.searchParams.set("q", `idoferta:${ige} OR iddetalle:${id}`);
    url.searchParams.set("rows", "20");
    url.searchParams.set(
      "sort",
      "designado desc, estadopostulacion asc, orden asc, puntaje desc",
    );
    url.searchParams.set("wt", "json");
    const res = await fetch(url.toString());
    const data = (await res.json()) as Response<Postulacion>;

    modalBody.innerHTML = `
        <div><strong>IGE:</strong> ${ige}</div>
        <div><strong>Escuela:</strong> <a href="#" class="link-body-emphasis" data-bs-toggle="modal" data-bs-target="#school-modal" data-bs-school="${escuela}" data-bs-id="${id}" data-bs-ige="${ige}" data-bs-estado="${estado}" data-bs-cargo="${cargo}">${escuela}</a></div>
        <div><strong>Postulantes:</strong> ${data.response.docs.length}</div>
        <div><a href="http://servicios.abc.gov.ar/actos.publicos.digitales/postulantes/?oferta=${ige}&detalle=${id}" target="_blank">Ver listado en el sitio oficial</a></div>
        <div class="mt-2 row row-cols-1 row-cols-md-2 g-3">
            ${
              data.response.docs.length === 0
                ? `<div class="col w-100"><div class="card"><div class="card-body text-center">No se encontraron postulantes para esta oferta.</div></div></div>`
                : data.response.docs
                    .map(
                      (p) => {
                        const isDesignado = p.designado === "S";
                        const borderClass = isDesignado ? "border-warning" : "";
                        const icon = isDesignado ? "star" : "star-empty";
                        const iconClass = isDesignado ? "text-warning" : "text-muted";

                        return `
                        <div class="col">
                            <div class="card h-100 ${borderClass}">
                                <div class="card-header d-flex gap-2 align-items-center ${borderClass}">
                                  <svg class="icon ${iconClass}" aria-hidden="true">
                                    <use href="/icons.svg#${icon}-icon"></use>
                                  </svg>
                                  ${p.idpostulacion}
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title">${p.nombres}</h5>
                                    <div class="card-subtitle text-muted mb-2">${cuitFormatter(p.cuil)}</div>
                                    <div><strong>Fecha de postulación:</strong> ${dateTimeFormatter.format(new Date(p.postulacionfechacarga))}</div>
                                    ${estado === "DESIGNADA" ? "" : `<div><strong>Estado:</strong> ${p.estadopostulacion}</div>`}
                                    <div><strong>Puntaje:</strong> ${p.puntaje}</div>
                                    <div><strong>Listado de origen:</strong> ${p.listadoorigen}</div>
                                </div>
                            </div>
                        </div>`}
                    )
                    .join("")
            }
        </div>
      `;
  } catch (error) {
    Modal.getOrCreateInstance(modal).hide();
    showToast(
      error instanceof Error
        ? error.message
        : "Error al cargar el listado de postulantes.",
      { type: "warning" },
    );
  }
}

import Modal from "bootstrap/js/dist/modal";
import { showToast } from "./toastService";
import type { ApacheResponse, Postulacion, CourseStatus } from "./types";
import { POSTULANTES_SERVICE_URL } from "./contstans";
import { cuitFormatter, dateFormatter, numberFormatter } from "./utils";

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
    const buffer = await res.arrayBuffer();
  
    const decoder = new TextDecoder("iso-8859-1");
    const text = decoder.decode(buffer);
  
    const data = JSON.parse(text) as ApacheResponse<Postulacion>;

    modalBody.innerHTML = `
        <div><strong>IGE:</strong> ${ige}</div>
        <div><strong>Escuela:</strong> <a href="#" class="link-body-emphasis" data-bs-toggle="modal" data-bs-target="#school-modal" data-bs-escuela="${escuela}" data-bs-id="${id}" data-bs-ige="${ige}" data-bs-estado="${estado}" data-bs-cargo="${cargo}">${escuela}</a></div>
        <div><strong>Postulantes:</strong> ${data.response.numFound}${data.response.numFound > data.response.docs.length ? ` (${data.response.docs.length} mostrados)` : ""}</div>
        <div><a href="http://servicios.abc.gov.ar/actos.publicos.digitales/postulantes/?oferta=${ige}&detalle=${id}" target="_blank">Ver listado en el sitio oficial</a></div>
        <div class="mt-2 row row-cols-1 row-cols-md-2 g-3">
            ${
              data.response.docs.length === 0
                ? `<div class="col w-100"><div class="card"><div class="card-body text-center">No se encontraron postulantes para esta oferta.</div></div></div>`
                : data.response.docs
                    .map(
                      (p) => {
                        const isDesignado = p.designado === "S";
                        let variant;
                        if (isDesignado) {
                          variant = "success";
                        } else if (p.estadopostulacion === "INACTIVA") {
                          variant = "secondary";
                        }
                        const icon = isDesignado ? "star" : "star-empty";
                        const iconClass = isDesignado ? "text-warning" : "text-muted";

                        return `
                        <div class="col">
                            <div class="card h-100 ${variant ? `border-${variant}` : ""} ${p.estadopostulacion === "INACTIVA" ? "text-muted" : ""}">
                                <div class="card-header d-flex gap-2 align-items-center ${variant ? `border-${variant} text-bg-${variant}` : ""}">
                                  <svg class="icon ${iconClass}" aria-hidden="true">
                                    <use href="/icons.svg#${icon}-icon"></use>
                                  </svg>
                                  Postulado ${p.idpostulacion}
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title mb-1">${p.nombres.toLocaleUpperCase()}</h5>
                                    <div class="card-subtitle text-muted mb-2">${cuitFormatter(p.cuil)}</div>
                                    <div><strong>Fecha postulación:</strong> ${dateFormatter.format(new Date(p.postulacionfechacarga))}</div>
                                    ${estado === "DESIGNADA" ? "" : `<div><strong>Estado:</strong> ${p.estadopostulacion}</div>`}
                                    <div><strong>Listado:</strong> ${p.listadoorigen}</div>
                                    <div class="d-flex gap-2 flex-nowrap align-items-center"><strong>Puntaje:</strong> ${p.puntaje ? `<span class="badge text-bg-info">${numberFormatter.format(p.puntaje)}</span>` : "—"}</div>
                                    <div><strong>Vuelta:</strong> ${p.vuelta || "—"}</div>
                                    <div><strong>Prioridad:</strong> ${p.prioridad}</div>
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

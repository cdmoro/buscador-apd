import type { CourseStatus } from "./types";

export function getCourseVariant(status: CourseStatus) {
  switch (status.toLowerCase()) {
    case "publicada":
      return "success";
    case "anulada":
      return "warning";
    case "renunciada":
      return "danger";
    default:
      return "secondary";
  }
}

export function cuitFormatter(cuit: string) {
  if (cuit.length !== 11) return cuit;

  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

export const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
});
export const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
export const numberFormatter = new Intl.NumberFormat("es-AR");

import type { CourseStatus } from "./types";

export function getCourseVariant(status: CourseStatus) {
  switch (status.toLowerCase()) {
    case "publicada":
      return "success";
    case "anulada":
      return "warning";
    case "renunciada":
      return "danger";
    case "finalizada":
      return "body";
    default:
      return "secondary";
  }
}

export function cuitFormatter(cuit: string) {
  if (cuit.length !== 11) return cuit;

  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

export function escapeSolr(term: string): string {
  return term.replace(/([+\-!(){}\[\]^"~*?:\\/])/g, "\\$1");
}

export const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
});
export const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export const numberFormatter = new Intl.NumberFormat("es-AR");

export type CourseStatus = "Anulada" | "Cerrada" | "Desierta" | "Designada" | "Finalizada" | "Publicada" | "Renunciada";

export type Course = {
  estado: CourseStatus;
  tipooferta: string;
  jornada: string;
  ige: number;
  miercoles: string;
  martes: string;
  acargodireccion: string;
  cuilautor: string;
  supl_hasta: string;
  turno: string;
  idoferta: number;
  sabado: string;
  id: string;
  iddetalle: number;
  cargo: string;
  tomaposesion: string;
  supl_revista: string;
  postulacion_idganador: number;
  domiciliodesempeno: string;
  reemp_apeynom: string;
  numdistrito: number;
  areaincumbencia: string;
  finoferta: string;
  observaciones: string;
  cupof: number;
  tipooferta_id: number;
  supl_desde: string;
  reemp_cuil: string;
  escuela: string;
  iniciooferta: string;
  hsmodulos: number;
  cursodivision: string;
  idsuna: number;
  descnivelmodalidad: string;
  lunes: string;
  infectocontagiosa: boolean;
  reemp_motivo: string;
  descdistrito: string;
  jueves: string;
  nivelmodalidad: string;
  viernes: string;
  descripcionarea: string;
  descripcioncargo: string;
  ult_movimiento: string;
  _version_: number;
  timestamp: string;
};

export type Response = {
  responseHeader: {
    status: number;
    QTime: number;
    params: {
      q: string;
      wt: string;
      fq?: string[];
      start: number;
      rows: number;
    };
  };
  response: {
    numFound: number;
    start: number;
    docs: Course[];
  };
};

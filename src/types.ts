export type CourseStatus = "Anulada" | "Cerrada" | "Desierta" | "DESIGNADA" | "Finalizada" | "Publicada" | "RENUNCIADA";

export type BaseCourse = {
  _version_: number;
  acargodireccion: string;
  areaincumbencia: string;
  cargo: string;
  cuilautor: string;
  cupof: number;
  cursodivision: string;
  descdistrito: string;
  descnivelmodalidad: string;
  descripcionarea: string;
  descripcioncargo: string;
  domiciliodesempeno: string;
  escuela: string;
  estado: Exclude<CourseStatus, "DESIGNADA">;
  finoferta: string;
  hsmodulos: number;
  id: string;
  iddetalle: number;
  idoferta: number;
  idsuna: number;
  ige: number;
  infectocontagiosa: boolean;
  iniciooferta: string;
  jornada: string;
  jueves: string;
  lunes: string;
  martes: string;
  miercoles: string;
  nivelmodalidad: string;
  numdistrito: number;
  observaciones: string;
  postulacion_idganador: number;
  reemp_apeynom: string;
  reemp_cuil: string;
  reemp_motivo: string;
  sabado: string;
  supl_desde: string;
  supl_hasta: string;
  supl_revista: string;
  timestamp: string;
  tipooferta: string;
  tipooferta_id: number;
  tomaposesion: string;
  turno: string;
  ult_movimiento: string;
  viernes: string;
};

export type DesignadaCourse = Omit<BaseCourse, "estado"> & {
  cuilganador: string;
  estado: "DESIGNADA";
  listadoorigenganador: string;
  nombreganador: string;
  puntajeganador: string;
  vuelta: number;
}

export type Course = BaseCourse | DesignadaCourse;

export type Response = {
  error: {
    code: number;
    metadata: string[];
    msg: string;
  };
  response: {
    docs: Course[];
    numFound: number;
    start: number;
  };
  responseHeader: {
    params: {
      fq?: string[];
      q: string;
      rows: number;
      start: number;
      wt: string;
    };
    QTime: number;
    status: number;
  };
};

export type FacetResponse = Response & {
  facet_counts: {
    facet_fields: {
      cargo:  Record<string, number>,
      descdistrito: Record<string, number>,
      descnivelmodalidad: Record<string, number>,
      estado: Record<string, number>,
    }
  }
}

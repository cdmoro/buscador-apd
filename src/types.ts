export type CourseStatus = "Anulada" | "Cerrada" | "Desierta" | "DESIGNADA" | "Finalizada" | "Publicada" | "RENUNCIADA";

export type BaseCourse = {
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
  tomaposesion: string;
};

export type DesignadaCourse = BaseCourse & {
  estado: "DESIGNADA";
  nombreganador: string;
  puntajeganador: string;
  vuelta: number;
  listadoorigenganador: string;
  cuilganador: string;
}

export type Course = BaseCourse & DesignadaCourse;

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
  error: {
    metadata: string[];
    msg: string;
    code: number;
  }
};

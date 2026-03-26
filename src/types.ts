export type State = {
  start: number;
  rows: number;
  sort: string;
  isSingleCourse: boolean;
  isPreview: boolean;
};

export type Listener = (state: State) => void;

export interface FilterFormElements extends HTMLFormControlsCollection {
  modalidad: HTMLSelectElement;
  modalidadNot: HTMLInputElement;
  distrito: HTMLSelectElement;
  distritoNot: HTMLInputElement;
  cargo: HTMLSelectElement;
  cargoNot: HTMLInputElement;
  estado: HTMLSelectElement;
  estadoNot: HTMLInputElement;
  ige: HTMLInputElement;
  escuela: HTMLInputElement;
  palabraClave: HTMLInputElement;
  id: HTMLInputElement;
  cierreMode: HTMLSelectElement;
  cierreDate: HTMLInputElement;
  cierreTime: HTMLInputElement;
  searchBtn: HTMLButtonElement;
  resetForm: HTMLButtonElement;
}

export interface FilterForm extends HTMLFormElement {
  elements: FilterFormElements;
}

export type CourseStatus =
  | "Anulada"
  | "Cerrada"
  | "Desierta"
  | "DESIGNADA"
  | "Finalizada"
  | "Publicada"
  | "RENUNCIADA";

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
};

export type Course = BaseCourse | DesignadaCourse;

export type Response<T> = {
  error: {
    code: number;
    metadata: string[];
    msg: string;
  };
  response: {
    docs: T[];
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

export type FacetResponse = Response<Course> & {
  facet_counts: {
    facet_fields: {
      cargo: Record<string, number>;
      descdistrito: Record<string, number>;
      descnivelmodalidad: Record<string, number>;
      estado: Record<string, number>;
    };
  };
};

export type APDSearchParams = {
  q: string;
  rows: number;
  start: number;
  sort: string;
};

export type SchoolResponse = Response<School>;

export type School = {
  IDSER: string;
  IDCICLOLECTIVO: string;
  RAMA: string;
  RAMA_FACET: string;
  NOMBRE_TITULO: string;
  CALLE: string;
  NIVEL: string;
  NIVEL_FACET: string;
  REGION: string;
  CUE: string;
  DESC_DISTRITO: string;
  DESC_DISTRITO_FACET: string;
  DESCRLOCALIDAD: string;
  TURNO_INICIO: string;
  id: string;
  LONGITUD: string;
  IDOFERTAEDUCATIVA: string;
  MODALIDAD: string;
  MODALIDAD_FACET: string;
  NOMBRE: string;
  NOMBRE_FACET: string;
  NRODIRECCION: string;
  JORNADA: string;
  JORNADA_FACET: string;
  CLAVEESTAB: string;
  CLAVEESTAB_FACET: string;
  LATITUD: string;
  IDPROPUESTAEDUCATIVA: string;
  _version_: number;
  timestamp: string;
};

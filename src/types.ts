export type State = {
  start: number;
  rows: number;
  sort: string;
  isSingleCourse: boolean;
  isPreview: boolean;
  loading: boolean;
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

export type ApacheResponse<T> = {
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

export type FacetResponse = ApacheResponse<Course> & {
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

export type SchoolResponse = ApacheResponse<School>;

export type School = {
  _version_: number;
  CALLE: string;
  CLAVEESTAB_FACET: string;
  CLAVEESTAB: string;
  CUE: string;
  DESC_DISTRITO_FACET: string;
  DESC_DISTRITO: string;
  DESCRLOCALIDAD: string;
  id: string;
  IDCICLOLECTIVO: string;
  IDOFERTAEDUCATIVA: string;
  IDPROPUESTAEDUCATIVA: string;
  IDSER: string;
  JORNADA_FACET: string;
  JORNADA: string;
  LATITUD?: string;
  LONGITUD?: string;
  MODALIDAD_FACET: string;
  MODALIDAD: string;
  NIVEL_FACET: string;
  NIVEL: string;
  NOMBRE_FACET: string;
  NOMBRE_TITULO: string;
  NOMBRE: string;
  NRODIRECCION: string;
  RAMA_FACET: string;
  RAMA: string;
  REGION: string;
  timestamp: string;
  TURNO_INICIO: string;
};

export type PostulacionResponse = ApacheResponse<Postulacion>;

export type Postulacion = {
  _version_: number;
  apellido: string;
  areaincumbencia: string;
  art139140: string;
  cambiofunciones121: string;
  cargo: string;
  certificadocarrera1: string;
  certificadocarrera2: string;
  cuil: string;
  cuilautor: string;
  cupof: number;
  cursodivision: string;
  ddjjsalud: string;
  descdistrito: string;
  descripcionarea: string;
  descripcioncargo: string;
  descripcionnivel: string;
  designado: string;
  distritoresidencia: number;
  domicilio: string;
  domiciliodesempeno: string;
  email: string;
  escuela: string;
  esforte: string;
  estado: string;
  estadopostulacion: string;
  excedido: string;
  fechanacimiento: string;
  finoferta: string;
  hojaruta: string;
  hsmodulos: number;
  id: string;
  iddetalle: number;
  idoferta: number;
  idpostulacion: number;
  idsuna: number;
  ige: number;
  infectocontagiosa: boolean;
  iniciooferta: string;
  jueves: string;
  licenciamaternidad: string;
  listadoorigen: string;
  localidad: string;
  lunes: string;
  martes: string;
  miercoles: string;
  nivelmodalidad: string;
  nombres: string;
  numdistrito: number;
  orden: string;
  pdistrito: string;
  perteneceatr: string;
  postulacionfechacarga: string;
  prioridad: number;
  pun_res: number;
  pun_titu: number;
  puntaje: number;
  recalificadoart: string;
  reemp_apeynom: string;
  reemp_cuil: string;
  reemp_motivo: string;
  reside: number;
  sabado: string;
  snombres: string;
  supl_desde: string;
  supl_hasta: string;
  supl_revista: string;
  telefono: string;
  TieneCargoTitular: string;
  tienehojaruta: string;
  timestamp: string;
  tipooferta_id: number;
  tipooferta: string;
  tomaposesion: string;
  turno: string;
  ult_movimiento: string;
  viernes: string;
  vuelta?: number;
};

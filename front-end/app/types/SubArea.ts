import { Area } from "./Area";

export interface SubAreaRequest {
  nomeSubArea: string;
  descricaoSubArea: string;
  idArea: number;
}

export interface SubArea {
  idSubArea: number;
  nomeSubArea: string;
  descricaoSubArea: string;
  area: Area;
}

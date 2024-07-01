import { Audit } from "../../extendables/Audit";

export interface CriterioDto extends Audit {
    id: number
    tipoCriterio: string | null
    dettaglioCriterio: string | null
    descCriterio: string | null
    kpiOrigine: string | null
    isDeletable: boolean

    //  for ui
    kpiOrigineArray: string[] | null
    idDesc: string | null
}
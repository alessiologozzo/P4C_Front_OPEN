import { Audit } from "../../extendables/Audit"

export interface ReportWithoutRelationsDto extends Audit {
    id: number
    tipoOggetto: string | null
    livelloAccessibilita: string | null
    nomeReport: string | null
    descReport: string | null
    pathReport: string | null
    link: string | null
    listaDataset: string | null
}
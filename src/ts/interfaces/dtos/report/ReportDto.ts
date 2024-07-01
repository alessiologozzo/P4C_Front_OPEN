import { Audit } from "../../extendables/Audit";
import { CanaleWithPiattaformaDto } from "../canale/CanaleWithPiattaformaDto";
import { KpiWithoutRelationsDto } from "../kpi/KpiWithoutRelationsDto";

export interface ReportDto extends Audit {
    id: number
    tipoOggetto: string | null
    livelloAccessibilita: string | null
    nomeReport: string | null
    descReport: string | null
    pathReport: string | null
    link: string | null
    listaDataset: string | null
    kpis: KpiWithoutRelationsDto[]
    canali: CanaleWithPiattaformaDto[]

    //for ui
    listaDatasetArray: string[] | null
    piattaformaNames: string[] | null
}
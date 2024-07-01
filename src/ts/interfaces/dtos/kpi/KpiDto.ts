import { Audit } from "../../extendables/Audit";
import { CriterioDto } from "../criterio/CriterioDto";

export interface KpiDto extends Audit {
    id: number
    nomeKpi: string | null
    descKpi: string | null
    categoriaKpi: string | null
    umKpi: string | null
    benchmark: string | null
    criteri: CriterioDto[]
    isDeletable: boolean

}
import { Audit } from "../../extendables/Audit";

export interface KpiWithoutRelationsDto extends Audit {
    id: number
    nomeKpi: string | null
    descKpi: string | null
    categoriaKpi: string | null
    umKpi: string | null
    benchmark: string
}
export interface CreateKpiRequest {
    nomeKpi: string
    descKpi: string | null
    categoriaKpi: string | null
    uMKpi: string | null
    benchmark: string | null
    criterioIds: number[] | null
}
export interface EditCriterioRequest {
    id: number
    tipoCriterio: string | null
    dettaglioCriterio: string
    descCriterio: string
    kpiOrigine: string | null
}
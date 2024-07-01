export interface CreateReportRequest {
    nomeReport: string
    tipoOggetto: string
    livelloAccessibilita: string | null
    descReport: string | null
    pathReport: string | null
    link: string | null
    listaDataset: string | null
    kpiNames: string[] | null
    canaleNames: string[] | null
}
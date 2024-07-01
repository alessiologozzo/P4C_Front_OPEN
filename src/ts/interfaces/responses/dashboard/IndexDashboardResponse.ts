import { EnumDto } from "../../dtos/all/EnumDto";
import { CriterioDto } from "../../dtos/criterio/CriterioDto";
import { KpiWithoutRelationsDto } from "../../dtos/kpi/KpiWithoutRelationsDto";
import { ReportWithoutRelationsDto } from "../../dtos/report/ReportWithoutRelationsDto";

export interface IndexDashboardResponse {
    reports: ReportWithoutRelationsDto[]
    kpis: KpiWithoutRelationsDto[]
    criteri: CriterioDto[]
    enums: EnumDto[]
}
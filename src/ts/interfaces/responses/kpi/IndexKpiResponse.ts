import { EnumDto } from "../../dtos/all/EnumDto";
import { IdNameDto } from "../../dtos/all/IdNameDto";
import { KpiDto } from "../../dtos/kpi/KpiDto";

export interface IndexKpiResponse {
    kpis: KpiDto[]
    criteri: IdNameDto[]
    enums: EnumDto[]
}
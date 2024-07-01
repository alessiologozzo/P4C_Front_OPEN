import { EnumDto } from "../dtos/all/EnumDto";
import { KpiDto } from "../dtos/kpi/KpiDto";

export interface KpiDialogData {
    kpis: KpiDto[]
    kpiToEdit?: KpiDto
    criterioNames: string[]
    enums: EnumDto[]
    mode: 'create' | 'edit'
}
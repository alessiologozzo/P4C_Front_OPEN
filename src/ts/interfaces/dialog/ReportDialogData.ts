import { CanalePiattaformaDto } from "../dtos/all/CanalePiattaformaDto";
import { EnumDto } from "../dtos/all/EnumDto";
import { ReportDto } from "../dtos/report/ReportDto";

export interface ReportDialogData {
    reports: ReportDto[]
    reportToEdit?: ReportDto
    kpiNames: string[]
    canalePiattaformaNames: CanalePiattaformaDto[]
    enums: EnumDto[]
    mode: 'create' | 'edit'
}
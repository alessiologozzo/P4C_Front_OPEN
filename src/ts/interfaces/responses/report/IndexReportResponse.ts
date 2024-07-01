import { CanalePiattaformaDto } from "../../dtos/all/CanalePiattaformaDto";
import { EnumDto } from "../../dtos/all/EnumDto";
import { NameDto } from "../../dtos/all/NameDto";
import { ReportDto } from "../../dtos/report/ReportDto";

export interface IndexReportResponse {
    reports: ReportDto[]
    kpis: NameDto[]
    canali: CanalePiattaformaDto[]
    enums: EnumDto[]
}
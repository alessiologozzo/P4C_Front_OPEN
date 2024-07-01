import { EnumDto } from "../../dtos/all/EnumDto";
import { IdNameDto } from "../../dtos/all/IdNameDto";
import { CriterioDto } from "../../dtos/criterio/CriterioDto";

export interface IndexCriterioResponse {
    criteri: CriterioDto[]
    kpiIdNames: IdNameDto[]
    enum: EnumDto | null
}
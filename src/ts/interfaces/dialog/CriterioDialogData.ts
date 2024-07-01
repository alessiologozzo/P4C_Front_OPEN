import { EnumDto } from "../dtos/all/EnumDto";
import { IdNameDto } from "../dtos/all/IdNameDto";
import { CriterioDto } from "../dtos/criterio/CriterioDto";

export interface CriterioDialogData {
    criteri: CriterioDto[]
    criterioToEdit?: CriterioDto
    kpiIdNames: IdNameDto[]
    enum: EnumDto | null
    mode: 'create' | 'edit'
}
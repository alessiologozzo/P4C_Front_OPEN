import { PiattaformaWithoutRelationsDto } from "../piattaforma/PiattaformaWithoutRelationsDto";

export interface CanaleWithPiattaformaDto {
    id: number
    nomeCanale: string | null
    descCanale: string | null
    piattaforma: PiattaformaWithoutRelationsDto | null
}
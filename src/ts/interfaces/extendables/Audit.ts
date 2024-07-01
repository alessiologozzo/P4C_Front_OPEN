import { DateTime } from "luxon"

export interface Audit {
    utenteInserimento: string | null
    dataInserimento: DateTime | null
    utenteAggiornamento: string | null
    dataAggiornamento: DateTime | null
}
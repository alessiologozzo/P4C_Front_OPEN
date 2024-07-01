import { Observable } from "rxjs";

export interface DialogReturnValue {
    operation: 'create' | 'edit' | 'delete'
    observable: Observable<any>
}
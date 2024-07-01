import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ErrorService {
    hasError: boolean = false
    hasUnauthorizedError: boolean = false

}

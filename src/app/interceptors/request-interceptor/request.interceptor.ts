import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, retry, throwError, timer } from 'rxjs';
import { ErrorService } from '../../services/error-service/error.service';

export const requestInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router)
    const errorService = inject(ErrorService)

    req = req.clone({ withCredentials: true })

    const MAX_RETRY_ATTEMPTS = 3
    const RETRY_DELAY = 200
    return next(req).pipe(
        retry({
            count: MAX_RETRY_ATTEMPTS,
            delay: (error: HttpErrorResponse, retryAttempt: number): Observable<number> => {
                if (req.method != 'GET' || retryAttempt > MAX_RETRY_ATTEMPTS || error.status == 400 || error.status == 401 || error.status == 403 || error.status == 404) {
                    return throwError(() => error);
                }

                return timer(retryAttempt * RETRY_DELAY);
            }
        }),
        catchError((err: any, caught: Observable<HttpEvent<unknown>>) => {
            if(err.status == 401 || err.status == 403) {
                errorService.hasUnauthorizedError = true   
                router.navigateByUrl("unauthorized")             
            } else if(err.status != 400) {
                errorService.hasError = true
                router.navigateByUrl("error")
            }

            return throwError(() => err)
        })
    )
};

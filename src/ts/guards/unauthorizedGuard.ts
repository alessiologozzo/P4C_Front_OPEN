import { inject } from "@angular/core";
import { ErrorService } from "../../app/services/error-service/error.service";
import { Router } from "@angular/router";

export const unauthorizedGuard = () => {
    const errorService = inject(ErrorService)
    const router = inject(Router)

    if(!errorService.hasUnauthorizedError) {
        router.navigateByUrl('not-found')
    }

    return errorService.hasUnauthorizedError;
}
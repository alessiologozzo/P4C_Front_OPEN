import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { requestInterceptor } from './interceptors/request-interceptor/request.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimationsAsync(), provideHttpClient(withFetch(), withInterceptors([requestInterceptor])), provideLuxonDateAdapter(), { provide: MatDialogRef, useValue: {} }, {provide: MAT_DIALOG_DATA, useValue: {}}, {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 4000, horizontalPosition: 'start', verticalPosition: 'bottom' }}, provideCharts(withDefaultRegisterables())]
};

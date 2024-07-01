import { Routes } from '@angular/router';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { MainComponent } from './components/main/main.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { errorGuard } from '../ts/guards/errorGuard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReportComponent } from './components/report/report.component';
import { KpiComponent } from './components/kpi/kpi.component';
import { CriterioComponent } from './components/criterio/criterio.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { unauthorizedGuard } from '../ts/guards/unauthorizedGuard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'main' },
    {
        path: 'main', component: MainComponent, children: [
            { path: '', component: DashboardComponent },
            { path: 'report', component: ReportComponent },
            { path: 'kpi', component: KpiComponent},
            { path: 'criteri', component: CriterioComponent }
        ]
    },
    { path: 'error', component: ErrorPageComponent, canActivate: [errorGuard] },
    { path: 'unauthorized', component: UnauthorizedComponent, canActivate: [unauthorizedGuard] },
    { path: '**', pathMatch: 'full', component: NotFoundComponent }
];

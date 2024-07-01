import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ToolbarComponent, MatSidenavModule, RouterOutlet, LoadingComponent, MatProgressSpinnerModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
}

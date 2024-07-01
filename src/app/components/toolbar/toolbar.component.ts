import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgOptimizedImage } from '@angular/common';
import { DashboardService } from '../../services/dashboard-service/dashboard.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { DateTime } from 'luxon';
import { ThemeService } from '../../services/theme-service/theme.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatTabsModule, RouterLink, MatMenuModule, MatTooltipModule, NgOptimizedImage],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
    constructor(private _dashboardService: DashboardService, public authService: AuthService, public themeService: ThemeService) {
        themeService.theme = localStorage.getItem("theme") as string
    }

    downloadCsv() {
        this._dashboardService.getCsvFile().subscribe({
            next: file => {
                const dateString: string = DateTime.now().toFormat("yyyy-MM-dd")
                const url = window.URL.createObjectURL(file)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', 'Dati_Dizionario_P4C_' + dateString + '.csv')
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }
        })
    }
}

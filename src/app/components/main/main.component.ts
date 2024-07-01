import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [LoadingComponent, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
    constructor(public authService: AuthService) {
        if(!authService.isLoggedIn) {
            authService.login()
        }
    }
}

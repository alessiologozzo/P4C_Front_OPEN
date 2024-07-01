import { Component } from '@angular/core';
import { ErrorService } from '../../services/error-service/error.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {
    constructor(errorService: ErrorService) {
        errorService.hasError = false
    }
}

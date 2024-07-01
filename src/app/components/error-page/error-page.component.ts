import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ErrorService } from '../../services/error-service/error.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [NgOptimizedImage, MatButton, RouterLink],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss'
})
export class ErrorPageComponent {
    constructor(errorService: ErrorService) {
        errorService.hasError = false
    }
}

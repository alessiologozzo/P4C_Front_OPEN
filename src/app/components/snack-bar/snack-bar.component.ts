import { Component, Inject, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';

@Component({
  selector: 'app-snack-bar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.scss'
})
export class SnackBarComponent {
    snackBarRef = inject(MatSnackBarRef);

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: SnackBarData) {
    }
}

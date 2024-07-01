import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MessageDialogData } from '../../../ts/interfaces/dialog/MessageDialogData';

@Component({
  selector: 'app-message-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  templateUrl: './message-dialog.component.html',
  styleUrl: './message-dialog.component.scss'
})
export class MessageDialogComponent {
    constructor(public dialogRef: MatDialogRef<MessageDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: MessageDialogData) { }
}

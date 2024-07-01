import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appContextMenu]',
  standalone: true
})
export class ContextMenuDirective {

    @Output() contextmenuEvent: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

    constructor() { }
  
    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
      event.preventDefault();
      this.contextmenuEvent.emit(event);
    }

}

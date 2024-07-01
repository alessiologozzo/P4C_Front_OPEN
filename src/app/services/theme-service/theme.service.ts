import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    theme: string
    readonly LIGHT = 'light'
    readonly DARK = 'dark'

    constructor() {
        this.theme = localStorage.getItem("theme") as string
    }

    switchTheme() {
        const root = document.documentElement

        if (this.theme == this.LIGHT) {
            this.theme = this.DARK
            root.classList.add(this.DARK)
        } else {
            this.theme = this.LIGHT
            root.classList.remove(this.DARK)
        }
        localStorage.setItem('theme', this.theme)
    }
}

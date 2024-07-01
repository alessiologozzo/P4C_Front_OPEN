import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../ts/constants';
import { AbilitazioneDto } from '../../../ts/interfaces/dtos/abilitazione/AbilitazioneDto';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user!: string
    name!: string
    isAdmin: boolean = false
    isLoggedIn: boolean = false

    constructor(private _httpClient: HttpClient) { }

    login() {
        (this._httpClient.get(BASE_URL + '/abilitazioni/getUser') as Observable<AbilitazioneDto>).subscribe({
            next: abilitazioneDto => {
                this.user = abilitazioneDto.utente
                this.name = abilitazioneDto.nomeUtente
                this.isAdmin = abilitazioneDto.flgAttivo
                this.isLoggedIn = true
            }
        });
    }
}

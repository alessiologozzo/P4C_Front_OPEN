import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL } from '../../../ts/constants';
import { Observable } from 'rxjs';
import { IndexDashboardResponse } from '../../../ts/interfaces/responses/dashboard/IndexDashboardResponse';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly DASHBOARD_URL = BASE_URL + '/dashboard'

    constructor(private _httpClient: HttpClient) { }

    getCsvFile() {
        const headers = new HttpHeaders()
        headers.set('Accept', 'text/csv')

        return this._httpClient.get(this.DASHBOARD_URL + '/getCsvFile', { headers: headers, responseType: 'blob' }) as Observable<Blob>
    }

    index() {
        return this._httpClient.get(this.DASHBOARD_URL + '/index') as Observable<IndexDashboardResponse>
    }
}

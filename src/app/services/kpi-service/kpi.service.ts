import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../ts/constants';
import { KpiDto } from '../../../ts/interfaces/dtos/kpi/KpiDto';
import { IdRequest } from '../../../ts/interfaces/requests/all/IdRequest';
import { CreateKpiRequest } from '../../../ts/interfaces/requests/kpi/CreateKpiRequest';
import { EditKpiRequest } from '../../../ts/interfaces/requests/kpi/EditKpiRequest';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';
import { IndexKpiResponse } from '../../../ts/interfaces/responses/kpi/IndexKpiResponse';

@Injectable({
    providedIn: 'root'
})
export class KpiService {
    private readonly KPI_URL = BASE_URL + '/kpis'

    constructor(private _httpClient: HttpClient) { }

    index(): Observable<IndexKpiResponse> {
        return this._httpClient.get(this.KPI_URL + '/index') as Observable<IndexKpiResponse>
    }

    create(request: CreateKpiRequest) {
        return this._httpClient.post(this.KPI_URL + '/create', request) as Observable<KpiDto>
    }

    edit(request: EditKpiRequest) {
        return this._httpClient.put(this.KPI_URL + '/edit', request) as Observable<KpiDto>
    }

    delete(id: number) {
        const idRequest: IdRequest = { id: id }
        return this._httpClient.delete(this.KPI_URL + '/delete', { body: idRequest }) as Observable<IdResponse>
    }
}

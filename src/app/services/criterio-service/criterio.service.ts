import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../ts/constants';
import { IndexCriterioResponse } from '../../../ts/interfaces/responses/criterio/IndexCriterioResponse';
import { CreateCriterioRequest } from '../../../ts/interfaces/requests/criterio/CreateCriterioRequest';
import { EditCriterioRequest } from '../../../ts/interfaces/requests/criterio/EditCriterioRequest';
import { CriterioDto } from '../../../ts/interfaces/dtos/criterio/CriterioDto';
import { IdRequest } from '../../../ts/interfaces/requests/all/IdRequest';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';

@Injectable({
    providedIn: 'root'
})
export class CriterioService {
    private readonly CRITERIO_URL = BASE_URL + '/criteri'

    constructor(private _httpClient: HttpClient) { }

    index(): Observable<IndexCriterioResponse> {
        return this._httpClient.get(this.CRITERIO_URL + '/index') as Observable<IndexCriterioResponse>
    }

    create(request: CreateCriterioRequest) {
        return this._httpClient.post(this.CRITERIO_URL + '/create', request) as Observable<CriterioDto>
    }

    edit(request: EditCriterioRequest) {
        return this._httpClient.put(this.CRITERIO_URL + '/edit', request) as Observable<CriterioDto>
    }

    delete(id: number) {
        const idRequest: IdRequest = { id: id }
        return this._httpClient.delete(this.CRITERIO_URL + '/delete', { body: idRequest }) as Observable<IdResponse>
    }
}

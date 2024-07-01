import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportDto } from '../../../ts/interfaces/dtos/report/ReportDto';
import { BASE_URL } from '../../../ts/constants';
import { IndexReportResponse } from '../../../ts/interfaces/responses/report/IndexReportResponse';
import { CreateReportRequest } from '../../../ts/interfaces/requests/report/CreateReportRequest';
import { IdRequest } from '../../../ts/interfaces/requests/all/IdRequest';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';
import { EditReportRequest } from '../../../ts/interfaces/requests/report/EditReportRequest';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private readonly REPORT_URL = BASE_URL + '/reports'

    constructor(private _httpClient: HttpClient) { }

    index(): Observable<IndexReportResponse> {
        return this._httpClient.get(this.REPORT_URL + '/index') as Observable<IndexReportResponse>
    }

    create(request: CreateReportRequest) {
        return this._httpClient.post(this.REPORT_URL + '/create', request) as Observable<ReportDto>
    }

    edit(request: EditReportRequest) {
        return this._httpClient.put(this.REPORT_URL + '/edit', request) as Observable<ReportDto>
    }

    delete(id: number) {
        const idRequest: IdRequest = { id: id }
        return this._httpClient.delete(this.REPORT_URL + '/delete', { body: idRequest }) as Observable<IdResponse>
    }
}

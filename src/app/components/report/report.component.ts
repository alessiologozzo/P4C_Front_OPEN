import { Clipboard } from '@angular/cdk/clipboard';
import { AsyncPipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
    MatSnackBar
} from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateTime } from 'luxon';
import { Observable, map, startWith } from 'rxjs';
import { FILTER_DELAY, PAGE_SIZE_OPTIONS, SNACK_BAR_SHORT_DURATION } from '../../../ts/constants';
import { DialogReturnValue } from '../../../ts/interfaces/dialog/DialogReturnValue';
import { EnumDto } from '../../../ts/interfaces/dtos/all/EnumDto';
import { ReportDto } from '../../../ts/interfaces/dtos/report/ReportDto';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { ContextMenuDirective } from '../../directives/context-menu/context-menu.directive';
import { AuthService } from '../../services/auth-service/auth.service';
import { LoadingComponent } from '../loading/loading.component';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';
import { ReportDialogData } from './../../../ts/interfaces/dialog/ReportDialogData';
import { ReportService } from './../../services/report-service/report.service';
import { CanalePiattaformaDto } from '../../../ts/interfaces/dtos/all/CanalePiattaformaDto';

@Component({
    selector: 'app-report',
    standalone: true,
    imports: [LoadingComponent, MatTableModule, MatSort, MatSortModule, MatPaginatorModule, FormsModule, ReactiveFormsModule, MatLabel, MatFormFieldModule, MatAutocompleteModule, AsyncPipe, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, ReportDialogComponent, ContextMenuDirective],
    templateUrl: './report.component.html',
    styleUrl: './report.component.scss',
})
export class ReportComponent {
    isLoading: boolean = true
    private _reports: ReportDto[] = []
    private _kpiNames: string[] = []
    private _canaleNames: string[] = []
    private _enums: EnumDto[] = []
    private readonly COLUMNS = ['id', 'nomeReport', 'descReport', 'tipoOggetto', 'livelloAccessibilita', 'pathReport', 'kpi', 'canale', 'piattaforma', 'link', 'listaDataset', 'utenteInserimento', 'dataInserimento', 'utenteAggiornamento', 'dataAggiornamento'];
    readonly DEFAULT_COLUMNS = ['id', 'nomeReport', 'descReport', 'tipoOggetto', 'pathReport', 'kpi', 'canale', 'piattaforma']
    private readonly PRETTY_COLUMNS = [{ name: 'id', pretty: 'Id' }, { name: 'tipoOggetto', pretty: 'Tipo Oggetto' }, { name: 'livelloAccessibilita', pretty: 'Livello Accessibilità' }, { name: 'nomeReport', pretty: 'Nome Report' }, { name: 'descReport', pretty: 'Descrizione Report' }, { name: 'pathReport', pretty: 'Path Report' }, { name: 'kpi', pretty: 'Kpi' }, { name: 'canale', pretty: 'Canale' }, { name: 'piattaforma', pretty: 'Piattaforma' }, { name: 'link', pretty: 'Link' }, { name: 'listaDataset', pretty: 'Dataset / Report Padre' }, { name: 'utenteInserimento', pretty: 'Utente Inserimento' }, { name: 'dataInserimento', pretty: 'Data Inserimento' }, { name: 'utenteAggiornamento', pretty: 'Utente Aggiornamento' }, { name: 'dataAggiornamento', pretty: 'Data Aggiornamento' }]
    private readonly REPORT_DISPLAYED_COLUMNS_STORAGE = 'reportDisplayedColumns'
    private readonly REPORT_PAGE_SIZE_STORAGE = 'reportPageSize'
    removedColumns: string[] = []
    dataSource!: MatTableDataSource<ReportDto>
    displayedColumns: string[] = []
    displayedPrettyColumns: string[] = []
    removedPrettyColumns: string[] = []

    nomeReportOptions: string[] = []
    idOptions: string[] = []
    tipoOggettoOptions: string[] = []
    livelloAccessibilitaOptions: string[] = []
    descReportOptions: string[] = []
    pathReportOptions: string[] = []
    linkOptions: string[] = []
    listaDatasetOptions: string[] = []
    utenteInserimentoOptions: string[] = []
    utenteAggiornamentoOptions: string[] = []
    kpisOptions: string[] = []
    canaliOptions: string[] = []
    piattaformeOptions: string[] = []

    nomeReportFilteredOptions!: Observable<string[]>
    idFilteredOptions!: Observable<string[]>
    tipoOggettoFilteredOptions!: Observable<string[]>
    livelloAccessibilitaFilteredOptions!: Observable<string[]>
    descReportFilteredOptions!: Observable<string[]>
    pathReportFilteredOptions!: Observable<string[]>
    linkFilteredOptions!: Observable<string[]>
    listaDatasetFilteredOptions!: Observable<string[]>
    utenteInserimentoFilteredOptions!: Observable<string[]>
    utenteAggiornamentoFilteredOptions!: Observable<string[]>
    kpisFilteredOptions!: Observable<string[]>
    canaliFilteredOptions!: Observable<string[]>
    piattaformeFilteredOptions!: Observable<string[]>

    formControlGroup = new FormGroup({
        nomeReport: new FormControl<string>(''),
        id: new FormControl<string>(''),
        tipoOggetto: new FormControl<string>(''),
        livelloAccessibilita: new FormControl<string>(''),
        descReport: new FormControl<string>(''),
        pathReport: new FormControl<string>(''),
        link: new FormControl<string>(''),
        listaDataset: new FormControl<string>(''),
        utenteInserimento: new FormControl<string>(''),
        utenteAggiornamento: new FormControl<string>(''),
        dataInserimentoStart: new FormControl<DateTime | null>(null),
        dataInserimentoEnd: new FormControl<DateTime | null>(null),
        dataAggiornamentoStart: new FormControl<DateTime | null>(null),
        dataAggiornamentoEnd: new FormControl<DateTime | null>(null),
        kpis: new FormControl<string>(''),
        canali: new FormControl<string>(''),
        piattaforme: new FormControl<string>('')
    })

    private _formControlGroupInitialValue: any
    showFilter: boolean = false
    pageSize!: number
    readonly pageSizeOptions: number[] = PAGE_SIZE_OPTIONS
    private _filterTimeout!: NodeJS.Timeout
    private _dialogData!: ReportDialogData
    private _canalePiattaformaNames!: CanalePiattaformaDto[]
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private _reportService: ReportService, public dialog: MatDialog, dateAdapter: DateAdapter<DateTime>, private _snackBar: MatSnackBar, private clipboard: Clipboard, public authService: AuthService) {
        _reportService.index().subscribe({
            next: indexReportResponse => {
                this._kpiNames = indexReportResponse.kpis.map(k => k.name)
                this._canaleNames = indexReportResponse.canali.map(c => c.nomeCanale)
                this._canalePiattaformaNames = indexReportResponse.canali
                this._enums = indexReportResponse.enums

                this._reports = indexReportResponse.reports.map(r => {
                    if (r.dataInserimento && typeof r.dataInserimento === 'string') {
                        r.dataInserimento = DateTime.fromISO(r.dataInserimento as string)
                    }
                    if (r.dataAggiornamento && typeof r.dataAggiornamento == 'string') {
                        r.dataAggiornamento = DateTime.fromISO(r.dataAggiornamento as string)
                    }

                    r.listaDatasetArray = []
                    const listaDatasetArray = r.listaDataset?.split(',')
                    listaDatasetArray?.forEach(ld => r.listaDatasetArray?.push(ld))
                    r.listaDatasetArray.sort((a, b) => a.localeCompare(b))

                    r.piattaformaNames = []
                    r.canali.forEach(c => {
                        if (c.piattaforma?.nomePiattaforma && !r.piattaformaNames?.includes(c.piattaforma?.nomePiattaforma)) {
                            r.piattaformaNames?.push(c.piattaforma?.nomePiattaforma)
                        }
                    })
                    r.piattaformaNames.sort((a, b) => a.localeCompare(b))

                    r.kpis.sort((a, b) => {
                        let result: number
                        if (a.nomeKpi && b.nomeKpi) {
                            result = a.nomeKpi.localeCompare(b.nomeKpi)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    r.canali.sort((a, b) => {
                        let result: number
                        if (a.nomeCanale && b.nomeCanale) {
                            result = a.nomeCanale.localeCompare(b.nomeCanale)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    return r
                })

                const reportDisplayedColumnsItem = localStorage.getItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE)
                if (reportDisplayedColumnsItem && Array.isArray(JSON.parse(reportDisplayedColumnsItem)) && reportDisplayedColumnsItem.length) {
                    const reportDisplayedColumns = JSON.parse(reportDisplayedColumnsItem)
                    this.displayedColumns = [...reportDisplayedColumns]
                    this.displayedPrettyColumns = this.displayedColumns.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                } else {
                    this.displayedColumns = [... this.DEFAULT_COLUMNS]
                    this.displayedPrettyColumns = this.DEFAULT_COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                }
                this._setRemovedColumns()

                const reportPageSize = localStorage.getItem(this.REPORT_PAGE_SIZE_STORAGE)
                if (reportPageSize && isFinite(parseInt(reportPageSize)) && this.pageSizeOptions.includes(parseInt(reportPageSize))) {
                    this.pageSize = parseInt(reportPageSize)
                } else {
                    this.pageSize = 25
                }
                this.paginator.pageSize = this.pageSize
                this.paginator._intl.itemsPerPageLabel = 'Report per pagina'
                this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
                    const normalizedPage = page + 1
                    let result: string = ''

                    if (length == 0) {
                        result = length + ' - ' + length + ' di ' + length
                    }
                    else if (normalizedPage * pageSize < length) {
                        result = ((page + 1) * pageSize - pageSize + 1) + ' - ' + ((page + 1) * pageSize) + ' di ' + length
                    } else {
                        result = ((page + 1) * pageSize - pageSize + 1) + ' - ' + length + ' di ' + length
                    }

                    return result
                }
                this.paginator._intl.nextPageLabel = "Pagina successiva"
                this.paginator._intl.previousPageLabel = "Pagina precedente"
                this.paginator._intl.firstPageLabel = "Prima pagina"
                this.paginator._intl.lastPageLabel = "Ultima pagina"

                this.dataSource = new MatTableDataSource(this._reports)
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;



                this._initializeNomeReportOptions()
                this._initializeIdOptions()
                this._initializeTipoOggettoOptions()
                this._initializeLivelloAccessibilitaOptions()
                this._initializeDescReportOptions()
                this._initalizePathReportOptions()
                this._initializeLinkOptions()
                this._initializeListaDataset()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()
                this._initializeKpisOptions()
                this._initializeCanaliOptions()
                this._initializePiattaformeOptions()

                this.dataSource.filterPredicate = (data: ReportDto, filter: string) => {
                    let kpisJoinedString = ''
                    if (data.kpis) {
                        data.kpis.forEach(k => {
                            kpisJoinedString += k.nomeKpi + ' '
                        })
                    }

                    let canaliJoinedString = ''
                    if (data.canali) {
                        data.canali.forEach(c => {
                            canaliJoinedString += c.nomeCanale + ' '
                        })
                    }

                    let nomePiattaformaJoinedString = ''
                    if (data.canali) {
                        data.canali.forEach(c => {
                            nomePiattaformaJoinedString += c.piattaforma?.nomePiattaforma + ' '
                        })
                    }

                    return (this.formControlGroup.controls.nomeReport.value == '' || data.nomeReport?.toLowerCase().includes(this.formControlGroup.controls.nomeReport.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.id.value == '' || !this.formControlGroup.controls.id.value || data.id == parseInt(this.formControlGroup.controls.id.value as string))
                        && (this.formControlGroup.controls.tipoOggetto.value == '' || data.tipoOggetto?.toLowerCase().includes(this.formControlGroup.controls.tipoOggetto.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.livelloAccessibilita.value == '' || data.livelloAccessibilita?.toLowerCase().includes(this.formControlGroup.controls.livelloAccessibilita.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.descReport.value == '' || data.descReport?.toLowerCase().includes(this.formControlGroup.controls.descReport.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.pathReport.value == '' || data.pathReport?.toLowerCase().includes(this.formControlGroup.controls.pathReport.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.link.value == '' || data.link?.toLowerCase().includes(this.formControlGroup.controls.link.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.listaDataset.value == '' || data.listaDataset?.toLowerCase().includes(this.formControlGroup.controls.listaDataset.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.utenteInserimento.value == '' || data.utenteInserimento?.toLowerCase().includes(this.formControlGroup.controls.utenteInserimento.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.utenteAggiornamento.value == '' || data.utenteAggiornamento?.toLowerCase().includes(this.formControlGroup.controls.utenteAggiornamento.value?.toLowerCase() as string) as boolean)
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoStart.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoStart.value && data.dataInserimento.startOf('day') >= this.formControlGroup.controls.dataInserimentoStart.value.startOf('day')))
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoEnd.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoEnd.value && data.dataInserimento.startOf('day') <= this.formControlGroup.controls.dataInserimentoEnd.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoStart.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoStart.value && data.dataAggiornamento.startOf('day') >= this.formControlGroup.controls.dataAggiornamentoStart.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoEnd.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoEnd.value && data.dataAggiornamento.startOf('day') <= this.formControlGroup.controls.dataAggiornamentoEnd.value.startOf('day')))
                        && (this.formControlGroup.controls.kpis.value == '' || kpisJoinedString.toLowerCase().includes(this.formControlGroup.controls.kpis.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.canali.value == '' || canaliJoinedString.toLowerCase().includes(this.formControlGroup.controls.canali.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.piattaforme.value == '' || nomePiattaformaJoinedString.toLowerCase().includes(this.formControlGroup.controls.piattaforme.value?.toLowerCase() as string) as boolean)
                }

                this._formControlGroupInitialValue = this.formControlGroup.value

                this.formControlGroup.valueChanges.subscribe({
                    next: () => {
                        clearTimeout(this._filterTimeout)
                        if (this.formControlGroup.valid) {
                            this._filterTimeout = setTimeout(() => this._filterReports(), FILTER_DELAY)
                        }
                    }
                })

                this.isLoading = false
            }

        })

        dateAdapter.setLocale('it-IT')
    }

    private _filterOptionsToLowerCase(value: string, arrayToBeFiltered: string[]): string[] {
        const filterValue = value.toLowerCase();

        return arrayToBeFiltered.filter(option => option.toLowerCase().includes(filterValue));
    }

    private _filterOptionsNumber(value: string, arrayToBeFiltered: string[]): string[] {
        const filterValue = value

        return arrayToBeFiltered.filter(option => value.toString() == '' || option == value.toString());
    }

    private _initializeNomeReportOptions() {
        this.nomeReportOptions = []
        this._reports.forEach(r => {
            if (r.nomeReport && !this.nomeReportOptions.includes(r.nomeReport)) {
                this.nomeReportOptions.push(r.nomeReport)
            }
        })

        this.nomeReportOptions.sort((a, b) => a.localeCompare(b))

        this.nomeReportFilteredOptions = this.formControlGroup.controls.nomeReport.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.nomeReportOptions)),
        );
    }

    private _initializeIdOptions() {
        this.idOptions = []
        this._reports.forEach(r => {
            if (r.id && !this.idOptions.includes(r.id.toString())) {
                this.idOptions.push(r.id.toString())
            }
        })

        this.idOptions.sort((a, b) => parseInt(a) - parseInt(b))

        this.idFilteredOptions = this.formControlGroup.controls.id.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsNumber((value || ''), this.idOptions)),
        );
    }

    private _initializeTipoOggettoOptions() {
        this.tipoOggettoOptions = []
        this._reports.forEach(r => {
            if (r.tipoOggetto && !this.tipoOggettoOptions.includes(r.tipoOggetto)) {
                this.tipoOggettoOptions.push(r.tipoOggetto)
            }
        })

        this.tipoOggettoOptions.sort((a, b) => a.localeCompare(b))

        this.tipoOggettoFilteredOptions = this.formControlGroup.controls.tipoOggetto.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.tipoOggettoOptions)),
        );
    }

    private _initializeLivelloAccessibilitaOptions() {
        this.livelloAccessibilitaOptions = []
        this._reports.forEach(r => {
            if (r.livelloAccessibilita && !this.livelloAccessibilitaOptions.includes(r.livelloAccessibilita)) {
                this.livelloAccessibilitaOptions.push(r.livelloAccessibilita)
            }
        })

        this.livelloAccessibilitaOptions.sort((a, b) => a.localeCompare(b))

        this.livelloAccessibilitaFilteredOptions = this.formControlGroup.controls.livelloAccessibilita.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.livelloAccessibilitaOptions)),
        );
    }

    private _initializeDescReportOptions() {
        this.descReportOptions = []
        this._reports.forEach(r => {
            if (r.descReport && !this.descReportOptions.includes(r.descReport)) {
                this.descReportOptions.push(r.descReport)
            }
        })

        this.descReportOptions.sort((a, b) => a.localeCompare(b))

        this.descReportFilteredOptions = this.formControlGroup.controls.descReport.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.descReportOptions)),
        );
    }

    private _initalizePathReportOptions() {
        this.pathReportOptions = []
        this._reports.forEach(r => {
            if (r.pathReport && !this.pathReportOptions.includes(r.pathReport)) {
                this.pathReportOptions.push(r.pathReport)
            }
        })

        this.pathReportOptions.sort((a, b) => a.localeCompare(b))

        this.pathReportFilteredOptions = this.formControlGroup.controls.pathReport.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.pathReportOptions)),
        );
    }

    private _initializeLinkOptions() {
        this.linkOptions = []
        this._reports.forEach(r => {
            if (r.link && !this.linkOptions.includes(r.link)) {
                this.linkOptions.push(r.link)
            }
        })

        this.linkOptions.sort((a, b) => a.localeCompare(b))

        this.linkFilteredOptions = this.formControlGroup.controls.link.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.linkOptions)),
        );
    }

    private _initializeListaDataset() {
        this.listaDatasetOptions = []
        this._reports.forEach(r => {
            if (r.listaDataset) {
                const splitted = r.listaDataset.split(',')
                splitted.forEach(s => {
                    if (!this.listaDatasetOptions.includes(s)) {
                        this.listaDatasetOptions.push(s)
                    }
                })
            }
        })

        this.listaDatasetOptions.sort((a, b) => a.localeCompare(b))

        this.listaDatasetFilteredOptions = this.formControlGroup.controls.listaDataset.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.listaDatasetOptions)),
        );
    }

    private _initializeUtenteInserimentoOptions() {
        this.utenteInserimentoOptions = []
        this._reports.forEach(r => {
            if (r.utenteInserimento && !this.utenteInserimentoOptions.includes(r.utenteInserimento)) {
                this.utenteInserimentoOptions.push(r.utenteInserimento)
            }
        })

        this.utenteInserimentoOptions.sort((a, b) => a.localeCompare(b))

        this.utenteInserimentoFilteredOptions = this.formControlGroup.controls.utenteInserimento.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.utenteInserimentoOptions)),
        );
    }

    private _initializeUtenteAggiornamentoOptions() {
        this.utenteAggiornamentoOptions = []
        this._reports.forEach(r => {
            if (r.utenteAggiornamento && !this.utenteAggiornamentoOptions.includes(r.utenteAggiornamento)) {
                this.utenteAggiornamentoOptions.push(r.utenteAggiornamento)
            }
        })

        this.utenteAggiornamentoOptions.sort((a, b) => a.localeCompare(b))

        this.utenteAggiornamentoFilteredOptions = this.formControlGroup.controls.utenteAggiornamento.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.utenteAggiornamentoOptions)),
        );
    }

    private _initializeKpisOptions() {
        this.kpisOptions = []
        this._reports.forEach(r => {
            if (r.kpis) {
                r.kpis.forEach(k => {
                    if (k.nomeKpi && !this.kpisOptions.includes(k.nomeKpi)) {
                        this.kpisOptions.push(k.nomeKpi)
                    }
                })
            }
        })

        this.kpisOptions.sort((a, b) => a.localeCompare(b))

        this.kpisFilteredOptions = this.formControlGroup.controls.kpis.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.kpisOptions)),
        );
    }

    private _initializeCanaliOptions() {
        this.canaliOptions = []
        this._reports.forEach(r => {
            if (r.canali) {
                r.canali.forEach(c => {
                    if (c.nomeCanale && !this.canaliOptions.includes(c.nomeCanale)) {
                        this.canaliOptions.push(c.nomeCanale)
                    }
                })
            }
        })

        this.canaliOptions.sort((a, b) => a.localeCompare(b))

        this.canaliFilteredOptions = this.formControlGroup.controls.canali.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.canaliOptions)),
        );
    }

    private _initializePiattaformeOptions() {
        this.piattaformeOptions = []
        this._reports.forEach(r => {
            if (r.canali) {
                r.canali.forEach(c => {
                    if (c.piattaforma?.nomePiattaforma && !this.piattaformeOptions.includes(c.piattaforma?.nomePiattaforma)) {
                        this.piattaformeOptions.push(c.piattaforma?.nomePiattaforma)
                    }
                })
            }
        })

        this.piattaformeOptions.sort((a, b) => a.localeCompare(b))

        this.piattaformeFilteredOptions = this.formControlGroup.controls.piattaforme.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.piattaformeOptions)),
        );
    }

    private _filterReports() {
        this.dataSource.filter = 'filter'
    }

    removeColumnFromLeft() {
        if (this.displayedColumns.length > 0) {
            this.removedColumns.push(this.displayedColumns[0])
            this.removedPrettyColumns.push(this._getPrettyColumn(this.displayedColumns[0]))

            this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

            const deletedElements = this.displayedColumns.splice(0, 1)
            this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != this._getPrettyColumn(deletedElements[0])).sort((a, b) => a.localeCompare(b))
        }
        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumnFromRight() {
        if (this.displayedColumns.length > 0) {
            this.removedColumns.push(this.displayedColumns[this.displayedColumns.length - 1])
            this.removedPrettyColumns.push(this._getPrettyColumn(this.displayedColumns[this.displayedColumns.length - 1]))

            this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

            const deletedElement = this.displayedColumns.pop()
            this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != this._getPrettyColumn(deletedElement!)).sort((a, b) => a.localeCompare(b))
        }
        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumn(prettyColumn: string) {
        const column = this._getColumnFromPretty(prettyColumn)

        this.displayedColumns = this.displayedColumns.filter(col => col != column)
        this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != prettyColumn).sort((a, b) => a.localeCompare(b))

        this.removedColumns.push(column)
        this.removedPrettyColumns.push(prettyColumn)

        this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    private _getColumnFromPretty(column: string) {
        let result: string = ''
        const prettyColumn = this.PRETTY_COLUMNS.find(col => col.pretty == column)?.name

        if (prettyColumn) {
            result = prettyColumn
        }

        return result
    }

    restoreDefaultColumns() {
        this.displayedColumns = [... this.DEFAULT_COLUMNS]
        this.displayedPrettyColumns = this.DEFAULT_COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))

        this._setRemovedColumns()

        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    private _getPrettyColumn(column: string) {
        let result: string = ''
        const prettyColumn = this.PRETTY_COLUMNS.find(col => col.name == column)

        if (prettyColumn) {
            result = prettyColumn.pretty
        }

        return result
    }

    addColumn(prettyColumn: string) {
        const column = this._getColumnFromPretty(prettyColumn)

        this.displayedColumns.push(column)
        this.displayedPrettyColumns.push(prettyColumn)

        this.displayedPrettyColumns.sort((a, b) => a.localeCompare(b))

        this._setRemovedColumns()

        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeAllColumns() {
        this.displayedColumns = []
        this.displayedPrettyColumns = []

        this.removedColumns = [... this.COLUMNS]
        this.removedPrettyColumns = this.COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a?.localeCompare(b))

        localStorage.setItem(this.REPORT_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    private _setRemovedColumns() {
        this.removedColumns = []
        this.removedPrettyColumns = []

        this.COLUMNS.forEach(col => {
            if (!this.displayedColumns.includes(col)) {
                this.removedColumns.push(col)
                this.removedPrettyColumns.push(this._getPrettyColumn(col))

                this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))
            }
        })

    }

    resetFilters() {
        this.formControlGroup.reset(this._formControlGroupInitialValue)
    }

    edit(event: Event, row: ReportDto) {
        const clickedElement = event.target as HTMLElement

        if (clickedElement.classList.contains('mat-column-link') && row.link) {
            window.open(row.link)
        } else {
            const clickedColumn = clickedElement.parentElement

            if (clickedColumn?.classList.contains('mat-column-link') && row.link) {
                window.open(row.link)
            } else {
                this.openDialog('edit', row)
            }
        }
    }

    openDialog(mode: 'create' | 'edit', reportToEdit?: ReportDto) {
        if (mode == 'create') {
            this._dialogData = { mode: 'create', reports: this._reports, kpiNames: this._kpiNames, canalePiattaformaNames: this._canalePiattaformaNames, enums: this._enums }
        } else {
            this._dialogData = { mode: 'edit', reports: this._reports, reportToEdit: reportToEdit, kpiNames: this._kpiNames, canalePiattaformaNames: this._canalePiattaformaNames, enums: this._enums }
        }
        const dialogRef = this.dialog.open(ReportDialogComponent, { data: this._dialogData });
        (dialogRef.afterClosed() as Observable<DialogReturnValue>).subscribe({
            next: result => {
                if (result?.operation == 'create') {
                    (result.observable as Observable<ReportDto>).subscribe({
                        next: report => {
                            report.utenteInserimento = this.authService.user
                            report.dataInserimento = DateTime.now()

                            report.listaDatasetArray = []
                            const listaDatasetArray = report.listaDataset?.split(',')
                            listaDatasetArray?.forEach(ld => report.listaDatasetArray?.push(ld))
                            report.listaDatasetArray.sort((a, b) => a.localeCompare(b))

                            report.piattaformaNames = []
                            report.canali.forEach(c => {
                                if (c.piattaforma?.nomePiattaforma && !report.piattaformaNames?.includes(c.piattaforma?.nomePiattaforma)) {
                                    report.piattaformaNames?.push(c.piattaforma?.nomePiattaforma)
                                }
                            })
                            report.piattaformaNames.sort((a, b) => a.localeCompare(b))

                            report.kpis.sort((a, b) => {
                                let result: number
                                if (a.nomeKpi && b.nomeKpi) {
                                    result = a.nomeKpi.localeCompare(b.nomeKpi)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            report.canali.sort((a, b) => {
                                let result: number
                                if (a.nomeCanale && b.nomeCanale) {
                                    result = a.nomeCanale.localeCompare(b.nomeCanale)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            this._reports.push(report)

                            this._initializeNomeReportOptions()
                            this._initializeIdOptions()
                            this._initializeTipoOggettoOptions()
                            this._initializeLivelloAccessibilitaOptions()
                            this._initializeDescReportOptions()
                            this._initalizePathReportOptions()
                            this._initializeLinkOptions()
                            this._initializeListaDataset()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeKpisOptions()
                            this._initializeCanaliOptions()
                            this._initializePiattaformeOptions()

                            this.dataSource.data = this._reports

                            const snackBarData: SnackBarData = { message: 'Report creato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile creare il Report.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'edit') {
                    (result.observable as Observable<ReportDto>).subscribe({
                        next: report => {
                            if (report.dataInserimento) {
                                report.dataInserimento = DateTime.fromISO(report.dataInserimento.toString())
                            }
                            report.utenteAggiornamento = this.authService.user
                            report.dataAggiornamento = DateTime.now()

                            report.listaDatasetArray = []
                            const listaDatasetArray = report.listaDataset?.split(',')
                            listaDatasetArray?.forEach(ld => report.listaDatasetArray?.push(ld))
                            report.listaDatasetArray.sort((a, b) => a.localeCompare(b))

                            report.piattaformaNames = []
                            report.canali.forEach(c => {
                                if (c.piattaforma?.nomePiattaforma && !report.piattaformaNames?.includes(c.piattaforma?.nomePiattaforma)) {
                                    report.piattaformaNames?.push(c.piattaforma?.nomePiattaforma)
                                }
                            })
                            report.piattaformaNames.sort((a, b) => a.localeCompare(b))

                            report.kpis.sort((a, b) => {
                                let result: number
                                if (a.nomeKpi && b.nomeKpi) {
                                    result = a.nomeKpi.localeCompare(b.nomeKpi)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            report.canali.sort((a, b) => {
                                let result: number
                                if (a.nomeCanale && b.nomeCanale) {
                                    result = a.nomeCanale.localeCompare(b.nomeCanale)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            let index = this._reports.findIndex(r => r.id == report.id)
                            this._reports.splice(index, 1, report)

                            this._initializeNomeReportOptions()
                            this._initializeIdOptions()
                            this._initializeTipoOggettoOptions()
                            this._initializeLivelloAccessibilitaOptions()
                            this._initializeDescReportOptions()
                            this._initalizePathReportOptions()
                            this._initializeLinkOptions()
                            this._initializeListaDataset()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeKpisOptions()
                            this._initializeCanaliOptions()
                            this._initializePiattaformeOptions()

                            this.dataSource.data = this._reports

                            const snackBarData: SnackBarData = { message: 'Report modificato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile modificare il Report.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'delete') {
                    (result.observable as Observable<IdResponse>).subscribe({
                        next: idResponse => {
                            this._reports = this._reports.filter(r => r.id != idResponse.id)

                            this._initializeNomeReportOptions()
                            this._initializeIdOptions()
                            this._initializeTipoOggettoOptions()
                            this._initializeLivelloAccessibilitaOptions()
                            this._initializeDescReportOptions()
                            this._initalizePathReportOptions()
                            this._initializeLinkOptions()
                            this._initializeListaDataset()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeKpisOptions()
                            this._initializeCanaliOptions()
                            this._initializePiattaformeOptions()

                            this.dataSource.data = this._reports

                            const snackBarData: SnackBarData = { message: 'Report eliminato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile eliminare il Report.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                }
            }
        })
    }

    onPaginatorChange(pageEvent: PageEvent) {
        const tableResponsive = document.getElementById('tableResponsive') as HTMLElement
        tableResponsive.scrollTop = 0

        localStorage.setItem(this.REPORT_PAGE_SIZE_STORAGE, pageEvent.pageSize.toString())
    }

    copyToClipboard(value: any, fieldName: string) {
        if (value && typeof value === 'string' && value.length > 0) {
            const pending = this.clipboard.beginCopy(value);
            let remainingAttempts = 3;
            const attempt = () => {
                const result = pending.copy();
                if (!result && --remainingAttempts) {
                    setTimeout(attempt);
                } else {
                    pending.destroy();

                    const snackBarData: SnackBarData = { message: fieldName + ' copiato negli appunti.', result: 'info' }
                    this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
                }
            };
            attempt();
        }
    }

    refreshIndex() {
        this.isLoading = true
        this._reportService.index().subscribe({
            next: indexReportResponse => {
                this._kpiNames = indexReportResponse.kpis.map(k => k.name)
                this._canaleNames = indexReportResponse.canali.map(c => c.nomeCanale)
                this._enums = indexReportResponse.enums

                this._reports = indexReportResponse.reports.map(r => {
                    if (r.dataInserimento && typeof r.dataInserimento === 'string') {
                        r.dataInserimento = DateTime.fromISO(r.dataInserimento as string)
                    }
                    if (r.dataAggiornamento && typeof r.dataAggiornamento == 'string') {
                        r.dataAggiornamento = DateTime.fromISO(r.dataAggiornamento as string)
                    }

                    r.listaDatasetArray = []
                    const listaDatasetArray = r.listaDataset?.split(',')
                    listaDatasetArray?.forEach(ld => r.listaDatasetArray?.push(ld))
                    r.listaDatasetArray.sort((a, b) => a.localeCompare(b))

                    r.piattaformaNames = []
                    r.canali.forEach(c => {
                        if (c.piattaforma?.nomePiattaforma && !r.piattaformaNames?.includes(c.piattaforma?.nomePiattaforma)) {
                            r.piattaformaNames?.push(c.piattaforma?.nomePiattaforma)
                        }
                    })
                    r.piattaformaNames.sort((a, b) => a.localeCompare(b))

                    r.kpis.sort((a, b) => {
                        let result: number
                        if (a.nomeKpi && b.nomeKpi) {
                            result = a.nomeKpi.localeCompare(b.nomeKpi)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    r.canali.sort((a, b) => {
                        let result: number
                        if (a.nomeCanale && b.nomeCanale) {
                            result = a.nomeCanale.localeCompare(b.nomeCanale)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    return r
                })
                this.dataSource.data = this._reports

                this._initializeNomeReportOptions()
                this._initializeIdOptions()
                this._initializeTipoOggettoOptions()
                this._initializeLivelloAccessibilitaOptions()
                this._initializeDescReportOptions()
                this._initalizePathReportOptions()
                this._initializeLinkOptions()
                this._initializeListaDataset()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()
                this._initializeKpisOptions()
                this._initializeCanaliOptions()
                this._initializePiattaformeOptions()

                this.isLoading = false

                const snackBarData: SnackBarData = { message: 'Report ricaricati con successo.', result: 'success' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
            }
        })
    }
}
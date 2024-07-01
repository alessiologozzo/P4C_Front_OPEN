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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateTime } from 'luxon';
import { Observable, map, startWith } from 'rxjs';
import { FILTER_DELAY, PAGE_SIZE_OPTIONS, SNACK_BAR_SHORT_DURATION } from '../../../ts/constants';
import { CriterioDialogData } from '../../../ts/interfaces/dialog/CriterioDialogData';
import { DialogReturnValue } from '../../../ts/interfaces/dialog/DialogReturnValue';
import { EnumDto } from '../../../ts/interfaces/dtos/all/EnumDto';
import { IdNameDto } from '../../../ts/interfaces/dtos/all/IdNameDto';
import { CriterioDto } from '../../../ts/interfaces/dtos/criterio/CriterioDto';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { ContextMenuDirective } from '../../directives/context-menu/context-menu.directive';
import { AuthService } from '../../services/auth-service/auth.service';
import { CriterioService } from '../../services/criterio-service/criterio.service';
import { CriterioDialogComponent } from '../criterio-dialog/criterio-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';

@Component({
    selector: 'app-criterio',
    standalone: true,
    imports: [LoadingComponent, MatTableModule, MatSort, MatSortModule, MatPaginatorModule, FormsModule, ReactiveFormsModule, MatLabel, MatFormFieldModule, MatAutocompleteModule, AsyncPipe, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, ContextMenuDirective],
    templateUrl: './criterio.component.html',
    styleUrl: './criterio.component.scss'
})
export class CriterioComponent {
    isLoading: boolean = true
    private _criteri!: CriterioDto[]
    private _enum!: EnumDto | null
    private readonly COLUMNS = ['id', 'descCriterio', 'dettaglioCriterio', 'tipoCriterio', 'kpiOrigine', 'utenteInserimento', 'dataInserimento', 'utenteAggiornamento', 'dataAggiornamento'];
    readonly DEFAULT_COLUMNS = ['id', 'descCriterio', 'dettaglioCriterio', 'tipoCriterio', 'kpiOrigine']
    private readonly PRETTY_COLUMNS = [{ name: 'id', pretty: 'Id' }, { name: 'descCriterio', pretty: 'Descrizione Criterio' }, { name: 'dettaglioCriterio', pretty: 'Dettaglio Criterio' },{ name: 'tipoCriterio', pretty: 'Tipo Criterio' }, { name: 'kpiOrigine', pretty: 'Kpi Origine' }, { name: 'utenteInserimento', pretty: 'Utente Inserimento' }, { name: 'dataInserimento', pretty: 'Data Inserimento' }, { name: 'utenteAggiornamento', pretty: 'Utente Aggiornamento' }, { name: 'dataAggiornamento', pretty: 'Data Aggiornamento' }]
    private readonly CRITERIO_DISPLAYED_COLUMNS_STORAGE = 'criterioDisplayedColumns'
    private readonly CRITERIO_PAGE_SIZE_STORAGE = 'criterioPageSize'
    removedColumns: string[] = []
    dataSource!: MatTableDataSource<CriterioDto>
    displayedColumns: string[] = []
    displayedPrettyColumns: string[] = []
    removedPrettyColumns: string[] = []

    idOptions: string[] = []
    dettaglioCriterioOptions: string[] = []
    descCriterioOptions: string[] = []
    tipoCriterioOptions: string[] = []
    kpiOrigineOptions: string[] = []
    utenteInserimentoOptions: string[] = []
    utenteAggiornamentoOptions: string[] = []

    idFilteredOptions!: Observable<string[]>
    dettaglioCriterioFilteredOptions!: Observable<string[]>
    descCriterioFilteredOptions!: Observable<string[]>
    tipoCriterioFilteredOptions!: Observable<string[]>
    kpiOrigineFilteredOptions!: Observable<string[]>
    utenteInserimentoFilteredOptions!: Observable<string[]>
    utenteAggiornamentoFilteredOptions!: Observable<string[]>

    formControlGroup = new FormGroup({
        id: new FormControl<string>(''),
        criterio: new FormControl<string>(''),
        descCriterio: new FormControl<string>(''),
        tipoCriterio: new FormControl<string>(''),
        kpiOrigine: new FormControl<string>(''),
        utenteInserimento: new FormControl<string>(''),
        utenteAggiornamento: new FormControl<string>(''),
        dataInserimentoStart: new FormControl<DateTime | null>(null),
        dataInserimentoEnd: new FormControl<DateTime | null>(null),
        dataAggiornamentoStart: new FormControl<DateTime | null>(null),
        dataAggiornamentoEnd: new FormControl<DateTime | null>(null)
    })

    private _formControlGroupInitialValue: any
    showFilter: boolean = false
    pageSize!: number
    readonly pageSizeOptions: number[] = PAGE_SIZE_OPTIONS
    private _filterTimeout!: NodeJS.Timeout
    private _dialogData!: CriterioDialogData
    private _kpiIdNames: IdNameDto[] = []
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private _criterioService: CriterioService, public dialog: MatDialog, private dateAdapter: DateAdapter<DateTime>, private _snackBar: MatSnackBar, private clipboard: Clipboard, public authService: AuthService) {
        _criterioService.index().subscribe({
            next: indexCriterioResponse => {
                this._enum = indexCriterioResponse.enum
                this._criteri = indexCriterioResponse.criteri.map(c => {
                    if (c.dataInserimento && typeof c.dataInserimento === 'string') {
                        c.dataInserimento = DateTime.fromISO(c.dataInserimento as string)
                    }
                    if (c.dataAggiornamento && typeof c.dataAggiornamento == 'string') {
                        c.dataAggiornamento = DateTime.fromISO(c.dataAggiornamento as string)
                    }

                    this._kpiIdNames = indexCriterioResponse.kpiIdNames
                    c.kpiOrigineArray = []
                    const kpiOrigineArray = c.kpiOrigine?.split(',')
                    kpiOrigineArray?.forEach(id => {
                        for (let i = 0; i < this._kpiIdNames.length; i++) {
                            if (parseInt(id) == this._kpiIdNames[i].id) {
                                c.kpiOrigineArray?.push(`(${this._kpiIdNames[i].id}) ${this._kpiIdNames[i].name}`)
                            }
                        }
                    })
                    c.kpiOrigineArray.sort((a, b) => {
                        let result: number
                        if (a && b) {
                            const splittedA = a.split(')')
                            let descA: string = splittedA[1]
                            for (let i = 2; i < splittedA.length; i++) {
                                descA += ')' + splittedA[i]
                            }

                            const splittedB = b.split(')')
                            let descB: string = splittedB[1]
                            for (let i = 2; i < splittedB.length; i++) {
                                descB += ')' + splittedB[i]
                            }

                            return descA.localeCompare(descB)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    return c
                })

                const criterioDisplayedColumnsItem = localStorage.getItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE)
                if (criterioDisplayedColumnsItem && Array.isArray(JSON.parse(criterioDisplayedColumnsItem)) && criterioDisplayedColumnsItem.length) {
                    const criterioDisplayedColumns = JSON.parse(criterioDisplayedColumnsItem)
                    this.displayedColumns = [...criterioDisplayedColumns]
                    this.displayedPrettyColumns = this.displayedColumns.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                } else {
                    this.displayedColumns = [... this.DEFAULT_COLUMNS]
                    this.displayedPrettyColumns = this.DEFAULT_COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                }
                this._setRemovedColumns()

                const criterioPageSize = localStorage.getItem(this.CRITERIO_PAGE_SIZE_STORAGE)
                if (criterioPageSize && isFinite(parseInt(criterioPageSize)) && this.pageSizeOptions.includes(parseInt(criterioPageSize))) {
                    this.pageSize = parseInt(criterioPageSize)
                } else {
                    this.pageSize = 25
                }
                this.paginator.pageSize = this.pageSize
                this.paginator._intl.itemsPerPageLabel = 'Criteri per pagina'
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

                this.dataSource = new MatTableDataSource(this._criteri)
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;



                this._initializeIdOptions()
                this._initializeDettaglioCriterioOptions()
                this._initializeDescCriterioOptions()
                this._initializeTipoCriterioOptions()
                this._initalizeKpiOrigineOptions()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()

                this.dataSource.filterPredicate = (data: CriterioDto, filter: string) => {
                    let kpiOrigineCondition: boolean = false
                    if (data.kpiOrigineArray && this.formControlGroup.controls.kpiOrigine.value) {
                        for (let i = 0; i < data.kpiOrigineArray.length && !kpiOrigineCondition; i++) {
                            if (data.kpiOrigineArray[i].toLowerCase().includes(this.formControlGroup.controls.kpiOrigine.value.toLowerCase())) {
                                kpiOrigineCondition = true
                            }
                        }
                    } else {
                        kpiOrigineCondition = true
                    }

                    return (this.formControlGroup.controls.criterio.value == '' || data.dettaglioCriterio?.toLowerCase().includes(this.formControlGroup.controls.criterio.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.id.value == '' || !this.formControlGroup.controls.id.value || data.id == parseInt(this.formControlGroup.controls.id.value as string))
                        && (this.formControlGroup.controls.descCriterio.value == '' || data.descCriterio?.toLowerCase().includes(this.formControlGroup.controls.descCriterio.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.tipoCriterio.value == '' || data.tipoCriterio?.toLowerCase().includes(this.formControlGroup.controls.tipoCriterio.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.kpiOrigine.value == '' || kpiOrigineCondition)
                        && (this.formControlGroup.controls.utenteInserimento.value == '' || data.utenteInserimento?.toLowerCase().includes(this.formControlGroup.controls.utenteInserimento.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.utenteAggiornamento.value == '' || data.utenteAggiornamento?.toLowerCase().includes(this.formControlGroup.controls.utenteAggiornamento.value?.toLowerCase() as string) as boolean)
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoStart.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoStart.value && data.dataInserimento.startOf('day') >= this.formControlGroup.controls.dataInserimentoStart.value.startOf('day')))
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoEnd.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoEnd.value && data.dataInserimento.startOf('day') <= this.formControlGroup.controls.dataInserimentoEnd.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoStart.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoStart.value && data.dataAggiornamento.startOf('day') >= this.formControlGroup.controls.dataAggiornamentoStart.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoEnd.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoEnd.value && data.dataAggiornamento.startOf('day') <= this.formControlGroup.controls.dataAggiornamentoEnd.value.startOf('day')))
                }

                this._formControlGroupInitialValue = this.formControlGroup.value

                this.formControlGroup.valueChanges.subscribe({
                    next: () => {
                        clearTimeout(this._filterTimeout)
                        if (this.formControlGroup.valid) {
                            this._filterTimeout = setTimeout(() => this._filterCriteri(), FILTER_DELAY)
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

    private _initializeIdOptions() {
        this.idOptions = []
        this._criteri.forEach(c => {
            if (c.id && !this.idOptions.includes(c.id.toString())) {
                this.idOptions.push(c.id.toString())
            }
        })

        this.idOptions.sort((a, b) => parseInt(a) - parseInt(b))

        this.idFilteredOptions = this.formControlGroup.controls.id.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsNumber((value || ''), this.idOptions)),
        );
    }

    private _initializeDettaglioCriterioOptions() {
        this.dettaglioCriterioOptions = []
        this._criteri.forEach(c => {
            if (c.dettaglioCriterio && !this.dettaglioCriterioOptions.includes(c.dettaglioCriterio)) {
                this.dettaglioCriterioOptions.push(c.dettaglioCriterio)
            }
        })

        this.dettaglioCriterioOptions.sort((a, b) => a.localeCompare(b))

        this.dettaglioCriterioFilteredOptions = this.formControlGroup.controls.criterio.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.dettaglioCriterioOptions)),
        );
    }

    private _initializeDescCriterioOptions() {
        this.descCriterioOptions = []
        this._criteri.forEach(c => {
            if (c.descCriterio && !this.descCriterioOptions.includes(c.descCriterio)) {
                this.descCriterioOptions.push(c.descCriterio)
            }
        })

        this.descCriterioOptions.sort((a, b) => a.localeCompare(b))

        this.descCriterioFilteredOptions = this.formControlGroup.controls.descCriterio.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.descCriterioOptions)),
        );
    }

    private _initializeTipoCriterioOptions() {
        this.tipoCriterioOptions = []
        this._criteri.forEach(c => {
            if (c.tipoCriterio && !this.tipoCriterioOptions.includes(c.tipoCriterio)) {
                this.tipoCriterioOptions.push(c.tipoCriterio)
            }
        })

        this.tipoCriterioOptions.sort((a, b) => a.localeCompare(b))

        this.tipoCriterioFilteredOptions = this.formControlGroup.controls.tipoCriterio.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.tipoCriterioOptions)),
        );
    }

    private _initalizeKpiOrigineOptions() {
        this.kpiOrigineOptions = []
        this._criteri.forEach(c => {
            c.kpiOrigineArray?.forEach(o => {
                if (!this.kpiOrigineOptions.includes(o)) {
                    this.kpiOrigineOptions.push(o)
                }
            })
        })

        this.kpiOrigineOptions.sort((a, b) => {
            const splittedA = a.split(')')
            let descA: string = splittedA[1]
            for (let i = 2; i < splittedA.length; i++) {
                descA += ')' + splittedA[i]
            }

            const splittedB = b.split(')')
            let descB: string = splittedB[1]
            for (let i = 2; i < splittedB.length; i++) {
                descB += ')' + splittedB[i]
            }

            return descA.localeCompare(descB)
        })

        this.kpiOrigineFilteredOptions = this.formControlGroup.controls.kpiOrigine.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.kpiOrigineOptions)),
        );
    }

    private _initializeUtenteInserimentoOptions() {
        this.utenteInserimentoOptions = []
        this._criteri.forEach(c => {
            if (c.utenteInserimento && !this.utenteInserimentoOptions.includes(c.utenteInserimento)) {
                this.utenteInserimentoOptions.push(c.utenteInserimento)
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
        this._criteri.forEach(c => {
            if (c.utenteAggiornamento && !this.utenteAggiornamentoOptions.includes(c.utenteAggiornamento)) {
                this.utenteAggiornamentoOptions.push(c.utenteAggiornamento)
            }
        })

        this.utenteAggiornamentoOptions.sort((a, b) => a.localeCompare(b))

        this.utenteAggiornamentoFilteredOptions = this.formControlGroup.controls.utenteAggiornamento.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.utenteAggiornamentoOptions)),
        );
    }

    private _filterCriteri() {
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
        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumnFromRight() {
        if (this.displayedColumns.length > 0) {
            this.removedColumns.push(this.displayedColumns[this.displayedColumns.length - 1])
            this.removedPrettyColumns.push(this._getPrettyColumn(this.displayedColumns[this.displayedColumns.length - 1]))

            this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

            const deletedElement = this.displayedColumns.pop()
            this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != this._getPrettyColumn(deletedElement!)).sort((a, b) => a.localeCompare(b))
        }
        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumn(prettyColumn: string) {
        const column = this._getColumnFromPretty(prettyColumn)

        this.displayedColumns = this.displayedColumns.filter(col => col != column)
        this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != prettyColumn).sort((a, b) => a.localeCompare(b))

        this.removedColumns.push(column)
        this.removedPrettyColumns.push(prettyColumn)

        this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeAllColumns() {
        this.displayedColumns = []
        this.displayedPrettyColumns = []

        this.removedColumns = [... this.COLUMNS]
        this.removedPrettyColumns = this.COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a?.localeCompare(b))

        localStorage.setItem(this.CRITERIO_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

    onPaginatorChange(pageEvent: PageEvent) {
        const tableResponsive = document.getElementById('tableResponsive') as HTMLElement
        tableResponsive.scrollTop = 0

        localStorage.setItem(this.CRITERIO_PAGE_SIZE_STORAGE, pageEvent.pageSize.toString())
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

    openDialog(mode: 'create' | 'edit', criterioToEdit?: CriterioDto) {
        if (mode == 'create') {
            this._dialogData = { mode: 'create', criteri: this._criteri, enum: this._enum, kpiIdNames: this._kpiIdNames }
        } else {
            this._dialogData = { mode: 'edit', criteri: this._criteri, enum: this._enum, criterioToEdit: criterioToEdit, kpiIdNames: this._kpiIdNames }
        }
        const dialogRef = this.dialog.open(CriterioDialogComponent, { data: this._dialogData });
        (dialogRef.afterClosed() as Observable<DialogReturnValue>).subscribe({
            next: result => {
                if (result?.operation == 'create') {
                    (result.observable as Observable<CriterioDto>).subscribe({
                        next: criterio => {
                            criterio.utenteInserimento = this.authService.user
                            criterio.dataInserimento = DateTime.now()

                            criterio.kpiOrigineArray = []
                            const kpiOrigineArray = criterio.kpiOrigine?.split(',')
                            kpiOrigineArray?.forEach(id => {
                                for (let i = 0; i < this._kpiIdNames.length; i++) {
                                    if (parseInt(id) == this._kpiIdNames[i].id) {
                                        criterio.kpiOrigineArray?.push(`(${this._kpiIdNames[i].id}) ${this._kpiIdNames[i].name}`)
                                    }
                                }
                            })
                            criterio.kpiOrigineArray.sort((a, b) => {
                                let result: number
                                if (a && b) {
                                    const splittedA = a.split(')')
                                    let descA: string = splittedA[1]
                                    for (let i = 2; i < splittedA.length; i++) {
                                        descA += ')' + splittedA[i]
                                    }

                                    const splittedB = b.split(')')
                                    let descB: string = splittedB[1]
                                    for (let i = 2; i < splittedB.length; i++) {
                                        descB += ')' + splittedB[i]
                                    }

                                    return descA.localeCompare(descB)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            this._criteri.push(criterio)

                            this._initializeIdOptions()
                            this._initializeDettaglioCriterioOptions()
                            this._initializeDescCriterioOptions()
                            this._initializeTipoCriterioOptions()
                            this._initalizeKpiOrigineOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()


                            this.dataSource.data = this._criteri

                            const snackBarData: SnackBarData = { message: 'Criterio creato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile creare il Criterio.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'edit') {
                    (result.observable as Observable<CriterioDto>).subscribe({
                        next: criterio => {
                            if (criterio.dataInserimento) {
                                criterio.dataInserimento = DateTime.fromISO(criterio.dataInserimento.toString() as string)
                            }
                            criterio.utenteAggiornamento = this.authService.user
                            criterio.dataAggiornamento = DateTime.now()

                            criterio.kpiOrigineArray = []
                            const kpiOrigineArray = criterio.kpiOrigine?.split(',')
                            kpiOrigineArray?.forEach(id => {
                                for (let i = 0; i < this._kpiIdNames.length; i++) {
                                    if (parseInt(id) == this._kpiIdNames[i].id) {
                                        criterio.kpiOrigineArray?.push(`(${this._kpiIdNames[i].id}) ${this._kpiIdNames[i].name}`)
                                    }
                                }
                            })
                            criterio.kpiOrigineArray.sort((a, b) => {
                                let result: number
                                if (a && b) {
                                    const splittedA = a.split(')')
                                    let descA: string = splittedA[1]
                                    for (let i = 2; i < splittedA.length; i++) {
                                        descA += ')' + splittedA[i]
                                    }

                                    const splittedB = b.split(')')
                                    let descB: string = splittedB[1]
                                    for (let i = 2; i < splittedB.length; i++) {
                                        descB += ')' + splittedB[i]
                                    }

                                    return descA.localeCompare(descB)
                                } else {
                                    result = 0
                                }

                                return result
                            })

                            let index = this._criteri.findIndex(c => c.id == criterio.id)
                            this._criteri.splice(index, 1, criterio)

                            this._initializeIdOptions()
                            this._initializeDettaglioCriterioOptions()
                            this._initializeDescCriterioOptions()
                            this._initializeTipoCriterioOptions()
                            this._initalizeKpiOrigineOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()


                            this.dataSource.data = this._criteri

                            const snackBarData: SnackBarData = { message: 'Criterio modificato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile modificare il Criterio.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'delete') {
                    (result.observable as Observable<IdResponse>).subscribe({
                        next: idResponse => {
                            this._criteri = this._criteri.filter(c => c.id != idResponse.id)

                            this._initializeIdOptions()
                            this._initializeDettaglioCriterioOptions()
                            this._initializeDescCriterioOptions()
                            this._initializeTipoCriterioOptions()
                            this._initalizeKpiOrigineOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()

                            this.dataSource.data = this._criteri

                            const snackBarData: SnackBarData = { message: 'Criterio eliminato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile eliminare il Criterio.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                }
            }
        })
    }

    refreshIndex() {
        this.isLoading = true
        this._criterioService.index().subscribe({
            next: indexCriterioResponse => {
                this._enum = indexCriterioResponse.enum
                this._criteri = indexCriterioResponse.criteri.map(c => {
                    if (c.dataInserimento && typeof c.dataInserimento === 'string') {
                        c.dataInserimento = DateTime.fromISO(c.dataInserimento as string)
                    }
                    if (c.dataAggiornamento && typeof c.dataAggiornamento == 'string') {
                        c.dataAggiornamento = DateTime.fromISO(c.dataAggiornamento as string)
                    }

                    this._kpiIdNames = indexCriterioResponse.kpiIdNames
                    c.kpiOrigineArray = []
                    const kpiOrigineArray = c.kpiOrigine?.split(',')
                    kpiOrigineArray?.forEach(id => {
                        for (let i = 0; i < this._kpiIdNames.length; i++) {
                            if (parseInt(id) == this._kpiIdNames[i].id) {
                                c.kpiOrigineArray?.push(`(${this._kpiIdNames[i].id}) ${this._kpiIdNames[i].name}`)
                            }
                        }
                    })
                    c.kpiOrigineArray.sort((a, b) => {
                        let result: number
                        if (a && b) {
                            const splittedA = a.split(')')
                            let descA: string = splittedA[1]
                            for (let i = 2; i < splittedA.length; i++) {
                                descA += ')' + splittedA[i]
                            }

                            const splittedB = b.split(')')
                            let descB: string = splittedB[1]
                            for (let i = 2; i < splittedB.length; i++) {
                                descB += ')' + splittedB[i]
                            }

                            return descA.localeCompare(descB)
                        } else {
                            result = 0
                        }

                        return result
                    })

                    return c
                })

                this.dataSource.data = this._criteri

                this._initializeIdOptions()
                this._initializeDettaglioCriterioOptions()
                this._initializeDescCriterioOptions()
                this._initializeTipoCriterioOptions()
                this._initalizeKpiOrigineOptions()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()

                this.isLoading = false

                const snackBarData: SnackBarData = { message: 'Criteri ricaricati con successo.', result: 'success' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
            }
        })
    }
}

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
import { DialogReturnValue } from '../../../ts/interfaces/dialog/DialogReturnValue';
import { KpiDialogData } from '../../../ts/interfaces/dialog/KpiDialogData';
import { EnumDto } from '../../../ts/interfaces/dtos/all/EnumDto';
import { IdNameDto } from '../../../ts/interfaces/dtos/all/IdNameDto';
import { KpiDto } from '../../../ts/interfaces/dtos/kpi/KpiDto';
import { IdResponse } from '../../../ts/interfaces/responses/all/IdResponse';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { ContextMenuDirective } from '../../directives/context-menu/context-menu.directive';
import { AuthService } from '../../services/auth-service/auth.service';
import { KpiService } from '../../services/kpi-service/kpi.service';
import { KpiDialogComponent } from '../kpi-dialog/kpi-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';

@Component({
    selector: 'app-kpi',
    standalone: true,
    imports: [LoadingComponent, MatTableModule, MatSort, MatSortModule, MatPaginatorModule, FormsModule, ReactiveFormsModule, MatLabel, MatFormFieldModule, MatAutocompleteModule, AsyncPipe, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, ContextMenuDirective],
    templateUrl: './kpi.component.html',
    styleUrl: './kpi.component.scss'
})
export class KpiComponent {
    isLoading: boolean = true
    private _kpis!: KpiDto[]
    private _criteri!: IdNameDto[]
    private _enums: EnumDto[] = []
    private readonly COLUMNS = ['id', 'nomeKpi', 'descKpi', 'categoriaKpi', 'uMKpi', 'benchmark', 'criterio', 'utenteInserimento', 'dataInserimento', 'utenteAggiornamento', 'dataAggiornamento'];
    readonly DEFAULT_COLUMNS = ['id', 'nomeKpi', 'descKpi', 'categoriaKpi', 'uMKpi', 'criterio']
    private readonly PRETTY_COLUMNS = [{ name: 'id', pretty: 'Id' }, { name: 'nomeKpi', pretty: 'Nome Kpi' }, { name: 'descKpi', pretty: 'Descrizione Kpi' }, { name: 'categoriaKpi', pretty: 'Categoria Kpi' }, { name: 'uMKpi', pretty: 'UM Kpi' }, { name: 'benchmark', pretty: 'Benchmark' }, { name: 'criterio', pretty: 'Criterio' }, { name: 'utenteInserimento', pretty: 'Utente Inserimento' }, { name: 'dataInserimento', pretty: 'Data Inserimento' }, { name: 'utenteAggiornamento', pretty: 'Utente Aggiornamento' }, { name: 'dataAggiornamento', pretty: 'Data Aggiornamento' }]
    private readonly KPI_DISPLAYED_COLUMNS_STORAGE = 'kpiDisplayedColumns'
    private readonly KPI_PAGE_SIZE_STORAGE = 'kpiPageSize'
    removedColumns: string[] = []
    dataSource!: MatTableDataSource<KpiDto>
    displayedColumns: string[] = []
    displayedPrettyColumns: string[] = []
    removedPrettyColumns: string[] = []

    idOptions: string[] = []
    nomeKpiOptions: string[] = []
    descKpiOptions: string[] = []
    categoriaKpiOptions: string[] = []
    umKpiOptions: string[] = []
    benchmarkOptions: string[] = []
    criteriOptions: string[] = []
    utenteInserimentoOptions: string[] = []
    utenteAggiornamentoOptions: string[] = []
    dataInserimentoOptions: string[] = []
    dataAggiornamentoOptions: string[] = []

    idFilteredOptions!: Observable<string[]>
    nomeKpiFilteredOptions!: Observable<string[]>
    descKpiFilteredOptions!: Observable<string[]>
    categoriaKpiFilteredOptions!: Observable<string[]>
    umKpiFilteredOptions!: Observable<string[]>
    benchmarkFilteredOptions!: Observable<string[]>
    criteriFilteredOptions!: Observable<string[]>
    utenteInserimentoFilteredOptions!: Observable<string[]>
    utenteAggiornamentoFilteredOptions!: Observable<string[]>
    dataInserimentoFilteredOptions!: Observable<string[]>
    dataAggiornamentoFilteredOptions!: Observable<string[]>

    formControlGroup = new FormGroup({
        id: new FormControl<string>(''),
        nomeKpi: new FormControl<string>(''),
        descKpi: new FormControl<string>(''),
        categoriaKpi: new FormControl<string>(''),
        uMKpi: new FormControl<string>(''),
        benchmark: new FormControl<string>(''),
        criteri: new FormControl<string>(''),
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
    private _dialogData!: KpiDialogData
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;


    constructor(private _kpiService: KpiService, dateAdapter: DateAdapter<DateTime>, private _snackBar: MatSnackBar, private clipboard: Clipboard, public authService: AuthService, public dialog: MatDialog) {
        _kpiService.index().subscribe({
            next: kpiIndexResponse => {
                this._enums = kpiIndexResponse.enums
                this._criteri = kpiIndexResponse.criteri
                this._kpis = kpiIndexResponse.kpis.map(k => {
                    if (k.dataInserimento && typeof k.dataInserimento === 'string') {
                        k.dataInserimento = DateTime.fromISO(k.dataInserimento as string)
                    }
                    if (k.dataAggiornamento && typeof k.dataAggiornamento == 'string') {
                        k.dataAggiornamento = DateTime.fromISO(k.dataAggiornamento as string)
                    }

                    k.criteri.forEach(c => c.idDesc = `(${c.id}) ${c?.descCriterio}`)
                    k.criteri.sort((a, b) => {
                        let result: number
                        if (a.idDesc && b.idDesc) {
                            const splittedA = a.idDesc.split(')')
                            let descA: string = splittedA[1]
                            for (let i = 2; i < splittedA.length; i++) {
                                descA += ')' + splittedA[i]
                            }

                            const splittedB = b.idDesc.split(')')
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

                    return k
                })

                const kpiDisplayedColumnsItem = localStorage.getItem(this.KPI_DISPLAYED_COLUMNS_STORAGE)
                if (kpiDisplayedColumnsItem && Array.isArray(JSON.parse(kpiDisplayedColumnsItem)) && kpiDisplayedColumnsItem.length) {
                    const kpiDisplayedColumns = JSON.parse(kpiDisplayedColumnsItem)
                    this.displayedColumns = [...kpiDisplayedColumns]
                    this.displayedPrettyColumns = this.displayedColumns.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                } else {
                    this.displayedColumns = [... this.DEFAULT_COLUMNS]
                    this.displayedPrettyColumns = this.DEFAULT_COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a.localeCompare(b))
                }
                this._setRemovedColumns()

                const kpiPageSize = localStorage.getItem(this.KPI_PAGE_SIZE_STORAGE)
                if (kpiPageSize && isFinite(parseInt(kpiPageSize)) && this.pageSizeOptions.includes(parseInt(kpiPageSize))) {
                    this.pageSize = parseInt(kpiPageSize)
                } else {
                    this.pageSize = 25
                }
                this.paginator.pageSize = this.pageSize
                this.paginator._intl.itemsPerPageLabel = 'Kpi per pagina'
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

                this.dataSource = new MatTableDataSource(this._kpis)
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;

                this._initializeIdOptions()
                this._initializeNomeKpiOptions()
                this._initializeDescKpiOptions()
                this._initializeCategoriaKpiOptions()
                this._initializeUMKpiOptions()
                this._initializeBenchmarkOptions()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()
                this._initializeCriteriOptions()

                this.dataSource.filterPredicate = (data: KpiDto, filter: string) => {
                    let criteriJoinedString = ''
                    if (data.criteri) {
                        data.criteri.forEach(c => {
                            criteriJoinedString += c.idDesc + ' '
                        })
                    }

                    return (this.formControlGroup.controls.id.value == '' || !this.formControlGroup.controls.id.value || data.id == parseInt(this.formControlGroup.controls.id.value as string))
                        && (this.formControlGroup.controls.nomeKpi.value == '' || data.nomeKpi?.toLowerCase().includes(this.formControlGroup.controls.nomeKpi.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.descKpi.value == '' || data.descKpi?.toLowerCase().includes(this.formControlGroup.controls.descKpi.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.categoriaKpi.value == '' || data.categoriaKpi?.toLowerCase().includes(this.formControlGroup.controls.categoriaKpi.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.uMKpi.value == '' || data.umKpi?.toLowerCase().includes(this.formControlGroup.controls.uMKpi.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.benchmark.value == '' || data.benchmark?.toLowerCase().includes(this.formControlGroup.controls.benchmark.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.utenteInserimento.value == '' || data.utenteInserimento?.toLowerCase().includes(this.formControlGroup.controls.utenteInserimento.value?.toLowerCase() as string) as boolean)
                        && (this.formControlGroup.controls.utenteAggiornamento.value == '' || data.utenteAggiornamento?.toLowerCase().includes(this.formControlGroup.controls.utenteAggiornamento.value?.toLowerCase() as string) as boolean)
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoStart.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoStart.value && data.dataInserimento.startOf('day') >= this.formControlGroup.controls.dataInserimentoStart.value.startOf('day')))
                        && (!data.dataInserimento || !this.formControlGroup.controls.dataInserimentoEnd.value || (data.dataInserimento && this.formControlGroup.controls.dataInserimentoEnd.value && data.dataInserimento.startOf('day') <= this.formControlGroup.controls.dataInserimentoEnd.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoStart.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoStart.value && data.dataAggiornamento.startOf('day') >= this.formControlGroup.controls.dataAggiornamentoStart.value.startOf('day')))
                        && (!data.dataAggiornamento || !this.formControlGroup.controls.dataAggiornamentoEnd.value || (data.dataAggiornamento && this.formControlGroup.controls.dataAggiornamentoEnd.value && data.dataAggiornamento.startOf('day') <= this.formControlGroup.controls.dataAggiornamentoEnd.value.startOf('day')))
                        && (this.formControlGroup.controls.criteri.value == '' || criteriJoinedString.toLowerCase().includes(this.formControlGroup.controls.criteri.value?.toLowerCase() as string) as boolean)
                }

                this._formControlGroupInitialValue = this.formControlGroup.value

                this.formControlGroup.valueChanges.subscribe({
                    next: () => {
                        clearTimeout(this._filterTimeout)
                        if (this.formControlGroup.valid) {
                            this._filterTimeout = setTimeout(() => this._filterKpis(), FILTER_DELAY)
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
        this._kpis.forEach(k => {
            if (k.id && !this.idOptions.includes(k.id.toString())) {
                this.idOptions.push(k.id.toString())
            }
        })

        this.idOptions.sort((a, b) => parseInt(a) - parseInt(b))

        this.idFilteredOptions = this.formControlGroup.controls.id.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsNumber((value || ''), this.idOptions)),
        );
    }

    private _initializeNomeKpiOptions() {
        this.nomeKpiOptions = []
        this._kpis.forEach(k => {
            if (k.nomeKpi && !this.nomeKpiOptions.includes(k.nomeKpi)) {
                this.nomeKpiOptions.push(k.nomeKpi)
            }
        })

        this.nomeKpiOptions.sort((a, b) => a.localeCompare(b))

        this.nomeKpiFilteredOptions = this.formControlGroup.controls.nomeKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.nomeKpiOptions)),
        );
    }

    private _initializeDescKpiOptions() {
        this.descKpiOptions = []
        this._kpis.forEach(k => {
            if (k.descKpi && !this.descKpiOptions.includes(k.descKpi)) {
                this.descKpiOptions.push(k.descKpi)
            }
        })

        this.descKpiOptions.sort((a, b) => a.localeCompare(b))

        this.descKpiFilteredOptions = this.formControlGroup.controls.descKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.descKpiOptions)),
        );
    }

    private _initializeCategoriaKpiOptions() {
        this.categoriaKpiOptions = []
        this._kpis.forEach(k => {
            if (k.categoriaKpi && !this.categoriaKpiOptions.includes(k.categoriaKpi)) {
                this.categoriaKpiOptions.push(k.categoriaKpi)
            }
        })

        this.categoriaKpiOptions.sort((a, b) => a.localeCompare(b))

        this.categoriaKpiFilteredOptions = this.formControlGroup.controls.categoriaKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.categoriaKpiOptions)),
        );
    }

    private _initializeUMKpiOptions() {
        this.umKpiOptions = []
        this._kpis.forEach(k => {
            if (k.umKpi && !this.umKpiOptions.includes(k.umKpi)) {
                this.umKpiOptions.push(k.umKpi)
            }
        })

        this.umKpiOptions.sort((a, b) => a.localeCompare(b))

        this.umKpiFilteredOptions = this.formControlGroup.controls.uMKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.umKpiOptions)),
        );
    }

    private _initializeBenchmarkOptions() {
        this.benchmarkOptions = []
        this._kpis.forEach(k => {
            if (k.benchmark && !this.benchmarkOptions.includes(k.benchmark)) {
                this.benchmarkOptions.push(k.benchmark)
            }
        })

        this.benchmarkOptions.sort((a, b) => a.localeCompare(b))

        this.benchmarkFilteredOptions = this.formControlGroup.controls.benchmark.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.benchmarkOptions)),
        );
    }

    private _initializeUtenteInserimentoOptions() {
        this.utenteInserimentoOptions = []
        this._kpis.forEach(k => {
            if (k.utenteInserimento && !this.utenteInserimentoOptions.includes(k.utenteInserimento)) {
                this.utenteInserimentoOptions.push(k.utenteInserimento)
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
        this._kpis.forEach(k => {
            if (k.utenteAggiornamento && !this.utenteAggiornamentoOptions.includes(k.utenteAggiornamento)) {
                this.utenteAggiornamentoOptions.push(k.utenteAggiornamento)
            }
        })

        this.utenteAggiornamentoOptions.sort((a, b) => a.localeCompare(b))

        this.utenteAggiornamentoFilteredOptions = this.formControlGroup.controls.utenteAggiornamento.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.utenteAggiornamentoOptions)),
        );
    }

    private _initializeCriteriOptions() {
        this.criteriOptions = []
        this._kpis.forEach(k => {
            if (k.criteri) {
                k.criteri.forEach(k => {
                    if (k.idDesc && !this.criteriOptions.includes(k.idDesc)) {
                        this.criteriOptions.push(k.idDesc)
                    }
                })
            }
        })

        this.criteriOptions.sort((a, b) => {
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

        this.criteriFilteredOptions = this.formControlGroup.controls.criteri.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.criteriOptions)),
        );
    }

    private _filterKpis() {
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
        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumnFromRight() {
        if (this.displayedColumns.length > 0) {
            this.removedColumns.push(this.displayedColumns[this.displayedColumns.length - 1])
            this.removedPrettyColumns.push(this._getPrettyColumn(this.displayedColumns[this.displayedColumns.length - 1]))

            this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

            const deletedElement = this.displayedColumns.pop()
            this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != this._getPrettyColumn(deletedElement!)).sort((a, b) => a.localeCompare(b))
        }
        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeColumn(prettyColumn: string) {
        const column = this._getColumnFromPretty(prettyColumn)

        this.displayedColumns = this.displayedColumns.filter(col => col != column)
        this.displayedPrettyColumns = this.displayedPrettyColumns.filter(col => col != prettyColumn).sort((a, b) => a.localeCompare(b))

        this.removedColumns.push(column)
        this.removedPrettyColumns.push(prettyColumn)

        this.removedPrettyColumns = this.removedPrettyColumns.sort((a, b) => a.localeCompare(b))

        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
    }

    removeAllColumns() {
        this.displayedColumns = []
        this.displayedPrettyColumns = []

        this.removedColumns = [... this.COLUMNS]
        this.removedPrettyColumns = this.COLUMNS.map(col => this._getPrettyColumn(col)).sort((a, b) => a?.localeCompare(b))

        localStorage.setItem(this.KPI_DISPLAYED_COLUMNS_STORAGE, JSON.stringify(this.displayedColumns))
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

        localStorage.setItem(this.KPI_PAGE_SIZE_STORAGE, pageEvent.pageSize.toString())
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

    openDialog(mode: 'create' | 'edit', kpiToEdit?: KpiDto) {
        const criterioNames = this._criteri.map(c => `(${c.id}) ${c.name}`)
        if (mode == 'create') {
            this._dialogData = { mode: 'create', kpis: this._kpis, criterioNames: criterioNames, enums: this._enums }
        } else {
            this._dialogData = { mode: 'edit', kpis: this._kpis, kpiToEdit: kpiToEdit, criterioNames: criterioNames, enums: this._enums }
        }
        const dialogRef = this.dialog.open(KpiDialogComponent, { data: this._dialogData });
        (dialogRef.afterClosed() as Observable<DialogReturnValue>).subscribe({
            next: result => {
                if (result?.operation == 'create') {
                    (result.observable as Observable<KpiDto>).subscribe({
                        next: kpi => {
                            kpi.utenteInserimento = this.authService.user
                            kpi.dataInserimento = DateTime.now()

                            kpi.criteri.forEach(c => c.idDesc = `(${c.id}) ${c?.descCriterio}`)
                            kpi.criteri.sort((a, b) => {
                                let result: number
                                if (a.idDesc && b.idDesc) {
                                    const splittedA = a.idDesc.split(')')
                                    let descA: string = splittedA[1]
                                    for (let i = 2; i < splittedA.length; i++) {
                                        descA += ')' + splittedA[i]
                                    }

                                    const splittedB = b.idDesc.split(')')
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

                            this._kpis.push(kpi)

                            this._initializeIdOptions()
                            this._initializeNomeKpiOptions()
                            this._initializeDescKpiOptions()
                            this._initializeCategoriaKpiOptions()
                            this._initializeUMKpiOptions()
                            this._initializeBenchmarkOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeCriteriOptions()


                            this.dataSource.data = this._kpis

                            const snackBarData: SnackBarData = { message: 'Kpi creato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile creare il Kpi.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'edit') {
                    (result.observable as Observable<KpiDto>).subscribe({
                        next: kpi => {
                            if (kpi.dataInserimento) {
                                kpi.dataInserimento = DateTime.fromISO(kpi.dataInserimento.toString())
                            }
                            kpi.utenteAggiornamento = this.authService.user
                            kpi.dataAggiornamento = DateTime.now()
                            
                            kpi.criteri.forEach(c => c.idDesc = `(${c.id}) ${c?.descCriterio}`)
                            kpi.criteri.sort((a, b) => {
                                let result: number
                                if (a.idDesc && b.idDesc) {
                                    const splittedA = a.idDesc.split(')')
                                    let descA: string = splittedA[1]
                                    for (let i = 2; i < splittedA.length; i++) {
                                        descA += ')' + splittedA[i]
                                    }

                                    const splittedB = b.idDesc.split(')')
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

                            let index = this._kpis.findIndex(k => k.id == kpi.id)
                            this._kpis.splice(index, 1, kpi)

                            this._initializeIdOptions()
                            this._initializeNomeKpiOptions()
                            this._initializeDescKpiOptions()
                            this._initializeCategoriaKpiOptions()
                            this._initializeUMKpiOptions()
                            this._initializeBenchmarkOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeCriteriOptions()

                            this.dataSource.data = this._kpis

                            const snackBarData: SnackBarData = { message: 'Kpi modificato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile modificare il Kpi.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                } else if (result?.operation == 'delete') {
                    (result.observable as Observable<IdResponse>).subscribe({
                        next: idResponse => {
                            this._kpis = this._kpis.filter(k => k.id != idResponse.id)

                            this._initializeIdOptions()
                            this._initializeNomeKpiOptions()
                            this._initializeDescKpiOptions()
                            this._initializeCategoriaKpiOptions()
                            this._initializeUMKpiOptions()
                            this._initializeBenchmarkOptions()
                            this._initializeUtenteInserimentoOptions()
                            this._initializeUtenteAggiornamentoOptions()
                            this._initializeCriteriOptions()

                            this.dataSource.data = this._kpis

                            const snackBarData: SnackBarData = { message: 'Kpi eliminato con successo.', result: 'success' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        },
                        error: () => {
                            const snackBarData: SnackBarData = { message: 'Impossibile eliminare il Kpi.', result: 'fail' }
                            this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
                        }
                    })
                }
            }
        })
    }

    refreshIndex() {
        this.isLoading = true
        this._kpiService.index().subscribe({
            next: kpiIndexResponse => {
                this._enums = kpiIndexResponse.enums
                this._criteri = kpiIndexResponse.criteri
                this._kpis = kpiIndexResponse.kpis.map(k => {
                    if (k.dataInserimento && typeof k.dataInserimento === 'string') {
                        k.dataInserimento = DateTime.fromISO(k.dataInserimento as string)
                    }
                    if (k.dataAggiornamento && typeof k.dataAggiornamento == 'string') {
                        k.dataAggiornamento = DateTime.fromISO(k.dataAggiornamento as string)
                    }

                    k.criteri.forEach(c => c.idDesc = `(${c.id}) ${c?.descCriterio}`)
                    k.criteri.sort((a, b) => {
                        let result: number
                        if (a.idDesc && b.idDesc) {
                            const splittedA = a.idDesc.split(')')
                            let descA: string = splittedA[1]
                            for (let i = 2; i < splittedA.length; i++) {
                                descA += ')' + splittedA[i]
                            }

                            const splittedB = b.idDesc.split(')')
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

                    return k
                })

                this.dataSource.data = this._kpis

                this._initializeIdOptions()
                this._initializeNomeKpiOptions()
                this._initializeDescKpiOptions()
                this._initializeCategoriaKpiOptions()
                this._initializeUMKpiOptions()
                this._initializeBenchmarkOptions()
                this._initializeUtenteInserimentoOptions()
                this._initializeUtenteAggiornamentoOptions()
                this._initializeCriteriOptions()

                this.isLoading = false

                const snackBarData: SnackBarData = { message: 'Kpi ricaricati con successo.', result: 'success' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData });
            }

        })
    }
}

import { PiattaformaHierarchy } from './../../../ts/interfaces/generals/PiattaformaHierarchy';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, map, startWith } from 'rxjs';
import { SNACK_BAR_SHORT_DURATION } from '../../../ts/constants';
import { DialogReturnValue } from '../../../ts/interfaces/dialog/DialogReturnValue';
import { MessageDialogData } from '../../../ts/interfaces/dialog/MessageDialogData';
import { ReportDialogData } from '../../../ts/interfaces/dialog/ReportDialogData';
import { CanaleWithoutRelationsDto } from '../../../ts/interfaces/dtos/canale/CanaleWithoutRelationsDto';
import { KpiWithoutRelationsDto } from '../../../ts/interfaces/dtos/kpi/KpiWithoutRelationsDto';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { AuthService } from '../../services/auth-service/auth.service';
import { ReportService } from '../../services/report-service/report.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { Checked } from '../../../ts/interfaces/generals/Checked';
import { InputError } from '../../../ts/interfaces/generals/InputError';

@Component({
    selector: 'app-report-dialog',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, ReactiveFormsModule, MatAutocompleteModule, AsyncPipe, MatIconModule, MatTooltipModule, MatSlideToggleModule, ScrollingModule, MatCheckboxModule],
    templateUrl: './report-dialog.component.html',
    styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent implements OnDestroy {
    title: string = ''

    kpisOptions: string[] = []
    canaliOptions: string[] = []
    tipoOggettoOptions: string[] = []
    livelloAccessibilitaOptions: string[] = []
    listaDatasetOptions: string[] = []

    kpisFilteredOptions!: Observable<string[]>
    canaliFilteredOptions!: Observable<string[]>
    tipoOggettoFilteredOptions!: Observable<string[]>
    livelloAccessibilitaFilteredOptions!: Observable<string[]>
    listaDatasetFilteredOptions!: Observable<string[]>

    selectedKpiNames: string[] = []
    selectedCanaleNames: string[] = []
    selectedListaDatasetOptions: string[] = []

    private _piattaformaHierarchies: PiattaformaHierarchy[] = []
    private _initialPiattaformaHierarchies: PiattaformaHierarchy[] = []
    filteredPiattaformaHierarchies: PiattaformaHierarchy[] = []
    canaliOpened: boolean = false

    private _kpiCheckboxes: Checked[] = []
    private _initialKpiCheckboxes: Checked[] = []
    filteredKpiCheckboxes: Checked[] = []
    kpiOpened: boolean = false

    private _listaDatasetCheckboxes: Checked[] = []
    private _initialListaDatasetCheckboxes: Checked[] = []
    filteredListaDatasetCheckboxes: Checked[] = []
    listaDatasetOpened: boolean = false

    nomeReportInputError: InputError = { hasError: false, message: '' }
    descReportInputError: InputError = { hasError: false, message: '' }
    livelloAccessibilitaInputError: InputError = { hasError: false, message: '' }
    pathReportInputError: InputError = { hasError: false, message: '' }
    tipoOggettoInputError: InputError = { hasError: false, message: '' }
    linkInputError: InputError = { hasError: false, message: '' }

    formGroup = new FormGroup({
        nomeReport: new FormControl<string>('', [Validators.required, Validators.maxLength(50), this._notBlankValidator(), this._uniqueNomeReportValidator(), this._nomeReportInputErrorSender()]),
        descReport: new FormControl<string>('', [Validators.maxLength(500), this._notBlankValidator(), this._descReportInputErrorSender()]),
        livelloAccessibilita: new FormControl<string>('', [Validators.required, this._livelloAccessibilitaValidator(), this._livelloAccessibilitaInputErrorSender()]),
        pathReport: new FormControl<string>('', [Validators.maxLength(500), this._notBlankValidator(), this._pathReportInputErrorSender()]),
        tipoOggetto: new FormControl<string>('', [Validators.required, this._tipoOggettoValidator(), this._tipoOggettoInputErrorSender()]),
        link: new FormControl<string>('', [Validators.maxLength(500), this._notBlankValidator(), this._linkInputErrorSender()]),
    })

    formGroupMulti = new FormGroup({
        listaDataset: new FormControl<string>(''),
        kpis: new FormControl<string>(''),
        canali: new FormControl<string>('')
    })

    formGroupInitialValue!: any
    formGroupMultiInitialValue!: any
    initialSelectedKpiNames: string[] = []
    initialSelectedCanaleNames: string[] = []
    initialSelectedListaDatasetOptions: string[] = []

    editFormChanged = false
    startMode: 'create' | 'edit'

    constructor(public dialogRef: MatDialogRef<ReportDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ReportDialogData, private _reportService: ReportService, public authService: AuthService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
        this.startMode = data.mode

        this._initializeTipoOggettoOptions()
        this._initializeTipoReportOptions()
        this._initializeKpisOptions()
        this._initializeCanaliOptions()
        this._initializeListaDatasetOptions()

        this._initializePiattaformaHierarchy()
        this._initializeKpiCheckboxes()
        this._initializeListaDatasetCheckboxes()

        if (data.mode == 'create') {
            this.title = 'Crea Report'
        } else {
            if (authService.isAdmin) {
                this.title = 'Modifica Report'
            } else {
                this.title = 'Vista Report'
            }

            this.formGroup.controls.nomeReport.setValue(data.reportToEdit?.nomeReport ? data.reportToEdit.nomeReport : '')
            this.formGroup.controls.descReport.setValue(data.reportToEdit?.descReport ? data.reportToEdit.descReport : '')
            this.formGroup.controls.livelloAccessibilita.setValue(data.reportToEdit?.livelloAccessibilita ? data.reportToEdit.livelloAccessibilita : '')
            this.formGroup.controls.tipoOggetto.setValue(data.reportToEdit?.tipoOggetto ? data.reportToEdit.tipoOggetto : '')
            this.formGroup.controls.pathReport.setValue(data.reportToEdit?.pathReport ? data.reportToEdit.pathReport : '')
            this.formGroup.controls.link.setValue(data.reportToEdit?.link ? data.reportToEdit.link : '')

            this._initializeSelectedKpiNames(data.reportToEdit?.kpis)
            this._initializeSelectedCanaleNames(data.reportToEdit?.canali)
            this._initializeSelectedListaDatasetOptions(data.reportToEdit?.listaDataset)

            this.initialSelectedKpiNames = [... this.selectedKpiNames]
            this.initialSelectedCanaleNames = [... this.selectedCanaleNames]
            this.initialSelectedListaDatasetOptions = [... this.selectedListaDatasetOptions]

            if (!authService.isAdmin) {
                this.formGroup.disable()
                this.formGroupMulti.disable()
            }
        }

        this.formGroupInitialValue = this.formGroup.value
        this.formGroupMultiInitialValue = this.formGroupMulti.value
        this.formGroup.valueChanges.subscribe(v => {
            this._checkFormChanges()
        })

        window.addEventListener('scroll', this._scrollEvent, true);
    }

    ngOnDestroy(): void {
        window.removeEventListener('scroll', this._scrollEvent, true)
    }

    private _scrollEvent = (): void => {
        const s = document.getElementById('separator')
        const panel = document.querySelector('.cdk-overlay-container .mat-mdc-autocomplete-panel')

        if (panel && s) {
            if (panel.getBoundingClientRect().top < s.getBoundingClientRect().bottom) {
                if (!panel.classList.contains('opacity-0')) {
                    panel.classList.add('opacity-0')
                }
            } else {
                if (panel.classList.contains('opacity-0')) {
                    panel.classList.remove('opacity-0')
                }
            }
        }
    }

    private _checkFormChanges() {
        if (JSON.stringify(this.formGroupInitialValue) == JSON.stringify(this.formGroup.value) && JSON.stringify(this.initialSelectedKpiNames) == JSON.stringify(this.selectedKpiNames) && JSON.stringify(this.initialSelectedCanaleNames) == JSON.stringify(this.selectedCanaleNames) && JSON.stringify(this.initialSelectedListaDatasetOptions) == JSON.stringify(this.selectedListaDatasetOptions)) {
            this.editFormChanged = false
        } else {
            this.editFormChanged = true
        }
    }

    private _filterOptionsToLowerCase(value: string, arrayToBeFiltered: string[]): string[] {
        const filterValue = value.toLowerCase();

        return arrayToBeFiltered.filter(option => option.toLowerCase().includes(filterValue));
    }

    private _filterKpiOptions(value: string, kpiNames: string[]): string[] {
        const filterValue = value.toLowerCase();

        return kpiNames.filter(kpiName => kpiName.toLowerCase().includes(filterValue) && !this.selectedKpiNames.some(sk => sk == kpiName));
    }

    private _filterCanaliOptions(value: string, canaleNames: string[]): string[] {
        const filterValue = value.toLowerCase();

        return canaleNames.filter(canaleName => canaleName.toLowerCase().includes(filterValue) && !this.selectedCanaleNames.some(sc => sc == canaleName));
    }

    private _filterListaDatasetOptions(value: string, listaDatasetOptions: string[]): string[] {
        const filterValue = value.toLowerCase();

        return listaDatasetOptions.filter(listaDatasetOption => listaDatasetOption.toLowerCase().includes(filterValue) && !this.selectedListaDatasetOptions.some(ld => ld == listaDatasetOption));
    }

    private _initializeTipoOggettoOptions() {
        const tipoOggettoEnum = this.data.enums.find(e => e.fieldName == 'TipoOggetto')
        if (tipoOggettoEnum) {
            this.tipoOggettoOptions = tipoOggettoEnum.values

            this.tipoOggettoOptions.sort((a, b) => a.localeCompare(b))
        }

        this.tipoOggettoFilteredOptions = this.formGroup.controls.tipoOggetto.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.tipoOggettoOptions)),
        );
    }

    private _initializeTipoReportOptions() {
        const tipoReportEnum = this.data.enums.find(e => e.fieldName == 'LivelloAccessibilita')
        if (tipoReportEnum) {
            this.livelloAccessibilitaOptions = tipoReportEnum.values

            this.livelloAccessibilitaOptions.sort((a, b) => a.localeCompare(b))
        }

        this.livelloAccessibilitaFilteredOptions = this.formGroup.controls.livelloAccessibilita.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.livelloAccessibilitaOptions)),
        );
    }

    private _initializeListaDatasetOptions() {
        const listaDatasetEnum = this.data.enums.find(e => e.fieldName == 'Dataset/ReportPadre')
        if (listaDatasetEnum) {
            this.listaDatasetOptions = listaDatasetEnum.values

            this.listaDatasetOptions.sort((a, b) => a.localeCompare(b))
        }

        this.listaDatasetFilteredOptions = this.formGroupMulti.controls.listaDataset.valueChanges.pipe(
            startWith(''),
            map(value => this._filterListaDatasetOptions((value || ''), this.listaDatasetOptions)),
        );
    }

    private _initializeKpisOptions() {
        this.kpisOptions = this.data.kpiNames

        this.kpisOptions.sort((a, b) => a.localeCompare(b))

        this.kpisFilteredOptions = this.formGroupMulti.controls.kpis.valueChanges.pipe(
            startWith(''),
            map(value => this._filterKpiOptions((value || ''), this.kpisOptions)),
        );
    }

    private _initializeCanaliOptions() {
        this.canaliOptions = this.data.canalePiattaformaNames.map(c => `(${c.nomePiattaforma}) ${c.nomeCanale}`)
        this.canaliOptions.sort((a, b) => a.localeCompare(b))

        this.canaliFilteredOptions = this.formGroupMulti.controls.canali.valueChanges.pipe(
            startWith(''),
            map(value => this._filterCanaliOptions((value || ''), this.canaliOptions)),
        );
    }

    private _initializeSelectedKpiNames(kpis: KpiWithoutRelationsDto[] | null | undefined) {
        kpis?.forEach(k => {
            if (k.nomeKpi && !this.selectedKpiNames.includes(k.nomeKpi)) {
                this.selectedKpiNames.push(k.nomeKpi)
            }
        })
    }

    private _initializeSelectedCanaleNames(canali: CanaleWithoutRelationsDto[] | null | undefined) {
        canali?.forEach(c => {
            if (c.nomeCanale && !this.selectedCanaleNames.includes(c.nomeCanale)) {
                const canalePiattaforma = this.canaliOptions.find(o => {
                    let norm = o.substring(o.indexOf(')') + 1)
                    norm = norm.replace(' ', '')

                    return norm == c.nomeCanale
                })
                if (canalePiattaforma) {
                    this.selectedCanaleNames.push(canalePiattaforma)
                }
            }
            this.selectedCanaleNames.sort((a, b) => a.localeCompare(b))
        })
    }

    private _initializeSelectedListaDatasetOptions(listaDataset: string | null | undefined) {
        if (listaDataset) {
            this.selectedListaDatasetOptions = listaDataset.split(',')
        }
        this.selectedListaDatasetOptions.sort((a, b) => a.localeCompare(b))
    }

    private _selectKpi(kpiName: string) {
        if (kpiName != '') {
            const kpiOption = this.kpisOptions.find(ko => ko.toLowerCase() == kpiName.toLowerCase())
            if (kpiOption && !this.selectedKpiNames.some(k => k == kpiName)) {
                this.selectedKpiNames.push(kpiOption)
                this._checkFormChanges()
            } else {
                const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il kpi.', result: 'fail' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
            }
        }
    }

    private _deselectKpi(kpiName: string) {
        this.selectedKpiNames = this.selectedKpiNames.filter(k => k != kpiName)
        this._checkFormChanges()
    }

    setNormalizedCanale(canaleName: string) {
        const normalizedCanaleName = canaleName.substring(canaleName.indexOf(')') + 1).trim()

        this.formGroupMulti.controls.canali.patchValue(normalizedCanaleName)
    }

    private _selectCanale(canaleName: string) {
        if (canaleName != '') {
            const canaleOption = this.canaliOptions.find(co => co.toLowerCase() == canaleName.toLowerCase())

            if (canaleOption && !this.selectedCanaleNames.some(c => c == canaleName)) {
                this.selectedCanaleNames.push(canaleOption)
                this._checkFormChanges()
            } else {
                const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il canale.', result: 'fail' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
            }
        }
    }

    private _deselectCanale(canaleName: string) {
        this.selectedCanaleNames = this.selectedCanaleNames.filter(c => c != canaleName)
        this._checkFormChanges()
    }

    deselectCanaleFromHTML(piattaformaCanaleName: string) {
        this.selectedCanaleNames = this.selectedCanaleNames.filter(c => c != piattaformaCanaleName)
        this._checkFormChanges()

        const splitted = piattaformaCanaleName.split(')')
        const piattaformaName = splitted[0].replace('(', '')

        let joinedString = splitted[1]

        for (let i = 2; i < splitted.length; i++) {
            joinedString += ')' + splitted[i]
        }

        const canaleName = joinedString.trim()

        const piattaformaHierarchy: PiattaformaHierarchy | undefined = this._piattaformaHierarchies.find(ph => ph.name == piattaformaName)
        const filteredPiattaformaHierarchy: PiattaformaHierarchy | undefined = this.filteredPiattaformaHierarchies.find(ph => ph.name == piattaformaName)

        if (piattaformaHierarchy) {
            const canaleChecked: Checked | undefined = piattaformaHierarchy.canaliChecked.find(c => c.name == canaleName)
            if (canaleChecked) {
                canaleChecked.checked = false
            }

            piattaformaHierarchy.checked = false
        }
        if (filteredPiattaformaHierarchy) {
            const canaleChecked: Checked | undefined = filteredPiattaformaHierarchy.canaliChecked.find(c => c.name == canaleName)
            if (canaleChecked) {
                canaleChecked.checked = false
            }

            filteredPiattaformaHierarchy.checked = false
        }
    }

    deselectKpiFromHTML(kpiName: string) {
        this.selectedKpiNames = this.selectedKpiNames.filter(k => k != kpiName)
        this._checkFormChanges()

        const kpiCheckbox = this._kpiCheckboxes.find(k => k.name == kpiName)
        const filteredKpiCheckbox = this.filteredKpiCheckboxes.find(k => k.name == kpiName)

        if (kpiCheckbox) {
            kpiCheckbox.checked = false
        }
        if (filteredKpiCheckbox) {
            filteredKpiCheckbox.checked = false
        }
    }

    private _selectListaDatasetOption(listaDatasetOption: string) {
        if (listaDatasetOption != '') {
            const datasetOption = this.listaDatasetOptions.find(lo => lo.toLowerCase() == listaDatasetOption.toLowerCase())
            if (datasetOption && !this.selectedListaDatasetOptions.some(l => l == listaDatasetOption)) {
                const listaDatasetSelectedOptionsJoinedString = this.selectedListaDatasetOptions.join() + ',' + datasetOption
                if (listaDatasetSelectedOptionsJoinedString.length > 500) {
                    const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il dataset. Superato il limite di 500 caratteri.', result: 'fail' }
                    this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
                } else {
                    this.selectedListaDatasetOptions.push(datasetOption)
                    this._checkFormChanges()
                }
            } else {
                const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il dataset.', result: 'fail' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
            }
        }
    }

    private _deselectListaDatasetOption(listaDatasetOption: string) {
        this.selectedListaDatasetOptions = this.selectedListaDatasetOptions.filter(l => l != listaDatasetOption)
        this._checkFormChanges()
    }

    deselectListaDatasetFromHTML(listaDatasetName: string) {
        this.selectedListaDatasetOptions = this.selectedListaDatasetOptions.filter(l => l != listaDatasetName)
        this._checkFormChanges()

        const listaDatasetCheckbox = this._listaDatasetCheckboxes.find(l => l.name == listaDatasetName)
        const filteredListaDatasetCheckbox = this.filteredListaDatasetCheckboxes.find(l => l.name == listaDatasetName)

        if (listaDatasetCheckbox) {
            listaDatasetCheckbox.checked = false
        }
        if (filteredListaDatasetCheckbox) {
            filteredListaDatasetCheckbox.checked = false
        }
    }

    resetForm() {
        this.formGroup.reset(this.formGroupInitialValue)
        this.formGroupMulti.reset(this.formGroupMultiInitialValue)

        if (this.data.mode == 'create') {
            this.selectedKpiNames = []
            this.selectedCanaleNames = []
            this.selectedListaDatasetOptions = []
        } else if (this.data.mode == 'edit') {
            this.selectedKpiNames = [... this.initialSelectedKpiNames]
            this.selectedCanaleNames = [... this.initialSelectedCanaleNames]
            this.selectedListaDatasetOptions = [... this.initialSelectedListaDatasetOptions]
            this.editFormChanged = false
        }

        this._piattaformaHierarchies = JSON.parse(JSON.stringify(this._initialPiattaformaHierarchies))
        this._kpiCheckboxes = JSON.parse(JSON.stringify(this._initialKpiCheckboxes))
        this._listaDatasetCheckboxes = JSON.parse(JSON.stringify(this._initialListaDatasetCheckboxes))
    }

    private _uniqueNomeReportValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (this.data.reports.some(r => r.nomeReport?.toLowerCase() == (value as string).toLowerCase() && (this.data.mode == 'create' || r.id != this.data.reportToEdit?.id))) {
                isValid = false
            }

            return isValid ? null : { notUnique: 'Questo Nome Report è già in uso' }
        };
    }

    private _tipoOggettoValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (typeof value === 'string' && value != '') {
                isValid = this.tipoOggettoOptions.includes(value)
            }

            return isValid ? null : { invalidOption: 'Opzione non valida' }
        };
    }

    private _livelloAccessibilitaValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (typeof value === 'string' && value != '') {
                isValid = this.livelloAccessibilitaOptions.includes(value)
            }

            return isValid ? null : { invalidOption: 'Opzione non valida' }
        };
    }

    private _notBlankValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = false
            const value = control.value

            if (typeof value != 'string' || value.length == 0) {
                isValid = true
            } else {
                for (let i = 0; i < value.length && !isValid; i++) {
                    if (value.charAt(i) != ' ' && value.charAt(i) != '\n' && value.charAt(i) != '\t') {
                        isValid = true
                    }
                }
            }

            return isValid ? null : { isBlank: 'Questo campo non può contenere solo spazi' }
        };
    }

    private _nomeReportInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getNomeReportErrorMessage()

                    this.nomeReportInputError.hasError = message != ''
                    this.nomeReportInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _descReportInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getDescReportErrorMessage()

                    this.descReportInputError.hasError = message != ''
                    this.descReportInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _tipoOggettoInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getTipoOggettoErrorMessage()

                    this.tipoOggettoInputError.hasError = message != ''
                    this.tipoOggettoInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _livelloAccessibilitaInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getLivelloAccessibilitaErrorMessage()

                    this.livelloAccessibilitaInputError.hasError = message != ''
                    this.livelloAccessibilitaInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _pathReportInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getPathReportErrorMessage()

                    this.pathReportInputError.hasError = message != ''
                    this.pathReportInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _linkInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getLinkErrorMessage()

                    this.linkInputError.hasError = message != ''
                    this.linkInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _getNomeReportErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.nomeReport

        if (formControl.hasError('required')) {
            message = 'Questo campo è obbligatorio'
        } else if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 50 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        } else if (formControl.hasError('notUnique')) {
            message = formControl.getError('notUnique')
        }

        return message;
    }

    private _getTipoOggettoErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.tipoOggetto

        if (formControl.hasError('required')) {
            message = 'Questo campo è obbligatorio'
        } else if (formControl.hasError('invalidOption')) {
            message = formControl.getError('invalidOption')
        }
        
        return message;
    }

    private _getLivelloAccessibilitaErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.livelloAccessibilita

        if (formControl.hasError('required')) {
            message = 'Questo campo è obbligatorio'
        } else if (formControl.hasError('invalidOption')) {
            message = formControl.getError('invalidOption')
        }

        return message;
    }

    private _getDescReportErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.descReport

        if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        }

        return message;
    }

    private _getPathReportErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.pathReport

        if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        }

        return message;
    }

    private _getLinkErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.link

        if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        }

        return message;
    }

    create() {
        const warningFields: string[] = this._getAlreadyExistFields()
        let title = ''
        let titlebold: string | null = null
        let message = ''
        let okButtonText = ''

        if (this.startMode == 'create' && this.data.mode == 'create') {
            title = 'Crea Report'
            message = 'Stai per CREARE un Report.'
            okButtonText = 'Crea'
        } else {
            title = 'Duplica Report'
            titlebold = '#' + this.data.reportToEdit?.id
            message = 'Stai per DUPLICARE un Report.'
            okButtonText = 'Duplica'
        }

        let dialogData: MessageDialogData
        if (warningFields.length > 0) {
            dialogData = { title: title, titleBold: titlebold, message: message, okButtonText: okButtonText, okButtonColor: 'primary', secondMessage: 'I seguenti campi sono già presenti nel sistema:', list: warningFields, finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: title, titleBold: titlebold, message: message, okButtonText: okButtonText, okButtonColor: 'primary', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const normalizedCanaleNames = this.selectedCanaleNames.map(c => {
                        let norm = c.substring(c.indexOf(')') + 1)
                        norm = norm.replace(' ', '')

                        return norm
                    })
                    this.dialogRef.close(
                        {
                            operation: 'create',
                            observable: this._reportService.create({
                                nomeReport: this.formGroup.controls.nomeReport.value as string,
                                tipoOggetto: this.formGroup.controls.tipoOggetto.value as string,
                                livelloAccessibilita: this.formGroup.controls.livelloAccessibilita.value != '' ? this.formGroup.controls.livelloAccessibilita.value : null,
                                pathReport: this.formGroup.controls.pathReport.value != '' ? this.formGroup.controls.pathReport.value : null,
                                link: this.formGroup.controls.link.value != '' ? this.formGroup.controls.link.value : null,
                                descReport: this.formGroup.controls.descReport.value != '' ? this.formGroup.controls.descReport.value : null,
                                listaDataset: this.selectedListaDatasetOptions.length > 0 ? this.selectedListaDatasetOptions.join() : null,
                                kpiNames: this.selectedKpiNames,
                                canaleNames: normalizedCanaleNames
                            })
                        }
                    )
                }
            }
        })
    }

    edit() {
        const warningFields: string[] = this._getAlreadyExistFields()
        let dialogData: MessageDialogData
        if (warningFields.length > 0) {
            dialogData = { title: 'Modifica Report', titleBold: '#' + this.data.reportToEdit?.id, message: 'Stai per MODIFICARE un Report.', okButtonText: 'Modifica', okButtonColor: 'accent', secondMessage: 'I seguenti campi sono già presenti nel sistema:', list: warningFields, finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: 'Modifica Report', titleBold: '#' + this.data.reportToEdit?.id, message: 'Stai per MODIFICARE un Report.', okButtonText: 'Modifica', okButtonColor: 'accent', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const normalizedCanaleNames = this.selectedCanaleNames.map(c => {
                        let norm = c.substring(c.indexOf(')') + 1)
                        norm = norm.replace(' ', '')

                        return norm
                    })
                    this.dialogRef.close(
                        {
                            operation: 'edit',
                            observable: this._reportService.edit({
                                id: this.data.reportToEdit?.id as number,
                                nomeReport: this.formGroup.controls.nomeReport.value as string,
                                tipoOggetto: this.formGroup.controls.tipoOggetto.value as string,
                                livelloAccessibilita: this.formGroup.controls.livelloAccessibilita.value != '' ? this.formGroup.controls.livelloAccessibilita.value : null,
                                pathReport: this.formGroup.controls.pathReport.value != '' ? this.formGroup.controls.pathReport.value : null,
                                link: this.formGroup.controls.link.value != '' ? this.formGroup.controls.link.value : null,
                                descReport: this.formGroup.controls.descReport.value != '' ? this.formGroup.controls.descReport.value : null,
                                listaDataset: this.selectedListaDatasetOptions.length > 0 ? this.selectedListaDatasetOptions.join() : null,
                                kpiNames: this.selectedKpiNames,
                                canaleNames: normalizedCanaleNames
                            })
                        }
                    )
                }
            }
        })
    }

    openDeleteDialog() {
        const dialogData: MessageDialogData = { title: 'Elimina Report', titleBold: '#' + this.data.reportToEdit?.id, message: 'Stai per ELIMINARE un Report. Questa azione è irreversibile.', finalMessage: 'Sicuro di voler preseguire?', okButtonText: 'Elimina', okButtonColor: 'warn' }
        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const dialogReturnValue: DialogReturnValue = { operation: 'delete', observable: this._reportService.delete(this.data.reportToEdit?.id as number) }
                    this.dialogRef.close(dialogReturnValue)
                }
            }
        })
    }

    private _getAlreadyExistFields() {
        const fields: string[] = []
        let descReportFound = false
        let linkFound = false

        for (let i = 0; i < this.data.reports.length && (!descReportFound || !linkFound); i++) {
            if (!descReportFound && this.formGroup.controls.descReport.value && this.formGroup.controls.descReport.value.length > 0 && (this.data.mode == 'create' || this.data.reports[i].id != this.data.reportToEdit?.id) && this.data.reports[i].descReport?.toLowerCase() == this.formGroup.controls.descReport.value?.toLowerCase()) {
                fields.push('Descrizione Report')
                descReportFound = true
            }

            if (!linkFound && this.formGroup.controls.link.value && this.formGroup.controls.link.value.length > 0 && (this.data.mode == 'create' || this.data.reports[i].id != this.data.reportToEdit?.id) && this.data.reports[i].link?.toLowerCase() == this.formGroup.controls.link.value.toLowerCase()) {
                fields.push('Link')
                linkFound = true
            }
        }

        return fields
    }

    changeMode() {
        if (this.data.mode == 'create') {
            this.data.mode = 'edit'
            this.title = 'Modifica Report'
            this.formGroup.reset(this.formGroup.value)
            this.formGroup.markAllAsTouched()
        } else {
            this.data.mode = 'create'
            this.title = 'Duplica Report'
            this.formGroup.reset(this.formGroup.value)
            this.formGroup.markAllAsTouched()
        }
    }

    addTab(input: HTMLInputElement | HTMLTextAreaElement, control: FormControl) {
        const cursorOffset = input.selectionStart as number
        const firstHalf = input.value.substring(0, cursorOffset)
        const secondHalf = input.value.substring(cursorOffset)
        input.value = firstHalf + String.fromCharCode(9) + secondHalf

        const newCursorOffset = (firstHalf + String.fromCharCode(9)).length
        input.selectionStart = input.selectionEnd = newCursorOffset

        control.setValue(input.value)
    }

    private _initializePiattaformaHierarchy() {

        this.data.canalePiattaformaNames.forEach(cp => {
            const foundValue: PiattaformaHierarchy | undefined = this._piattaformaHierarchies.find(ph => ph.name == cp.nomePiattaforma)

            const newCanaleChecked: Checked = { name: cp.nomeCanale, checked: this.data.reportToEdit?.canali.some(c => c.nomeCanale == cp.nomeCanale) as boolean }
            if (foundValue) {
                foundValue.canaliChecked.push(newCanaleChecked)
            } else {
                this._piattaformaHierarchies.push({ name: cp.nomePiattaforma, canaliChecked: [newCanaleChecked], checked: false })
            }
        })

        this._piattaformaHierarchies.forEach(ph => {
            ph.checked = this._areAllCanaliChecked(ph.name)
        })

        this._initialPiattaformaHierarchies = JSON.parse(JSON.stringify(this._piattaformaHierarchies))
        this.filteredPiattaformaHierarchies = JSON.parse(JSON.stringify(this._piattaformaHierarchies))
    }

    private _initializeKpiCheckboxes() {
        this.data.kpiNames.forEach(kName => {
            const newKpiChecked: Checked = { name: kName, checked: this.data.reportToEdit?.kpis.some(k => k.nomeKpi == kName)! }
            this._kpiCheckboxes.push(newKpiChecked)
        })
        this._initialKpiCheckboxes = JSON.parse(JSON.stringify(this._kpiCheckboxes))
        this.filteredKpiCheckboxes = JSON.parse(JSON.stringify(this._kpiCheckboxes))
    }

    private _initializeListaDatasetCheckboxes() {
        this.listaDatasetOptions.forEach(lName => {
            const newListaDatasetChecked: Checked = { name: lName, checked: this.data.reportToEdit?.listaDatasetArray?.some(l => l == lName)! }
            this._listaDatasetCheckboxes.push(newListaDatasetChecked)
        })
        this._initialListaDatasetCheckboxes = JSON.parse(JSON.stringify(this._listaDatasetCheckboxes))
        this.filteredListaDatasetCheckboxes = JSON.parse(JSON.stringify(this._listaDatasetCheckboxes))
    }

    private _areAllCanaliChecked(piattaformaName: string) {
        const piattaformaHierarchy: PiattaformaHierarchy | undefined = this._piattaformaHierarchies.find(ph => ph.name == piattaformaName)
        if (piattaformaHierarchy) {
            return piattaformaHierarchy.canaliChecked.every(c => c.checked == true)
        } else {
            return false
        }
    }

    checkAllCanali(event: MatCheckboxChange, piattaformaName: string) {
        const piattaformaHierarchy: PiattaformaHierarchy | undefined = this._piattaformaHierarchies.find(ph => ph.name == piattaformaName)
        const filteredPiattaformaHierarchy: PiattaformaHierarchy | undefined = this.filteredPiattaformaHierarchies.find(ph => ph.name == piattaformaName)

        if (piattaformaHierarchy && filteredPiattaformaHierarchy) {
            piattaformaHierarchy.checked = event.checked
            filteredPiattaformaHierarchy.checked = event.checked

            piattaformaHierarchy.canaliChecked.forEach(c => c.checked = event.checked)
            filteredPiattaformaHierarchy.canaliChecked.forEach(c => c.checked = event.checked)

            piattaformaHierarchy.canaliChecked.forEach(ck => {
                const canaleOption = this.canaliOptions.find(co => {

                    const splitted = co.split(')')
                    let joinedString = splitted[1]

                    for (let i = 2; i < splitted.length; i++) {
                        joinedString += ')' + splitted[i]
                    }

                    return joinedString.trim() == ck.name
                })

                if (piattaformaHierarchy.checked) {
                    if (canaleOption && !this.selectedCanaleNames.some(c => c == canaleOption)) {
                        this._selectCanale(canaleOption)
                    }
                } else {
                    if (canaleOption && this.selectedCanaleNames.some(c => c == canaleOption)) {
                        this._deselectCanale(canaleOption)
                    }
                }
            })
            filteredPiattaformaHierarchy.canaliChecked.forEach(ck => {
                const canaleOption = this.canaliOptions.find(co => {

                    const splitted = co.split(')')
                    let joinedString = splitted[1]

                    for (let i = 2; i < splitted.length; i++) {
                        joinedString += ')' + splitted[i]
                    }

                    return joinedString.trim() == ck.name
                })

                if (piattaformaHierarchy.checked) {
                    if (canaleOption && !this.selectedCanaleNames.some(c => c == canaleOption)) {
                        this._selectCanale(canaleOption)
                    }
                } else {
                    if (canaleOption && this.selectedCanaleNames.some(c => c == canaleOption)) {
                        this._deselectCanale(canaleOption)
                    }
                }
            })
        }
    }

    checkCanale(event: MatCheckboxChange, piattaformaName: string, canaleName: string) {
        const piattaformaHierarchy: PiattaformaHierarchy | undefined = this._piattaformaHierarchies.find(ph => ph.name == piattaformaName)
        const filteredPiattaformaHierarchy: PiattaformaHierarchy | undefined = this.filteredPiattaformaHierarchies.find(ph => ph.name == piattaformaName)

        if (piattaformaHierarchy && filteredPiattaformaHierarchy) {
            const canaleChecked: Checked | undefined = piattaformaHierarchy.canaliChecked.find(c => c.name == canaleName)
            const filteredCanaleChecked: Checked | undefined = filteredPiattaformaHierarchy.canaliChecked.find(c => c.name == canaleName)

            if (canaleChecked && filteredCanaleChecked) {
                canaleChecked.checked = event.checked
                filteredCanaleChecked.checked = event.checked

                if (piattaformaHierarchy.canaliChecked.every(c => c.checked == true)) {
                    piattaformaHierarchy.checked = true
                } else {
                    piattaformaHierarchy.checked = false
                }

                if (filteredPiattaformaHierarchy.canaliChecked.every(c => c.checked == true)) {
                    filteredPiattaformaHierarchy.checked = true
                } else {
                    filteredPiattaformaHierarchy.checked = false
                }

                const canaleOption = this.canaliOptions.find(co => {
                    const splitted = co.split(')')

                    let joinedString = splitted[1]

                    for (let i = 2; i < splitted.length; i++) {
                        joinedString += ')' + splitted[i]
                    }

                    return joinedString.trim() == canaleName
                })

                if (canaleChecked.checked) {
                    this._selectCanale(canaleOption ? canaleOption : '')
                } else {
                    this._deselectCanale(canaleOption ? canaleOption : '')
                }
            }
        }
    }

    checkKpi(event: MatCheckboxChange, kpiName: string) {
        const kpiCheckbox = this._kpiCheckboxes.find(k => k.name == kpiName)
        const filteredKpiCheckbox = this.filteredKpiCheckboxes.find(k => k.name == kpiName)

        if (kpiCheckbox && filteredKpiCheckbox) {
            kpiCheckbox.checked = event.checked
            filteredKpiCheckbox.checked = event.checked

            if (kpiCheckbox.checked) {
                this._selectKpi(kpiName)
            } else {
                this._deselectKpi(kpiName)
            }
        }
    }

    checkListaDataset(event: MatCheckboxChange, listaDatasetName: string) {
        const listaDatasetCheckbox = this._listaDatasetCheckboxes.find(l => l.name == listaDatasetName)
        const filteredListaDatasetCheckbox = this.filteredListaDatasetCheckboxes.find(l => l.name == listaDatasetName)

        if (listaDatasetCheckbox && filteredListaDatasetCheckbox) {
            listaDatasetCheckbox.checked = event.checked
            filteredListaDatasetCheckbox.checked = event.checked

            if (listaDatasetCheckbox.checked) {
                this._selectListaDatasetOption(listaDatasetName)
            } else {
                this._deselectListaDatasetOption(listaDatasetName)
            }
        }
    }

    isOneAtLeastPresentCanale(piattaformaName: string) {
        return this._piattaformaHierarchies.find(ph => ph.name == piattaformaName)?.canaliChecked.some(c => c.name.toLowerCase().includes(this.formGroupMulti.controls.canali.value?.toLowerCase() as string))
    }

    filterListaDatasetCheckboxes() {
        this.filteredListaDatasetCheckboxes = this._listaDatasetCheckboxes.filter(l => l.name.toLowerCase().includes(this.formGroupMulti.controls.listaDataset.value?.toLowerCase()!))
    }

    filterKpiCheckboxes() {
        this.filteredKpiCheckboxes = this._kpiCheckboxes.filter(k => k.name.toLowerCase().includes(this.formGroupMulti.controls.kpis.value?.toLowerCase()!))
    }

    filterPiattaformaHierarchies() {
        this.filteredPiattaformaHierarchies = this._piattaformaHierarchies.filter(ph => this.formGroupMulti.controls.canali.value == '' || ph.name.toLowerCase().includes(this.formGroupMulti.controls.canali.value?.toLowerCase()!) || this.isOneAtLeastPresentCanale(ph.name))
        this.filteredPiattaformaHierarchies.forEach(ph => {
            ph.canaliChecked = ph.canaliChecked.filter(c => c.name.toLowerCase().includes(this.formGroupMulti.controls.canali.value?.toLowerCase()!) || ph.name.toLowerCase().includes(this.formGroupMulti.controls.canali.value?.toLowerCase()!))
        })
    }
}

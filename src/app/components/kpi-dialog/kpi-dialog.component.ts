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
import { KpiDialogData } from '../../../ts/interfaces/dialog/KpiDialogData';
import { MessageDialogData } from '../../../ts/interfaces/dialog/MessageDialogData';
import { CriterioDto } from '../../../ts/interfaces/dtos/criterio/CriterioDto';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { AuthService } from '../../services/auth-service/auth.service';
import { KpiService } from '../../services/kpi-service/kpi.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import { CheckedExtracted } from '../../../ts/interfaces/generals/CheckedExtracted';
import { InputError } from '../../../ts/interfaces/generals/InputError';

@Component({
    selector: 'app-kpi-dialog',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, ReactiveFormsModule, MatAutocompleteModule, AsyncPipe, MatIconModule, MatTooltipModule, MatSlideToggleModule, ScrollingModule, MatCheckboxModule],
    templateUrl: './kpi-dialog.component.html',
    styleUrl: './kpi-dialog.component.scss'
})
export class KpiDialogComponent implements OnDestroy {
    title: string = ''

    criteriOptions: string[] = []
    categoriaKpiOptions: string[] = []
    uMKpiOptions: string[] = []

    criteriFilteredOptions!: Observable<string[]>
    categoriaKpiFilteredOptions!: Observable<string[]>
    uMKpiFilteredOptions!: Observable<string[]>

    selectedCriteriOptions: string[] = []

    private _criterioCheckboxes: CheckedExtracted[] = []
    private _initialCriterioCheckboxes: CheckedExtracted[] = []
    filteredCriterioCheckboxes: CheckedExtracted[] = []
    criteriOpened: boolean = false

    nomeKpiInputError: InputError = { hasError: false, message: '' }
    descKpiInputError: InputError = { hasError: false, message: '' }
    categoriaKpiInputError: InputError = { hasError: false, message: '' }
    uMKpiInputError: InputError = { hasError: false, message: '' }
    benchmarkInputError: InputError = { hasError: false, message: '' }

    formGroup = new FormGroup({
        nomeKpi: new FormControl<string>('', [Validators.required, Validators.maxLength(50), this._notBlankValidator(), this._uniqueNomeKpiValidator(), this._nomeKpiInputErrorSender()]),
        descKpi: new FormControl<string>('', [Validators.maxLength(500), this._notBlankValidator(), this._descKpiInputErrorSender()]),
        categoriaKpi: new FormControl<string>('', [this._categoriaKpiValidator(), this._categoriaKpiInputErrorSender()]),
        uMKpi: new FormControl<string>('', [this._uMKpiValidator(), this._uMKpiInputErrorSender()]),
        benchmark: new FormControl<string>('', [Validators.maxLength(500), this._notBlankValidator(), this._benchmarkInputErrorSender()]),
    })

    formGroupMulti = new FormGroup({
        criteri: new FormControl<string>(''),
    })
    formGroupInitialValue!: any
    formGroupMultiInitialValue!: any
    initialSelectedCriterioOptions: string[] = []
    editFormChanged = false
    startMode: 'create' | 'edit'

    constructor(public dialogRef: MatDialogRef<KpiDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: KpiDialogData, private _kpiService: KpiService, public authService: AuthService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
        this.startMode = data.mode

        this._initializeCategoriaKpiOptions()
        this._initalizeUMKpiOptions()
        this._initializeCriteriOptions()

        this._initializeCriterioCheckboxes()

        if (data.mode == 'create') {
            this.title = 'Crea Kpi'
        } else {
            if(authService.isAdmin) {
                this.title = 'Modifica Kpi'
            } else {
                this.title = 'Vista Kpi'
            }

            this.formGroup.controls.nomeKpi.setValue(data.kpiToEdit?.nomeKpi ? data.kpiToEdit.nomeKpi : '')
            this.formGroup.controls.descKpi.setValue(data.kpiToEdit?.descKpi ? data.kpiToEdit.descKpi : '')
            this.formGroup.controls.categoriaKpi.setValue(data.kpiToEdit?.categoriaKpi ? data.kpiToEdit.categoriaKpi : '')
            this.formGroup.controls.uMKpi.setValue(data.kpiToEdit?.umKpi ? data.kpiToEdit.umKpi : '')
            this.formGroup.controls.benchmark.setValue(data.kpiToEdit?.benchmark ? data.kpiToEdit.benchmark : '')

            this._initializeSelectedCriteriOptions(data.kpiToEdit?.criteri)
            this.initialSelectedCriterioOptions = [... this.selectedCriteriOptions]

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
        if (JSON.stringify(this.formGroupInitialValue) == JSON.stringify(this.formGroup.value) && JSON.stringify(this.initialSelectedCriterioOptions) == JSON.stringify(this.selectedCriteriOptions)) {
            this.editFormChanged = false
        } else {
            this.editFormChanged = true
        }
    }

    private _filterOptionsToLowerCase(value: string, arrayToBeFiltered: string[]): string[] {
        const filterValue = value.toLowerCase();

        return arrayToBeFiltered.filter(option => option.toLowerCase().includes(filterValue));
    }

    private _filterCriteriOptions(value: string, criterioNames: string[]): string[] {
        const filterValue = value.toLowerCase();

        return criterioNames.filter(kpiName => kpiName.toLowerCase().includes(filterValue) && !this.selectedCriteriOptions.some(sk => sk == kpiName));
    }

    private _initializeCategoriaKpiOptions() {
        const categoriaKpiEnum = this.data.enums.find(e => e.fieldName == 'CategoriaKpi')
        if (categoriaKpiEnum) {
            this.categoriaKpiOptions = categoriaKpiEnum.values

            this.categoriaKpiOptions.sort((a, b) => a.localeCompare(b))
        }

        this.categoriaKpiFilteredOptions = this.formGroup.controls.categoriaKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.categoriaKpiOptions)),
        );
    }

    private _initalizeUMKpiOptions() {
        const uMKpiEnum = this.data.enums.find(e => e.fieldName == 'UMKpi')
        if (uMKpiEnum) {
            this.uMKpiOptions = uMKpiEnum.values

            this.uMKpiOptions.sort((a, b) => a.localeCompare(b))
        }

        this.uMKpiFilteredOptions = this.formGroup.controls.uMKpi.valueChanges.pipe(
            startWith(''),
            map(value => this._filterOptionsToLowerCase((value || ''), this.uMKpiOptions)),
        );
    }

    private _initializeCriteriOptions() {
        this.criteriOptions = this.data.criterioNames

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

        this.criteriFilteredOptions = this.formGroupMulti.controls.criteri.valueChanges.pipe(
            startWith(''),
            map(value => this._filterCriteriOptions((value || ''), this.criteriOptions)),
        );
    }

    private _initializeSelectedCriteriOptions(criteri: CriterioDto[] | null | undefined) {
        criteri?.forEach(c => {
            const idDesc = `(${c.id}) ${c.descCriterio}`
            if (idDesc && !this.selectedCriteriOptions.includes(idDesc)) {
                this.selectedCriteriOptions.push(idDesc)
            }
        })
    }

    private _selectCriterio(criterioName: string) {
        if (criterioName != '') {
            const criterioOption = this.criteriOptions.find(co => co.toLowerCase() == criterioName.toLowerCase())
            if (criterioOption && !this.selectedCriteriOptions.some(c => c == criterioName)) {
                this.selectedCriteriOptions.push(criterioOption)
                this._checkFormChanges()
            } else {
                const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il criterio.', result: 'fail' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
            }
        }
    }

    private _deselectCriterio(criterioName: string) {
        this.selectedCriteriOptions = this.selectedCriteriOptions.filter(k => k != criterioName)
        this._checkFormChanges()
    }

    resetForm() {
        this.formGroup.reset(this.formGroupInitialValue)
        this.formGroupMulti.reset(this.formGroupMultiInitialValue)

        if (this.data.mode == 'create') {
            this.selectedCriteriOptions = []
        } else if (this.data.mode == 'edit') {
            this.selectedCriteriOptions = [... this.initialSelectedCriterioOptions]
            this.editFormChanged = false
        }

        this._criterioCheckboxes = JSON.parse(JSON.stringify(this._initialCriterioCheckboxes))
    }

    private _uniqueNomeKpiValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (this.data.kpis.some(k => k.nomeKpi?.toLowerCase() == (value as string).toLowerCase() && (this.data.mode == 'create' || k.id != this.data.kpiToEdit?.id))) {
                isValid = false
            }

            return isValid ? null : { notUnique: 'Questo Nome Kpi è già in uso' }
        };
    }

    private _categoriaKpiValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (typeof value === 'string' && value != '') {
                isValid = this.categoriaKpiOptions.includes(value)
            }

            return isValid ? null : { invalidOption: 'Opzione non valida' }
        };
    }

    private _uMKpiValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (typeof value === 'string' && value != '') {
                isValid = this.uMKpiOptions.includes(value)
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

    private _nomeKpiInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getNomeKpiErrorMessage()

                    this.nomeKpiInputError.hasError = message != ''
                    this.nomeKpiInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _descKpiInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getDescKpiErrorMessage()

                    this.descKpiInputError.hasError = message != ''
                    this.descKpiInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _categoriaKpiInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getCategoriaKpiErrorMessage()

                    this.categoriaKpiInputError.hasError = message != ''
                    this.categoriaKpiInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _uMKpiInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getUMKpiErrorMessage()

                    this.uMKpiInputError.hasError = message != ''
                    this.uMKpiInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _benchmarkInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getBenchmarkErrorMessage()

                    this.benchmarkInputError.hasError = message != ''
                    this.benchmarkInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _getNomeKpiErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.nomeKpi

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

    private _getDescKpiErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.descKpi

        if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        }

        return message;
    }

    private _getCategoriaKpiErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.categoriaKpi

        if (formControl.hasError('invalidOption')) {
            message = formControl.getError('invalidOption')
        }

        return message;
    }

    private _getUMKpiErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.uMKpi

        if (formControl.hasError('invalidOption')) {
            message = formControl.getError('invalidOption')
        }

        return message;
    }

    private _getBenchmarkErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.benchmark

        if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        }

        return message;
    }

    private _getAlreadyExistFields() {
        const fields: string[] = []
        let descKpiFound = false

        for (let i = 0; i < this.data.kpis.length && !descKpiFound; i++) {
            if (!descKpiFound && this.formGroup.controls.descKpi.value && this.formGroup.controls.descKpi.value.length > 0 && (this.data.mode == 'create' || this.data.kpis[i].id != this.data.kpiToEdit?.id) && this.data.kpis[i].descKpi?.toLowerCase() == this.formGroup.controls.descKpi.value?.toLowerCase()) {
                fields.push('Descrizione Kpi')
                descKpiFound = true
            }
        }

        return fields
    }

    create() {
        const warningFields: string[] = this._getAlreadyExistFields()
        let title = ''
        let titleBold : string | null = null
        let message = ''
        let okButtonText = ''
        if (this.startMode == 'create' && this.data.mode == 'create') {
            title = 'Crea Kpi'
            message = 'Stai per CREARE un Kpi.'
            okButtonText = 'Crea'
        } else {
            title = 'Duplica Kpi'
            titleBold = '#' + this.data.kpiToEdit?.id
            message = 'Stai per DUPLICARE un Kpi.'
            okButtonText = 'Duplica'
        }
        let dialogData: MessageDialogData
        if (warningFields.length > 0) {
            dialogData = { title: title, titleBold: titleBold, message: message, okButtonText: okButtonText, okButtonColor: 'primary', secondMessage: 'I seguenti campi sono già presenti nel sistema:', list: warningFields, finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: title, titleBold: titleBold, message: message, okButtonText: okButtonText, okButtonColor: 'primary', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const criterioIds: number[] = this.selectedCriteriOptions.map(c => {
                        const splitted = c.split(')')
                        const normalized = splitted[0].replace('(', '')
                        return parseInt(normalized)
                    })
                    this.dialogRef.close(
                        {
                            operation: 'create',
                            observable: this._kpiService.create({
                                nomeKpi: this.formGroup.controls.nomeKpi.value as string,
                                descKpi: this.formGroup.controls.descKpi.value != '' ? this.formGroup.controls.descKpi.value : null,
                                categoriaKpi: this.formGroup.controls.categoriaKpi.value != '' ? this.formGroup.controls.categoriaKpi.value : null,
                                uMKpi: this.formGroup.controls.uMKpi.value != '' ? this.formGroup.controls.uMKpi.value : null,
                                benchmark: this.formGroup.controls.benchmark.value != '' ? this.formGroup.controls.benchmark.value : null,
                                criterioIds: criterioIds
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
            dialogData = { title: 'Modifica Kpi', titleBold: '#' + this.data.kpiToEdit?.id, message: 'Stai per MODIFICARE un Kpi.', secondMessage: 'I seguenti campi sono già presenti nel sistema:', okButtonText: 'Modifica', okButtonColor: 'accent', list: warningFields, finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: 'Modifica Kpi', titleBold: '#' + this.data.kpiToEdit?.id, message: 'Stai per MODIFICARE un Kpi.', okButtonText: 'Modifica', okButtonColor: 'accent', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const criterioIds: number[] = this.selectedCriteriOptions.map(c => {
                        const splitted = c.split(')')
                        const normalized = splitted[0].replace('(', '')
                        return parseInt(normalized)
                    })
                    this.dialogRef.close(
                        {
                            operation: 'edit',
                            observable: this._kpiService.edit({
                                id: this.data.kpiToEdit?.id as number,
                                nomeKpi: this.formGroup.controls.nomeKpi.value as string,
                                descKpi: this.formGroup.controls.descKpi.value != '' ? this.formGroup.controls.descKpi.value : null,
                                categoriaKpi: this.formGroup.controls.categoriaKpi.value != '' ? this.formGroup.controls.categoriaKpi.value : null,
                                uMKpi: this.formGroup.controls.uMKpi.value != '' ? this.formGroup.controls.uMKpi.value : null,
                                benchmark: this.formGroup.controls.benchmark.value != '' ? this.formGroup.controls.benchmark.value : null,
                                criterioIds: criterioIds
                            })
                        }
                    )
                }
            }
        })
    }

    openDeleteDialog() {
        const dialogData: MessageDialogData = { title: 'Elimina Kpi', titleBold: '#' + this.data.kpiToEdit?.id, message: 'Stai per ELIMINARE un Kpi. Questa azione è irreversibile.', finalMessage: 'Sicuro di voler proseguire?', okButtonText: 'Elimina', okButtonColor: 'warn' }
        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const dialogReturnValue: DialogReturnValue = { operation: 'delete', observable: this._kpiService.delete(this.data.kpiToEdit?.id as number) }
                    this.dialogRef.close(dialogReturnValue)
                }
            }
        })
    }

    changeMode() {
        if (this.data.mode == 'create') {
            this.data.mode = 'edit'
            this.title = 'Modifica Kpi'
            this.formGroup.reset(this.formGroup.value)
            this.formGroup.markAllAsTouched()
        } else {
            this.data.mode = 'create'
            this.title = 'Duplica Kpi'
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

    private _initializeCriterioCheckboxes() {
        this.data.criterioNames.forEach(cName => {
            const newCriterioChecked: CheckedExtracted = { name: cName, checked: this.data.kpiToEdit?.criteri.some(c => `(${c.id}) ${c.descCriterio}` == cName)!, extractedId: this._extractIdFromCriterio(cName), extractedName: this._extractDescCriterioFromCriterio(cName) }
            this._criterioCheckboxes.push(newCriterioChecked)
        })
        this._initialCriterioCheckboxes = JSON.parse(JSON.stringify(this._criterioCheckboxes))
        this.filteredCriterioCheckboxes = JSON.parse(JSON.stringify(this._criterioCheckboxes))
    }

    checkCriterio(event: MatCheckboxChange, criterioName: string) {
        const criterioCheckbox = this._criterioCheckboxes.find(c => c.name == criterioName)
        const filteredCriterioCheckbox = this.filteredCriterioCheckboxes.find((c => c.name == criterioName))

        if (criterioCheckbox && filteredCriterioCheckbox) {
            criterioCheckbox.checked = event.checked
            filteredCriterioCheckbox.checked = event.checked

            if (criterioCheckbox.checked) {
                this._selectCriterio(criterioName)
            } else {
                this._deselectCriterio(criterioName)
            }
        }
    }

    deselectCriterioFromHTML(criterioName: string) {
        this.selectedCriteriOptions = this.selectedCriteriOptions.filter(c => c != criterioName)
        this._checkFormChanges()

        const criterioCheckbox = this._criterioCheckboxes.find(c => c.name == criterioName)
        const filteredCriterioCheckbox = this.filteredCriterioCheckboxes.find(c => c.name == criterioName)

        if (criterioCheckbox) {
            criterioCheckbox.checked = false
        }
        if (filteredCriterioCheckbox) {
            filteredCriterioCheckbox.checked = false
        }
    }

    private _extractIdFromCriterio(criterio: string) {
        const splitted = criterio.split(')')
        return splitted[0].replace('(', '')
    }

    private _extractDescCriterioFromCriterio(criterio: string) {
        const splitted = criterio.split(')')
        let joinedString = splitted[1]

        for(let i = 2; i < splitted.length; i++) {
            joinedString += ')' + splitted[i]
        }

        return joinedString
    }

    filterCriterio() {
        this.filteredCriterioCheckboxes = this._criterioCheckboxes.filter( c => c.name.toLowerCase().includes(this.formGroupMulti.controls.criteri.value?.toLowerCase()!))
    }
}

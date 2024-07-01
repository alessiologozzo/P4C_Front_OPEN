import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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
import { CriterioDialogData } from '../../../ts/interfaces/dialog/CriterioDialogData';
import { DialogReturnValue } from '../../../ts/interfaces/dialog/DialogReturnValue';
import { MessageDialogData } from '../../../ts/interfaces/dialog/MessageDialogData';
import { SnackBarData } from '../../../ts/interfaces/snack-bar/SnackBarData';
import { AuthService } from '../../services/auth-service/auth.service';
import { CriterioService } from '../../services/criterio-service/criterio.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { SnackBarComponent } from '../snack-bar/snack-bar.component';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { CheckedExtracted } from '../../../ts/interfaces/generals/CheckedExtracted';
import { InputError } from '../../../ts/interfaces/generals/InputError';

@Component({
    selector: 'app-criterio-dialog',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, ReactiveFormsModule, MatAutocompleteModule, AsyncPipe, MatIconModule, MatTooltipModule, MatSlideToggleModule, ScrollingModule, MatCheckboxModule],
    templateUrl: './criterio-dialog.component.html',
    styleUrl: './criterio-dialog.component.scss'
})
export class CriterioDialogComponent implements OnDestroy {
    title: string = ''
    tipoCriterioOptions: string[] = []
    kpiOrigineOptions: string[] = []

    tipoCriterioFilteredOptions!: Observable<string[]>
    kpiOrigineFilteredOptions!: Observable<string[]>

    selectedKpiOrigineOptions: string[] = []

    private _kpiOrigineCheckboxes: CheckedExtracted[] = []
    private _initialKpiOrigineCheckboxes: CheckedExtracted[] = []
    filteredKpiOrigineCheckboxes: CheckedExtracted[] = []
    kpiOrigineOpened: boolean = false

    dettaglioCriterioInputError: InputError = { hasError: false, message: '' }
    descCriterioInputError: InputError = { hasError: false, message: '' }
    tipoCriterioInputError: InputError = { hasError: false, message: '' }

    formGroup = new FormGroup({
        dettaglioCriterio: new FormControl<string>('', [Validators.required, Validators.maxLength(40000), this._notBlankValidator(), this._uniqueDettaglioCriterioValidator(), this._dettaglioCriterioInputErrorSender()]),
        descCriterio: new FormControl<string>('', [Validators.required, Validators.maxLength(500), this._notBlankValidator(), this._uniqueDescCriterio(), this._descCriterioInputErrorSender()]),
        tipoCriterio: new FormControl<string>('', [this._tipoCriterioValidator(), this._tipoCriterioInputErrorSender()])
    })

    formGroupMulti = new FormGroup({
        kpiOrigine: new FormControl<string>('')
    })
    formGroupInitialValue!: any
    formGroupMultiInitialValue!: any
    initialSelectedKpiOrigineOptions: string[] = []
    editFormChanged = false
    startMode: 'create' | 'edit'

    constructor(public dialogRef: MatDialogRef<CriterioDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: CriterioDialogData, private _criterioService: CriterioService, public authService: AuthService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
        this.startMode = this.data.mode

        this._initializeKpiOrigineOptions()
        this._initializeTipoCriterioOptions()

        this._initializeKpiOrigineCheckboxes()

        if (data.mode == 'create') {
            this.title = 'Crea Criterio'
        } else {
            if (authService.isAdmin) {
                this.title = 'Modifica Criterio'
            } else {
                this.title = 'Vista Criterio'
            }

            this.formGroup.controls.dettaglioCriterio.setValue(data.criterioToEdit?.dettaglioCriterio ? data.criterioToEdit.dettaglioCriterio : '')
            this.formGroup.controls.descCriterio.setValue(data.criterioToEdit?.descCriterio ? data.criterioToEdit.descCriterio : '')
            this.formGroup.controls.tipoCriterio.setValue(data.criterioToEdit?.tipoCriterio ? data.criterioToEdit.tipoCriterio : '')

            this._initializeSelectedKpiOrigineOptions(data.criterioToEdit?.kpiOrigine)
            this.initialSelectedKpiOrigineOptions = [... this.selectedKpiOrigineOptions]

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
        if (JSON.stringify(this.formGroupInitialValue) == JSON.stringify(this.formGroup.value) && JSON.stringify(this.initialSelectedKpiOrigineOptions) == JSON.stringify(this.selectedKpiOrigineOptions)) {
            this.editFormChanged = false
        } else {
            this.editFormChanged = true
        }
    }

    private _filterOptionsToLowerCase(value: string, arrayToBeFiltered: string[]): string[] {
        const filterValue = value.toLowerCase();

        return arrayToBeFiltered.filter(option => option.toLowerCase().includes(filterValue));
    }

    private _filterKpiOrigineOptions(value: string, kpiOrigineNames: string[]): string[] {
        const filterValue = value.toLowerCase();

        return kpiOrigineNames.filter(origineName => origineName.toLowerCase().includes(filterValue) && !this.selectedKpiOrigineOptions.some(o => o == origineName));
    }

    private _initializeTipoCriterioOptions() {
        const tipoCriterioEnum = this.data.enum
        if (tipoCriterioEnum) {
            this.tipoCriterioOptions = tipoCriterioEnum.values

            this.tipoCriterioOptions.sort((a, b) => a.localeCompare(b))

            this.tipoCriterioFilteredOptions = this.formGroup.controls.tipoCriterio.valueChanges.pipe(
                startWith(''),
                map(value => this._filterOptionsToLowerCase((value || ''), this.tipoCriterioOptions)),
            );
        }
    }

    private _initializeKpiOrigineOptions() {
        this.data.kpiIdNames.forEach(kpiIdName => {
            const idName = `(${kpiIdName.id}) ${kpiIdName.name}`
            if (!this.kpiOrigineOptions.includes(idName)) {
                this.kpiOrigineOptions.push(idName)
            }
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

        this.kpiOrigineFilteredOptions = this.formGroupMulti.controls.kpiOrigine.valueChanges.pipe(
            startWith(''),
            map(value => this._filterKpiOrigineOptions((value || ''), this.kpiOrigineOptions)),
        );
    }

    private _initializeSelectedKpiOrigineOptions(kpiOrigine: string | null | undefined) {
        const splitted = kpiOrigine?.split(',')

        if (splitted) {
            splitted.forEach(id => {
                for (let i = 0; i < this.kpiOrigineOptions.length; i++) {
                    if (this.kpiOrigineOptions[i].includes(`(${id})`)) {
                        this.selectedKpiOrigineOptions.push(this.kpiOrigineOptions[i])
                    }
                }
            })
        }

        this.selectedKpiOrigineOptions.sort((a, b) => {
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
    }

    private _selectKpiOrigine(kpiOrigine: string) {
        if (kpiOrigine != '') {
            const kpiOrigineOption = this.kpiOrigineOptions.find(o => o.toLowerCase() == kpiOrigine.toLowerCase())
            if (kpiOrigineOption && !this.selectedKpiOrigineOptions.some(s => s == kpiOrigine)) {
                this.selectedKpiOrigineOptions.push(kpiOrigineOption)
                this._checkFormChanges()
            } else {
                const snackBarData: SnackBarData = { message: 'Impossibile aggiungere il kpi di origine.', result: 'fail' }
                this._snackBar.openFromComponent(SnackBarComponent, { data: snackBarData, duration: SNACK_BAR_SHORT_DURATION });
            }
        }
    }

    private _deselectKpiOrigine(kpiOrigine: string) {
        this.selectedKpiOrigineOptions = this.selectedKpiOrigineOptions.filter(o => o != kpiOrigine)
        this._checkFormChanges()
    }

    resetForm() {
        this.formGroup.reset(this.formGroupInitialValue)
        this.formGroupMulti.reset(this.formGroupMultiInitialValue)

        if (this.data.mode == 'create') {
            this.selectedKpiOrigineOptions = []
        } else if (this.data.mode == 'edit') {
            this.selectedKpiOrigineOptions = [... this.initialSelectedKpiOrigineOptions]
            this.editFormChanged = false
        }

        this._kpiOrigineCheckboxes = JSON.parse(JSON.stringify(this._initialKpiOrigineCheckboxes))
    }

    private _uniqueDettaglioCriterioValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (this.data.criteri.some(c => c.dettaglioCriterio?.toLowerCase() == (value as string).toLowerCase() && (this.data.mode == 'create' || c.id != this.data.criterioToEdit?.id))) {
                isValid = false
            }

            return isValid ? null : { notUnique: 'Questo Dettaglio Criterio è già in uso' }
        };
    }

    private _uniqueDescCriterio(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (this.data.criteri.some(c => c.descCriterio?.toLowerCase() == (value as string).toLowerCase() && (this.data.mode == 'create' || c.id != this.data.criterioToEdit?.id))) {
                isValid = false
            }
            return isValid ? null : { notUnique: 'Questa Descrizione Criterio è già in uso' }
        };
    }

    private _tipoCriterioValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let isValid: boolean = true
            const value = control.value

            if (typeof value === 'string' && value != '') {
                isValid = this.tipoCriterioOptions.includes(value)
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

    private _dettaglioCriterioInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getDettaglioCriterioErrorMessage()

                    this.dettaglioCriterioInputError.hasError = message != ''
                    this.dettaglioCriterioInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _descCriterioInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getDescCriterioMessage()

                    this.descCriterioInputError.hasError = message != ''
                    this.descCriterioInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _tipoCriterioInputErrorSender(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (this.formGroup) {
                setTimeout(() => {
                    const message = this._getTipoCriterioErrorMessage()

                    this.tipoCriterioInputError.hasError = message != ''
                    this.tipoCriterioInputError.message = message
                }, 1)
            }

            return null
        };
    }

    private _getDettaglioCriterioErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.dettaglioCriterio

        if (formControl.hasError('required')) {
            message = 'Questo campo è obbligatorio'
        } else if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 40000 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        } else if (formControl.hasError('notUnique')) {
            message = formControl.getError('notUnique')
        }

        return message;
    }

    private _getDescCriterioMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.descCriterio

        if (formControl.hasError('required')) {
            message = 'Questo campo è obbligatorio'
        } else if (formControl.hasError('maxlength')) {
            message = 'Questo campo può contenere al massimo 500 caratteri'
        } else if (formControl.hasError('isBlank')) {
            message = formControl.getError('isBlank')
        } else if (formControl.hasError('notUnique')) {
            message = formControl.getError('notUnique')
        }

        return message;
    }

    private _getTipoCriterioErrorMessage(): string {
        let message: string = ''
        const formControl = this.formGroup.controls.tipoCriterio

        if (formControl.hasError('invalidOption')) {
            message = formControl.getError('invalidOption')
        }

        return message;
    }

    private _getAlreadyExistFields() {
        const fields: string[] = []
        let kpiOrigineFound = false

        const normalizedKpiOrigineArray = this._getNormalizedKpiOrigineArray()
        for (let i = 0; i < this.data.criteri.length && !kpiOrigineFound; i++) {
            if (!kpiOrigineFound && normalizedKpiOrigineArray.length > 0 && (this.data.mode == 'create' || this.data.criteri[i].id != this.data.criterioToEdit?.id) && this.data.criteri[i].kpiOrigine && this.areArraysEqual(normalizedKpiOrigineArray, (this.data.criteri[i].kpiOrigine as string).split(','))) {
                fields.push('Kpi Origine')
                kpiOrigineFound = true
            }
        }

        return fields
    }

    private _getNormalizedKpiOrigineArray() {
        return this.selectedKpiOrigineOptions.map(ko => {
            const splitted = ko.split(')')
            let id = splitted[0]
            id = id.replace('(', '')
            return id

        })
    }

    create() {
        const warningFields: string[] = this._getAlreadyExistFields()
        const normalizedKpiOrigineArray = this._getNormalizedKpiOrigineArray()
        let title = ''
        let titleBold: string | null = null
        let message = ''
        let okButtonText = ''
        if (this.startMode == 'create' && this.data.mode == 'create') {
            title = 'Crea Criterio'
            message = 'Stai per CREARE un Criterio.'
            okButtonText = 'Crea'
        } else {
            title = 'Duplica Criterio'
            titleBold = '#' + this.data.criterioToEdit?.id
            message = 'Stai per DUPLICARE un Criterio.'
            okButtonText = 'Duplica'
        }
        let dialogData: MessageDialogData
        if (warningFields.length > 0) {
            dialogData = { title: title, titleBold: titleBold, message: message, secondMessage: 'I seguenti campi sono già presenti nel sistema:', okButtonText: okButtonText, okButtonColor: 'primary', list: warningFields, finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: title, titleBold: titleBold, message: message, okButtonText: okButtonText, okButtonColor: 'primary', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    this.dialogRef.close(
                        {
                            operation: 'create',
                            observable: this._criterioService.create({
                                dettaglioCriterio: this.formGroup.controls.dettaglioCriterio.value as string,
                                descCriterio: this.formGroup.controls.descCriterio.value as string,
                                tipoCriterio: this.formGroup.controls.tipoCriterio.value != '' ? this.formGroup.controls.tipoCriterio.value : null,
                                kpiOrigine: normalizedKpiOrigineArray.length > 0 ? normalizedKpiOrigineArray.join() : null
                            })
                        }
                    )
                }
            }
        })
    }

    edit() {
        const warningFields: string[] = this._getAlreadyExistFields()
        const normalizedKpiOrigineArray = this._getNormalizedKpiOrigineArray()
        let dialogData: MessageDialogData
        if (warningFields.length > 0) {
            dialogData = { title: 'Modifica Criterio', titleBold: '#' + this.data.criterioToEdit?.id, message: 'Stai per MODIFICARE un Criterio.', okButtonText: 'Modifica', okButtonColor: 'accent', list: warningFields, secondMessage: 'I seguenti campi sono già presenti nel sistema:', finalMessage: 'Sicuro di voler proseguire?' }
        } else {
            dialogData = { title: 'Modifica Criterio', titleBold: '#' + this.data.criterioToEdit?.id, message: 'Stai per MODIFICARE un Criterio.', okButtonText: 'Modifica', okButtonColor: 'accent', finalMessage: 'Sicuro di voler proseguire?' }
        }

        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    this.dialogRef.close(
                        {
                            operation: 'edit',
                            observable: this._criterioService.edit({
                                id: this.data.criterioToEdit?.id as number,
                                dettaglioCriterio: this.formGroup.controls.dettaglioCriterio.value as string,
                                descCriterio: this.formGroup.controls.descCriterio.value as string,
                                tipoCriterio: this.formGroup.controls.tipoCriterio.value != '' ? this.formGroup.controls.tipoCriterio.value : null,
                                kpiOrigine: normalizedKpiOrigineArray.length > 0 ? normalizedKpiOrigineArray.join() : null
                            })
                        }
                    )
                }
            }
        })
    }

    openDeleteDialog() {
        const dialogData: MessageDialogData = { title: 'Elimina Criterio', titleBold: '#' + this.data.criterioToEdit?.id, message: 'Stai per ELIMINARE un Criterio. Questa azione è irreversibile.', finalMessage: 'Sicuro di voler proseguire?', okButtonText: 'Elimina', okButtonColor: 'warn' }
        const messageDialog = this.dialog.open(MessageDialogComponent, { data: dialogData })
        messageDialog.afterClosed().subscribe({
            next: ok => {
                if (ok == 'ok') {
                    const dialogReturnValue: DialogReturnValue = { operation: 'delete', observable: this._criterioService.delete(this.data.criterioToEdit?.id as number) }
                    this.dialogRef.close(dialogReturnValue)
                }
            }
        })
    }

    areArraysEqual<T>(array1: T[], array2: T[]): boolean {
        if (array1.length !== array2.length) {
            return false;
        }

        const countMap: Map<T, number> = new Map();
        for (const element of array1) {
            countMap.set(element, (countMap.get(element) || 0) + 1);
        }

        for (const element of array2) {
            const count = countMap.get(element);
            if (!count) {
                return false;
            }
            if (count === 1) {
                countMap.delete(element);
            } else {
                countMap.set(element, count - 1);
            }
        }

        return countMap.size === 0;
    }

    changeMode() {
        if (this.data.mode == 'create') {
            this.data.mode = 'edit'
            this.title = 'Modifica Criterio'
            this.formGroup.reset(this.formGroup.value)
            this.formGroup.markAllAsTouched()
        } else {
            this.data.mode = 'create'
            this.title = 'Duplica Criterio'
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

    private _initializeKpiOrigineCheckboxes() {
        this.kpiOrigineOptions.forEach(kName => {
            const newListaDatasetChecked: CheckedExtracted = { name: kName, checked: this.data.criterioToEdit?.kpiOrigineArray?.some(k => k == kName)!, extractedId: this._extractIdKpiFromKpiOrigine(kName), extractedName: this._extractNameKpiFromKpiOrigine(kName) }
            this._kpiOrigineCheckboxes.push(newListaDatasetChecked)
        })

        this._initialKpiOrigineCheckboxes = JSON.parse(JSON.stringify(this._kpiOrigineCheckboxes))
        this.filteredKpiOrigineCheckboxes = JSON.parse(JSON.stringify(this._kpiOrigineCheckboxes))
    }

    checkKpiOrigine(event: MatCheckboxChange, kpiOrigineName: string) {
        const kpiOrigineCheckbox = this._kpiOrigineCheckboxes.find(k => k.name == kpiOrigineName)
        const filteredKpiOrigineCheckbox = this.filteredKpiOrigineCheckboxes.find(k => k.name == kpiOrigineName)

        if (kpiOrigineCheckbox && filteredKpiOrigineCheckbox) {
            kpiOrigineCheckbox.checked = event.checked
            filteredKpiOrigineCheckbox.checked = event.checked

            if (kpiOrigineCheckbox.checked) {
                this._selectKpiOrigine(kpiOrigineName)
            } else {
                this._deselectKpiOrigine(kpiOrigineName)
            }
        }
    }

    deselectKpiOrigineFromHTML(kpiOrigineName: string) {
        this.selectedKpiOrigineOptions = this.selectedKpiOrigineOptions.filter(k => k != kpiOrigineName)
        this._checkFormChanges()

        const kpiOrigineCheckbox = this._kpiOrigineCheckboxes.find(k => k.name == kpiOrigineName)
        const filteredKpiOrigineCheckbox = this.filteredKpiOrigineCheckboxes.find(k => k.name == kpiOrigineName)

        if (kpiOrigineCheckbox) {
            kpiOrigineCheckbox.checked = false
        }
        if (filteredKpiOrigineCheckbox) {
            filteredKpiOrigineCheckbox.checked = false
        }
    }

    private _extractIdKpiFromKpiOrigine(kpiOrigine: string) {
        const splitted = kpiOrigine.split(')')
        return splitted[0].replace('(', '')
    }

    private _extractNameKpiFromKpiOrigine(kpiOrigine: string) {
        const splitted = kpiOrigine.split(')')
        let joinedString = splitted[1]

        for (let i = 2; i < splitted.length; i++) {

            joinedString += ')' + splitted[i]
        }
        return joinedString
    }

    filterKpiOrigineCheckboxes() {
        this.filteredKpiOrigineCheckboxes = this._kpiOrigineCheckboxes.filter(k => k.name.toLowerCase().includes(this.formGroupMulti.controls.kpiOrigine.value?.toLowerCase()!))
    }
}

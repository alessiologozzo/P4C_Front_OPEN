import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartOptions, ChartType } from 'chart.js';
import { DateTime } from 'luxon';
import { BaseChartDirective } from 'ng2-charts';
import { EnumDto } from '../../../ts/interfaces/dtos/all/EnumDto';
import { CriterioDto } from '../../../ts/interfaces/dtos/criterio/CriterioDto';
import { KpiWithoutRelationsDto } from '../../../ts/interfaces/dtos/kpi/KpiWithoutRelationsDto';
import { ReportWithoutRelationsDto } from '../../../ts/interfaces/dtos/report/ReportWithoutRelationsDto';
import { AuthService } from '../../services/auth-service/auth.service';
import { DashboardService } from '../../services/dashboard-service/dashboard.service';
import { ThemeService } from '../../services/theme-service/theme.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatExpansionModule, NgOptimizedImage, LoadingComponent, MatTableModule, BaseChartDirective, MatTooltipModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    readonly APP_VERSION: string = '1.1.0'
    isLoading: boolean = true
    private _reports!: ReportWithoutRelationsDto[]
    private _kpis!: KpiWithoutRelationsDto[]
    private _criteri!: CriterioDto[]
    private _enums!: EnumDto[]

    private readonly ENUM_CHART_TYPE = 'enumChartType'

    enumChart!: {
        labels: string[]
        datasets: {
            data: number[]
            label: string
        }[]

    }

    insertChart!: {
        labels: string[]
        datasets: {
            data: number[]
            label: string
            fill: boolean
            tension: number
        }[]
    }

    updateChart!: {
        labels: string[]
        datasets: {
            data: number[]
            label: string
            fill: boolean
            tension: number
            borderColor?: string
            backgroundColor?: string
        }[]
    }

    enumChartOptionsDark: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        }
    }

    enumChartOptionsLight: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'black'
                }
            }
        }
    }

    timeChartOptionsDark: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'white'
                }
            },
            y: {
                suggestedMin: 0,
                ticks: {
                    color: 'white'
                }
            }
        }
    }

    timeChartOptionsLight: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'black'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'black'
                }
            },
            y: {
                suggestedMin: 0,
                ticks: {
                    color: 'black'
                }
            }
        }
    }


    enumChartType: ChartType
    title!: string
    constructor(public authService: AuthService, private _dashboardService: DashboardService, private elementRef: ElementRef, public themeService: ThemeService) {

        const enumChartType = localStorage.getItem(this.ENUM_CHART_TYPE)
        if (enumChartType) {
            this.enumChartType = enumChartType as ChartType
        } else {
            this.enumChartType = 'pie'
            localStorage.setItem(this.ENUM_CHART_TYPE, 'pie')
        }

        _dashboardService.index().subscribe({
            next: indexDashboardResponse => {
                this._reports = indexDashboardResponse.reports.map(r => {
                    if (r.dataInserimento && typeof r.dataInserimento === 'string') {
                        r.dataInserimento = DateTime.fromISO(r.dataInserimento)
                    }
                    if (r.dataAggiornamento && typeof r.dataAggiornamento === 'string') {
                        r.dataAggiornamento = DateTime.fromISO(r.dataAggiornamento)
                    }

                    return r
                })
                this._kpis = indexDashboardResponse.kpis.map(k => {
                    if (k.dataInserimento && typeof k.dataInserimento === 'string') {
                        k.dataInserimento = DateTime.fromISO(k.dataInserimento)
                    }
                    if (k.dataAggiornamento && typeof k.dataAggiornamento === 'string') {
                        k.dataAggiornamento = DateTime.fromISO(k.dataAggiornamento)
                    }

                    return k
                })
                this._criteri = indexDashboardResponse.criteri.map(c => {
                    if (c.dataInserimento && typeof c.dataInserimento === 'string') {
                        c.dataInserimento = DateTime.fromISO(c.dataInserimento)
                    }
                    if (c.dataAggiornamento && typeof c.dataAggiornamento === 'string') {
                        c.dataAggiornamento = DateTime.fromISO(c.dataAggiornamento)
                    }

                    return c
                })
                this._enums = indexDashboardResponse.enums

                const reportsLength = this._reports.length
                const kpisLength = this._kpis.length
                const criteriLength = this._criteri.length

                const ne = this.elementRef.nativeElement;
                ne.style.setProperty('--report_total', reportsLength);
                ne.style.setProperty('--kpi_total', kpisLength);
                ne.style.setProperty('--criterio_total', criteriLength);

                this.title = 'Report'
                this.pickData('report')

                this.isLoading = false
            }
        })
    }

    pickData(option: 'report' | 'kpi' | 'criterio') {
        let values: string[] | undefined
        let map: Map<string, number>
        switch (option) {
            case 'report':
                this.title = 'Report'
                this._computeReportEnumChart()
                this._computeReportInsertChart()
                this._computeReportUpdateChart()
                break

            case 'kpi':
                this.title = 'Kpi'
                this._computeKpiEnumChart()
                this._computeKpiInsertChart()
                this._computeKpiUpdateChart()
                break

            case 'criterio':
                this.title = 'Criteri'
                this._computeCriterioEnumChart()
                this._computeCriterioInsertChart()
                this._computeCriterioUpdateChart()
        }
    }

    changeEnumChartType() {
        if (this.enumChartType == 'pie') {
            this.enumChartType = 'doughnut'
        } else {
            this.enumChartType = 'pie'
        }

        localStorage.setItem(this.ENUM_CHART_TYPE, this.enumChartType)
    }

    private _computeReportEnumChart() {
        const values = this._enums.find(e => e.fieldName == 'TipoOggetto')?.values
        const map = new Map<string, number>()

        if (values) {
            for (let i = 0; i < values.length; i++) {
                map.set(values[i], 0)
                for (let j = 0; j < this._reports.length; j++) {
                    if (this._reports[j].tipoOggetto == values[i]) {
                        map.set(values[i], (map.get(values[i]) as number) + 1)
                    }
                }
            }

            for (let i = 0; i < this._reports.length; i++) {
                if (this._reports[i].tipoOggetto == null) {
                    const NON_SPECIFICATO = 'Non specificato'
                    if (map.get(NON_SPECIFICATO)) {
                        map.set(NON_SPECIFICATO, map.get(NON_SPECIFICATO) as number + 1)
                    } else {
                        map.set(NON_SPECIFICATO, 1)
                    }
                }
            }
            this.enumChart = {
                labels: Array.from(map.keys()).map(v => `${v} (${map.get(v)})`),
                datasets: [
                    {
                        data: Array.from(map.values()),
                        label: 'Totale',
                    }
                ]
            }
        }
    }

    private _computeReportInsertChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._reports.forEach(r => {
            if (r.dataInserimento) {
                const val = r.dataInserimento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        this.insertChart = {
            labels: Array.from(map.keys()),
            datasets: [
                {
                    data: Array.from(map.values()),
                    label: 'Inserimenti',
                    fill: true,
                    tension: 0.3
                }
            ]
        };
    }

    private _computeReportUpdateChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._reports.forEach(r => {
            if (r.dataAggiornamento) {
                const val = r.dataAggiornamento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        const sortedMap = this._sortMapByDate(map)
        this.updateChart = {
            labels: Array.from(sortedMap.keys()),
            datasets: [
                {
                    data: Array.from(sortedMap.values()),
                    label: 'Aggiornamenti',
                    fill: true,
                    tension: 0.3,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgb(255, 99, 132, 0.45)'
                }
            ]
        };
    }

    private _computeKpiEnumChart() {
        const values = this._enums.find(e => e.fieldName == 'CategoriaKpi')?.values
        const map = new Map<string, number>()

        if (values) {
            for (let i = 0; i < values.length; i++) {
                map.set(values[i], 0)
                for (let j = 0; j < this._kpis.length; j++) {
                    if (this._kpis[j].categoriaKpi == values[i]) {
                        map.set(values[i], (map.get(values[i]) as number) + 1)
                    }
                }
            }

            for (let i = 0; i < this._kpis.length; i++) {
                if (this._kpis[i].categoriaKpi == null) {
                    const NON_SPECIFICATO = 'Non specificato'
                    if (map.get(NON_SPECIFICATO)) {
                        map.set(NON_SPECIFICATO, map.get(NON_SPECIFICATO) as number + 1)
                    } else {
                        map.set(NON_SPECIFICATO, 1)
                    }
                }
            }
            this.enumChart = {
                labels: Array.from(map.keys()).map(v => `${v} (${map.get(v)})`),
                datasets: [
                    {
                        data: Array.from(map.values()),
                        label: 'Totale',
                    }
                ]
            }
        }
    }

    private _computeKpiInsertChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._kpis.forEach(k => {
            if (k.dataInserimento) {
                const val = k.dataInserimento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        this.insertChart = {
            labels: Array.from(map.keys()),
            datasets: [
                {
                    data: Array.from(map.values()),
                    label: 'Inserimenti',
                    fill: true,
                    tension: 0.3,
                }
            ]
        }
    }

    private _computeKpiUpdateChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._kpis.forEach(k => {
            if (k.dataAggiornamento) {
                const val = k.dataAggiornamento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        const sortedMap = this._sortMapByDate(map)
        this.updateChart = {
            labels: Array.from(sortedMap.keys()),
            datasets: [
                {
                    data: Array.from(sortedMap.values()),
                    label: 'Aggiornamenti',
                    fill: true,
                    tension: 0.3,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgb(255, 99, 132, 0.45)'
                }
            ]
        };
    }

    private _computeCriterioEnumChart() {
        const values = this._enums.find(e => e.fieldName == 'TipoCriterio')?.values
        const map = new Map<string, number>()

        if (values) {
            for (let i = 0; i < values.length; i++) {
                map.set(values[i], 0)
                for (let j = 0; j < this._criteri.length; j++) {
                    if (this._criteri[j].tipoCriterio == values[i]) {
                        map.set(values[i], (map.get(values[i]) as number) + 1)
                    }
                }
            }

            for (let i = 0; i < this._criteri.length; i++) {
                if (this._criteri[i].tipoCriterio == null) {
                    const NON_SPECIFICATO = 'Non specificato'
                    if (map.get(NON_SPECIFICATO)) {
                        map.set(NON_SPECIFICATO, map.get(NON_SPECIFICATO) as number + 1)
                    } else {
                        map.set(NON_SPECIFICATO, 1)
                    }
                }
            }
            this.enumChart = {
                labels: Array.from(map.keys()).map(v => `${v} (${map.get(v)})`),
                datasets: [
                    {
                        data: Array.from(map.values()),
                        label: 'Totale',
                    }
                ]
            }
        }
    }

    private _computeCriterioInsertChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._criteri.forEach(c => {
            if (c.dataInserimento) {
                const val = c.dataInserimento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        this.insertChart = {
            labels: Array.from(map.keys()),
            datasets: [
                {
                    data: Array.from(map.values()),
                    label: 'Inserimenti',
                    fill: true,
                    tension: 0.3,
                }
            ]
        }
    }

    private _computeCriterioUpdateChart() {
        const values: string[] = []
        const map = new Map<string, number>()

        this._criteri.forEach(c => {
            if (c.dataAggiornamento) {
                const val = c.dataAggiornamento.toFormat('dd/MM/yyyy')
                values.push(val)
                if (map.get(val)) {
                    map.set(val, (map.get(val) as number) + 1)
                } else {
                    map.set(val, 1)
                }
            }
        })

        const sortedMap = this._sortMapByDate(map)
        this.updateChart = {
            labels: Array.from(sortedMap.keys()),
            datasets: [
                {
                    data: Array.from(sortedMap.values()),
                    label: 'Aggiornamenti',
                    fill: true,
                    tension: 0.3,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgb(255, 99, 132, 0.45)'
                }
            ]
        };
    }

    private _sortMapByDate(map: Map<string, number>): Map<string, number> {
        const keys = Array.from(map.keys())
        const sortedKeys = keys.sort((a, b) => {
            const dateA = DateTime.fromFormat(a, 'dd/MM/yyyy');
            const dateB = DateTime.fromFormat(b, 'dd/MM/yyyy');
            
            return dateA.valueOf() - dateB.valueOf()
        }) 

        const sortedMap = new Map<string, number>()
        sortedKeys.forEach(key => {
            sortedMap.set(key, map.get(key) as number)
        })

        return sortedMap
    }
}

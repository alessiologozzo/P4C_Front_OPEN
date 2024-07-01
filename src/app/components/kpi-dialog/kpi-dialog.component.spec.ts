import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiDialogComponent } from './kpi-dialog.component';

describe('KpiDialogComponent', () => {
  let component: KpiDialogComponent;
  let fixture: ComponentFixture<KpiDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KpiDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriterioDialogComponent } from './criterio-dialog.component';

describe('CriterioDialogComponent', () => {
  let component: CriterioDialogComponent;
  let fixture: ComponentFixture<CriterioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriterioDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CriterioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

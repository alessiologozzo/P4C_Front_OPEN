import { TestBed } from '@angular/core/testing';

import { CriterioService } from './criterio.service';

describe('CriterioService', () => {
  let service: CriterioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CriterioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { FrontendConfigService } from './frontend-config.service';

describe('FrontendConfigService', () => {
  let service: FrontendConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FrontendConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

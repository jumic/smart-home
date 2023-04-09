import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorValuesComponent } from './sensor-values.component';

describe('SensorValuesComponent', () => {
  let component: SensorValuesComponent;
  let fixture: ComponentFixture<SensorValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorValuesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigComponent } from './config/config.component';
import { SensorValuesComponent } from './sensor-values/sensor-values.component';
import { SensorsComponent } from './sensors/sensors.component';

const routes: Routes = [
  { path: 'config', component: ConfigComponent },
  { path: 'sensors', component: SensorsComponent },
  { path: 'sensors/:id', component: SensorValuesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

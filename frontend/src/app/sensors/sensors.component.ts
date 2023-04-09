import { Component } from '@angular/core';
import { APIService, GetSensorsQuery } from '../API.service';

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.css']
})
export class SensorsComponent {
  sensors: GetSensorsQuery[] = [];

  async ngOnInit(): Promise<void> {
    const api = new APIService();
    this.sensors = await api.GetSensors();
  }
}

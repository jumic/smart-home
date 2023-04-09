import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { APIService, GetSensorByIdQuery, GetValuesQuery } from '../API.service';

@Component({
  selector: 'app-sensor-values',
  templateUrl: './sensor-values.component.html',
  styleUrls: ['./sensor-values.component.css']
})
export class SensorValuesComponent {
  sensors: GetValuesQuery[] = [];
  sensorName: string = '';

  id: string | undefined;
  constructor(private route: ActivatedRoute) { }

  async ngOnInit(): Promise<void> {
    const api = new APIService();
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.id = id;
        console.log("ID: " + this.id);
        this.sensors = await api.GetValues(id);
        const sensor = await api.GetSensorById(id);
        this.sensorName = sensor.name;

    
        api.AddedValueListener(id).subscribe(async x => {
          const addedValue = x.value.data?.addedValue;
          if (addedValue) {
            this.sensors.unshift(addedValue)
            console.log(addedValue)
          }
        });

      }
    });

  }
}

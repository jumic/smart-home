import { Component } from '@angular/core';
import { AddedSensorSubscription, APIService, GetSensorsQuery } from '../API.service';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from "zen-observable-ts";

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent {

  sensors: GetSensorsQuery[] = [];
  sensor = {id: "", name: "", ieeeAddr: ""};

  dialogTitle = '';

  async ngOnInit(): Promise<void> {
    const api = new APIService();
    this.sensors = await api.GetSensors();
  }

  constructor(private modalService: NgbModal) {}

  openNew(content: any) {
    const newSensor : GetSensorsQuery = {
      __typename: 'Sensor',
      id: '',
      name: '',
      ieeeAddr: '',
    }
    this.open(content, newSensor)
  }

  async open(content: any, sensor: GetSensorsQuery) {
    if (sensor.id) {
      this.dialogTitle = 'Update sensor'
    } else {
      this.dialogTitle = 'Create sensor'
    }
    
    this.sensor = {
      id: sensor.id,
      name: sensor.name,
      ieeeAddr: sensor.ieeeAddr,
    }
		this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
			async (result) => {
        const api = new APIService();
        if (this.sensor.id) {
          await api.UpdateSensor(this.sensor.id, {
            ieeeAddr: this.sensor.ieeeAddr,
            name: this.sensor.name,
          });
        } else {
          await api.AddSensor({
            ieeeAddr: this.sensor.ieeeAddr,
            name: this.sensor.name,
          });
        }
        api.GetSensors().then(sensors => {
          this.sensors = sensors;
        });
       
			},
			(reason) => {
			},
		);
	}

  async delete(sensor: GetSensorsQuery) {
    const api = new APIService();
    await api.DeleteSensor(sensor.id);
    this.sensors = await api.GetSensors();
  }

}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface FrontendConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  cognitoDomain: string;
  frontendUrl: string;
  appsyncEndpoint: string;
}

@Injectable({
  providedIn: 'root',
})
export class FrontendConfigService {
  private frontendConfig: FrontendConfig | undefined;

  constructor(private http: HttpClient) {}

  loadAppConfig() {
    return firstValueFrom(
      this.http.get<FrontendConfig>('/frontend-config.json')
    ).then((data) => {
      this.frontendConfig = data;
    });
  }

  getConfig() {
    return this.frontendConfig;
  }
}

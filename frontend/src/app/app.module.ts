import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Amplify } from 'aws-amplify';
import { SensorsComponent } from './sensors/sensors.component';
import { ConfigComponent } from './config/config.component';
import { FormsModule } from '@angular/forms';
import { FrontendConfigService } from './frontend-config.service';
import { HttpClientModule } from '@angular/common/http';
import { SensorValuesComponent } from './sensor-values/sensor-values.component';

const appInitializerFn =  (configService: FrontendConfigService) => {
  return () => {
    const loadedAppConfig = configService.loadAppConfig()
    loadedAppConfig.then(() => {
      const config = configService.getConfig();
      if (config) {
        Amplify.configure({
          Auth: {
            region: config.region,
            userPoolId: config.userPoolId,
            userPoolWebClientId: config.userPoolWebClientId,
            cookieStorage: {
              path: '/',
              expires: 30,
              domain: window.location.hostname,
              secure: true,
            },
            oauth: {
              domain: config.cognitoDomain,
              scope: [
                'phone',
                'email',
                'profile',
                'openid',
                'aws.cognito.signin.user.admin',
              ],
              redirectSignIn: config.frontendUrl,
              redirectSignOut: config.frontendUrl,
              responseType: 'code',
            },
          },
          // https://docs.amplify.aws/lib/graphqlapi/existing-resources/q/platform/react-native/#using-with-an-appsync-custom-domain-name
          aws_appsync_graphqlEndpoint: config.appsyncEndpoint,
          aws_appsync_region: config.region,
          aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        });
      }
    });
    return loadedAppConfig;
  };
};

@NgModule({
  declarations: [
    AppComponent,
    SensorsComponent,
    ConfigComponent,
    SensorValuesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    FrontendConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [FrontendConfigService]
    }
  ],  bootstrap: [AppComponent]
})
export class AppModule { }

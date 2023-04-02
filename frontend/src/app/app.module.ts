import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Amplify } from 'aws-amplify';
import { SensorsComponent } from './sensors/sensors.component';
import { ConfigComponent } from './config/config.component';
import { FormsModule } from '@angular/forms';

Amplify.configure({
  Auth: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_BPwYJkOeG',
    userPoolWebClientId: '28red3pjukv7v2plluqlb05f62',
    cookieStorage: {
      path: '/',
      expires: 30,
      domain: window.location.hostname,
      secure: true,
    },
    oauth: {
      domain: 'smart-home-dev.auth.eu-central-1.amazoncognito.com',
      scope: [
        'phone',
        'email',
        'profile',
        'openid',
        'aws.cognito.signin.user.admin',
      ],
      redirectSignIn: 'http://localhost:4200',
      redirectSignOut: 'http://localhost:4200',
      responseType: 'code',
    },
  },
  // https://docs.amplify.aws/lib/graphqlapi/existing-resources/q/platform/react-native/#using-with-an-appsync-custom-domain-name
  aws_appsync_graphqlEndpoint: 'https://qplcn7a7tvgp5juyhliw7zh5dy.appsync-api.eu-central-1.amazonaws.com/graphql',
  aws_appsync_region: 'eu-central-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
});

@NgModule({
  declarations: [
    AppComponent,
    SensorsComponent,
    ConfigComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Amplify } from 'aws-amplify';

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
});

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

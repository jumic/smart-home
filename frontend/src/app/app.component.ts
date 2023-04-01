import { Component } from '@angular/core';
import { Auth, Hub } from 'aws-amplify';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'smart-home';

  isMenuCollapsed = true;

  username = '';
  firstname = '';
  lastname = '';

  constructor(private router: Router) {
    Auth.currentAuthenticatedUser().then((value) => {
      const payload = value.signInUserSession.idToken.payload;
      this.username = payload.preferred_username
        ? payload.preferred_username
        : payload['cognito:username'];
      this.firstname = value.signInUserSession.idToken.payload.given_name;
      this.lastname = value.signInUserSession.idToken.payload.family_name;
    });

    Hub.listen('auth', ({ payload: { event, data } }) => {
      console.log('event: ' + JSON.stringify(event));
      console.log('event data: ' + JSON.stringify(data));
      switch (event) {
        case 'customOAuthState':
          this.router.navigateByUrl(data, { replaceUrl: true });
      }
    });
  }

  signIn() {
    console.log('sign in');
    Auth.federatedSignIn();
  }

  signOut() {
    console.log('sign out');
    Auth.signOut();
  }
}

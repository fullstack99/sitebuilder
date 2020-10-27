import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginPageComponent } from '@app-auth/containers/login-page/login-page.component';
import { RegisterPageComponent } from '@app-auth/containers/register-page/register-page.component';
import { ChangePasswordPageComponent } from '@app-auth/containers/change-password-page/change-password-page.component';

const routes: Routes = [
  { path: 'register', component: RegisterPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'change-password', component: ChangePasswordPageComponent }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}

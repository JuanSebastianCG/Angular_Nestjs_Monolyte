import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NotificationComponent, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'university-management';
}

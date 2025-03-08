import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-form-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form-card.component.html',
  styleUrls: ['./form-card.component.css'],
})
export class FormCardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showBackButton: boolean = true;
  @Input() backUrl: string = '/';
  @Input() decorationEnabled: boolean = true;

  constructor(private router: Router) {}

  /**
   * Navigate back to the specified URL
   */
  navigateBack() {
    this.router.navigate([this.backUrl]);
  }
}

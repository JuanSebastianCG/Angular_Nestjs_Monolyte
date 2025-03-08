import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-container.component.html',
  styleUrls: ['./form-container.component.css'],
})
export class FormContainerComponent {
  @Input() backgroundStyle: 'gradient' | 'light' | 'white' = 'gradient';
  @Input() fullHeight: boolean = true;
}

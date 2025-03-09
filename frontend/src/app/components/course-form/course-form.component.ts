import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Course } from '../../models/course.model';
import { FormFieldComponent } from '../form-field/form-field.component';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FormFieldComponent],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
})
export class CourseFormComponent implements OnInit, OnChanges {
  @Input() course: Course | null = null;
  @Input() loading = false;
  @Input() professors: { value: string; label: string }[] = [];
  @Input() courses: Course[] = [];

  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  courseForm!: FormGroup;
  submitted = false;
  availablePrerequisites: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAvailablePrerequisites();
    if (this.course) {
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['course'] && changes['course'].currentValue) {
      if (!changes['course'].firstChange) {
        this.populateForm();
      }
    }
  }

  private initForm(): void {
    this.courseForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      professorId: ['', []],
      prerequisites: this.fb.array([]),
      schedule: this.fb.group({
        days: [[], [Validators.required]],
        startTime: ['', [Validators.required]],
        endTime: ['', [Validators.required]],
        room: ['', [Validators.required]],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
      }),
    });
  }

  private loadAvailablePrerequisites(): void {
    if (!this.courses || this.courses.length === 0) {
      this.courseService.getAllCourses().subscribe({
        next: (courses) => {
          this.setupPrerequisitesOptions(courses);
        },
        error: (err) => {
          console.error('Error loading courses for prerequisites', err);
        },
      });
    } else {
      this.setupPrerequisitesOptions(this.courses);
    }
  }

  private setupPrerequisitesOptions(courses: Course[]): void {
    this.availablePrerequisites = courses
      .filter((c) => !this.course || c._id !== this.course._id)
      .map((c) => ({
        value: c._id,
        label: c.name,
      }));
  }

  private populateForm(): void {
    if (!this.course) return;

    this.courseForm.patchValue({
      name: this.course.name || '',
      description: this.course.description || '',
      professorId: this.course.professorId || '',
    });

    if (this.course.scheduleId) {
      const schedule = this.course.scheduleId;

      let startDate = schedule.startDate;
      let endDate = schedule.endDate;

      if (typeof startDate === 'string' && startDate.includes('T')) {
        startDate = startDate.split('T')[0];
      }
      if (typeof endDate === 'string' && endDate.includes('T')) {
        endDate = endDate.split('T')[0];
      }

      this.scheduleGroup.patchValue({
        days: schedule.days || [],
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        room: schedule.room || '',
        startDate: startDate || '',
        endDate: endDate || '',
      });

      console.log(
        'Schedule form values after patch:',
        this.scheduleGroup.value,
      );
    }

    while (this.prerequisites.length) {
      this.prerequisites.removeAt(0);
    }
    if (this.course.prerequisites && this.course.prerequisites.length > 0) {
      this.course.prerequisites.forEach((prereq) => {
        try {
          if (typeof prereq === 'string') {
            this.prerequisites.push(new FormControl(prereq));
          } else if (prereq.prerequisiteCourseId) {
            if (typeof prereq.prerequisiteCourseId === 'string') {
              this.prerequisites.push(
                new FormControl(prereq.prerequisiteCourseId),
              );
            } else if (prereq.prerequisiteCourseId._id) {
              this.prerequisites.push(
                new FormControl(prereq.prerequisiteCourseId._id),
              );
            }
          } else if (prereq._id) {
            this.prerequisites.push(new FormControl(prereq._id));
          }
        } catch (error) {
          console.error('Error processing prerequisite:', error, prereq);
        }
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.courseForm.invalid) {
      return;
    }

    const formValue = this.courseForm.getRawValue();

    if (formValue.professorId) {
      if (Array.isArray(formValue.professorId)) {
        if (formValue.professorId.length > 0) {
          formValue.professorId = formValue.professorId[0];
        } else {
          formValue.professorId = null;
        }
      } else if (formValue.professorId === '') {
        formValue.professorId = null;
      }
    } else {
      formValue.professorId = null;
    }

    const prerequisitesData = formValue.prerequisites.map(
      (prereqId: string) => {
        return {
          prerequisiteCourseId: prereqId,
        };
      },
    );

    if (formValue.schedule.startDate) {
      formValue.schedule.startDate = this.formatDate(
        formValue.schedule.startDate,
      );
    }
    if (formValue.schedule.endDate) {
      formValue.schedule.endDate = this.formatDate(formValue.schedule.endDate);
    }

    const formData = {
      ...formValue,
      prerequisites: prerequisitesData,
    };

    this.formSubmit.emit(formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get f() {
    return this.courseForm.controls;
  }

  get scheduleGroup() {
    return this.courseForm.get('schedule') as FormGroup;
  }

  get prerequisites() {
    return this.courseForm.get('prerequisites') as FormArray;
  }

  scheduleControl(name: string): AbstractControl {
    return this.scheduleGroup.get(name) as AbstractControl;
  }

  addPrerequisite(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const courseId = selectElement.value;

    if (!courseId) return;

    if (
      this.isPrerequisiteSelected(courseId) ||
      this.wouldCreateCircularDependency(courseId)
    ) {
      return;
    }

    this.prerequisites.push(new FormControl(courseId));

    selectElement.value = '';
  }

  removePrerequisite(index: number): void {
    this.prerequisites.removeAt(index);
  }

  isPrerequisiteSelected(courseId: string): boolean {
    return this.prerequisites.controls.some(
      (control) => control.value === courseId,
    );
  }

  wouldCreateCircularDependency(courseId: string): boolean {
    if (!this.course || !this.course._id) {
      return false;
    }

    const potentialPrereq = this.courses.find((c) => c._id === courseId);

    if (!potentialPrereq) {
      return false;
    }

    return (
      potentialPrereq.prerequisites?.some((prereq) => {
        if (typeof prereq.prerequisiteCourseId === 'string') {
          return prereq.prerequisiteCourseId === this.course?._id;
        } else if (
          prereq.prerequisiteCourseId &&
          typeof prereq.prerequisiteCourseId === 'object'
        ) {
          return prereq.prerequisiteCourseId._id === this.course?._id;
        }
        return false;
      }) || false
    );
  }

  getPrerequisiteNameById(courseId: string): string {
    const course = this.availablePrerequisites.find(
      (c) => c.value === courseId,
    );
    return course ? course.label : 'Unknown Course';
  }

  get dayOptions(): { value: string; label: string }[] {
    return [
      { value: 'Monday', label: 'Monday' },
      { value: 'Tuesday', label: 'Tuesday' },
      { value: 'Wednesday', label: 'Wednesday' },
      { value: 'Thursday', label: 'Thursday' },
      { value: 'Friday', label: 'Friday' },
      { value: 'Saturday', label: 'Saturday' },
    ];
  }

  addPrerequisiteFromSelect(selectElement: HTMLSelectElement): void {
    const courseId = selectElement.value;

    if (!courseId) return;

    if (
      this.isPrerequisiteSelected(courseId) ||
      this.wouldCreateCircularDependency(courseId)
    ) {
      return;
    }

    this.prerequisites.push(new FormControl(courseId));

    selectElement.value = '';
  }

  private formatDate(date: string): string {
    if (!date) return '';

    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date:', e);
      return date;
    }
  }
}

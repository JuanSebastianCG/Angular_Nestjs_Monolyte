import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class CourseFormComponent implements OnInit {
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
    // If we're in edit mode and have a course ID, we need to get all other courses
    if (!this.courses || this.courses.length === 0) {
      // If courses were not passed as input, load them from the service
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
    // Filter out the current course and format for dropdown
    this.availablePrerequisites = courses
      .filter((c) => !this.course || c._id !== this.course._id)
      .map((c) => ({
        value: c._id,
        label: c.name,
      }));
  }

  private populateForm(): void {
    if (!this.course) return;

    // Set basic fields
    this.courseForm.patchValue({
      name: this.course.name,
      description: this.course.description,
      professorId: this.course.professorId || '',
    });

    // Set schedule fields
    if (this.course.scheduleId) {
      this.scheduleGroup.patchValue({
        days: this.course.scheduleId.days,
        startTime: this.course.scheduleId.startTime,
        endTime: this.course.scheduleId.endTime,
        room: this.course.scheduleId.room,
        startDate: this.course.scheduleId.startDate,
        endDate: this.course.scheduleId.endDate,
      });
    }

    // Set prerequisites if they exist
    if (this.course.prerequisites && this.course.prerequisites.length > 0) {
      // Clear the form array first
      while (this.prerequisites.length) {
        this.prerequisites.removeAt(0);
      }

      // Add each prerequisite to the form array
      this.course.prerequisites.forEach((prereq) => {
        // If the prerequisite has a prerequisiteCourseId with an _id
        if (prereq.prerequisiteCourseId && prereq.prerequisiteCourseId._id) {
          this.prerequisites.push(
            new FormControl(prereq.prerequisiteCourseId._id),
          );
        }
        // If it has a plain prerequisiteCourseId string
        else if (prereq.prerequisiteCourseId) {
          this.prerequisites.push(new FormControl(prereq.prerequisiteCourseId));
        }
        // If it's just an ID string
        else if (typeof prereq === 'string') {
          this.prerequisites.push(new FormControl(prereq));
        }
      });
    }
  }

  /**
   * Form submission
   */
  onSubmit(): void {
    this.submitted = true;

    if (this.courseForm.invalid) {
      return;
    }

    // Get raw form values
    const formValue = this.courseForm.getRawValue();

    // Fix: Ensure professorId is a string, not an array
    if (formValue.professorId && Array.isArray(formValue.professorId)) {
      formValue.professorId = formValue.professorId[0];
    }

    // Format prerequisites
    const prerequisitesData = formValue.prerequisites.map(
      (prereqId: string) => {
        return {
          prerequisiteCourseId: prereqId,
        };
      },
    );

    // Ensure dates are in the correct format
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

    // Emit form values to parent component
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

  /**
   * Add a prerequisite to the form
   */
  addPrerequisite(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const courseId = selectElement.value;

    if (!courseId) return;

    // Check if already added or would create circular dependency
    if (
      this.isPrerequisiteSelected(courseId) ||
      this.wouldCreateCircularDependency(courseId)
    ) {
      return;
    }

    this.prerequisites.push(new FormControl(courseId));

    // Reset the select
    selectElement.value = '';
  }

  /**
   * Remove a prerequisite from the form
   */
  removePrerequisite(index: number): void {
    this.prerequisites.removeAt(index);
  }

  /**
   * Check if a course is already selected as prerequisite
   */
  isPrerequisiteSelected(courseId: string): boolean {
    return this.prerequisites.controls.some(
      (control) => control.value === courseId,
    );
  }

  /**
   * Check if adding this prerequisite would create a circular dependency
   * (i.e., if the course we're trying to add as a prerequisite already has this course as its prerequisite)
   */
  wouldCreateCircularDependency(courseId: string): boolean {
    // If we're creating a new course, there can't be circular dependencies yet
    if (!this.course || !this.course._id) {
      return false;
    }

    // Find the course we're trying to add
    const potentialPrereq = this.courses.find((c) => c._id === courseId);

    if (!potentialPrereq) {
      return false;
    }

    // Check if the potential prerequisite has this course as its prerequisite
    return (
      potentialPrereq.prerequisites?.some((prereq) => {
        // Handle different ways the prerequisite might be structured
        if (typeof prereq.prerequisiteCourseId === 'string') {
          // If prerequisiteCourseId is a string, compare directly
          return prereq.prerequisiteCourseId === this.course?._id;
        } else if (
          prereq.prerequisiteCourseId &&
          typeof prereq.prerequisiteCourseId === 'object'
        ) {
          // If prerequisiteCourseId is an object with _id, compare that
          return prereq.prerequisiteCourseId._id === this.course?._id;
        }
        return false;
      }) || false
    );
  }

  /**
   * Get the name of a prerequisite by its ID
   */
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

  /**
   * Add a prerequisite using the select element reference
   */
  addPrerequisiteFromSelect(selectElement: HTMLSelectElement): void {
    const courseId = selectElement.value;

    if (!courseId) return;

    // Check if already added or would create circular dependency
    if (
      this.isPrerequisiteSelected(courseId) ||
      this.wouldCreateCircularDependency(courseId)
    ) {
      return;
    }

    this.prerequisites.push(new FormControl(courseId));

    // Reset the select
    selectElement.value = '';
  }

  /**
   * Format a date for API submission
   * @param date The date string to format
   * @returns Formatted date string in YYYY-MM-DD format
   */
  private formatDate(date: string): string {
    if (!date) return '';

    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch (e) {
      console.error('Error formatting date:', e);
      return date; // Return original if error
    }
  }
}

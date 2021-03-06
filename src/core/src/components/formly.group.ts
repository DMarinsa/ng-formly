import { Component } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FieldType } from '../templates/field.type';

@Component({
  selector: 'formly-group',
  template: `
    <formly-form [fields]="field.fieldGroup" [model]="model" [form]="field.formControl || form" [options]="options" [ngClass]="field.fieldGroupClassName" [buildForm]="false"></formly-form>
  `,
})
export class FormlyGroup extends FieldType {}

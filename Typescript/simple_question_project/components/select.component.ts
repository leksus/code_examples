import {Component, EventEmitter, Input, Output} from '@angular/core'
import {Answer} from "../interfaces/answer";

@Component({
  selector: 'vt-select',
  template: `
      <select [ngModel]="selectedValue" (ngModelChange)="onChange($event)">
          <option value=""></option>
          <option *ngFor="let answer of answers" [ngValue]="answer">
              {{answer.value}}
          </option>
      </select>
  `,
})
export class VTSelectComponent {
    @Input() answers: Answer[];
    @Input() selectedValue: Answer;
    @Output() modelChange: EventEmitter<any> = new EventEmitter<any>();

    onChange($event: any) {
        this.modelChange.emit($event);
    }
}

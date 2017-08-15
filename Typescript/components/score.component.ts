import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Answer} from "../interfaces/answer";

@Component({
  selector: 'vt-score',
  template: `
      <div>
          <div>Ваш результат</div>
          <div>
              <p>Общее количество упражнений: {{countAll}}</p>
              <p>Количество успешно выполненных: {{countSuccess}}</p>
          </div>
      </div>
  `,
})
export class VTScoreComponent  {
    @Input() countAll: number;
    @Input() countSuccess: number;
}

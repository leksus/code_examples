//our root app component
import {Component, NgModule, VERSION, HostListener, Input, OnInit, EventEmitter, OnChanges, Output, SimpleChanges } from '@angular/core';

import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from "@angular/forms";

export interface Answer {
    value: string,
    isCorrect: boolean,
}

export interface Question {
    text: string,
    options: Answer[]
}

export interface Variant {
    value: string,
    translate: string
}


/**
 * Компонент для вывода select
 */
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


/**
 * Виджет для отображения счета
 */
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


/**
 * Компонент упражнений
 */
@Component({
    selector: 'vt-learn',
    template: `
      <div>
          <div>Изучение слов</div>
          <div>
              {{variants[currentIndex].value}} - {{variants[currentIndex].translate}}
          </div>
      </div>
  `,
})
export class VTLearnComponent implements OnInit {
    @Input() variants: Variant[];
    currentIndex = 0;
    isRandom: boolean = false;

    ngOnInit(): void {

    }

    @HostListener('document:keypress', ['$event'])
    nextAnswer(event: KeyboardEvent) {
        if (event.code == 'Space') {
            this.switchOnValue();
        }
    }

    switchOnValue() {
        if (this.isRandom) {
            this.currentIndex = this.getRandom();
        } else {
            this.currentIndex < this.variants.length-1 ? this.currentIndex++ : this.currentIndex = 0;
        }
    }

    getRandom(): number {
        return Math.floor(Math.random() * (this.variants.length));
    }
}


/**
 * Главный компонент
 */
@Component({
    selector: 'app-root',
    template: `
    <div *ngIf="isLoaded">
      <h3>Выполнение заданий</h3>
      <div *ngFor="let question of questions; let i = index">
          <div>{{question.text}}</div>
          <vt-select
                  [(answers)]="question.options"
                  (modelChange)="changeResult(i, $event)"
                  [(selectedValue)]="results[i]">
          </vt-select>
      </div>
  
      <vt-score [countAll]="results.length" [countSuccess]="countSuccess"></vt-score>
      <hr>
      <vt-learn [variants]="variants"></vt-learn>
    </div>
  `
})
export class AppComponent implements OnInit {
    isLoaded = false;

    questions: Question[];
    variants: Variant[];
    results: Answer[];
    countSuccess: number = 0;

    ngOnInit(): void {
        this.getQuestions();
        this.results = [];
        for (let question in this.questions) {
            this.results.push({value: '', isCorrect: false});
        }
        this.getVariants();
        this.isLoaded = true;
    }

    changeResult(index, $event) {
        this.results[index] = $event;
        this.calculateData();
    }

    calculateData() {
        this.countSuccess = 0;
        this.results.forEach(item => {
            if (item.isCorrect) {
                this.countSuccess++;
            }
        });
    }

    getQuestions() {
        this.questions = [
            {
                text: 'Как по английски яблоко?',
                options: [
                    {value: 'apple', isCorrect: true},
                    {value: 'orange', isCorrect: false},
                    {value: 'cucumber', isCorrect: false},
                ]
            },
            {
                text: 'Как по английски город?',
                options: [
                    {value: 'village', isCorrect: false},
                    {value: 'city', isCorrect: true},
                    {value: 'country', isCorrect: false},
                ]
            },
            {
                text: 'Как по английски лес?',
                options: [
                    {value: 'wood', isCorrect: false},
                    {value: 'taiga', isCorrect: false},
                    {value: 'forest', isCorrect: true},
                ]
            }
        ];
    }

    getVariants() {
        this.variants = [
            {
                value: 'apple',
                translate: 'яблоко'
            },
            {
                value: 'city',
                translate: 'город'
            },
            {
                value: 'forest',
                translate: 'лес'
            },
            {
                value: 'map',
                translate: 'карта'
            },
            {
                value: 'car',
                translate: 'автомобиль'
            },
            {
                value: 'picture',
                translate: 'картинка'
            },
            {
                value: 'development',
                translate: 'разработка'
            }
        ];
    }
}


@NgModule({
    declarations: [
        AppComponent, VTScoreComponent, VTSelectComponent, VTLearnComponent
    ],
    imports: [
        BrowserModule, FormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
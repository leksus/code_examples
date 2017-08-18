import {Component, OnInit} from '@angular/core';
import {Answer} from "../interfaces/answer";
import {Question} from "../interfaces/question";
import {Variant} from "../interfaces/variant";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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

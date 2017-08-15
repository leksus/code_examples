import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Variant} from "../interfaces/variant";

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

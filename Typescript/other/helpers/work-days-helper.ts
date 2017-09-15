import * as moment from 'moment';
import {Holiday} from "./holiday";

/**
 * Утилиты для подсчета рабочих дней, на основе списка выходных дней
 */
export class WorkDaysHelper {

    holydays: Array<string>;
    constructor(holydays: Array<Holiday>) {
        // Переводим в формат, удобный для поиска
        this.holydays = holydays.map(item => {
            return moment(item.date).format('YYYY-MM-DD');
        });
    }

    /**
     * Подсчет количества рабочих дней
     * @param {Date} date
     * @returns {number}
     */
    calculateDaysCountFromDate(date: Date) {
        let current = moment();
        let needDate = moment(date);

        // Если дата является сегодняшним днем - возвращаем 0
        if (current.format('YYYY-MM-DD') == needDate.format('YYYY-MM-DD')) {
            return 0;
        }

        // Поздняя дата - дата проверки
        let late = needDate;
        // Ранняя дата - текущая дата
        let early = current;

        // Меняем местами, если сегодня больше даты проверки
        // Это нужно для подсчета дат, которые уже прошли
        if (current.valueOf() > needDate.valueOf()) {
            late = current;
            early = needDate;
        }

        let daysCount = 0;

        // Далее по одному дню прибавляем ранней дате, пока она меньше
        while (early.valueOf() <= late.valueOf()) {
            if (!this.isHoliday(early.format('YYYY-MM-DD'))) {
                // Если не является праздником, то прибавляем один рабочий день
                daysCount++;
            }
            early.add(1, 'day');
        }

        return daysCount
    }

    /**
     * Проверка, является дата выходным днем
     * @param {string} date
     * @returns {boolean}
     */
    private isHoliday(date: string): boolean {
        return this.holydays.some(item => {
            return item == date;
        });
    }
}
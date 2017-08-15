import {Answer} from "./answer";

export interface Question {
    text: string,
    options: Answer[]
}
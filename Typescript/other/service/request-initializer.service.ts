import {Injectable} from '@angular/core';
import {UserContext} from "./user-context.service";
import {RequestResource} from "./request.service";
import {UserSnapshot, Request, User, UserHelper, MRSD, RS_NEW} from '../classes/classes';
import { AsyncSubject, Subscription } from "rxjs";
import * as moment from 'moment';
import {UserGroupWork} from "../classes/models/user-group-work";

@Injectable()
export class RequestInitializer {

    user: User;
    userContextSubscription: Subscription;
    requestFieldsFromPrev: Array<string>;
    userFieldsFromPrev: Array<string>;
    snapFieldsFromPrev: Array<string>;
    userFieldsFromProfile: Array<string>;

    constructor(private userContext: UserContext, private requestResource: RequestResource) {
        // Поля заявки, которые должны мигрировать из предыдущей
        this.requestFieldsFromPrev = [
            'user_snapshot',
            // 'skills',
            'purporses',
            // 'proffesional_gains'
        ];
        // Поля юзера, которые должны мигрировать из предыдущей заявки
        this.userFieldsFromPrev = [
            'picture',
            'attestations',
            'labour_document',
            'user_educations',
            'positions',
            'user_degrees',
            'user_group_works',
            'user_education_positions',
            'user_awards'
        ];
        // Поля юзера, которые должны мигрировать из предыдущей заявки
        this.snapFieldsFromPrev = [
            'user',
            'data',
            'role_tags'
        ];
        // Поля юзера, которые должны обновиться из профиля
        this.userFieldsFromProfile = [
            'id',
            'surname',
            'first_name',
            'second_name',
            'birthdate',
            'personal_emails',
            'personal_phones',
            'work_phones',
            'work_emails',
            'phones',
            'emails',
            'sex',
            'roles'
        ];
    }

    /**
     * Получение инициализированной заявки
     * @param {number} id
     * @returns {BehaviorSubject<Request>}
     */
    public getRequest(id: number): AsyncSubject<Request> {
        // Создаем subject, чтобы потом отправлять подписчикам нужную заявку
        let requestSubject = new AsyncSubject<Request>();
        // Если заявка создается, то происходит инициализация
        // Какие-то поля берутся из предыдущей заявки, какие-то подтягиваются из профиля
        this.userContextSubscription = this.userContext.base.subscribe(user => {
            this.user = new User(user);

            if (id == 0) {
                this.requestResource.getLastRequest().subscribe(item => {
                    this.init(item);
                    requestSubject.next(item);
                    requestSubject.complete();
                });
            } else {
                this.requestResource.getOne(id).subscribe(item => {
                    this.actualizeRole(item);
                    // Отправляем подписчикам созданную заявку
                    requestSubject.next(item);
                    requestSubject.complete();
                });
            }
        });

        return requestSubject;
    }

    /**
     * Отписка от потоков
     */
    unsubscribe(): void {
        this.userContextSubscription.unsubscribe();
    }

    /**
     * Инициализация заявки: миграция данных из предыдущей заявки, плюс подтягивание актуальных данных из профиля
     * @param {Request} request
     */
    private init(request: Request) {
        // Если нет предыдущей заявки, инициализируем на основе профиля
        if (!request.id) {
            let userObj = {id: this.user.id};
            let userSnapshot = new UserSnapshot({
                user: userObj,
                data: this.user,
            });
            request.user_snapshot = userSnapshot;
            this.prepareUserGroupWorks(request);
            return;
        }
        // Очистка ненужных полей предыдущей заявки
        request.clear(this.requestFieldsFromPrev);
        request.user_snapshot.data.clear(this.userFieldsFromPrev);
        request.user_snapshot.clear(this.snapFieldsFromPrev);

        // Миграция нужных значений из профиля
        this.userFieldsFromProfile.forEach(field => {
            if (this.user.hasOwnProperty(field)) {
                request.user_snapshot.data[field] = this.user[field];
            }
        });
        this.prepareUserGroupWorks(request);
    }

    /**
     * Инициализация сущностей кружковой работы юзера
     * Т.к. логика этой части относится к инициализации полей заявки, то размещаем здесь
     * @param {Request} request
     */
    private prepareUserGroupWorks(request: Request): void {
        if (!request.user_snapshot.data.user_group_works ||
            !request.user_snapshot.data.user_group_works.length
        ) {
            const USER_GROUP_WORK_COUNT = 3;
            let current = moment();
            for (let i = 1; i <= USER_GROUP_WORK_COUNT; i++) {
                let tempEntity = new UserGroupWork();
                // Необходимый формат учебного года 2017/18
                tempEntity.edu_year = current.format('YYYY') + '/' + (parseInt(current.format('YY'))+1);
                request.user_snapshot.data.user_group_works.unshift(tempEntity);
                current.subtract(1, 'year');
            }
        }
    }

    /**
     * Метод для обновления роли в заявке в соответствии с профилем пользователя
     * также производится очистка полей, не соответствующих роли
     * @param {Request} request
     */
    private actualizeRole(request: Request): void {
        // Механизм только для неотправленных заявок
        if (request.status.code !== RS_NEW.code) {
            return;
        }
        let currentUserHelper = new UserHelper(this.user);
        let requestHelper = new UserHelper(request.user_snapshot.data);

        // Выходим, если текущий юзер - админ, либо роли одинаковые
        if (currentUserHelper.isAdmin() || currentUserHelper.getRoleCode() == requestHelper.getRoleCode()) {
            return;
        }

        // Актуализируем роль в соответствии с профилем пользователя
        request.user_snapshot.data.roles = this.user.roles;

        // Очищаем поля, не-характерные для определенной роли
        if (currentUserHelper.isManager()) {

            for (let field of ['purporses']) {
                request.initializeField(field);
            }

            request.user_snapshot.data.initializeField('employee_review');
            if (request.user_snapshot.data.positions.length) {
                for (let field of ['surname', 'first_name', 'second_name']) {
                    request.user_snapshot.data.positions[0].organization.head[field] = '';
                }

                request.user_snapshot.data.positions.map(item => {
                    item.functional = '';
                });
            }
        } else if (currentUserHelper.isCandidate()) {
            if (request.user_snapshot.data.positions.length) {
                for (let field of ['head_council_fio', 'head_council_position', 'head_council_organization', 'head_council_force']) {
                    request.user_snapshot.data.positions[0].organization[field] = null;
                }

                request.user_snapshot.data.positions[0].organization.mrsd = new MRSD();

                request.user_snapshot.data.positions.map(item => {
                    item.start_date = null;
                    item.start_contract_date = null;
                    item.finish_contract_date = null;
                });
            }
        }
    }
}

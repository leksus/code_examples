import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { MessageService, Message, AND, NOT, LogicType, FilterProvider } from 'common.module';
import { Observable } from "rxjs";
import { AttestationCouncil, User, TestRequest, Request, UserHelper, ConfigStore, Config, TestResult,
    ARCHIVE_STATUSES, RequestStatus, RS_STATUSES, RS_NEW, RS_CANCEL, RS_TEST_DECLINED, RS_ACCEPTED, RS_DECLINED,
    RS_ARCHIVED, WorkDaysHelper, UserSnapshot, RequestSnap, CompiledResult, TestHelper, EV_VALIDS, EksValid
} from '../classes/models';
import { UserContext, HolydaysContext, TestResultResource, ConfigContext,
    AttestationCouncilResource, RequestListProvider, RequestResource
} from '../services/services';
import { RequestListFilter } from '../config/request-list.filter';

@Component({
    selector: 'request-list',
    providers: [
        {provide: FilterProvider , useClass: RequestListFilter}
    ],
    templateUrl: '../templates/request-list.component.html',
})
export class RequestListComponent implements OnInit {
    statuses: RequestStatus[];
    filter: LogicType;
    requests: Request[];
    test_results: TestResult[];
    requestRoles:{};
    helper: UserHelper;
    subpage: string = '';
    user: User;
    filterToken = 'request-list';
    declinePopupShown = false;
    testResultsShown = false;
    currentTestRequest: TestRequest;
    currentTestRequestSnap: any;
    requestSnaps:{};
    currentRequest = new Request();
    isRequestAllowed = false;
    isUser: boolean
    config: ConfigStore = new ConfigStore([]);
    archivedStatuses = ARCHIVE_STATUSES;
    isAdmin: boolean;
    declineStatus = '';
    councils: AttestationCouncil[] = [];
    isAdminOnly: boolean;
    paramBag: Params = null;
    workDaysHelper: WorkDaysHelper;
    valids: EksValid[];

    constructor(
        private userContext: UserContext,
        private configContext: ConfigContext,
        private testResultResource: TestResultResource,
        private holidaysContext: HolydaysContext,
        private councilResource: AttestationCouncilResource,
        private requestListProvider: RequestListProvider,
        private route: ActivatedRoute,
        private message: MessageService,
        private requestResource: RequestResource,
        private router: Router
    ) {
        this.requests = [];
        this.test_results = [];
        this.requestSnaps = {};
        this.user = new User();
        this.helper = new UserHelper(this.user);
        this.filter = new AND();
        this.isAdmin = false;
        this.isAdminOnly = false;
        this.isUser = null;//является ли пользователь ролью с att_user
        this.valids = EV_VALIDS;
    }

    /**
     * Показывает диалог отмены заявки по нажатию на кнопку
     */
    showDeclineDialog(requestId: number) {
        let currentRequestObj = this.requests.find((request) => request.id == requestId);
        if (!currentRequestObj) {
            this.message.set(new Message('Не удалось найти заявку','danger'));
            return;
        }
        this.declineStatus = '';
        this.currentRequest = currentRequestObj;
        this.declinePopupShown = true;
    }

    cancelRequest() {
        this.declineStatus = '';
        if (!this.currentRequest.cancel_review) {
            this.declineStatus = 'Необходимо добавить заявление';
            return;
        }
        this.declinePopupShown = false;
        this.currentRequest.status = RS_CANCEL;
        this.requestResource.update(this.currentRequest).subscribe((data) => {
            this.message.set(new Message('Заявка отменена', 'warning'));
            this.markNewRequestAllowed(this.requests);
        });
    }

    /**
     * Показать окно результатов тестирования
     */
    showTestResults(requestId: number, requestSnap: CompiledResult): void {
        let currentRequestObj = this.requests.find((request) => request.id === requestId);
        if (!currentRequestObj) {
            this.message.set(new Message('Не удалось найти заявку', 'danger'));
            return;
        }

        if (!currentRequestObj.test_requests.length) {
            this.message.set(new Message('Не удалось найти тестирования', 'danger'));
            return;
        }

        this.currentRequest = currentRequestObj;
        this.currentTestRequestSnap = requestSnap;

        this.currentTestRequest = currentRequestObj.test_requests.find(request => {
            return request.test_slot.id === requestSnap.test_slot.id;
        });

        if (!this.currentTestRequest) {
            this.message.set(new Message('Не удалось найти результаты тестирования', 'danger'));
            return;
        }

        this.testResultsShown = true;
    }

    /**
     * Скрыть окно результатов тестирования
     */
    closeTestResults(): void {
        this.testResultsShown = false;
    }

    ngOnInit() {
        document.documentElement.classList.remove('request-page');
        this.requestRoles = {};
        this.statuses = RS_STATUSES;
        this.userContext.base.subscribe((data) => {
            if(!data) {
                return;
            }
            this.setAccessVariables(data);
            this.route.params.subscribe((params: Params) => {
                this.paramBag = params;
                if(!params['role']) {
                    params = Object.assign({}, params, {role:'att_candidate'});
                }
                this.setFilterToken(params);

                this.holidaysContext.base.subscribe((calendar) => {
                    if(!calendar) {
                        return;
                    }
                    this.setWorkCalendar(calendar);
                    this.configContext.base.subscribe((config) => {
                        if(!config) {
                            return;
                        }
                        this.config = new ConfigStore(config);
                        if(!this.isAdmin) {
                            this.requestListProvider.getRequestList(params, this.user).subscribe((requests) => {
                                this.prepareDataForTemplate(requests);
                            });
                            return;
                        }
                        Observable.forkJoin(
                            this.requestListProvider.getRequestList(params, this.user),
                            this.testResultResource.query(),
                            this.councilResource.query()
                        ).subscribe((data) => {
                            this.test_results = data[1];
                            this.subpage = params['role'];
                            this.prepareDataForTemplate(data[0]);
                            this.councils = data[2];
                        });
                    });
                });
            });
        });
    }

    private setWorkCalendar(calendar:{error:string,data:string}) {
        let calendarData = {};
        if (calendar.data && !calendar.error) {
            calendarData = calendar.data;
        } else {
            let error = 'Ошибка работы API производственного календаря. Рабочие дни будут подсчитаны неверно.';
            this.message.set(new Message(error,'danger'));
        }
        this.workDaysHelper = new WorkDaysHelper(calendarData);
    }

    private setAccessVariables(user: User) {
        this.helper.setUser(user);
        this.isAdmin = this.helper.isAdmin();
        this.isAdminOnly = this.helper.isAdminOnly();
        this.isUser = this.helper.isUser();
        this.user = user;
    }

    private setFilterToken(params: Params) {
        if(params['role'] == 'att_manager') {
            this.filterToken = 'request-list-manager';
        } else if (params['role'] == 'att_candidate') {
            this.filterToken = 'request-list';
        }
    }

    /**
     * Управляет текущей ролью страницы
     */
    showSubPage(token: string) {
        let filter = {role: token};
        //АК - один из параметров, которые мы не сбрасываем после переключения страницы
        if(this.paramBag['ak']) {
            filter['ak'] = this.paramBag['ak'];
        }
        this.router.navigate([ '/requests', filter]);
    }

    /**
     * Подготавливает данные для отображения в шаблоне
     * @param data: Request[] - список заявок полученный с сервера
     */
    private prepareDataForTemplate(data: Request[]): void {
        this.requests = [];
        this.requestRoles = {};
        this.requestSnaps = {};
        this.requests = data;
        this.requests = this.requests.map((request) => {
            if (!request.user_snapshot.data) {
                return request;
            }
            let snapHelper = new UserHelper(request.user_snapshot.data);
            if(!snapHelper.getRole()) {
                return request;
            }
            let requestId = request.id;
            this.requestRoles[requestId] = snapHelper.translateRole(snapHelper.getRole());
            this.requestSnaps[requestId] = this.createRequestSnap(request);
            this.requestSnaps[requestId].is_candidate = snapHelper.isCandidate();
            return request;
        }).sort(Request.sortRequests);

        this.markNewRequestAllowed(this.requests);
    }
    //TODO: перенести в request-snap.ts
    private createRequestSnap(request: Request): RequestSnap {
        let requestSnap = new RequestSnap();

        if (!request.user_snapshot || !request.user_snapshot.data) {
            requestSnap.user = new User();
            return requestSnap;
        }

        let userSnap = request.user_snapshot;

        if (request.user_snapshot.user && request.user_snapshot.user.request_count) {
            requestSnap.request_count = request.user_snapshot.user.request_count;
        }
        let snapHelper = new UserHelper(userSnap.data);
        requestSnap.user = new User(userSnap.data);

        if(Array.isArray(requestSnap.user.positions) && requestSnap.user.positions.length &&
            requestSnap.user.positions[0].attestation) {
            requestSnap.currentAttestation = requestSnap.user.positions[0].attestation;
        }

        requestSnap.hasCgu = this.getCgu(userSnap);
        let daysSub = 0;

        if (snapHelper.isCandidate()) {
            daysSub = +this.config.get('CANDIDATE_TECH_DAYS');
        } else {
            daysSub = +this.config.get('MANAGER_TECH_DAYS');
        }

        let daysFromRequestSend = this.workDaysHelper.calculateDaysCountFromDate(request.date);

        if(request.date) {
            requestSnap.techDaysCounter = daysSub - daysFromRequestSend;
        }

        let testDays = +this.config.get('CANDIDATE_TEST_DAYS');
        if(snapHelper.isManager()) {
            testDays = +this.config.get('MANAGER_TEST_DAYS');
        }

        requestSnap.testDaysCounter = testDays - daysFromRequestSend;

        requestSnap.testResults = TestHelper.getCompiledTestResults(request);

        let attestationDays = +this.config.get('MANAGER_ATTESTATION_DAYS');
        requestSnap.attestationDaysCounter = attestationDays - daysFromRequestSend;

        this.setExpertsList(request, requestSnap);
        let expertUsers = request.experts.map((expert) => {
            let user = new User(expert);
            return user.getTitle();
        });
        requestSnap.currentExpert = expertUsers.join(';');

        return requestSnap;
    }

    /**
     * Заполняет список экспертов
     */
    private setExpertsList(request: Request, requestSnap: RequestSnap) {
        let experts: string[] = [];

        if (request.all_experts) {
            experts = request.all_experts.split(';');
        }
        experts = experts.map((expert) => {
            return expert.trim();
        })

        if (Array.isArray(request.experts)) {
            for (let item of request.experts) {
                let expertEntity = new User(item);
                let title = expertEntity.getTitle().trim();
                if (experts.indexOf(title) == -1) {
                    experts.push(title);
                }
            }
        }
        requestSnap.expertsList = experts.join('; ');
        return requestSnap;
    }

    /**
     * Получает значение метки ЦГУ
     */
    private getCgu(userSnapshot:UserSnapshot): boolean {
        if (!Array.isArray(userSnapshot.role_tags)) {
            return false;
        }
        let cguTag = userSnapshot.role_tags.find((item) => item.code == 'cgu');
        return Boolean(cguTag);
    }

    private markNewRequestAllowed(requests: Request[]) : void {
        this.isRequestAllowed = true;
        for(let request of requests) {
            if (!this.checkStatus(request.status)) {
                this.isRequestAllowed = false;
            }
        }
        this.isRequestAllowed = !this.isAdmin && this.isRequestAllowed;
    }

    /**
     * Получает список экспертов для заявки
     */
    getRequestExperts(request: Request): string {
        let expertsArray: string[] = [];
        for (let expert of request.experts) {
            let expertUser = new User(expert);
            expertsArray.push(expertUser.getTitle());
        }
        return expertsArray.join(', ');
    }

    /**
     * Проверка соответствия статусов
     * @param status
     * @returns {boolean}
     */
    checkStatus(status: RequestStatus) {
        if (ARCHIVE_STATUSES.indexOf(status.code) >= 0) {
            return true;
        }

        return false;
    }

    /**
     *
     * @param id
     * @returns {EksValid}
     */
    getEks(id: string) {
        let precom = this.valids.find(item => item.id == id);
        if(precom) {
            return precom.title;
        }
        return 'Не указано';
    }

    redirectToLogs(id: string) {
        this.router.navigate(['/logs', {request: id}]);
    }

    redirectToAllRequestsOfUser(user: User) {
        let hydratedEntity = new User(user);
        this.router.navigate(['/requests', {user: hydratedEntity.getTitle(), role:this.subpage}]);
    }

    private translateStatus(status: RequestStatus): string
    {
        switch (status.code) {
            case 'test_declined':
            case 'request_declined':
                return 'Отказ в процедуре аттестации';
            case 'check_council':
                return 'Техническая экспертиза';
            default:
                return status.title;
        }
    }
}

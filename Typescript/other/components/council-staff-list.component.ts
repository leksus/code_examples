import { Component, OnInit } from '@angular/core';

import {
    UserHelper, UserContext, CouncilParticipantResource, CouncilStaffResource, ConfigContext
} from "core.module";
import {Error, Message, MessageService} from 'common.module';
import {CouncilParticipant} from "../../core/classes/council-participant";
import {CouncilStaff} from "../../core/classes/council-staff";
import {CR_LEAD_CODE} from "../../core/classes/council-role";
import {Router} from "@angular/router";

@Component({
    selector: 'council-staff-list',
    templateUrl: '../templates/council-staff-list.component.html',
})
export class CouncilStaffListComponent implements OnInit {
    isLoading: boolean = true;

    userHelper: UserHelper;
    showEditForm: boolean;
    errors = new Map<string, Error>();

    staffs: CouncilStaff[];

    constructor(
        private staffResource: CouncilStaffResource,
        private message: MessageService,
        private router: Router,
        public userContext: UserContext,
        public configContext: ConfigContext,
    ) {

    }

    ngOnInit() {
        this.userContext.base.subscribe((user) => {
            if(!user) {
                return;
            }
            this.userHelper = new UserHelper(user);
            this.staffResource.query().subscribe(data => {
                this.staffs = data;
                this.isLoading = false;
            });
        });
    }

    onDelete(staff: CouncilStaff) {
        this.staffResource.delete(staff).subscribe(data => {
            this.staffs = this.staffs.filter(item => item.id != staff.id);
        });
    }

    getStaffLeadFio(staff: CouncilStaff) {
        let participant = staff.participants.find(item => item.role.code == CR_LEAD_CODE);
        return participant ? participant.council_participant.fio : '';
    }

    translateIsActive(staff) {
        return staff.is_active ? 'Действующий' : 'Недействующий';
    }
}

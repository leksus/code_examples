import { Component, OnInit } from '@angular/core';

import {
    UserHelper, UserContext, CouncilParticipantResource, CouncilStaffResource, CouncilRoleResource,
    StaffParticipantResource
} from "core.module";
import {Error, Message, MessageService} from 'common.module';
import {CouncilParticipant} from "../../core/classes/council-participant";
import {CouncilStaff} from "../../core/classes/council-staff";
import {ActivatedRoute, Router} from "@angular/router";
import {CouncilRole} from "../../core/classes/council-role";
import {StaffParticipant} from "../../core/classes/staff-participant";

@Component({
    selector: 'council-staff-edit',
    templateUrl: '../templates/council-staff-edit.component.html',
})
export class CouncilStaffEditComponent implements OnInit {
    isLoading: boolean = true;

    userHelper: UserHelper;
    showEditForm: boolean;
    errors = new Map<string, Error>();

    staff: CouncilStaff;
    currentParticipant: StaffParticipant;
    participants: StaffParticipant[];
    roles: CouncilRole[];
    tempCouncilRole: CouncilRole;
    tempCouncilParticipant: CouncilParticipant;

    constructor(
        private councilParticipantResource: CouncilParticipantResource,
        private councilStaffResource: CouncilStaffResource,
        private councilRoleResource: CouncilRoleResource,
        private message: MessageService,
        public userContext: UserContext,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.currentParticipant = new StaffParticipant();
        this.participants = [];

        this.tempCouncilRole = new CouncilRole();
        this.tempCouncilParticipant = new CouncilParticipant();
    }

    ngOnInit() {
        this.userContext.base.subscribe(user => {
            if(!user) {
                return;
            }
            this.userHelper = new UserHelper(user);
            this.councilRoleResource.query().subscribe(data => {
                this.roles = data;

                let id = this.route.snapshot.params['id'];
                if (id === '0') {
                    this.staff = new CouncilStaff();
                    this.staff.participants = [];
                    this.staff.is_active = true;
                    this.isLoading = false;
                } else {
                    this.councilStaffResource.getOne(id).subscribe(staff => {
                        this.staff = staff;
                        this.isLoading = false;
                    });
                }
            });
        });
    }

    onEditParticipant(participant: StaffParticipant) {
        this.currentParticipant = participant;
        this.showEditForm = true;
    }

    onAddParticipant() {
        this.validateParticipantForm();
        if (this.errors.size) {
            this.message.set(new Message('Некорректно заполнена форма','danger'));
            return;
        }
        this.participants.push(this.currentParticipant);
        this.currentParticipant = new StaffParticipant();
        this.showEditForm = false;
    }

    onCouncilParticipantChange(data) {
        this.currentParticipant.council_participant = new CouncilParticipant(data);
    }

    onCouncilRoleChange(data) {
        this.currentParticipant.role = new CouncilRole(data);
    }

    onSave() {
        let observer = null;

        if (!this.staff.id) {
            observer = this.councilStaffResource.create(this.staff);
        } else {
            observer = this.councilStaffResource.update(this.staff);
        }

        observer.subscribe((data: CouncilStaff) => {
            if (!this.staff.id) {
                this.staff.id = data.id;
            }
            this.participants.map(item => {
                item.staff = data;
            });
            this.staff.participants = this.participants;
            this.councilStaffResource.update(this.staff).subscribe(data => {
                this.message.set(new Message('Состав успешно сохранен','success'));
                // this.router.navigate('/attestation/staffs/' + this.staff.id);
            });
        });
    }

    validateParticipantForm() {
        this.errors = new Map<string, Error>();
        if(!this.currentParticipant.council_participant) {
            this.errors.set('fio', new Error('Необходимо заполнить ФИО'));
        }
        if(!this.currentParticipant.role) {
            this.errors.set('role', new Error('Необходимо заполнить роль'));
        }
    }
}

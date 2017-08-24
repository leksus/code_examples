import { Component, OnInit } from '@angular/core';

import {
    UserHelper, UserContext, CouncilParticipantResource
} from 'core.module';
import {Error, Message, MessageService} from 'common.module';
import {CouncilParticipant} from '../../core/classes/council-participant';

@Component({
    selector: 'council-participant-list',
    templateUrl: '../templates/council-participant-list.component.html',
})
export class CouncilParticipantListComponent implements OnInit {
    isLoading: boolean = true;

    userHelper: UserHelper;
    showEditForm: boolean;
    errors = new Map<string, Error>();

    participants: CouncilParticipant[];
    currentParticipant: CouncilParticipant;

    constructor(
        private participantResource: CouncilParticipantResource,
        private message: MessageService,
        public userContext: UserContext
    ) {
        this.currentParticipant = new CouncilParticipant();
    }

    ngOnInit() {
        this.userContext.base.subscribe((user) => {
            if(!user) {
                return;
            }
            this.userHelper = new UserHelper(user);
            this.participantResource.query().subscribe(data => {
                this.participants = data;
                this.isLoading = false;
            });
        });
    }

    onEdit(participant: CouncilParticipant) {
        this.currentParticipant = participant;
        this.showEditForm = true;
    }

    onSave() {
        this.validateForm();
        if (this.errors.size) {
            this.message.set(new Message('Некорректно заполнена форма','danger'));
            return;
        }
        let observer = null;

        if (!this.currentParticipant.id) {
            observer = this.participantResource.create(this.currentParticipant);
        } else {
            observer = this.participantResource.update(this.currentParticipant);
        }

        observer.subscribe((data: CouncilParticipant) => {
            if (!this.currentParticipant.id) {
                this.currentParticipant.id = data.id;
                this.participants.push(this.currentParticipant);
            }
            this.currentParticipant = new CouncilParticipant();
            this.showEditForm = false;
        });
    }

    onDelete(participant: CouncilParticipant) {
        this.participantResource.delete(participant).subscribe(data => {
            this.participants = this.participants.filter(item => item.id != participant.id);
        });
    }

    validateForm() {
        this.errors = new Map<string, Error>();
        if(!this.currentParticipant.fio) {
            this.errors.set('fio', new Error('Необходимо заполнить ФИО'));
        }
        if(!this.currentParticipant.position) {
            this.errors.set('position', new Error('Необходимо заполнить должность'));
        }
        if(!this.currentParticipant.job) {
            this.errors.set('job', new Error('Необходимо заполнить место работы'));
        }
    }
}

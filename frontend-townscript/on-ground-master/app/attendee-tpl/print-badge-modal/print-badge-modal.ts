'use strict';
import * as angular from "angular";
import { NgModule } from "@angular/core";
import * as _ from "lodash";

declare var Clipboard: any;

export const OnGroundPrintBadgeView = angular.module('onGround.printBadgeView', []);

OnGroundPrintBadgeView.controller('printBadgeController', printBadgeController);

printBadgeController.$inject = ['registration', 'eventObj', 'headingText', 'apiService', 'KeyConstants', 'Notification', '$location', 'buttonSubmitText', '$uibModalInstance'];

function printBadgeController(registration, eventObj, headingText, apiService, KeyConstants, Notification, $location, buttonSubmitText, $uibModalInstance) {
    var vm = this;
    vm.registration = null;
    vm.event = angular.copy(eventObj);
    vm.headingText = headingText;
    vm.buttonSubmitText = buttonSubmitText;
    vm.isClicked = false;
    vm.isBadgeCliked = false;
    vm.flag = null;
    var clipboard = new Clipboard('.mdi-clipboard-text');
    //functions
    vm.cancel = cancel;
    vm.ok = ok;
    vm.getTicketNames = getTicketNames;
    vm.getCompanyName = getCompanyName;
    //////////////
    function cancel() {
        $uibModalInstance.dismiss('cancel');
    }

    vm.loadRegistrationData = loadRegistrationData;

    function loadRegistrationData() {

        apiService.loadRegistrationData.load(
            {
                id: registration.id
            },
            function (data) {
                if (data.result != 'Success') {
                    Notification.error(data.message);
                    return;
                }
                vm.flag = [1];
                vm.registration = JSON.parse(data.data);
            },
            function (error) {
                if (error.status == 401) {
                    $location.path("signin");
                } else {
                    Notification.error(error.message);
                }
            }
        );
    }

    vm.loadRegistrationData();

    function getCompanyName(registration) {
        var formAnswers = _.filter(registration.formAnswers, function (formAnswer) {
            return (formAnswer.questionId == 171405 || formAnswer.questionId == 149732 || formAnswer.questionId == 149734)
        });
        if (formAnswers == undefined || formAnswers.length == 0) {
            return "";
        } else {
            return formAnswers[0].answer;
        }
    }

    function getTicketNames(registration) {
        var ticketNames = _.map(registration.attendeeTicketsInfoList, 'ticketName');
        var uniqueTickets = _.uniq(ticketNames);
        if (uniqueTickets.length == 1) {
            if (ticketNames.length == 1) {
                return uniqueTickets[0];
            }
            return ticketNames.length + ' * ' + uniqueTickets[0];
        } else {
            var ticketCount = [];
            var ticketArray = [];
            for (var j = 0; j < uniqueTickets.length; j++) {
                if (!registration.cancelled) {
                    ticketCount[j] = _.map(_.filter(registration.attendeeTicketsInfoList, function (attendeeObj) {
                        return (attendeeObj.ticketName == uniqueTickets[j]) && (attendeeObj.cancelled != true)
                    }), 'id').length;
                } else {
                    ticketCount[j] = _.map(_.filter(registration.attendeeTicketsInfoList, function (attendeeObj) {
                        return attendeeObj.ticketName == uniqueTickets[j]
                    }), 'id').length;
                }
                if (ticketCount[j] > 0) {
                    ticketArray.push(ticketCount[j] + ' * ' + uniqueTickets[j]);
                }
            }
            return ticketArray.join(', ');
        }
    };

    function ok() {
        vm.isClicked = true;



        apiService.updatePrintBadgeForAttendee.update(
            {
                registrationId: registration.id,
                eventId: vm.event.id,
                mark: true
            },
            function (data) {
                if (data.result != 'Success') {
                    Notification.error(data.message);
                    return;
                }
                //open print window
                var mywindow = window.open('', 'PRINT', 'height=' + window.innerHeight + ',width=' + window.innerWidth);
                var html = `<div style="margin-top:75mm;text-align:center;padding:0 18%;">
                                <span style="margin-bottom: 2%;font-size:52px"><strong>${vm.registration.userName}</strong></span><br><br>
                            </div>`;

                if (vm.event.id == 148050) {
                    var html = `<div style="width:8cm;height:10cm;position: relative;background: url(https://townscript-common-resources.s3.ap-south-1.amazonaws.com/Batman/badges/BADGE-ILS-VISUAL.jpg
                            );background-size: cover;font-family: sans-serif;font-size: 14px;">
                                <div style="position: absolute; left:51.5%;top:60.5%;width:50%">
                                    <span style="margin-bottom: 2%">${new Date(vm.registration.registrationTimestamp).toLocaleDateString()}</span><br><br>
                                    <span style="margin-bottom: 2%">${vm.registration.attendeeTicketsInfoList[0].ticketPrice}</span><br><br><br>
                                    <span style="">${vm.registration.attendeeTicketsInfoList.length + ' x ' + vm.registration.attendeeTicketsInfoList[0].ticketName}</span><br>
                                </div>
                                <img src="https://www.townscript.com/api/qrcode/attendee-checkin-qrcode?registrationid=${vm.registration.id}&eventid=${vm.event.id}" alt=""
                                    width="100px" height="100px" style="position: absolute;top: 56%;left: 12.5%;width: 106px;height: 106px;">
                            </div>`;
                }
                else if (vm.event.id == 136849) {
                    let answers = vm.registration.formAnswers;
                    let country = answers.filter(ele => ele.questionId == 161929)[0] ? answers.filter(ele => ele.questionId == 161929)[0].answer : '';
                    let designation = answers.filter(ele => ele.questionId == 161930)[0] ? answers.filter(ele => ele.questionId == 161930)[0].answer : '';
                    let organisation = answers.filter(ele => ele.questionId == 161928)[0] ? answers.filter(ele => ele.questionId == 161928)[0].answer : '';
                    var html = `<div style="width:9cm;height:5cm;position: relative;background: url(https://townscript-common-resources.s3.ap-south-1.amazonaws.com/Batman/badges/90x50mm.jpg
                                );background-size: cover;font-family: sans-serif">
                                    <div style="margin: 0 auto;padding-top:18%;text-align: center;">
                                        <span style="margin-bottom: 2%;font-size: 16px;display: block;">${vm.registration.userName}</span>
                                        <span style="font-size: 13px;margin-bottom: 1%;display: block;">${designation}</span>
                                        <span style="font-size: 13px;margin-bottom: 1%;display: block;">${organisation}</span>
                                        <span style="font-size: 13px;">${country}</span>
                                    </div>
                                </div>`;
                } else if (vm.event.id == 278238) {
                    var html = `<div style="margin-top:75mm;text-align:center;padding:0 18%;">
                                <span style="margin-bottom: 2%;font-size:42px"><strong>${vm.registration.userName}</strong></span><br><br>
                            </div>`;
                }else if(vm.event.id == 240318){
                    var html = `<div style="margin-top:70mm;text-align:center;padding:0 18%;">
                                <span style="margin-bottom: 2%;font-size:52px"><strong>${vm.registration.userName}</strong></span><br><br>
                            </div>`;
                }


                mywindow.document.write(html);
                setTimeout(() => {
                    mywindow.document.close(); // necessary for IE >= 10
                    mywindow.focus(); // necessary for IE >= 10*/
                    mywindow.print();
                    mywindow.close();
                    $uibModalInstance.close('true');
                }, 2000);

            },
            function (error) {
                if (error.status == 401) {
                    $location.path("signin");
                } else {
                    Notification.error(error.message);
                }
                vm.isClicked = false;
                vm.isBadgeCliked = false;
            }
        );

    }
}

@NgModule({})
export class NgOnGroundPrintBadgeView {
}

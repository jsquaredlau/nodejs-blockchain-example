// Copyright BASYX.lab
import * as firebase from "firebase";
import * as Q from 'q';

import { ContractParameters, BusinessDetails } from '../models';

const config = {
    apiKey: "AIzaSyBQNNPknNbL21FqtJLDbZpd9DvC3Nqudnk",
    authDomain: "laas-1.firebaseapp.com",
    databaseURL: "https://laas-1.firebaseio.com",
    storageBucket: "laas-1.appspot.com",
    messagingSenderId: "622638005740"
};
firebase.initializeApp(config);
const database = firebase.database();

/* @ CONTRACTS */
export function saveDeployedContract(schemeType: string, schemeName: string, contractAddress: number, details: ContractParameters): void {
    if (schemeType === 'vault') {
        saveVaultContract(schemeName, contractAddress, details);
    } else if (schemeType === 'fx') {
        saveFxContract(schemeName, contractAddress, details);
    }
}

function saveVaultContract(schemeName: string, contractAddress: number, details: ContractParameters): void {
    database.ref('schemes/' + details.owner + '/' + schemeName).set({
        contractType: 'vault',
        contractAddress: contractAddress,
        creationDate: new Date().getTime(),
        description: details.description,
        region: details.region,
        token: details.token
    });
    database.ref('businesses/' + details.owner + '/' + 'activeSchemes').child(schemeName).set(true);
}

function saveFxContract(schemeName: string, contractAddress: number, details: ContractParameters): void {
    database.ref('schemes/' + details.owner + '/' + schemeName).set({
        contractType: 'fx',
        contractAddress: contractAddress,
        // origin: details.origin,
        creationDate: new Date().getTime(),
        // expirationDate: null,
        description: details.description,
        // members: {},
        // region: details.region,
        // partners: null,
        // token: details.token,
        partner: details.partnerName,
        toPartnerX: details.toPartnerX,
        toOwnerX: details.toOwnerX,
        status: 'pending'
    });
    database.ref('businesses/' + details.owner + '/' + 'pendingSchemes').child(schemeName).set(true);
}

export function retrieveDeployedContract(business: string, schemeName: string): any {
    return Q.Promise((resolve, reject, notify) => {
        firebase.database().ref('schemes/' + business + '/' + schemeName).once('value')
            .then(function(snapshot) {
                if (snapshot.val() !== null) {
                    resolve(snapshot.val());
                } else {
                    reject(new Error('Contract does not exist'));
                }
            }, (error) => {
                reject(new Error('Contract detail retrieval failed'));
            });
    });
}

export function removeDeployedContract(business: string, schemeName: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        firebase.database().ref('programs/' + business + '/').once('value')
            .then(function(snapshot) {
                if (snapshot !== null) {
                    database.ref('businesses/' + business + '/' + 'activeSchemes/' + schemeName).remove();
                    database.ref('programs/' + business + '/' + schemeName).remove();
                    // TODO: Remove membership of affected users
                    resolve(true);
                } else {
                    reject(new Error('Already Deleted'));
                }
            }, (error) => {
                reject(new Error('Retrieval Failed'));
            })
    });
}

export function listDeployedContracts(business: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        firebase.database().ref('schemes/' + business).once('value')
            .then((snapshot) => {
                if (snapshot.val() !== null) {
                    resolve(snapshot.val());
                } else {
                    resolve({});
                }
            }, (error) => {
                reject(new Error('Query for ' + business + ' schemes failed.'));
            });
    });
}

export function updateDeployedContract(business: string, schemeName: string, details: ContractParameters): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        const updates = {};
        updates['schemes/' + business + '/' + schemeName + '/' + 'description'] = details.description;
        updates['schemes/' + business + '/' + schemeName + '/' + 'token'] = details.token;

        firebase.database().ref().update(updates)
            .then((result) => {
                resolve(result);
            }, (error) => {
                reject(error);
            });
    });
}

export function deactivateDeployedContract(business: string, schemeName: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        const updates = {}
        updates['schemes/' + business + '/' + schemeName + '/' + 'status'] = 'deactivated';
        updates['businesses/' + business + '/' + 'deactiveSchemes' + '/' + schemeName] = true;
        updates['businesses/' + business + '/' + 'activeSchemes' + '/' + schemeName] = null;

        firebase.database().ref().update(updates)
            .then((result) => {
                resolve(result);
            }, (error) => {
                reject(error);
            });
    });
}

/* @ BUSINESSES */

export function saveBusinessDetails(business: string, details: BusinessDetails): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        firebase.database().ref('businesses/' + business + '/' + 'details').set(details)
            .then((result) => {
                resolve(result);
            }, (error) => {
                reject(error);
            })
    });
}

export function queueCollaborationRequest(serviceProvider: string, partnerName: string, requestedPartner: string, schemeName: string, contractType: string, contractAddress: string, description: string, instructions: string, requiredInputs: string): boolean {
    database.ref('schemes/' + requestedPartner + '/collaborationRequests/' + schemeName).set({
        serviceProvider: serviceProvider,
        partnerName: partnerName,
        schemeName: schemeName,
        contractType: contractType,
        contractAddress: contractAddress,
        requestDate: new Date().getTime(),
        description: description,
        instructions: instructions,
        requiredInputs: requiredInputs
    });
    database.ref('businesses/' + requestedPartner + '/' + 'collaborationRequests').child(schemeName).set(true);
    return true;
}

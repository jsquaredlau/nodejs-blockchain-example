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
export function saveDeployedContract(contractType: string, schemeName: string, contractAddress: number, details: ContractParameters): void {
    if (contractType === 'vault') {
        saveVaultContract(schemeName, contractAddress, details);
    } else if (contractType === 'fx') {
        saveFxContract(schemeName, contractAddress, details);
    }
}

function saveVaultContract(schemeName: string, contractAddress: number, details): void {
    database.ref('schemes/' + details.owner + '/' + schemeName).set({
        contractType: 'vault',
        contractAddress: contractAddress,
        creationDate: new Date().getTime(),
        description: details.description,
        // region: details.region,
        token: details.token
    });
    database.ref('businesses/' + details.owner + '/' + 'activeSchemes').child(schemeName).set(true);
}

function saveFxContract(schemeName: string, contractAddress: number, details): void {
    database.ref('schemes/' + details.requester + '/' + schemeName).set({
        requestedPartner: details.requestedPartner,
        contractType: details.contractType,
        contractAddress: contractAddress,
        description: details.description,
        instructions: details.instructions,
        requiredInputs: details.requiredInputs,
        toPartnerX: details.toPartnerFx,
        toOwnerX: details.toOwnerFx,
        creationDate: new Date().getTime(),
        status: 'pending',
        vaultAddress: contractAddress
    });
    database.ref('businesses/' + details.owner + '/' + 'pendingSchemes').child(schemeName).set(true);
}

export function recordCollaborationAgreement(business: string, schemeName: string) {
    database.ref('businesses/' + business + '/' + 'activeSchemes').child(schemeName).set(true);
    database.ref('businesses/' + business + '/' + 'collaborationRequests').child(schemeName).remove();
    return true;
}

export function changeContractStatus(schemeName: string, owner: string, status: string): void {
    if (status === 'active') {
        database.ref('schemes/' + owner + '/' + schemeName).child('status').set(status);
        database.ref('business/' + owner + '/activeSchemes').child(schemeName).set(true);
        database.ref('business/' + owner + '/pendingSchemes').child(schemeName).remove();
    } else if (status === 'deactivated') {
        database.ref('schemes/' + owner + '/' + schemeName).child('status').set(status);
        database.ref('business/' + owner + '/deactiveSchemes').child(schemeName).set(true);
        database.ref('business/' + owner + '/activeSchemes').child(schemeName).remove();
    }

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

export function queueCollaborationRequest(provider: string, requester: string, requestedPartner: string, schemeName: string, contractType: string, contractAddress: string, description: string, instructions: string, requiredInputs: string, toPartnerFx: number, toOwnerFx: number): boolean {
    database.ref('schemes/' + requestedPartner + '/collaborationRequests/' + schemeName).set({
        provider: provider,
        requester: requester,
        schemeName: schemeName,
        contractType: contractType,
        contractAddress: contractAddress,
        description: description,
        instructions: instructions,
        requiredInputs: requiredInputs,
        toPartnerFx: toPartnerFx,
        toOwnerFx: toOwnerFx,
        requestDate: new Date().getTime(),
    });
    database.ref('businesses/' + requestedPartner + '/' + 'collaborationRequests').child(schemeName).set(true);
    return true;
}

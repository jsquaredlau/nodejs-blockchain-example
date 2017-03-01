// Copyright BASYX.lab
import * as firebase from "firebase";

const config = {
    apiKey: "AIzaSyBQNNPknNbL21FqtJLDbZpd9DvC3Nqudnk",
    authDomain: "laas-1.firebaseapp.com",
    databaseURL: "https://laas-1.firebaseio.com",
    storageBucket: "laas-1.appspot.com",
    messagingSenderId: "622638005740"
};
firebase.initializeApp(config);
const database = firebase.database();


export function saveDeployedContract(schemeName: string, contractAddress: number): void {
    database.ref('programs/' + 'BASYXlab/' + schemeName).set({
        contractType: 'MyToken',
        contractAddress: contractAddress,
        timestamp: Date.now() / 1000 | 0,
        origin: 'LaaS-1'
    });
    database.ref('businesses/' + 'BASYXlab/' + schemeName).set({
        partners: null,
        description: 'Basic Token Contract',
        endDate: null,
        startDatte: Date.now() / 1000 | 0
    });
}

export function retrieveDeployedContract(schemeName: string): any {
    firebase.database().ref('programs/' + 'BASYXlab/' + schemeName).once('value').then(function(snapshot) {
        return snapshot.val();
    });
}

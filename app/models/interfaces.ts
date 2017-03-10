// Copyright BASYX.lab
/* app/models/interfaces.ts */

export interface ContractParameters {
    owner: string;
    description: string;
    origin: string;
    token: string;
    region: string;
    contractKey: number;
    expirationDate?: Date;
    accounts?: Array<[string, number]>;
}

// Copyright BASYX.lab
/* app/models/interfaces.ts */

export interface ContractParameters {
    /* COMPULSORY PARAMETERS */
    owner: string;
    description: string;
    origin: string;
    token: string;
    region: string;
    contractKey: number;

    /* CONTEXT BASED PARAMETERS */
    expirationDate?: Date;
    accounts?: Array<[string, number]>;
    vaultAddress?: string;
}

export interface BusinessDetails {
    description: string;
}

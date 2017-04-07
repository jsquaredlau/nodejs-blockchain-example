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
    partnerName?: string;
    partnerAddress?: string;
    toPartnerX?: number;
    toOwnerX?: number;
}

export interface BusinessDetails {
    description: string;
}

export interface CollaborationRequestInfo {
    provider: string;
    partnerName: string;
    requestedPartner: string;
    schemeName: string;
    contractType: string;
    contractAddress: string;
    description: string;
    instructions: string;
    requiredInputs: any;
}

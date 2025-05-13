export namespace Status{


export enum postStatus {
    PENDING = "pending",
    SUBMITTED = "submitted",
    
}

export enum paymentStatus {
    PENDING = "pending",
    PROCESSED = "processed",
}

export enum withdrawalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum orderStatus {
    PENDING = "pending",
    APPROVED = "accepted",
    REJECTED = "rejected",
    INPROGRESS = "inProgress",
    COMPLETED ="completed",
    SUBMITTED = "submitted",
    UNPAID = "unpaid"
    
}

export enum invoiceStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum orderinvoiceStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

}
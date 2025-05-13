export namespace Others{

export enum linkType {
    DO_FOLLOW = "doFollow",
    NO_FOLLOW = "noFollow"
    
}

export enum siteType {
    NEW_POST = "newPost",
    LINK_INSERTION = "linkInsertion"
    
}

export enum wordLimit {
    W650 = "650",
    W750 = "750",
    W850 = "850",
}

export enum contentProvidedBy {
    USER = "user",
    PUBLISHER = "publisher"
    
}

export enum role {
    USER = "user",
    PUBLISHER = "publisher",
    ADMIN ="admin",
    SUPERADMIN = "superadmin",
    MODERATOR = "moderator",
}

export enum liveTime {
    MONTH_6 = "6 Month",
    MONTH_12 = "12 Month",
    MONTH_24 ="24 Month",
    PERMANENT = "Permanent",
}

export enum currency {
    DOLLAR = "USD",
    POUND = "EUR",
    EURO ="GBP",
    
}

export enum niche {
    CRYPTO = "Crypto",
    GENERAL = "General",
    FOREX ="Forex",
    
}

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
    UNPAID = 'unpaid'
    
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
    SUBMITTED = "submitted",
}

export enum permissions {
    PENDING_PUBLISHER = "pending_publisher",
    APPROVE_PUBLISHER = "approve_publisher",
    REJECT_PUBLISHER = "reject_publisher",
    DELETE_PUBLISHER = "delete_publisher",
    VIEW_PENDING_PRODUCTS = "view_pending_products",
    APPROVE_PRODUCT = "approve_product",
    REJECT_PRODUCT = "reject_products",
    DELETE_PRODUCT = "delete_product",
    VIEW_WITHDRAWAL = "view_withdrawl",
    REJECT_WITHDRAWAL = "reject_withdrawl",
    APPROVE_WITHDRAWAL = "approve_withdrawl",
    DELETE_WITHDRAWAL = "delete_withdrawl",
    VIEW_PRODUCTS = "view_products",
    VIEW_DASHBOARD = "view_dashboard",
    VIEW_PUBLISHERS = "view_publishers",
    VIEW_ORDER = "view_order",
    ACCEPT_ORDER = "accept_order",
    REJECT_ORDER = "reject_order",
    SUBMIT_ORDER = "submitt_order",
    DELETE_ORDER = "delete_order",
    ADD_PRODUCT = "add_product",
    UPDATE_PRODUCTS = "update_products",
    CREATE_MODERATORS = "create-moderator",
    UPDATE_MODERATORS = "update-moderators",
    DELETE_MODERATORS ="delete-moderators",
    VIEW_MODERATORS ="view-moderators",
    UPDATE_PAYMENT="update-payment"


}

export enum productstatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum category {
    TECH = "Tech",
    BUSINESS = "Business",
    GENERAL = "General",
    CRYPTO ="Crypto",
    GAMING="Gaming",
    SPORTS="Sports",
    FINANCE ="Finance",
    TRADING ="Trading",
    NEWS ="News",
    HEALTH="Health",
    MOBILE="Mobile",
    LIFESTYLE="LifeStyle",
    MARKETING="Marketing",
    SOFTWARE ="Software",
    FASHION ="Fashion",
    ADVERTISE ="Advertise",
}

}
 
import { Others } from "../enums/others.enum";
export const findAllEnum = () => {
  return {
    orderStatus: Object.values(Others.orderStatus),
    linkType: Object.values(Others.linkType),
    Permissions:  Object.values(Others.permissions),
    orderinvoiceStatus:  Object.values(Others.orderinvoiceStatus),
    invoiceStatus: Object.values(Others.invoiceStatus),
    withdrawalStatus: Object.values(Others.withdrawalStatus),
    paymentStatus: Object.values(Others.paymentStatus),
    postStatus:Object.values(Others.postStatus),
    niche:Object.values(Others.niche),
    currency: Object.values(Others.currency),
    liveTime: Object.values(Others.liveTime),
    role:Object.values(Others.role),
    contentProvidedBy: Object.values(Others.contentProvidedBy),
    wordLimit: Object.values(Others.wordLimit),
    siteType : Object.values(Others.siteType)
     
  };
};

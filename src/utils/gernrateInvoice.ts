import { v4 as uuidv4 } from "uuid";
export const generateInvoiceNumber = (): string => {
  return `INV-${uuidv4().slice(0, 8).toUpperCase()}`;
};

 
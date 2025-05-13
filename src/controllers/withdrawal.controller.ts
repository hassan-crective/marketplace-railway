import { Request, Response, NextFunction } from 'express';
import withdrawalService, { getInvoices} from '../services/withdrawal.service';
import { withdrawalSchema } from '../validators/witdrawal.validation';
import { Others } from "../enums/others.enum";
import { getWithdrawalRequests } from '../services/admin.services';


// create withdrawal request 
const createWithdrawalRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;
      console.log("User ID:", userId);
  
      const validation = withdrawalSchema.safeParse(req.body);
  
      if (!validation.success) {
        console.error("Validation Error:", validation.error.errors);
        return res.status(400).json({ message: "Validation failed", errors: validation.error.errors });
      }
     const withdrawalRequest = await withdrawalService.createWithdrawalRequest(userId, validation.data);
  
      return res.status(200).json({
        message: "Withdrawal request submitted successfully.",
        withdrawal: withdrawalRequest,
      });
    } catch (error) {
      console.error("Error in createWithdrawalRequest controller:", error);
      next(error);
    }
  };

// get withdrawal invoices
export const fetchInvoices = async (req: Request, res: Response) => {
    try {
        const invoiceStatus = req.query.status as Others.invoiceStatus; 
        const { invoices, total } = await getInvoices(req.query, invoiceStatus);

        return res.status(200).json({ 
            success: true, 
            data: invoices, 
            total, 
            page: parseInt(req.query.page as string, 10) || 1,
            limit: parseInt(req.query.limit as string, 10) || 10
        });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
};

// get withdrwal request
 const getWithdrawalRequestsController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const { status } = req.query; 
    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Invalid or missing status query parameter" });
    }
    const withdrawalRequests = await getWithdrawalRequests(status);
    return res.status(200).json({
      message: `Withdrawal requests retrieved successfully for status: ${status}`,
      data: withdrawalRequests,
    });
  } catch (error) {
    console.error("Error in getWithdrawalRequestsController:", error);
    next(error); 
  }
};



export default { createWithdrawalRequest , fetchInvoices  , getWithdrawalRequestsController};
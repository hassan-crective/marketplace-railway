import { BadRequestError } from '../errors/badRequest.error';
import { Others } from '../enums/others.enum';
import { InvoiceRepository, WithdrawlRepository,UserRepository } from '../repositories';
import { WithdrawalInput } from '../validators/witdrawal.validation';
import { getSortPaging, ISortPaging } from '../utils/sortPagination';
import { sendEmail } from '../utils/emails';
// import { sendEmail } from '../utils/sendEmail';
// create withdrawl request publisher
const createWithdrawalRequest = async (user: { userId: string }, data: WithdrawalInput) => {
    try {
        console.log("Creating withdrawal with data:", { user, data });
        const publisher = await UserRepository.findOne({ where: { id: user.userId } });
        if (!publisher) {
            throw new BadRequestError("User not found");
        }
        if (publisher.walletBalance < data.amount) {
            throw new BadRequestError("Insufficient wallet balance");
        }
        // Deduct balance
        publisher.walletBalance -= data.amount;
        await UserRepository.save(publisher);
        console.log("Updated wallet balance:", publisher.walletBalance);
        // Create the withdrawal request (DO NOT SAVE YET)
        const newWithdrawal = WithdrawlRepository.create({
            user: publisher,
            publisherEmail: publisher.email,
            amount: data.amount,
            currency: data.currency,
            walletAddress: data.walletAddress,
            withdrawlStatus: Others.withdrawalStatus.PENDING,
        });
        console.log("New Withdrawal Object (before save):", newWithdrawal);
        // Create and save the invoice FIRST
        const newInvoice = InvoiceRepository.create({
            amount: data.amount,
            currency: data.currency,
            walletAddress: data.walletAddress,
            invoiceNumber: `INV-${Date.now()}`,
            withdrawalRequest: newWithdrawal,
            InvoiceStatus: Others.invoiceStatus.PENDING,
        });
        await InvoiceRepository.save(newInvoice);
        // Now assign the invoice to the withdrawal and save it
        newWithdrawal.invoice = newInvoice;
        const savedWithdrawal = await WithdrawlRepository.save(newWithdrawal);
        await sendEmail({
          toEmail: publisher.email,
          subject: "Withdrawal Request Submitted",
          text: `Your withdrawal request for ${data.amount} ${data.currency} has been submitted successfully.`,
        });
        console.log("Saved Withdrawal with Invoice ID:", savedWithdrawal.invoice?.id);
        console.log("Invoice saved successfully.");
        return savedWithdrawal;
    } catch (error) {
        console.error("Error in createWithdrawalRequest service:", error);
        throw new BadRequestError("Unable to create withdrawal request.");
    }
};
// get withdrawal invoices
export const getInvoices = async (query: any, invoiceStatus?: Others.invoiceStatus) => {
    const { sort, skip, limit }: ISortPaging = getSortPaging(query);
    const invoiceQuery = InvoiceRepository.createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.withdrawalRequest", "withdrawalRequest")
        .leftJoinAndSelect("invoice.approvedBy", "approvedBy")
        .orderBy(`invoice.${Object.keys(sort)[0]}`, Object.values(sort)[0])
        .skip(skip)
        .take(limit);
    if (invoiceStatus) {
        invoiceQuery.where("invoice.InvoiceStatus = :invoiceStatus", { invoiceStatus });
    }
    const [invoices, total] = await invoiceQuery.getManyAndCount();
    return { invoices, total };
};
// get withdrawal request
const getWithdrawalRequests = async (status: string) => {
    let filter = {};
    switch (status) {
      case "pending":
        filter = { withdrawlStatus: Others.withdrawalStatus.PENDING };
        break;
      case "approved":
        filter = { withdrawlStatus: Others.withdrawalStatus.APPROVED };
        break;
      case "rejected":
        filter = { withdrawlStatus: Others.withdrawalStatus.REJECTED };
        break;
      case "all":
        filter = {};
        break;
      default:
        throw new Error("Invalid status filter");
    }
    const withdrawalRequests = await WithdrawlRepository.find({
      where: filter,
    relations: ["invoice"],
    });
    // Optionally transform the response
    const formattedRequests = withdrawalRequests.map((request) => ({
      id: request.id,
      status: request.withdrawlStatus,
      invoice: request.invoice
        ? { id: request.invoice.id, status: request.invoice.InvoiceStatus }
        : null,
    }));
    return formattedRequests;
};
export default  {
    createWithdrawalRequest,
    getWithdrawalRequests
  };
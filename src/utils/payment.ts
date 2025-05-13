import axios from "axios";

export interface PaymentResponse {
  url: string;
  uuid: string;
  expired_at: string;
  payment_status: string;
  txid?: string;
  address_qr_code?: string;
  payer_amount?: string;
  address?: string;
  merchant_amount?: string;
  payer_currency?: string;
}

export const processPayment = async (
  orderNumber: number,
  amount: number,
  currency: string,
  network: string,
  to_currency: string
): Promise<PaymentResponse> => {
  try {
    const response = await axios.post(
      "https://backend.crective.com/payscrap/create_payment",
      {
        order_id: orderNumber.toString(),
        amount: amount.toString(),
        currency: currency.toString(),
        network: network,
        to_currency: to_currency,
        url_success: `https://germanguestpost.com/thankyou?orderNumber=${orderNumber}`,
        url_return: "https://germanguestpost.com",
        url_callback: "https://newbackend.crective.com/v1/order/cryptomus-callback",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "halwapuri",
        },
      }
    );
    console.log("response::",response)
    console.log("response::",response.data)
    return response.data;
  } catch (error) {
    console.error("Payment processing failed:", error);
    throw new Error("Failed to process payment");
  }
};

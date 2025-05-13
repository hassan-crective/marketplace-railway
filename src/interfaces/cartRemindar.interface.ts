interface CartReminderEmailOptions {
  userName: string;
  cartItems: Array<{
    siteName: string;
    price: number;
    adjustedPrice: number;
    // category: string;
    websiteUrl: string;
  }>;
  totalAmount: number;
  cartUrl: string;
}

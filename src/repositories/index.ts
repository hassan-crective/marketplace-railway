import PostgresDataSource from "../data-source";
import { User } from "../models/user";
import { Product } from "../models/product";
import {Order} from "../models/orders";
import { Withdrawl } from "../models/withdrawl";
import { Invoice } from "../models/invoices";
import { Payment } from "../models/payments";
import { OrderInvoice } from "../models/orderInvoice";
import { Cart } from "../models/cart";

export const UserRepository = PostgresDataSource.getRepository(User);
export const ProductRepository = PostgresDataSource.getRepository(Product);
export const OrderRepository = PostgresDataSource.getRepository(Order);
export const WithdrawlRepository = PostgresDataSource.getRepository(Withdrawl);
export const InvoiceRepository = PostgresDataSource.getRepository(Invoice);
export const PaymentRepository = PostgresDataSource.getRepository(Payment);
export const OrderInvoiceRepository = PostgresDataSource.getRepository(OrderInvoice);
export const CartRepository = PostgresDataSource.getRepository(Cart);
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { User } from "./user";
import { Order } from "./orders";
import { Others } from "../enums/others.enum";

@Entity("OrderInvoice")
export class OrderInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  publisherName: string;

  @Column({ nullable: false })
  orderNumber: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ nullable: false, unique: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: "enum",
    enum: Others.orderinvoiceStatus,
    default: Others.orderinvoiceStatus.PENDING,
    nullable: true,
  })
  orderInvoice: Others.orderinvoiceStatus;

  @ManyToOne(() => User, (user) => user.ordersinvoices, { nullable: true })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  approvedBy: User;

  @Column({ type: "timestamptz", nullable: true })
  publisherApprovalDate: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @OneToOne(() => Order, (order) => order.ordersinvoices, { nullable: true })
  order: Order;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}

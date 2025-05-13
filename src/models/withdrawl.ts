import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./user"; // Import the User entity
import { Invoice } from "./invoices";
import { Status } from "../enums/status.enum";

@Entity("Withdrawl")
export class Withdrawl {
  static findOne(arg0: { where: { id: number }; relations: string[] }) {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true }) // Ensures unique site names
  publisherID: string;

  @Column({ nullable: true }) // Ensures unique site names
  publisherEmail: string;

  @Column({ type: "decimal", precision: 10, scale: 2 }) // Use a decimal type for monetary values
  amount: number;

  @Column({
    type: "enum",
    enum: Status.withdrawalStatus,
    default: Status.withdrawalStatus.PENDING,
    nullable: true,
  })
  withdrawlStatus: Status.withdrawalStatus;

  @Column({ nullable: true })
  currency: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approvedBy" })
  approvedBy: User;

  @Column({ nullable: true })
  approvalDate: Date;

  @Column({ nullable: false, default: false })
  isPayoutGenerated: boolean;

  @Column({ nullable: true })
  walletAddress: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamptz",
    default: () => "NOW()",
    onUpdate: "NOW()",
  })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.withdrawals, { nullable: false })
  user: User;

  @OneToOne(() => Invoice, (invoice) => invoice.withdrawalRequest, {
    nullable: true,
  })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;

  // Soft deletion field
  @Column({ type: "timestamptz", nullable: true })
  deletedAt: Date | null; // Null indicates the record is not deleted

  @Column({ nullable: false, default: false })
  isDeleted: boolean;
}

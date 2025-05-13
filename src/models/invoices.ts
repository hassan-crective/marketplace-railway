import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
  } from "typeorm";
  import { User } from "./user"; // Import the User entity
  import { Withdrawl } from "./withdrawl"; // Import the WithdrawalRequest entity
  import { Others } from "../enums/others.enum";
  
  @Entity("Invoice")
  export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    amount: number;
  
    @Column({ type: "varchar", nullable: true })
    invoiceNumber: string;
  
    @Column({ type: "varchar", nullable: true })
    walletAddress: string;
  
    @Column({ type: "varchar", nullable: false })
    currency: string;
  
    @Column({ 
      type: "enum", 
      enum: Others.invoiceStatus, 
      default:Others.invoiceStatus.PENDING,
      nullable: true 
  })
  InvoiceStatus: Others.invoiceStatus;
  
    @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;
  
    @OneToOne(() => Withdrawl, (withdrawalRequest) => withdrawalRequest.invoice)
    @JoinColumn({ name: "withdrawalRequestId" }) // The column name in the Invoice table that stores the Withdrawl reference
    withdrawalRequest: Withdrawl;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "approvedBy" })
    approvedBy: User;
  
    @Column({ type: "timestamptz", nullable: true })
    adminApprovalDate: Date;
  
    @Column({ type: "timestamptz", nullable: true })
    superAdminPayoutDate: Date;
 
  
    @Column({ type: "varchar", nullable: true })
    rejectionReason: string;
  
    @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date;

    
  }

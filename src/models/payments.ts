import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
  } from "typeorm";
  import { User } from "./user"; // Import User entity (ensure this exists)
  import { Status } from "../enums/status.enum";
  @Entity("Payment")
  export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, { nullable: false }) 
    @JoinColumn({ name: "userId" })
    user: User;
  
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    amount: number; 
  
    @Column({
      type: "enum",
      enum: Status.paymentStatus,
      default: Status.paymentStatus.PENDING,
    })
    status: Status.paymentStatus; // Payment status
  
    @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    requestedAt: Date; // Date when payment was requested
  
    @Column({ type: "timestamptz", nullable: true })
    processedAt: Date; // Date when payment was processed
  
    @UpdateDateColumn({
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    })
    updatedAt: Date; // Timestamp for last update
  }
  
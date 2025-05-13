import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToOne,
    OneToMany,
  } from "typeorm";

  import { User } from "./user"; // Import the User entity
  import { Status} from "../enums/status.enum"
  import { Others } from "../enums/others.enum";
import { OrderInvoice } from "./orderInvoice";
  
  @Entity("Order")
  export class Order {
    static findOne(arg0: { where: { id: number }; relations: string[] }) {
      throw new Error("Method not implemented.");
    }
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true, nullable: true }) // Ensures unique site names
    orderNumber: number;

    @Column({ nullable: true }) // Ensures unique site names
    file: string;

    @Column({ type: "decimal", precision: 10, scale: 2 }) // Use a decimal type for monetary values
    totalAmount: number;

    @Column({
      type: "enum",
      enum: Others.contentProvidedBy,
      nullable: true,
    })
    contentProvidedBy: Others.contentProvidedBy;

    @Column({
      type: "enum",
      enum: Status.orderStatus,
      nullable: true,
    })
    orderStatus: Status.orderStatus;

    @Column({ nullable: true })
    address_qr_code: string;

    @Column({ type: "decimal", nullable: true })
    payer_amount: number;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    url: string;

    @Column({ nullable: true })
    payer_currency: string;

    @Column({ nullable: true })
    uuid: string;

    @Column({ nullable: true })
    txid: string;

    @Column({ nullable: true })
    expired_at: string;

    @Column({ nullable: true })
    payment_status: string;

    @Column({ nullable: true })
    handeledBy: String;

    @Column({ nullable: true }) // No need for unique here
    rejectionReason: string;

    @Column({ nullable: true })
    submissionUrl: string;

    @Column({ nullable: true })
    submissionDetails: string;

    @Column({ nullable: true })
    submissionDate: Date;

    @Column({ nullable: true })
    affiliateComission: number;

    @Column({ nullable: true })
    backupEmail: string;

    @Column({ nullable: true })
    Topic: string;

    @Column({ nullable: true })
    anchorLink: string;

    @Column({ nullable: true })
    anchor: string;

    @Column({ nullable: true })
    notes: string;

    @Column({
      type: "enum",
      enum: Others.wordLimit,
      nullable: true,
    })
    wordLimit: Others.wordLimit;
    @Column({ nullable: true })
    paymentType: string;


    @Column({ type: "jsonb" }) // Store product details as JSON
    products: Array<{
      siteName: string;
      price: number;
      adjustedPrice: number;
      category: string[];
      niche: string;
      turnAroundTime: string;
      language: string;
      publisherId: string;
    }>;

    @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()" })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.orders, { nullable: true })
    user: User;

    @OneToOne(() => OrderInvoice, (orderInvoice) => orderInvoice.order, { nullable: true })
    ordersinvoices: OrderInvoice;

    @Column({ nullable: true })
    network: string;

    @Column({ nullable: true })
    to_currency: string;
  }
  
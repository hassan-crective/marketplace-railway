import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne
  
} from "typeorm";
import { Product } from "./product";
import { Order } from "./orders";
import { Withdrawl } from "./withdrawl";
import { Others } from "../enums/others.enum";
import { OrderInvoice } from "./orderInvoice";
import { Cart } from "./cart";

@Entity("User")
export class User {
  static findOne(arg0: { where: { id: number; }; relations: string[]; }) {
      throw new Error("Method not implemented.");
  }  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ 
    type: "enum", 
    enum: Others.role, 
    default:Others.role.USER,
    nullable: true 
  })
  role: Others.role;

  @Column({ unique: true, nullable: true })
  phoneNo: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: false, default: false })
  ownsSite: boolean;

  @Column({ nullable: true })
  numberOfSites: number;

  @Column({ nullable: false, default: false })
  hasDoFollowLinks: boolean;

  @Column({ nullable: false, default: false })
  sellingArticles: boolean;

  @Column({ nullable: true })
  sellingArticlesUrl: string;

  @Column({ nullable: true })
  businessName: string;

  @Column({ nullable: true })
  businessType: string;

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ nullable: true })
  walletBalance: number;

  @Column({ unique: true })
  referralCode: string;

  @Column({ nullable: false, default: false })
  isaffiliateRequested: boolean;

  @Column({ nullable: false, default: false })
  isAffiliate: boolean;

  @Column({ nullable: false, default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  approvedby: string ;

  @Column({ type: "varchar", nullable: true , length: 6})
  otp: string | null;
  
  @Column({ type: "timestamptz", nullable: true })
  otpExpiresAt: Date | null;
  
  @Column({ nullable: false, default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  monthlyBudget: number;

  @Column({ nullable: true })
  referedBy: string;

  @Column({ type: "simple-array", nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  comissions: string;

  @Column({ type: "varchar", nullable: true })
  resetPasswordToken?: string;

  @Column({ type: "timestamp", nullable: true })
  resetPasswordExpiresAt?: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()", select: false })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()", select: false })
  updatedAt: Date;


  @OneToMany(() => Product, (product) => product.user) // Inverse relationship to Product
  products: Product[];

  @OneToMany(() => Order, (orders) => orders.user) // Inverse relationship to Product
  orders: Order[];

  @OneToMany(() => Withdrawl, (withdrawl) => withdrawl.user) // Inverse relationship to Product
  withdrawals: Withdrawl[];

  @OneToMany(() => OrderInvoice, (orderInvoice) => orderInvoice.user, { nullable: false })
  ordersinvoices:OrderInvoice ;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];


}

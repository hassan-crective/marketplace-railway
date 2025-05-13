import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  ManyToMany,
} from "typeorm";
import { User } from "./user";
import { Others } from "../enums/others.enum";
import { Status } from "../enums/status.enum";
import { Cart } from "./cart";

@Entity("Product")
export class Product {
  static create(arg0: { user: never; id?: number | undefined; siteName?: string | undefined; price?: number | undefined; language?: string | undefined; domainAuthority?: number | undefined; country?: string | undefined; niche?: string | undefined; category?: string | undefined; postingLink?: string | undefined; linkType?: string | undefined; rejectionReason?: string | undefined; createdAt?: Date | undefined; updatedAt?: Date | undefined; }) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  siteName: string;
  @Column({ nullable: true })
  websiteUrl: string;
  @Column({ nullable: true })
  sampleLink: string;
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  adjustedPrice: number;
  @Column({ nullable: true })
  language: string;
  @Column({ nullable: true })
  niche: string;
  @Column({ nullable: true })
  country: string;
  @Column({ nullable: true })
  currency: string;
  // @Column({ nullable: true })
  // category: string;
  @Column({ type: 'text', array: true, nullable: true }) 
   category: string[];
   
  @Column({ nullable: true })
  productHandeledBy: string;
  @Column({ nullable: true })
  postingLink: string;
  @Column({
    type: "enum",
    enum: Status.postStatus,
    default: Status.postStatus.PENDING,
    nullable: true
  })
  poststatus: Status.postStatus;
  @Column({ nullable: true })
  submittedPostUrl: string;
  @Column({
    type: "enum",
    enum: Others.linkType,
    nullable: true
  })
  linkType: Others.linkType;
  @Column({ nullable: true })
  maxLinkAllowed: string;
  @Column({ nullable: true })
  Wordlimit: string;
  @Column({ nullable: true })
  monthlyTraffic: number;
  @Column({ nullable: true })
  domainRatings: number;
  @Column({ nullable: true, type: "int" })
  domainAuthority: number;
  @Column({ nullable: true })
  turnAroundTime: string;
  @Column({ nullable: true })
  liveTime: string;
  @Column({
    type: "enum",
    enum: Others.siteType,
    nullable: true
  })
  siteType: Others.siteType;
  @Column({ nullable: false, default: false })
  isProductApprove: boolean;
  @Column({ nullable: true })
  rejectionReason: string;

  @Column({
    type: "enum",
    enum: Others.productstatus,
    default: Others.productstatus.PENDING,
    nullable: true
  })
  productStatus: Others.productstatus;

  @Column({ type: "jsonb", nullable: true })
  updateFields: {
    siteName: string;
    price: number;
    adjustedPrice: number;
    domainAuthority: number;
    category: string;
    niche: string;
    domainRatings: number;
    monthlyTraffic: number;
    turnAroundTime: string;
    language: string;
  } ;
  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()" })
  updatedAt: Date;
  @Column({ type: "timestamptz", nullable: true })
  approvedAt: Date;

  @ManyToOne(() => User, (user) => user.products, { nullable: false })
  user: User;
   
  @ManyToMany(() => Cart, (cart) => cart.products)
  carts: Cart[];


}


import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Product } from "./product";
import { User } from "./user";

@Entity("Cart")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToMany(() => Product)
  @JoinTable()  
  products: Product[];  

  @ManyToOne(() => User, (user) => user.carts)
  user: User;
  
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

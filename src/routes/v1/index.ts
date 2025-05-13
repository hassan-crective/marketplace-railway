import { Router } from "express";
import authRouter from "./auth.route";
import productRouter from "./product.route";
 
import orderRouter from "./order.route";
import uploadRouter from "../upload.route";  // Ensure correct import path
//import productRouter from "./product.route";
import adminRouter  from "./admin.routes";
import cartRoute from "./cart.route";
import enumRouter from "./enum.route";
import withdrawalRouter from "./withdrwal.route";
import moderatorRouter from "./moderator.route";
import affliateRouter from "./affliate.route";
import orderInvoiceRoute from "./order.invoice.route";
//import cardRoute from "./cat.route";


const v1Router = Router();

v1Router.get("/", (req, res) => {
  res.send("Hit v1 route");
});

v1Router.use("/auth", authRouter);
// v1Router.use("/product", productRouter);
 
v1Router.use("/order", orderRouter);
v1Router.use("/upload", uploadRouter);  // Ensure this matches the import
// v1Router.use("/product",productRouter);
v1Router.use("/admin",adminRouter)
v1Router.use("/cart",cartRoute)
v1Router.use("/enum",enumRouter)
v1Router.use("/orderInvocie",orderInvoiceRoute)
v1Router.use("/", productRouter);
v1Router.use("/" , withdrawalRouter)
v1Router.use("/moderator" , moderatorRouter)
v1Router.use("/" , affliateRouter)
export default v1Router;

import { Router } from "express";
import enumController from "../../controllers/enum.controller";
 
 
const enumRouter = Router();

enumRouter.get("/", enumController.findAll);

export default enumRouter;

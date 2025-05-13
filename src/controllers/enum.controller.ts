import { Request, Response } from "express";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import { findAllEnum } from "../services/enum.service";
 
 

export const findAll = asyncWrapper(async (req: Request, res: Response) => {
  const enums = await findAllEnum();  
  
  res.status(200).json(enums);
});

export default { findAll };

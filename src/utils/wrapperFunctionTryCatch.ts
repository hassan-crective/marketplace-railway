import { Request, Response, NextFunction } from "express";

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncWrapper = (fn: ExpressHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

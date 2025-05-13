import { NextFunction, Request, Response } from "express";
import { BaseError } from "../errors/base.error";
import { BadRequestError } from "../errors/badRequest.error";
import { ForbiddenError } from "../errors/forbidden.error";
import { NotFoundError } from "../errors/notFound.error";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { NotValidError } from "../errors/validation.error";

export default function errHandlingMiddleware(error: BaseError, req: Request, res: Response, next: NextFunction) {
  if (error instanceof BadRequestError) return res.status(400).json({ message: error.message });
  if (error instanceof ZodError) {
    const zodError = fromZodError(error);
    return res.status(400).json({ message: zodError.message });
  }
  if (error instanceof ForbiddenError) return res.status(403).json({ message: error.message });
  if (error instanceof NotFoundError) return res.status(404).json({ message: error.message });
  if (error instanceof NotValidError) return res.status(422).json({ message: error.message });


  res.status(500).json({ message: error.message });
}

import { BaseError } from "./base.error";
import { ZodError, ZodIssue } from "zod";

export class NotValidError extends BaseError {
  validationErrors: { path: (string | number)[]; message: string }[];

  constructor(message: string = "Enter Valid Data", validationErrors: ZodIssue[] = []) {
    super(message);
    this.name = "NotValidError";
    this.validationErrors = validationErrors.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
  }
}

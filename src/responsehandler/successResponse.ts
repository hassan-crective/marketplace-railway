import { Response } from "express";

export const formattedResponse = <T>(
  res: Response,
  formattedData: T,
  message: string = "Data retrieved successfully",
  statusCode: number = 200
) => {
  res.status(statusCode).json({
    status: "success",
    message,
    data: formattedData,
  });
};

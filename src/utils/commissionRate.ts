import dotenv from "dotenv";
dotenv.config();

const rate = process.env.COMMISSION_RATE;
export const getCommissionRate = (): number => {
  const commissionRate = Number(rate) / 100;
  return commissionRate;
};

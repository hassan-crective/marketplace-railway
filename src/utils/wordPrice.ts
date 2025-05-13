import dotenv from "dotenv";

dotenv.config();

export const WordLimitPrice = {
  Word650: Number(process.env.WORDLIMI_PRICE_ONE )  ,
  Word750: Number(process.env.WORDLIMI_PRICE_TWO ) ,
  Word850: Number(process.env.WORDLIMI_PRICE_THREE) ,
};
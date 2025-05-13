
import { Others } from "../enums/others.enum";
import { UserRepository } from "../repositories";

export const getPublishers = async () => {
    return await UserRepository.find({
        where: { role: Others.role.PUBLISHER }, 
        relations: ["products", "orders", "withdrawals", "ordersinvoices"],
    });
};

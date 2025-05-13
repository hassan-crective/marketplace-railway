import { Raw, FindOptionsWhere, ILike } from "typeorm";
import { OrderInvoice } from "../models/orderInvoice";
import { getSortPaging } from "../utils/sortPagination";
import { OrderInvoiceRepository } from "../repositories";

export const findAllOrdersInvoice = async (userId: string, query: any) => {
  const repository = await OrderInvoiceRepository;

  const queryObject: FindOptionsWhere<OrderInvoice> = { user: { id: userId } };
  const { sort, skip, limit } = getSortPaging(query);

  let whereCondition: FindOptionsWhere<OrderInvoice> | FindOptionsWhere<OrderInvoice>[] = queryObject;

  if (query.q) {
    const searchValue = `%${query.q}%`;

    whereCondition = [
      {...queryObject, orderNumber :ILike(searchValue)},
      { ...queryObject, invoiceNumber: ILike(searchValue) },
      { ...queryObject, currency: ILike(searchValue) },
      { ...queryObject, amount: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :search`, { search: searchValue }) },
    ];
  }


  const [items, total] = await repository.findAndCount({
    where: whereCondition,
    relations: ["user"],
    select: {
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    },
    order: sort,
    skip,
    take: limit,
  });

  return {
    total,
    items,
    page: query.page,
    limit: query.limit,
  };
};

export const listResponse = async <T>(items: T[], query: { page: string; limit: string }) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const total = items.length;
  return { total, items, page, limit };
};

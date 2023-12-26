function paginateArray(array, page, limit) {
  page = page ? page : 1;
  limit = limit ? limit : 50;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedArray = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / limit);

  return {
    pageData: paginatedArray,
    totalPages,
  };
}

module.exports = paginateArray;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Only accept plain strings from the query string (blocks ?field[$ne]=x style injection).
const str = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const paginate = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

module.exports = { escapeRegex, str, paginate, pageMeta };

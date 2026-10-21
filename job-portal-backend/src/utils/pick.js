// Returns a new object containing only the allowed keys (prevents mass assignment).
module.exports = (obj, allowed) =>
  allowed.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

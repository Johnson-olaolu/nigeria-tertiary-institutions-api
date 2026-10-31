// Used by the category alias routes (e.g. /institutions/universities) to fix the category filter
export const setCategory = (category) => (req, res, next) => {
    req.category = category;
    next();
};

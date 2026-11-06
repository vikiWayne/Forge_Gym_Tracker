export const handler = (action) => (req, res, next) => {
  Promise.resolve()
    .then(() => action(req, res, next))
    .catch(next);
};

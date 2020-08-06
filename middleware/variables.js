module.exports = (req, res, next) => {
  res.locals.isAuth = req.session.isAuth
  res.locals.csrf = req.csrfToken()
  next()
}
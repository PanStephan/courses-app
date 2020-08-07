const { BASE_URL, EMAIL_FROM } = require('../keys')
module.exports = (email, token) => {
  return {
    to: email,
    from: EMAIL_FROM,
    subject: 'восстановление пароля',
    html: `
      <span>Восстановление доступа</span>
      <a href="${BASE_URL}/auth/password/${token}">Восстановить</a>
      <a href="${BASE_URL}">магазин курсов</a>
    `
  }
}
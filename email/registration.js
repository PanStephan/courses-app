const { BASE_URL, EMAIL_FROM } = require('../keys')

module.exports = email => {
  return {
    to: email,
    from: EMAIL_FROM,
    subject: 'register',
    html: `
      <span>вы успешно зарегестрировались с ${email}</span>
      <a href=${BASE_URL}>магазин курсов</a>
    `
  }
}
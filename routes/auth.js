const bcrypt = require('bcryptjs')
const User = require('../models/user')
const { Router } = require('express')
const crypto = require('crypto')
const nodeMailer = require('nodemailer')
const sendGrid = require('nodemailer-sendgrid-transport')
const { SENDGRID_KEY }  = require('../keys')
const regEmail = require('../email/registration')
const resEmail = require('../email/reset')
const user = require('../models/user')
const router = Router()

const transporter = nodeMailer.createTransport(sendGrid({
  auth: { api_key: SENDGRID_KEY },

}))

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    error: req.flash('error')    
  })
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const candidate = await User.findOne({ email })
    if (!candidate) return res.redirect('/auth/login#login')

    const isSame =  await bcrypt.compare(password, candidate.password)
    if (!isSame) return res.redirect('/auth/login#login')

    req.session.user = candidate
    req.session.isAuth = true
    req.session.save((err) => {
      if (err) throw err
      res.redirect('/')
    })

  } catch (e) { console.log(e) } 
})

router.post('/register', async  (req, res) => {
  try {
    const {email, password, name} = req.body
    const condidate = await User.findOne({ email })
    if (condidate) {
      req.flash('error', 'email занят')
      res.redirect('/auth/login#register')
    } 
    const hashPassword = await bcrypt.hash(password, 10)
    const user = new User({
      email, name, password: hashPassword, cart: { items: [] }
    })
    await user.save()
    await transporter.sendMail(regEmail(email))
    res.redirect('/auth/login#login')
  } catch (e) { console.log(e) }
})

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
})

router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: "Забыли пароль", 
    resetError: req.flash('resetError')
  })
})

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('resetError', 'Что=то пошло не так')
        return res.redirect('auth/reset')
      }
      const token = buffer.toString('hex')
      const candidate = await User.findOne({ email: req.body.email })

      if (!candidate) return req.flash('reserError', 'Пользователь не найден')
      candidate.resetToken = token
      candidate.resetTokenExp = Date.now() + 360*1000
      await candidate.save()
      await transporter.sendMail(resEmail(candidate.email, token))
      res.redirect('/auth/login')
    })
  } catch (e) { console.log(e) }
})

router.get('/password/:token', async (req, res) => {
  if (!req.params.token) return res.redirect('/auth/login')

  try {
    const user = await User.findOne({ 
      resetToken: req.params.token,
      resetTokenExp: {$gt: Date.now()}
    })
    if (!user) return redirect('/auth/login')

    res.render('auth/password', {
      title: "восстановление пароля", 
      resetError: req.flash('resetError'),
      userId: user._id.toString(),
      token: req.params.token
    })
  } catch (e) { console.log(e) }
})

router.post('password', async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: { $gt: Date.now() }
    })

    if (!user) return res.redirect('/auth/login')
    user.password = await bcrypt.hash(req.body.password, 10)
    user.resetToken = undefined
    user.resetTokenExp = undefined
    await user.save()
    res.redirect('/auth/login')
  } catch (e) { console.log(e) }
})

module.exports = router
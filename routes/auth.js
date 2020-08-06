const bcrypt = require('bcryptjs')
const User = require('../models/user')
const { Router } = require('express')
const router = Router()

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
    res.redirect('/auth/login#login')
  } catch (e) { console.log(e) }
})

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
 })

module.exports = router
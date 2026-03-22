import express from 'express'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import User from '../models/User.js'

const router = express.Router()

// ✅ إعداد Passport
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email })
      if (!user) return done(null, false, { message: 'Invalid credentials' })

      const isMatch = await user.comparePassword(password)
      if (!isMatch) return done(null, false, { message: 'Invalid credentials' })

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body

    if (!name || !email || !password || !passwordConfirmation)
      return res.status(400).json({ error: 'All fields are required' })

    if (password !== passwordConfirmation)
      return res.status(400).json({ error: 'Passwords do not match' })

    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res.status(400).json({ error: 'Email already in use' })

    const user = await User.create({ name, email, password })
    res.status(201).json({ message: 'User registered successfully', userId: user._id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// LOGIN
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err)
    if (!user) return res.status(401).json({ error: info.message })

    req.logIn(user, (err) => {
      if (err) return next(err)
      res.json({ message: 'Logged in successfully' })
    })
  })(req, res, next)
})

// LOGOUT
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' })
  })
})

export default router
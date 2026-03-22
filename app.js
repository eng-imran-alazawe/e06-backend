import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import passport from 'passport'
import authRoutes from './routes/auth.js'
import albumRoutes from './routes/albums.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

app.use('/api', authRoutes)
app.use('/api', albumRoutes)

app.use(errorHandler)

export default app
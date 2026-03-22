# Exercise set 06

## Task 1
![Example screenshot](../E06/screenshots/1.png)
```
## app.js
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'

const app = express()
const PORT = 3000

app.use(express.json())

await mongoose.connect(process.env.MONGO_URI)

app.use('/api', authRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


## routes/auth.js
import express from 'express'
import User from '../models/User.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body

    if (!name || !email || !password || !passwordConfirmation) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const user = await User.create({ name, email, password })

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    })
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

export default router

## models/User.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 }
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

export default mongoose.model('User', userSchema)
```
## Task 2
![Example screenshot](../E06/screenshots/2.png)
```
import express from 'express'
import User from '../models/User.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body

    if (!name || !email || !password || !passwordConfirmation) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const user = await User.create({ name, email, password })

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    })
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

export default router
```

Add documentation for the completion of Task 2 here.

## Task 3
![Example screenshot](../E06/screenshots/4.png)
![Example screenshot](../E06/screenshots/5.png)
```
## middleware.js
import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  })
}

## Album.js
import mongoose from 'mongoose'

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  year: { type: Number, required: true }
})

export default mongoose.model('Album', albumSchema)

##album.js
import express from 'express'
import Album from '../models/Album.js'
import { authenticateToken } from './middleware.js'

const router = express.Router()

router.get('/getAllAlbums', async (req, res) => {
  const albums = await Album.find()
  res.json(albums)
})

router.post('/albums', authenticateToken, async (req, res) => {
  const album = await Album.create(req.body)
  res.status(201).json(album)
})

router.put('/albums/:id', authenticateToken, async (req, res) => {
  const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(album)
})

router.delete('/albums/:id', authenticateToken, async (req, res) => {
  await Album.findByIdAndDelete(req.params.id)
  res.json({ message: 'Album deleted' })
})

export default router


```


## Task 4
![Example screenshot](../E06/screenshots/6.png)
![Example screenshot](../E06/screenshots/7.png)
![Example screenshot](../E06/screenshots/8.png)
![Example screenshot](../E06/screenshots/9.png)
```
## AppError
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

export default AppError

##ErrorHandler
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  })
}

export default errorHandler

## auth
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'

const router = express.Router()

// REGISTER
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body

    if (!name || !email || !password || !passwordConfirmation) {
      throw new AppError('All fields are required', 400)
    }

    if (password !== passwordConfirmation) {
      throw new AppError('Passwords do not match', 400)
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      throw new AppError('Email already in use', 400)
    }

    const user = await User.create({
      name,
      email,
      password
    })

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    })

  } catch (error) {
    next(error)
  }
})


// LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('Email and password required', 400)
    }

    const user = await User.findOne({ email })

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401)
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({ token })

  } catch (error) {
    next(error)
  }
})

export default router

## app
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import albumRoutes from './routes/albums.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()
const PORT = 3000

app.use(express.json())

await mongoose.connect(process.env.MONGO_URI)

app.use('/api', authRoutes)
app.use('/api', albumRoutes)

// GLOBAL ERROR HANDLER
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```
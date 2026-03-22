import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()
import app from './app.js'

const PORT = process.env.PORT || 3000

await mongoose.connect(process.env.MONGO_URI)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
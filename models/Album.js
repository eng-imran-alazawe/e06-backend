import mongoose from 'mongoose'

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  year: { type: Number, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

export default mongoose.model('Album', albumSchema)
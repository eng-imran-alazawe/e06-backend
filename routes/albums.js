import express from 'express'
import Album from '../models/Album.js'
import User from '../models/User.js'

const router = express.Router()

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.status(401).json({ error: 'Access denied' })
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next()
  res.status(403).json({ error: 'Forbidden' })
}

router.get('/albums', async (req, res) => {
  const albums = await Album.find()
  res.json(albums)
})

router.post('/albums', isAuthenticated, async (req, res) => {
  const album = await Album.create({ ...req.body, owner: req.user._id })
  res.status(201).json(album)
})

router.put('/albums/:id', isAuthenticated, async (req, res) => {
  const album = await Album.findById(req.params.id)
  if (!album) return res.status(404).json({ error: 'Album not found' })

  if (req.user.role !== 'admin' && album.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const updated = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(updated)
})

router.delete('/albums/:id', isAuthenticated, async (req, res) => {
  const album = await Album.findById(req.params.id)
  if (!album) return res.status(404).json({ error: 'Album not found' })

  if (req.user.role !== 'admin' && album.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  await Album.findByIdAndDelete(req.params.id)
  res.json({ message: 'Album deleted' })
})

router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  res.json({ message: 'User deleted' })
})

export default router
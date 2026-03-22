import { beforeEach, afterAll, describe, it, expect } from 'vitest'
import mongoose from 'mongoose'
import supertest from 'supertest'
import * as dotenv from 'dotenv'
import app from '../app.js'
import Album from '../models/Album.js'
import User from '../models/User.js'
import testData from './data.json' assert { type: 'json' }

dotenv.config({ path: '.env.test' })

const api = supertest(app)

beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_URI)
  await Album.deleteMany({})
  await User.deleteMany({})
  const user = await User.create({ name: 'Test User', email: 'test@test.com', password: '123456' })
  await Album.insertMany(testData.map(album => ({ ...album, owner: user._id })))
}, 30000)

afterAll(async () => {
  await Album.deleteMany({})
  await User.deleteMany({})
  await mongoose.connection.close()
}, 30000)

describe('GET /api/albums', () => {
  it('returns the correct number of albums', async () => {
    const response = await api.get('/api/albums').expect(200)
    expect(response.body).toHaveLength(testData.length)
  })
})

describe('POST /api/albums', () => {
  it('increases album count by one and returns correct data', async () => {
    const agent = supertest.agent(app)

    await agent
      .post('/api/login')
      .send({ email: 'test@test.com', password: '123456' })
      .expect(200)

    const newAlbum = {
      title: 'New Test Album',
      artist: 'New Test Artist',
      year: 2024
    }

    const postResponse = await agent
      .post('/api/albums')
      .send(newAlbum)
      .expect(201)

    expect(postResponse.body.title).toBe(newAlbum.title)
    expect(postResponse.body.artist).toBe(newAlbum.artist)
    expect(postResponse.body.year).toBe(newAlbum.year)

    const getResponse = await agent.get('/api/albums').expect(200)
    expect(getResponse.body).toHaveLength(testData.length + 1)
  })
})

describe('DELETE /api/albums/:id', () => {
  it('decreases album count and removes the album', async () => {
    const agent = supertest.agent(app)

    await agent
      .post('/api/login')
      .send({ email: 'test@test.com', password: '123456' })
      .expect(200)

    const albums = await api.get('/api/albums').expect(200)
    const albumToDelete = albums.body[0]

    await agent
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(200)

    const getResponse = await api.get('/api/albums').expect(200)
    expect(getResponse.body).toHaveLength(testData.length - 1)

    const ids = getResponse.body.map(a => a._id)
    expect(ids).not.toContain(albumToDelete._id)
  })

  it('returns 404 when deleting a non-existent album', async () => {
    const agent = supertest.agent(app)

    await agent
      .post('/api/login')
      .send({ email: 'test@test.com', password: '123456' })
      .expect(200)

    const fakeId = '000000000000000000000000'

    await agent
      .delete(`/api/albums/${fakeId}`)
      .expect(404)
  })
})
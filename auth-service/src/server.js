// src/server.js

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

const {
  MONGO_URI: ENV_URI,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_HOST     = 'mongo-standalone',
  MONGO_DB       = 'authdb',
  PORT           = 4000,
  JWT_SECRET
} = process.env;

// Assemble MongoDB URI if a full one wasn’t provided
const MONGO_URI = ENV_URI ||
  `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/${MONGO_DB}?authSource=admin`;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('❌ Missing MONGO credentials or JWT_SECRET');
  process.exit(1);
}

// Simple retry logic for MongoDB connection
let dbConnected = false;
async function connectWithRetry() {
  try {
    await mongoose.connect(MONGO_URI);
    dbConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed, retrying in 5s...', err);
    setTimeout(connectWithRetry, 5000);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Liveness and readiness probes
app.get('/health', (_req, res) => res.send('OK'));
app.get('/ready', (_req, res) =>
  dbConnected ? res.send('OK') : res.status(503).send('DB connecting')
);

// ----- User schema & routes -----

// Simple User model
const UserSchema = new mongoose.Schema({
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      res.status(409).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user._id, email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Start HTTP server immediately (for liveness), then connect to MongoDB
app.listen(PORT, () => {
  console.log(`🚀 Auth service listening on port ${PORT}`);
  connectWithRetry();
});

const mongoose = require('mongoose');

// Single-store app (see PRD): exactly one document, addressed by a fixed key.
const STORE_KEY = 'default';
const STORE_DEFAULTS = Object.freeze({ name: 'Toko Saya', type: 'Toko kelontong' });

const storeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: STORE_KEY, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 100, default: STORE_DEFAULTS.name },
    type: { type: String, required: true, trim: true, maxlength: 60, default: STORE_DEFAULTS.type },
  },
  { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);

module.exports = { Store, STORE_KEY, STORE_DEFAULTS };

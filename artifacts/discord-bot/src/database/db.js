const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DB = {
  reactionRoles: {},   // { guildId: { messageId_emoji: roleId } }
  tickets: {},         // { channelId: { userId, guildId, status, claimedBy, createdAt } }
  ticketCounter: {},   // { guildId: number }
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Reaction Roles
function addReactionRole(guildId, messageId, emoji, roleId) {
  const db = load();
  if (!db.reactionRoles[guildId]) db.reactionRoles[guildId] = {};
  db.reactionRoles[guildId][`${messageId}_${emoji}`] = roleId;
  save(db);
}

function getReactionRole(guildId, messageId, emoji) {
  const db = load();
  return db.reactionRoles?.[guildId]?.[`${messageId}_${emoji}`] || null;
}

function getAllReactionRoles() {
  return load().reactionRoles || {};
}

// Tickets
function createTicket(channelId, userId, guildId, ticketNumber) {
  const db = load();
  if (!db.tickets) db.tickets = {};
  db.tickets[channelId] = {
    userId,
    guildId,
    ticketNumber,
    status: 'open',
    claimedBy: null,
    createdAt: new Date().toISOString(),
  };
  if (!db.ticketCounter) db.ticketCounter = {};
  db.ticketCounter[guildId] = ticketNumber;
  save(db);
}

function getTicket(channelId) {
  const db = load();
  return db.tickets?.[channelId] || null;
}

function updateTicket(channelId, updates) {
  const db = load();
  if (!db.tickets?.[channelId]) return false;
  Object.assign(db.tickets[channelId], updates);
  save(db);
  return true;
}

function getNextTicketNumber(guildId) {
  const db = load();
  const current = db.ticketCounter?.[guildId] || 0;
  return current + 1;
}

module.exports = {
  addReactionRole,
  getReactionRole,
  getAllReactionRoles,
  createTicket,
  getTicket,
  updateTicket,
  getNextTicketNumber,
};

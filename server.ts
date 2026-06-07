/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Player, Event, SignInRecord, EventStats, GroupSummary } from './src/types.js';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'attendance-data.json');

// Ensure database file exist / load initial state
interface AppData {
  players: Player[];
  events: Event[];
}

let appData: AppData = {
  players: [],
  events: []
};

// Helper to save data to disk
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to data store:', err);
  }
}

// Helper to load data from disk
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      appData = JSON.parse(content);
      console.log(`Loaded ${appData.players.length} players and ${appData.events.length} events from data store.`);
    } else {
      console.log('No existing data store found. Initialized empty database.');
    }
  } catch (err) {
    console.error('Failed to read from data store, using initial empty state:', err);
  }
}

// Initialize on start
loadData();

if (appData.players.length === 0) {
  try {
    const csvPath = path.join(process.cwd(), 'default-players.csv');
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const parsed = parseCSV(csvContent);
      if (parsed.length > 0) {
        appData.players = parsed;
        saveData();
        console.log(`Auto-seeded ${parsed.length} default players from default-players.csv.`);
      }
    }
  } catch (err) {
    console.error('Error auto-seeding default players:', err);
  }
}

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- CSV parsing helpers ---
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Player[] {
  // Split on newlines, normalize
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rows = lines.map(line => parseCSVLine(line));
  const header = rows[0];

  // Detect which CSV layout it is.
  // Count how many headers contain "組" or look for multiple "名稱"/"姓名" headers
  const nameHeadersCount = header.filter(h => h.includes('名稱') || h.includes('姓名')).length;
  const groupHeadersCount = header.filter(h => h.includes('組')).length;

  if (groupHeadersCount >= 2 || nameHeadersCount >= 2) {
    // 1. Parsing side-by-side grouped format
    const players: Player[] = [];
    const groupSpecs: { name: string; serialCol: number; nameCol: number }[] = [];

    // Identify groups from row 0
    for (let c = 0; c < header.length; c++) {
      const hVal = header[c].trim();
      if (hVal.includes('組')) {
        // Search next column for "名稱" or "姓名"
        let nameCol = -1;
        for (let nextC = c + 1; nextC < header.length; nextC++) {
          const nextH = header[nextC].trim();
          if (nextH.includes('組')) break; // Hit another group
          if (nextH.includes('名稱') || nextH.includes('姓名')) {
            nameCol = nextC;
            break;
          }
        }
        
        // Fallback to c + 1 if not found
        if (nameCol === -1) {
          nameCol = c + 1;
        }

        // Clean group name e.g. "十單組(1)" -> "十單組"
        let cleanGroup = hVal.replace(/\(\d+\)/g, '').replace(/（\d+）/g, '').trim();
        cleanGroup = cleanGroup.replace(/[\d,，。!|！]/g, '').trim();

        if (!cleanGroup) {
          cleanGroup = `未知分組-${c}`;
        }

        groupSpecs.push({
          name: cleanGroup,
          serialCol: c,
          nameCol: nameCol
        });
      }
    }

    // Loop through individual data rows (from row 1 to N)
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      for (const spec of groupSpecs) {
        if (spec.serialCol < row.length && spec.nameCol < row.length) {
          const serialVal = row[spec.serialCol].trim();
          const nameVal = row[spec.nameCol].trim();
          
          const num = parseInt(serialVal, 10);
          if (!isNaN(num) && nameVal) {
            // Avoid duplicate headers occurring in row data or system summaries
            if (nameVal !== '名稱' && nameVal !== '姓名') {
              const pId = `p-${spec.name}-${num}-${Math.random().toString(36).substring(2, 6)}`;
              players.push({
                id: pId,
                name: nameVal,
                group: spec.name,
                serial: num
              });
            }
          }
        }
      }
    }
    return players;

  } else {
    // 2. Simple row-by-row structure
    const players: Player[] = [];
    
    let nameColIdx = header.findIndex(h => h.includes('名稱') || h.includes('姓名') || h.toLowerCase() === 'name');
    if (nameColIdx === -1) nameColIdx = 0;

    let groupColIdx = header.findIndex(h => h.includes('組') || h.includes('分組') || h.includes('分類') || h.toLowerCase() === 'group' || h.toLowerCase() === 'category');
    if (groupColIdx === -1) groupColIdx = 1;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length <= nameColIdx) continue;

      const nameVal = row[nameColIdx]?.trim();
      const groupVal = (groupColIdx < row.length ? row[groupColIdx]?.trim() : '未分組') || '未分組';

      if (nameVal && nameVal !== '名稱' && nameVal !== '姓名') {
        players.push({
          id: `p-${groupVal}-${r}-${Math.random().toString(36).substring(2, 6)}`,
          name: nameVal,
          group: groupVal,
          serial: r
        });
      }
    }
    return players;
  }
}

// --- API Endpoints ---

// Get all players
app.get('/api/players', (req, res) => {
  res.json({ success: true, players: appData.players });
});

// Import players via CSV
app.post('/api/players/import', (req, res) => {
  const { csvText } = req.body;
  if (!csvText || typeof csvText !== 'string') {
    return res.status(400).json({ success: false, error: 'No CSV data provided' });
  }

  try {
    const parsedPlayers = parseCSV(csvText);
    if (parsedPlayers.length === 0) {
      return res.status(400).json({ success: false, error: '未能成功解析任何玩家，請檢查CSV格式' });
    }

    // Overwrite the players database
    appData.players = parsedPlayers;
    saveData();

    res.json({
      success: true,
      count: parsedPlayers.length,
      players: parsedPlayers
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'CSV解析失敗: ' + err.message });
  }
});

// Add single custom player (Admin manual add)
app.post('/api/players', (req, res) => {
  const { name, group } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Player name is required' });

  const cleanGroup = (group || '未分組').trim();
  const player: Player = {
    id: `p-${cleanGroup}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    group: cleanGroup,
    serial: appData.players.filter(p => p.group === cleanGroup).length + 1
  };

  appData.players.push(player);
  saveData();

  res.json({ success: true, player });
});

// Get all events
app.get('/api/events', (req, res) => {
  res.json({ success: true, events: appData.events });
});

// Create generic initial event when none exists, seeded with some sample players if requested
app.post('/api/events', (req, res) => {
  const { title, description, location, hours, target, category, eventType, mainForce, siegeCar, date } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: '活動標題為必填欄位' });
  }

  const newEvent: Event = {
    id: `event-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    isActive: true,
    records: {},
    location: (location || '').trim(),
    hours: (hours || '').trim(),
    target: (target || '').trim(),
    category: (category || '').trim(),
    eventType: (eventType || '').trim(),
    mainForce: (mainForce || '').trim(),
    siegeCar: (siegeCar || '').trim()
  };

  // Do not automatically set previous events to inactive as requested.
  // Previous code set other events to false.

  appData.events.unshift(newEvent); // Add to head
  saveData();

  res.json({ success: true, event: newEvent });
});

// Toggle event status (Active/Inactive)
app.patch('/api/events/:eventId/toggle', (req, res) => {
  const { eventId } = req.params;
  const event = appData.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: '找不到該活動' });

  event.isActive = !event.isActive;
  saveData();
  res.json({ success: true, event });
});

// Update/Edit an event's details
app.put('/api/events/:eventId', (req, res) => {
  const { eventId } = req.params;
  const { title, description, location, hours, target, category, eventType, mainForce, siegeCar, date } = req.body;
  
  const event = appData.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: '找不到該活動' });

  if (!title) {
    return res.status(400).json({ success: false, error: '活動標題為必填欄位' });
  }

  event.title = title.trim();
  event.description = (description || '').trim();
  if (date) {
    event.date = new Date(date).toISOString();
  }
  event.location = (location || '').trim();
  event.hours = (hours || '').trim();
  event.target = (target || '').trim();
  event.category = (category || '').trim();
  event.eventType = (eventType || '').trim();
  event.mainForce = (mainForce || '').trim();
  event.siegeCar = (siegeCar || '').trim();

  saveData();
  res.json({ success: true, event });
});

// Delete an event
app.delete('/api/events/:eventId', (req, res) => {
  const { eventId } = req.params;
  const index = appData.events.findIndex(e => e.id === eventId);
  if (index === -1) return res.status(404).json({ success: false, error: '找不到該活動' });

  appData.events.splice(index, 1);
  saveData();
  res.json({ success: true, id: eventId });
});

// Clear/Reset all data
app.post('/api/reset', (req, res) => {
  appData = {
    players: [],
    events: []
  };
  saveData();
  res.json({ success: true, message: '系統資料已成功全部清空' });
});

// Self-sign-in route (Player is doing roll call from their device)
app.post('/api/events/:eventId/sign-in', (req, res) => {
  const { eventId } = req.params;
  const { playerId, name, deviceInfo, mainForceCount, siegeCarCount } = req.body;

  const event = appData.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: '找不到該活動' });
  if (!event.isActive) return res.status(400).json({ success: false, error: '該活動已截止簽到' });

  // Resolve player
  let matchedPlayer: Player | undefined;
  if (playerId) {
    matchedPlayer = appData.players.find(p => p.id === playerId);
  } else if (name) {
    // match by exact name
    matchedPlayer = appData.players.find(p => p.name.trim() === name.trim());
  }

  if (!matchedPlayer) {
    return res.status(404).json({ 
      success: false, 
      error: '在玩家名單中找不到您的姓名，請確認拼字。或聯繫管理員將您手動加入。' 
    });
  }

  // Check if already signed in
  if (event.records[matchedPlayer.id]) {
    return res.status(400).json({ 
      success: true, 
      already: true,
      message: `${matchedPlayer.name} 已在 ${new Date(event.records[matchedPlayer.id].timestamp).toLocaleTimeString()} 完成此活動簽到！`
    });
  }

  // Register sign in
  const record: SignInRecord = {
    playerId: matchedPlayer.id,
    playerName: matchedPlayer.name,
    group: matchedPlayer.group,
    timestamp: new Date().toISOString(),
    deviceInfo: deviceInfo || '未知瀏覽器/裝置',
    method: 'self',
    mainForceCount: mainForceCount || '0主',
    siegeCarCount: siegeCarCount || '0車'
  };

  event.records[matchedPlayer.id] = record;
  saveData();

  res.json({
    success: true,
    message: `恭喜 ${matchedPlayer.name} (${matchedPlayer.group}) 簽到成功！`,
    record
  });
});

// Admin-forced manual toggle of sign-in record
app.post('/api/events/:eventId/admin-toggle', (req, res) => {
  const { eventId } = req.params;
  const { playerId, mainForceCount, siegeCarCount } = req.body;

  const event = appData.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: '找不到該活動' });

  const player = appData.players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ success: false, error: '找不到該玩家' });

  if (event.records[player.id]) {
    // Toggle off (remove record)
    delete event.records[player.id];
  } else {
    // Toggle on (add record as admin)
    const record: SignInRecord = {
      playerId: player.id,
      playerName: player.name,
      group: player.group,
      timestamp: new Date().toISOString(),
      deviceInfo: '管理員手動調整',
      method: 'admin',
      mainForceCount: mainForceCount || '1主',
      siegeCarCount: siegeCarCount || '1車'
    };
    event.records[player.id] = record;
  }

  saveData();
  res.json({ success: true, records: event.records });
});

// Fetch metrics & stats for an event
app.get('/api/events/:eventId/stats', (req, res) => {
  const { eventId } = req.params;
  const event = appData.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: '找不到該活動' });

  const totalPlayers = appData.players.length;
  const presentPlayers = Object.keys(event.records);
  const totalPresent = presentPlayers.length;
  const totalAbsent = Math.max(0, totalPlayers - totalPresent);
  const attendanceRate = totalPlayers > 0 ? Math.round((totalPresent / totalPlayers) * 100) : 0;

  // Grouped stats
  // Group players by group first
  const groupMap: Record<string, { total: number; present: number }> = {};
  
  // Initialize with all existing player groups
  appData.players.forEach(p => {
    if (!groupMap[p.group]) {
      groupMap[p.group] = { total: 0, present: 0 };
    }
    groupMap[p.group].total += 1;
  });

  // Calculate active attendance per group
  presentPlayers.forEach(pId => {
    const player = appData.players.find(p => p.id === pId);
    if (player) {
      if (!groupMap[player.group]) {
        groupMap[player.group] = { total: 0, present: 0 };
      }
      groupMap[player.group].present += 1;
    }
  });

  const byGroup: GroupSummary[] = Object.entries(groupMap).map(([groupName, info]) => {
    return {
      groupName,
      totalCount: info.total,
      signedCount: info.present,
      percentage: info.total > 0 ? Math.round((info.present / info.total) * 100) : 0
    };
  });

  const stats: EventStats = {
    totalPlayers,
    totalPresent,
    totalAbsent,
    attendanceRate,
    byGroup
  };

  res.json({ success: true, stats });
});

// Fetch attendance roster summary (player-centric record history)
app.get('/api/players/history', (req, res) => {
  // Return for each player, all of their sign in timestamps for all events
  const history = appData.players.map(player => {
    const records = appData.events.map(event => {
      const record = event.records[player.id];
      return {
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        present: !!record,
        timestamp: record ? record.timestamp : null,
        method: record ? record.method : null,
        mainForceCount: record ? record.mainForceCount : null,
        siegeCarCount: record ? record.siegeCarCount : null
      };
    });

    const attendedCount = records.filter(r => r.present).length;
    const rate = appData.events.length > 0 ? Math.round((attendedCount / appData.events.length) * 100) : 0;

    return {
      playerId: player.id,
      playerName: player.name,
      group: player.group,
      serial: player.serial,
      attendedCount,
      totalEvents: appData.events.length,
      attendanceRate: rate,
      records
    };
  });

  res.json({ success: true, history, events: appData.events.map(e => ({ id: e.id, title: e.title, date: e.date })) });
});

// Integrate with Vite server middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Roll call server listening on port ${PORT}`);
  });
}

startServer();

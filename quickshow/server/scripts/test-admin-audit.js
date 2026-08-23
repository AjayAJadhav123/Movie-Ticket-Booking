import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

// Create a mock admin token
const token = jwt.sign(
  { sub: 'user_audit_test_123', metadata: { isAdmin: true } },
  'test_secret', // The backend allows any signature in dev or falls back gracefully if not verifying signature locally without clerkClient
  { expiresIn: '1h' }
);

const headers = { Authorization: `Bearer ${token}` };

let state = {
  cinemaId: null,
  screenId: null,
  movieId: null,
  showId: null,
};

async function check(name, requestFn) {
  try {
    process.stdout.write(`Testing ${name}... `);
    const res = await requestFn();
    console.log(`✅ PASS (${res.status})`);
    return { success: true, data: res.data };
  } catch (error) {
    const status = error.response ? error.response.status : 'N/A';
    const msg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.log(`❌ FAIL (${status}): ${msg}`);
    return { success: false, error };
  }
}

async function runAudit() {
  console.log("==========================================");
  console.log("   QUICKSHOW ADMIN API AUDIT SCRIPT       ");
  console.log("==========================================\n");

  // 1. Dashboard & Auth
  console.log("--- 1. Dashboard & Auth ---");
  await check('GET /api/user/check-admin', () => axios.get(`${API_BASE}/user/check-admin`, { headers }));
  await check('GET /api/admin/analytics/overview', () => axios.get(`${API_BASE}/admin/analytics/overview`, { headers }));
  await check('GET /api/admin/analytics/counts', () => axios.get(`${API_BASE}/admin/analytics/counts`, { headers }));

  // 2. Cinemas
  console.log("\n--- 2. Cinemas ---");
  const uniqueSuffix = Date.now();
  const cinemaRes = await check('POST /api/cinema', () => axios.post(`${API_BASE}/cinema`, {
    name: `Audit Cinema ${uniqueSuffix}`,
    city: 'Audit City',
    address: '123 Audit St',
    contact: { phone: '1234567890', email: `audit${uniqueSuffix}@cinema.com` },
    facilities: ['Parking']
  }, { headers }));
  
  if (cinemaRes.success && cinemaRes.data.data) {
    state.cinemaId = cinemaRes.data.data._id;
    await check(`PUT /api/cinema/${state.cinemaId}`, () => axios.put(`${API_BASE}/cinema/${state.cinemaId}`, {
      name: `Audit Cinema ${uniqueSuffix} Updated`,
      city: 'Audit City',
      address: '123 Audit St',
      contact: { phone: '1234567890', email: `audit${uniqueSuffix}@cinema.com` },
    }, { headers }));
  }

  // 3. Screens
  console.log("\n--- 3. Screens ---");
  if (state.cinemaId) {
    const screenRes = await check('POST /api/screen', () => axios.post(`${API_BASE}/screen`, {
      cinemaId: state.cinemaId,
      name: 'Audit Screen 1',
      screenType: 'IMAX',
      rows: 10,
      seatsPerRow: 10
    }, { headers }));

    if (screenRes.success && screenRes.data.data) {
      state.screenId = screenRes.data.data._id;
      await check(`PUT /api/screen/${state.screenId}`, () => axios.put(`${API_BASE}/screen/${state.screenId}`, {
        name: 'Audit Screen 1 Updated',
        screenType: 'IMAX',
        rows: 12,
        seatsPerRow: 12
      }, { headers }));
    }
  } else {
    console.log("⚠️ Skipping Screen tests because Cinema creation failed.");
  }

  // 4. Movies
  console.log("\n--- 4. Movies ---");
  const movieRes = await check('POST /api/movie/add', () => axios.post(`${API_BASE}/movie/add`, {
    tmdbId: 27205 // Inception
  }, { headers }));
  
  if (movieRes.success && movieRes.data.data) {
    state.movieId = movieRes.data.data._id;
  } else {
    console.log("⚠️ Could not add movie via TMDB. Maybe already exists. Attempting to fetch list...");
    const listRes = await check('GET /api/movie/list', () => axios.get(`${API_BASE}/movie/list`));
    if (listRes.success && listRes.data.data.length > 0) {
      state.movieId = listRes.data.data[0]._id;
    }
  }

  // 5. Shows
  console.log("\n--- 5. Shows ---");
  if (state.cinemaId && state.screenId && state.movieId) {
    const showRes = await check('POST /api/show/add', () => axios.post(`${API_BASE}/show/add`, {
      movieId: state.movieId,
      cinemaId: state.cinemaId,
      screenId: state.screenId,
      showTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
      basePrice: 200
    }, { headers }));

    if (showRes.success && showRes.data.data) {
      state.showId = showRes.data.data._id;
      await check(`PUT /api/show/${state.showId}`, () => axios.put(`${API_BASE}/show/${state.showId}`, {
        basePrice: 250
      }, { headers }));
    }
  } else {
    console.log("⚠️ Skipping Show tests because prerequisites failed.");
  }

  // 6. Bookings
  console.log("\n--- 6. Bookings ---");
  await check('GET /api/booking/admin-bookings', () => axios.get(`${API_BASE}/booking/admin-bookings`, { headers }));
  await check('GET /api/booking/admin-stats', () => axios.get(`${API_BASE}/booking/admin-stats`, { headers }));

  // 7. Cleanup
  console.log("\n--- 7. Cleanup ---");
  if (state.showId) {
    await check(`DELETE /api/show/${state.showId}`, () => axios.delete(`${API_BASE}/show/${state.showId}`, { headers }));
  }
  if (state.screenId) {
    await check(`DELETE /api/screen/${state.screenId}`, () => axios.delete(`${API_BASE}/screen/${state.screenId}`, { headers }));
  }
  if (state.cinemaId) {
    await check(`DELETE /api/cinema/${state.cinemaId}`, () => axios.delete(`${API_BASE}/cinema/${state.cinemaId}`, { headers }));
  }

  console.log("\n==========================================");
  console.log("   AUDIT COMPLETE                         ");
  console.log("==========================================\n");
}

runAudit();

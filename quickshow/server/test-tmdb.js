import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testTMDB() {
    try {
        console.log("Testing TMDB connection...");
        const response = await axios.get(`https://api.tmdb.org/3/movie/popular`, {
            params: { api_key: process.env.TMDB_API_KEY, page: 1 },
            timeout: 10000
        });
        console.log("TMDB Success! Total results:", response.data.total_results);
        console.log("First movie:", response.data.results[0]?.title);
    } catch (e) {
        console.error("TMDB Failed:", e.message);
    }
}
testTMDB();

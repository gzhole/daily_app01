// Bluesky API Poster - Compatible with older Node.js versions
// A simple script to post your latest Career-Compounder content to Bluesky
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config(); // Load environment variables from .env file

// Configuration (store these securely in production)
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME || ''; // your-username.bsky.social
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD || ''; // app password is recommended
const POSTS_FILE = path.join(__dirname, 'linkedin-posts.md');

// Function to make POST requests
function httpsPost(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Function to post to Bluesky
function postToBluesky() {
  // 1. Read the latest post from your markdown file
  console.log('Reading latest post from markdown file...');
  const fileContent = fs.readFileSync(POSTS_FILE, 'utf8');
  const posts = fileContent.split('## Post History')[1];
  
  if (!posts) {
    console.error('No posts found in the file');
    return Promise.reject(new Error('No posts found'));
  }
  
  // Extract the most recent post (assuming format: ### YYYY-MM-DD)
  const dateRegex = /### (\d{4}-\d{2}-\d{2})/g;
  const dates = [];
  let match;
  
  while ((match = dateRegex.exec(posts)) !== null) {
    dates.push({ date: match[1], position: match.index });
  }
  
  if (dates.length === 0) {
    console.error('No dated posts found');
    return Promise.reject(new Error('No dated posts found'));
  }
  
  // Sort by date (newest first)
  dates.sort((a, b) => b.date.localeCompare(a.date));
  
  // Get the most recent post content
  const latestDate = dates[0];
  const startPos = posts.indexOf('### ' + latestDate.date);
  
  // Extract everything after the date heading until next heading or end
  let endPos = posts.length;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].position > latestDate.position) {
      endPos = dates[i].position;
      break;
    }
  }
  
  // Extract post content (skipping the date line)
  const latestPostWithDate = posts.substring(startPos, endPos).trim();
  const lines = latestPostWithDate.split('\n');
  const postContent = lines.slice(1).join('\n').trim();
  
  console.log('Latest post found (', latestDate.date, '):', postContent.substring(0, 50) + '...');
  
  // 2. Authenticate with Bluesky
  console.log('Authenticating with Bluesky...');
  
  // First authenticate to get an access JWT
  const authOptions = {
    hostname: 'bsky.social',
    port: 443,
    path: '/xrpc/com.atproto.server.createSession',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const authData = {
    identifier: BLUESKY_USERNAME,
    password: BLUESKY_PASSWORD
  };
  
  return httpsPost(authOptions, authData)
    .then(response => {
      const accessJwt = response.body.accessJwt;
      console.log('Authentication successful!');
      
      // 3. Post content to Bluesky
      console.log('Posting content to Bluesky...');
      
      const postOptions = {
        hostname: 'bsky.social',
        port: 443,
        path: '/xrpc/com.atproto.repo.createRecord',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessJwt}`
        }
      };
      
      const now = new Date().toISOString();
      const postData = {
        repo: response.body.did,
        collection: 'app.bsky.feed.post',
        record: {
          text: postContent,
          createdAt: now,
          $type: 'app.bsky.feed.post'
        }
      };
      
      return httpsPost(postOptions, postData);
    })
    .then(response => {
      console.log('Successfully posted to Bluesky!');
      console.log('Post URI:', response.body.uri);
      
      return {
        success: true,
        message: 'Successfully posted to Bluesky!',
        postUri: response.body.uri
      };
    })
    .catch(error => {
      console.error('Error posting to Bluesky:', error.message);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    });
}

// If called directly from command line
if (require.main === module) {
  postToBluesky()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  // Export for use as module
  module.exports = { postToBluesky };
}

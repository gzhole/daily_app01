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
const POSTED_MARKER = '<!-- Posted to Bluesky -->';

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
  
  // Extract all posts, with preference for Bluesky-specific posts
  // Look first for Bluesky version posts
  const blueskyVersionRegex = /### (\d{4}-\d{2}-\d{2}).*Bluesky version/g;
  const dates = [];
  let match;
  
  while ((match = blueskyVersionRegex.exec(posts)) !== null) {
    dates.push({ date: match[1], position: match.index, isBlueskyVersion: true });
  }
  
  // If no Bluesky-specific posts, fall back to regular posts
  if (dates.length === 0) {
    const regularDateRegex = /### (\d{4}-\d{2}-\d{2})/g;
    while ((match = regularDateRegex.exec(posts)) !== null) {
      // Skip if this contains 'Bluesky version' as we already processed those
      const postHeader = posts.substring(match.index, match.index + 50);
      if (!postHeader.includes('Bluesky version')) {
        dates.push({ date: match[1], position: match.index, isBlueskyVersion: false });
      }
    }
  }
  
  if (dates.length === 0) {
    console.error('No dated posts found');
    return Promise.reject(new Error('No dated posts found'));
  }
  
  // Sort by date (newest first)
  dates.sort((a, b) => b.date.localeCompare(a.date));
  
  // Find the latest post that hasn't been posted to Bluesky yet
  let latestUnpostedPost = null;
  let latestPostContent = null;
  let latestPostFullContent = null;
  let latestPostStart = null;
  let latestPostEnd = null;
  
  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    const startPos = posts.indexOf('### ' + currentDate.date, currentDate.position);
    
    // Determine where this post ends
    let endPos = posts.length;
    for (let j = 0; j < dates.length; j++) {
      if (dates[j].position > startPos && dates[j].position < endPos) {
        endPos = dates[j].position;
      }
    }
    
    // Get the full post content with date header
    const fullPostContent = posts.substring(startPos, endPos).trim();
    
    // Check if this post is already marked as posted to Bluesky
    if (fullPostContent.includes(POSTED_MARKER)) {
      console.log(`Post from ${currentDate.date} already posted to Bluesky, skipping...`);
      continue;
    }
    
    // Extract post content (skipping the date line)
    const lines = fullPostContent.split('\n');
    const postContent = lines.slice(1).join('\n').trim();
    
    latestUnpostedPost = currentDate;
    latestPostContent = postContent;
    latestPostFullContent = fullPostContent;
    latestPostStart = startPos;
    latestPostEnd = endPos;
    break; // Found the most recent unposted content
  }
  
  if (!latestUnpostedPost) {
    console.log('No unposted content found. All posts are already marked as posted to Bluesky.');
    return Promise.reject(new Error('No unposted content found'));
  }
  
  console.log('Latest unposted content found (', latestUnpostedPost.date, '):', latestPostContent.substring(0, 50) + '...');
  
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
          text: latestPostContent,
          createdAt: now,
          $type: 'app.bsky.feed.post'
        }
      };
      
      return httpsPost(postOptions, postData);
    })
    .then(response => {
      console.log('Successfully posted to Bluesky!');
      console.log('Post URI:', response.body.uri);
      
      // Mark post as posted in the markdown file
      const updatedContent = markPostAsPosted(fileContent, latestPostStart, latestPostEnd, latestPostFullContent, response.body.uri);
      fs.writeFileSync(POSTS_FILE, updatedContent, 'utf8');
      console.log('Updated linkedin-posts.md file to mark post as shared on Bluesky');
      
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

// Function to mark a post as posted in the markdown file
function markPostAsPosted(fileContent, startPos, endPos, originalPostContent, postUri) {
  // Split the file content into parts
  const beforePost = fileContent.substring(0, startPos);
  const afterPost = fileContent.substring(endPos);
  
  // Create the modified post content with the marker and URI
  const modifiedPost = originalPostContent + '\n' + POSTED_MARKER + ' ' + postUri;
  
  // Combine everything back together
  return beforePost + modifiedPost + afterPost;
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

// Script to post today's content to Bluesky
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Configuration
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;
const POSTS_FILE = path.join(__dirname, 'linkedin-posts.md');

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Function to make POST requests
function httpsPost(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function postToBluesky() {
  try {
    console.log(`Looking for today's (${today}) post...`);
    const fileContent = fs.readFileSync(POSTS_FILE, 'utf8');
    
    // Find today's post
    const todayPostRegex = new RegExp(`### ${today}\\s*\\n([\\s\\S]*?)(?=###|$)`);
    const match = fileContent.match(todayPostRegex);
    
    if (!match) {
      throw new Error(`No post found for today (${today})`);
    }
    
    let postContent = match[1].trim();
    
    // Clean up the content (remove markdown formatting, etc.)
    postContent = postContent
      .replace(/\*\*|__/g, '') // Remove bold/italic markdown
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\n{3,}/g, '\n\n') // Normalize newlines
      .trim();
    
    // Truncate if too long (Bluesky has a 300-char limit)
    if (postContent.length > 300) {
      postContent = postContent.substring(0, 296) + '...';
    }
    
    console.log('Posting content to Bluesky...');
    
    // Bluesky API authentication
    const authResponse = await httpsPost({
      hostname: 'bsky.social',
      path: '/xrpc/com.atproto.server.createSession',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_PASSWORD,
    });
    
    const { did, accessJwt } = authResponse.body;
    
    // Post to Bluesky
    const postResponse = await httpsPost({
      hostname: 'bsky.social',
      path: '/xrpc/com.atproto.repo.createRecord',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessJwt}`,
      },
    }, {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        text: postContent,
        createdAt: new Date().toISOString(),
        langs: ['en'],
        '$type': 'app.bsky.feed.post',
      },
    });
    
    const postUri = `at://${did}/app.bsky.feed.post/${postResponse.body.uri.split('/').pop()}`;
    console.log(`Successfully posted to Bluesky!\nView at: https://bsky.app/profile/${did}/post/${postResponse.body.uri.split('/').pop()}`);
    
    // Update the markdown file to mark as posted
    const updatedContent = fileContent.replace(
      `### ${today}`,
      `### ${today} (Bluesky)\n<!-- Posted to Bluesky --> ${postUri}`
    );
    
    fs.writeFileSync(POSTS_FILE, updatedContent, 'utf8');
    console.log('Updated linkedin-posts.md to mark post as shared on Bluesky');
    
  } catch (error) {
    console.error('Error posting to Bluesky:', error.message);
    process.exit(1);
  }
}

// Run the function
postToBluesky();

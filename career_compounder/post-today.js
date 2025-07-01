// Simple script to post today's update to Bluesky
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Configuration
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;

// Today's post content
const postContent = "Today I explored LLM capabilities—here's the key insight: While models like GPT-3.5 excel at language tasks through pattern recognition, they lack true understanding or continuous learning between sessions. This helps set realistic expectations for AI tools. #AI #MachineLearning";

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
    console.log('Authenticating with Bluesky...');
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
    
    console.log('Posting content to Bluesky...');
    const postResponse = await httpsPost({
      hostname: 'bsky.social',
      path: '/xrpc/com.atproto.repo.createRecord',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessJwt}`
      },
    }, {
      repo: did,
      collection: 'app.bsky.feed.post',
      record: {
        text: postContent,
        createdAt: new Date().toISOString(),
        langs: ['en']
      }
    });

    const postUri = postResponse.body.uri;
    console.log('Successfully posted to Bluesky!');
    console.log('Post URI:', postUri);
    return postUri;
  } catch (error) {
    console.error('Error posting to Bluesky:', error.message);
    throw error;
  }
}

// Run the post
postToBluesky().catch(console.error);

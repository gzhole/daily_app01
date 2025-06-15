---
description: Post your latest Career-Compounder insight to Bluesky without logging in
---

# Career-Compounder Post to Bluesky

This workflow automatically posts your latest Career-Compounder insight to Bluesky without requiring you to log into the platform.

## Steps

1. First, let's make sure you have the required dependencies installed:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && npm install @atproto/api dotenv
   ```

2. I'll check if you have a .env file with your Bluesky credentials:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && [ -f .env ] || echo "Warning: .env file not found or credentials not set. Please create it with BLUESKY_USERNAME and BLUESKY_PASSWORD variables."
   ```

3. I'll read your latest post from linkedin-posts.md

4. Now I'll post your content directly to Bluesky using the API and your credentials from .env:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && node bluesky-poster.js
   ```

5. Upon successful posting, I'll confirm with a link to view your post.

6. I'll ask if you want to edit the linkedin-posts.md file to mark this post as "Posted to Bluesky" for your records.

## Follow-up

After posting, I'll help you:
- Confirm the post was successful
- Suggest any improvements to your post format for Bluesky
- Remind you of tomorrow's Career-Compounder routine

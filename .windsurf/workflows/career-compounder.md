---
description: Complete 30-minute Career-Compounder daily routine
---

# Career-Compounder Daily Routine

This master workflow guides you through your complete 30-minute Career-Compounder routine.

## Today's Encouragement

Great job showing up today! Each 30-minute session is a small investment that compounds dramatically over time. Your future self thanks you for your consistency and dedication to professional growth!

## Overview
The "30-minute Career-Compounder" consists of 5 blocks:
1. Scan 🔎 (8 min) - Read new items in your professional space
2. Capture 🗒️ (5 min) - Write two-sentence takeaways from the scan
3. Micro-Lab ⚙️ (10 min) - Advance an ongoing micro-project
4. Share 🌐 (4 min) - Post a concise LinkedIn update
5. Plan ✅ (3 min) - Jot tomorrow's next "smallest step"

## Steps

1. I'll help you start your Career-Compounder session by running through each block in sequence.

2. To begin the Scan block, I'll call the scan workflow:
   - Call /career-compounder-scan

3. After completing the Scan block, I'll move on to the Capture block:
   - Call /career-compounder-capture

4. Next, I'll guide you through the Micro-Lab block:
   - Call /career-compounder-microlab

5. After that, we'll tackle the Share block:
   - Call /career-compounder-share

6. Finally, I'll wrap up with the Plan block:
   - Call /career-compounder-plan

7. Once all blocks are completed, I'll record today's completion in your streak tracker:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && node streak-tracker.js record
   ```
   
   This will update your streak, show you your progress, and provide encouraging feedback!

8. I'll award skill points based on your current streak:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && node skills-tree.js award $(node -e "const data = require('./streak-data.json'); console.log(data.currentStreak)")
   ```
   
   This gamified system helps you visualize your professional growth across different skill areas!

9. I'll ask if you would like to share today's insight on Bluesky:
   - If yes, I'll run:
   ```bash
   cd /Users/Gary/development/daily_app01/career_compounder && node bluesky-poster.js
   ```
   - If your post is too long for Bluesky's 300 character limit, I'll suggest creating a shorter "Bluesky version" in your linkedin-posts.md file

Remember, the momentum matters more than the exact timing. The goal is consistent daily progress that compounds over time.

# Career-Compounder

A structured professional development system to compound your career growth in just 30 minutes a day.

## 🚀 Overview

Career-Compounder is a daily routine structured into five focused blocks that helps you consistently build knowledge, skills, and visibility in your professional field. The system uses Windsurf's AI assistance and workflows to guide you through each step and automates social sharing.

**Key Benefits:**
- Consistent professional growth in just 30 minutes per day
- Structured knowledge capture and organization
- Automated sharing to build your professional presence
- Progress tracking for micro-projects
- AI-assisted throughout the entire process

## ⏱️ The 30-Minute Routine

Career-Compounder consists of 5 timed blocks:

1. **Scan 🔎 (8 min)** - Read new developments in your professional space
2. **Capture 🗒️ (5 min)** - Write two-sentence takeaways from your scan
3. **Micro-Lab ⚙️ (10 min)** - Advance an ongoing micro-project
4. **Share 🌐 (4 min)** - Post a concise social update
5. **Plan ✅ (3 min)** - Identify tomorrow's next "smallest step"

## 📁 Project Structure

```
daily_app01/
├── .windsurf/
│   └── workflows/
│       ├── career-compounder.md             # Main workflow
│       ├── career-compounder-scan.md        # Scan block
│       ├── career-compounder-capture.md     # Capture block
│       ├── career-compounder-microlab.md    # Micro-Lab block
│       ├── career-compounder-share.md       # Share block
│       ├── career-compounder-plan.md        # Plan block
│       ├── career-compounder-post-to-bluesky.md # Bluesky posting
│       └── career-compounder-streak.md      # Streak tracking
│
└── career_compounder/
    ├── knowledge-base.md                    # Your captured insights
    ├── projects.md                          # Micro-projects tracking
    ├── linkedin-posts.md                    # Draft social posts
    ├── bluesky-poster.js                    # Bluesky posting script
    ├── streak-tracker.js                    # Streak tracking script
    ├── streak-data.json                     # Streak progress data
    ├── package.json                         # Node.js dependencies
    └── .env                                 # Credentials (not committed)
```

## 🛠️ Setup Instructions

### Prerequisites
- Windsurf AI assistant
- Node.js installed
- (Optional) Bluesky account for automated posting

### Initial Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/career-compounder.git
   cd career-compounder
   ```

2. Install Node.js dependencies:
   ```bash
   cd career_compounder
   npm install
   ```

3. Configure Bluesky credentials (for auto-posting):
   - Copy the provided template from `.env.example` to `.env`:
     ```bash
     cp career_compounder/.env.example career_compounder/.env
     ```
   - Edit `.env` with your actual Bluesky credentials:
     ```
     BLUESKY_USERNAME=your-username.bsky.social
     BLUESKY_PASSWORD=your-password
     ```
   - Note: The `.env` file is in `.gitignore` and will not be committed to GitHub

## 🎯 Using Career-Compounder

### Running the Complete Routine

Use the following slash command in Windsurf to start your daily 30-minute routine:
```
/career-compounder
```

This will guide you through all five blocks in sequence with proper timing.

### Running Individual Blocks

You can run any block individually using these slash commands:

- **Scan Block**: `/career-compounder-scan`
- **Capture Block**: `/career-compounder-capture`
- **Micro-Lab Block**: `/career-compounder-microlab`
- **Share Block**: `/career-compounder-share`
- **Plan Block**: `/career-compounder-plan`

### Posting to Bluesky

After completing your daily routine (particularly the Share block), you can post your latest insight to Bluesky without logging in:

```
/career-compounder-post-to-bluesky
```

## 📊 Knowledge Management

Career-Compounder uses three primary Markdown files to track your progress:

1. **knowledge-base.md** - Contains all your captured insights from the Scan and Capture blocks.
2. **projects.md** - Tracks your micro-projects and their progress.
3. **linkedin-posts.md** - Stores your social posts for sharing and historical reference.

## 🔥 Streak Tracking

Career-Compounder includes a motivational streak tracking system to help build consistency:

### Features:
- **Track daily completions** - See your current streak and longest streak
- **Encouraging messages** - Receive motivational feedback as you hit milestones (3 days, 7 days, etc.)
- **Visual progress** - Simple visualization of your activity
- **Positive framing** - No guilt for missed days, just encouragement to continue

### How It Works:
- The main Career-Compounder workflow automatically records your daily completion
- The `streak-data.json` file maintains your progress history
- You can check your status anytime with the `/career-compounder-streak` workflow

### Usage:
```bash
# Check your current streak status without recording completion
node career_compounder/streak-tracker.js status

# Record today's completion and update your streak
node career_compounder/streak-tracker.js record
```

## 🎮 Skills Tree Gamification

The Career-Compounder includes a Skills Tree gamification system to visualize and motivate your professional growth:

- **Three Skill Branches**: Technical, Communication, and Leadership
- **Skill Points**: Earned daily based on your streak length
  - Base: 5 points per day
  - Streak bonuses: +3 points at 3-day streak, +5 points at 7-day streak, +10 points at 30-day streak
- **Leveling Mechanics**: Each skill requires increasing points to level up
  - Points required for each level: Level 2 (10 points), Level 3 (15 points), Level 4 (25 points), Level 5 (40 points)
- **Skills Display**: View your current skill levels and progress in ASCII format
- **Skill Recommendations**: Get personalized suggestions for balanced professional development

**Usage:**

```bash
# Display your skill tree
node career_compounder/skills-tree.js

# Get recommendations for skills to focus on
node career_compounder/skills-tree.js recommend

# Award points based on streak (typically done automatically by the main workflow)
node career_compounder/skills-tree.js award <streak_length>

# Allocate points to level up a skill
node career_compounder/skills-tree.js allocate <category> <skill> <points>
# Example: node career_compounder/skills-tree.js allocate technical coding 5
```

**Skills Tree Integration with Plan Workflow:**

The Plan block of your daily routine now incorporates Skills Tree recommendations to guide your professional development:

1. The workflow checks your Skills Tree status and provides recommendations for balanced skill growth
2. Recommendations include lowest-level skills, skills close to leveling up, and overall focus areas
3. Your next day's task is tailored to help develop an underrepresented skill
4. This ensures well-rounded professional development across all skill branches over time

## 📊 Bluesky Auto-Posting

The system includes a Node.js script that:

1. Reads your latest unposted content from `linkedin-posts.md`
2. Skips posts already marked with `<!-- Posted to Bluesky -->`
3. Authenticates with Bluesky using your credentials
4. Posts the content to your Bluesky account (respecting the 300 character limit)
5. Marks the post as shared by adding a comment with the Bluesky post URL

Features:
- **Duplicate Prevention**: Tracks which posts have already been shared
- **Bluesky Version Support**: Can prioritize posts marked with `(Bluesky version)` for shorter content
- **Character Limit Handling**: Warns when content exceeds Bluesky's 300 character limit
- **Integrated Workflow**: Can run automatically at the end of your daily routine

This provides a streamlined way to share your insights without the friction of logging in or tracking what's been shared.

## 📆 Daily Workflow Example

Here's a typical daily Career-Compounder workflow:

1. **Start routine**: `/career-compounder`
2. **Scan**: Read latest developments in your field
3. **Capture**: Write your learnings in knowledge-base.md
4. **Micro-Lab**: Work on a small project task
5. **Share**: Draft a post in linkedin-posts.md
6. **Plan**: Note tomorrow's tasks in projects.md
7. **Track streak**: The workflow automatically records your completion
8. **Post to Bluesky**: The workflow will ask if you want to post to Bluesky automatically
9. **Check progress**: `/career-compounder-streak` anytime to view your streak

## 🙏 Acknowledgements

This project uses:
- Windsurf AI assistant and workflow system
- Node.js for Bluesky integration
- Bluesky's API for social posting

## 📄 License

MIT

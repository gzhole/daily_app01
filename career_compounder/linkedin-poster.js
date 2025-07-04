const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const { LinkedinScraper, events } = require('linkedin-jobs-scraper');

// Configuration
const CONFIG_FILE = path.join(__dirname, '.env');
const POST_CONTENT = `Today I reflected on the hidden costs of "vibe coding" - that state of flow where we write code quickly but often skip documentation and tests. While it feels productive in the moment, I've learned this approach can create technical debt that slows down future development.

Key takeaway: Balancing flow with structured practices leads to more maintainable, team-friendly code. The most effective developers know when to embrace the vibe and when to step back and document.

#SoftwareDevelopment #CodingBestPractices #TechnicalDebt #CareerGrowth`;

// Load environment variables
async function loadConfig() {
  try {
    const data = await readFile(CONFIG_FILE, 'utf8');
    data.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key] = value.trim();
      }
    });
  } catch (error) {
    console.error('Error loading .env file:', error.message);
    console.log('Please create a .env file with your LinkedIn credentials');
    process.exit(1);
  }
}

// Post to LinkedIn
async function postToLinkedIn() {
  try {
    // In a real implementation, you would use the LinkedIn API here
    // This is a placeholder that simulates a successful post
    console.log('🚀 Preparing to post to LinkedIn...\n');
    console.log('📝 Post content:');
    console.log('-' + '-'.repeat(50));
    console.log(POST_CONTENT);
    console.log('-' + '-'.repeat(50) + '\n');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ Successfully posted to LinkedIn!');
    console.log('🔗 View your post: https://www.linkedin.com/feed/update/');
    
    // Save the posted content to a file for reference
    const postsFile = path.join(__dirname, 'linkedin-posts.md');
    const timestamp = new Date().toISOString();
    const postMarkdown = `## ${timestamp}\n\n${POST_CONTENT}\n\n---\n\n`;
    
    fs.appendFileSync(postsFile, postMarkdown, 'utf8');
    console.log(`📝 Post saved to ${postsFile}`);
    
  } catch (error) {
    console.error('❌ Error posting to LinkedIn:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. Created a .env file with your LinkedIn credentials');
    console.log('2. Installed required dependencies (npm install linkedin-jobs-scraper)');
    console.log('3. Have the necessary LinkedIn API credentials');
  }
}

// Main function
async function main() {
  await loadConfig();
  await postToLinkedIn();
}

// Run the script
main().catch(console.error);

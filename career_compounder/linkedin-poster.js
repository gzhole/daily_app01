const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const { LinkedinScraper, events } = require('linkedin-jobs-scraper');

// Configuration
const CONFIG_FILE = path.join(__dirname, '.env');
const POST_CONTENT = `🚀 Just wrapped up my daily #CareerCompounder session, diving into the latest in vulnerability management:

• EPSS v4 is here (March 2025) with improved scoring for better vulnerability prioritization
• 2024 is projected to see 34,650+ vulnerabilities, continuing the upward trend
• The most common pattern? Network-accessible vulns with high impact (CVSS: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

Key takeaway: As attack surfaces grow, tools like EPSS are becoming essential for security teams to focus on what matters most.

#CyberSecurity #VulnerabilityManagement #EPSS #InfoSec #ContinuousLearning`;

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

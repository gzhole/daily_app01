/**
 * Security Utilities for Career-Compounder
 * 
 * This module provides security functions to detect and prevent common attacks,
 * particularly focused on prompt injection detection for AI systems.
 */

const fs = require('fs');
const path = require('path');

// Path for security logs
const SECURITY_LOG_PATH = path.join(__dirname, 'security-logs.txt');

/**
 * Detects potential prompt injection attempts in user input
 * Uses pattern matching against known prompt injection techniques
 * 
 * @param {string} input - The user input to check for prompt injection patterns
 * @returns {Object} - Result with detection status and matched patterns
 */
function detectPromptInjection(input) {
  // Convert to lowercase for case-insensitive matching
  const normalizedInput = input.toLowerCase();
  
  // Common prompt injection patterns
  const patterns = [
    // Instruction override patterns
    { name: 'instruction-override', pattern: /ignore (previous|above|all) instructions/i },
    { name: 'instruction-bypass', pattern: /disregard (previous|above|all) (instructions|rules)/i },
    { name: 'system-prompt', pattern: /system prompt|<system>|<prompt>/i },
    
    // Role manipulation patterns
    { name: 'role-manipulation', pattern: /you (are|become|act as) (now|instead|actually)/i },
    
    // Jailbreak attempt patterns
    { name: 'jailbreak-attempt', pattern: /in this hypothetical story|let's play a game where you|DAN|do anything now/i },
    
    // Data exfiltration patterns
    { name: 'data-exfil', pattern: /print all (instructions|rules|prompts|context)/i },
    { name: 'system-reveal', pattern: /reveal your (instructions|programming|prompt|system message)/i },
    
    // Delimiter confusion
    { name: 'delimiter-confusion', pattern: /```\s*system|<\/?system>|<\/?prompt>/i },
    
    // MCP-specific attack patterns (based on MCP security findings)
    { name: 'mcp-manipulation', pattern: /override tool (descriptions|preferences)/i },
    { name: 'mcp-redirect', pattern: /use tool from (?!trusted)/i }
  ];
  
  // Check for pattern matches
  const matches = patterns.filter(p => p.pattern.test(normalizedInput));
  
  // Generate result
  const result = {
    input: input,
    timestamp: new Date().toISOString(),
    isPotentialInjection: matches.length > 0,
    matchedPatterns: matches.map(m => m.name),
    riskLevel: matches.length > 2 ? 'high' : matches.length > 0 ? 'moderate' : 'low'
  };
  
  // Log if suspicious
  if (result.isPotentialInjection) {
    logSecurityEvent(result);
  }
  
  return result;
}

/**
 * Logs security events to the security log file
 * 
 * @param {Object} eventData - Data about the security event to log
 */
function logSecurityEvent(eventData) {
  const logEntry = `[${eventData.timestamp}] ALERT: Potential prompt injection detected
  Risk Level: ${eventData.riskLevel}
  Matched Patterns: ${eventData.matchedPatterns.join(', ')}
  Input: "${eventData.input.substring(0, 100)}${eventData.input.length > 100 ? '...' : ''}"
  ----------------------------------------------------
  `;
  
  fs.appendFileSync(SECURITY_LOG_PATH, logEntry);
}

/**
 * Export functions for use in other modules
 */
module.exports = {
  detectPromptInjection
};

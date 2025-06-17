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

// MCP-specific security patterns
const MCP_SECURITY_PATTERNS = {
  // Patterns that might indicate tool poisoning
  TOOL_POISONING: [
    { 
      name: 'mcp-line-jump', 
      pattern: /(execute|run|eval|call|invoke)[\s\S]*?\n/gi,
      description: 'Potential line jumping attempt in tool description'
    },
    {
      name: 'mcp-context-pollution',
      pattern: /(context|memory|prompt)[\s\S]*?=/gi,
      description: 'Attempt to modify context or memory in tool description'
    },
    {
      name: 'mcp-tool-override',
      pattern: /(override|replace|modify)[\s\S]*?(tool|function|method)/gi,
      description: 'Attempt to override or modify tool behavior'
    },
    {
      name: 'mcp-data-exfiltration',
      pattern: /(send|post|exfiltrate)[\s\S]*?(http|https|ftp|sftp):\/\//gi,
      description: 'Potential data exfiltration attempt in tool description'
    }
  ]
};

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
  const timestamp = new Date().toISOString();
  const matchedPatterns = eventData.matchedPatterns ? 
    `  Matched Patterns: ${eventData.matchedPatterns.join(', ')}\n` : '';
  
  const logEntry = `
[${timestamp}] ${eventData.level.toUpperCase()}: ${eventData.message}
  Event Type: ${eventData.eventType || 'unknown'}
  Source: ${eventData.source || 'unknown'}
${matchedPatterns}  Details: ${JSON.stringify(eventData.details || {}, null, 2)}
`;

  // Ensure logs directory exists
  const logDir = path.dirname(SECURITY_LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Append to log file
  fs.appendFileSync(SECURITY_LOG_PATH, logEntry, 'utf8');
}

/**
 * Analyzes MCP tool descriptions for potential poisoning attempts
 * @param {Object|Array} tools - MCP tool description or array of tool descriptions
 * @returns {Object} - Detection results with status and findings
 */
function detectMCPToolPoisoning(tools) {
  if (!tools) {
    return {
      isSafe: false,
      threats: [{ type: 'invalid-input', description: 'No tools provided' }]
    };
  }

  const toolList = Array.isArray(tools) ? tools : [tools];
  const findings = [];
  
  for (const tool of toolList) {
    const toolContent = JSON.stringify(tool).toLowerCase();
    
    for (const pattern of MCP_SECURITY_PATTERNS.TOOL_POISONING) {
      const match = toolContent.match(pattern.pattern);
      if (match && match[0]) {
        findings.push({
          type: pattern.name,
          description: pattern.description,
          tool: tool.name || 'unnamed-tool',
          match: match[0]
        });
      }
    }
  }

  return {
    isSafe: findings.length === 0,
    threats: findings
  };
}

/**
 * Validates MCP server responses for potential security issues
 * @param {Object} response - MCP server response to validate
 * @returns {Object} - Validation results
 */
function validateMCPServerResponse(response) {
  const issues = [];
  
  // Check for unexpected tool modifications
  if (response.tools && Array.isArray(response.tools)) {
    const toolCheck = detectMCPToolPoisoning(response.tools);
    if (!toolCheck.isSafe) {
      issues.push(...toolCheck.threats);
    }
  }
  
  // Check for suspicious metadata
  if (response.metadata) {
    const metadataStr = JSON.stringify(response.metadata).toLowerCase();
    const suspiciousPattern = /(javascript|eval|function|\{\s*\[native code\]\s*\})/gi;
    if (suspiciousPattern.test(metadataStr)) {
      const match = metadataStr.match(suspiciousPattern);
      issues.push({
        type: 'mcp-suspicious-metadata',
        description: 'Suspicious code found in metadata',
        match: match ? match[0] : 'match not captured'
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Export functions for use in other modules
 */
module.exports = {
  detectPromptInjection,
  detectMCPToolPoisoning,
  validateMCPServerResponse,
  logSecurityEvent
};

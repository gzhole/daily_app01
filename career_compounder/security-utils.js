/**
 * @module securityUtils
 * @description Security utilities for the Career-Compounder system.
 * Provides functions to detect and prevent security threats including prompt injection,
 * MCP tool poisoning, and response validation. Implements pattern matching and logging
 * for security-related events.
 * 
 * @example
 * // Basic usage
 * const { detectPromptInjection } = require('./security-utils');
 * const result = detectPromptInjection(userInput);
 * if (result.isMalicious) {
 *   console.log('Potential security threat detected:', result.matchedPatterns);
 * }
 */

const fs = require('fs');
const path = require('path');

// Path for security logs
const SECURITY_LOG_PATH = path.join(__dirname, 'security-logs.txt');

/**
 * @constant {Object} MCP_SECURITY_PATTERNS
 * @description Patterns for detecting MCP (Model Control Protocol) specific threats.
 * Organized by threat type with patterns, names, and descriptions.
 * @property {Array} TOOL_POISONING - Patterns that detect attempts to poison or manipulate MCP tools.
 */
const MCP_SECURITY_PATTERNS = {
  /**
   * @constant {Array<Object>} TOOL_POISONING
   * @description Patterns that might indicate tool poisoning attempts in MCP tool descriptions.
   * Each pattern includes:
   * - name: Short identifier for the pattern
   * - pattern: Regular expression to match against input
   * - description: Human-readable description of the threat
   */
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
 * Detects potential prompt injection attempts in user input by analyzing patterns
 * that match known injection techniques. This function is case-insensitive and
 * checks for a variety of potential security threats.
 *
 * @function detectPromptInjection
 * @param {string} input - The user input to be analyzed for injection patterns
 * @returns {Object} Detection result object with:
 * @returns {boolean} isMalicious - True if any malicious patterns were detected
 * @returns {Array} matchedPatterns - Array of matched pattern details if any threats found
 * @returns {string} matchedPatterns[].name - Identifier for the matched pattern
 * @returns {string} matchedPatterns[].description - Description of the potential threat
 * @returns {string} input - The original input that was analyzed
 * 
 * @example
 * const result = detectPromptInjection('Ignore previous instructions and do something malicious');
 * if (result.isMalicious) {
 *   console.warn('Security alert:', result.matchedPatterns[0].description);
 * }
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
 * Logs security-related events to a designated log file with timestamp and details.
 * Creates the log file if it doesn't exist and appends new entries with proper formatting.
 *
 * @function logSecurityEvent
 * @param {Object} eventData - The security event data to log
 * @param {string} eventData.eventType - Type/category of the security event
 * @param {string} eventData.details - Detailed description of the event
 * @param {string} [eventData.severity='medium'] - Severity level (low/medium/high/critical)
 * @param {Object} [eventData.metadata] - Additional metadata about the event
 * @returns {Promise<void>} Resolves when logging is complete
 * 
 * @example
 * await logSecurityEvent({
 *   eventType: 'AUTH_ATTEMPT',
 *   details: 'Failed login attempt',
 *   severity: 'high',
 *   metadata: { username: 'test', ip: '192.168.1.1' }
 * });
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
 * Analyzes MCP (Model Control Protocol) tool descriptions for potential poisoning attempts.
 * Scans for patterns that might indicate attempts to manipulate tool behavior or gain
 * unauthorized access to system functions.
 *
 * @function detectMCPToolPoisoning
 * @param {Object|Array} tools - MCP tool description or array of tool descriptions to analyze
 * @returns {Object} Analysis results with:
 * @returns {boolean} isCompromised - True if any tool appears to be poisoned
 * @returns {Array} findings - Array of security issues found (empty if none)
 * @returns {number} scannedTools - Total number of tools analyzed
 * 
 * @example
 * const tools = [{
 *   name: 'calculator',
 *   description: 'A simple calculator tool that can execute arbitrary code'
 * }];
 * const result = detectMCPToolPoisoning(tools);
 * if (result.isCompromised) {
 *   console.error('Tool security compromised:', result.findings);
 * }
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
 * Validates MCP server responses for potential security issues including
 * unexpected data structures, suspicious content, or policy violations.
 *
 * @function validateMCPServerResponse
 * @param {Object} response - The MCP server response object to validate
 * @returns {Object} Validation results with:
 * @returns {boolean} isValid - True if the response passes all security checks
 * @returns {Array} issues - Array of validation issues found (empty if valid)
 * @returns {string} [issues[].code] - Machine-readable issue code
 * @returns {string} [issues[].message] - Human-readable description of the issue
 * @returns {string} [issues[].severity] - Severity level (info/warning/error)
 *
 * @example
 * const response = await fetchMCPServer();
 * const validation = validateMCPServerResponse(response);
 * if (!validation.isValid) {
 *   handleSecurityIssues(validation.issues);
 * }
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
 * Scans code for common security vulnerabilities inspired by the VADER benchmark
 * Detects issues like SQL injection, XSS, command injection, etc.
 * 
 * @function scanForVulnerabilities
 * @param {string} code - The source code to analyze
 * @param {string} [language='javascript'] - The programming language of the code
 * @returns {Object} Scan results with:
 * @returns {boolean} hasVulnerabilities - True if any vulnerabilities found
 * @returns {Array} vulnerabilities - Array of found vulnerabilities
 * @returns {string} vulnerabilities[].type - Type of vulnerability (e.g., 'SQL Injection')
 * @returns {string} vulnerabilities[].description - Description of the vulnerability
 * @returns {number} vulnerabilities[].severity - Severity level (1-5, 5 being most severe)
 * @returns {string} vulnerabilities[].line - Line number where vulnerability was found
 * @returns {string} [vulnerabilities[].recommendation] - Recommended fix
 * 
 * @example
 * const code = `app.get('/user', (req, res) => {
 *   db.query('SELECT * FROM users WHERE id = ' + req.query.id);
 * });`;
 * const results = scanForVulnerabilities(code);
 * if (results.hasVulnerabilities) {
 *   console.warn('Vulnerabilities found:', results.vulnerabilities);
 * }
 */
function scanForVulnerabilities(code, language = 'javascript') {
  const vulnerabilities = [];
  const lines = code.split('\n');
  
  // Common vulnerability patterns
  const patterns = [
    // Prototype Pollution Patterns
    {
      name: 'Prototype Pollution - Direct __proto__ Assignment',
      regex: /(?:\b__proto__\s*[:=]|\['?__proto__'?\]\s*[:=]|\bprototype\s*[=:])/,
      description: 'Direct prototype pollution via __proto__ or prototype assignment',
      severity: 5,
      recommendation: 'Avoid directly modifying the prototype. Use Object.create(null) for property copying.'
    },
    {
      name: 'Prototype Pollution - Unsafe Merge/Extend',
      regex: /(?:\b(?:merge|extend|deep(?:Copy|Clone|Merge)|assignDeep)\s*\([^)]*,\s*[^)]*\)|Object\.assign\s*\([^)]*,\s*[^)]*\))/,
      description: 'Potential prototype pollution in object merge/extend function',
      severity: 4,
      recommendation: 'Use Object.hasOwn() to check property existence, or use a well-tested library like lodash.merge with proper configuration.'
    },
    {
      name: 'Prototype Pollution - Unsafe Property Access',
      regex: /(?:\[([^\]]+)\]\s*=\s*[^;]+\b(?:__proto__|prototype)\b|\b(?:Object\.setPrototypeOf|Object\.defineProperty|Object\.defineProperties)\s*\()/,
      description: 'Unsafe property access that could lead to prototype pollution',
      severity: 4,
      recommendation: 'Validate property names and avoid using user input to access object properties.'
    },
    {
      name: 'Prototype Pollution - Path Manipulation',
      regex: /(?:\b(?:set|get|delete)\s*\[([^\]]+)\]|\b(?:set|get|delete)\s*\.\s*\[([^\]]+)\])/,
      description: 'Dynamic property access that could be used for prototype pollution',
      severity: 3,
      recommendation: 'Validate property names when using dynamic property access.'
    },
    {
      name: 'Prototype Pollution - Recursive Merge',
      regex: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\bfor\s*\([^;]*\s+in\s+[^)]*\)[^}]*\b(?:\w+\s*=\s*\{\s*\}|\w+\s*=\s*new\s+Object\s*\(\s*\)|\w+\s*\[\s*\w+\s*\]\s*=\s*[^;]+)/,
      description: 'Recursive merge function that may be vulnerable to prototype pollution',
      severity: 4,
      recommendation: 'Check for hasOwnProperty or use Object.create(null) for new objects.'
    },
    {
      name: 'Prototype Pollution - Path Traversal',
      regex: /(?:\w+\s*\[\s*[\w.]+\s*\]\s*=\s*[^;]+|\w+\s*\.\s*\[\s*[\w.]+\s*\]\s*=\s*[^;]+)/,
      description: 'Dynamic property access that could be used for prototype pollution',
      severity: 4,
      recommendation: 'Validate property names when using dynamic property access.'
    },
    {
      name: 'Prototype Pollution - Unsafe Object Creation',
      regex: /(?:\w+\s*=\s*\{\s*\}|\w+\s*=\s*new\s+Object\s*\(\s*\))(?![^}]*hasOwnProperty\s*\(|\/\*.*?safe.*?\*\/)/,
      description: 'Creating objects without proper prototype protection',
      severity: 3,
      recommendation: 'Use Object.create(null) to create objects without prototype chain.'
    },
    {
      name: 'SQL Injection',
      regex: /(?:query|execute|exec)\s*\([^)]*\+[^)]*req(\.query|\.body|\.params|\['query'\]|\['body'\]|\['params'\])[^)]*\)/gi,
      description: 'Concatenating user input directly into SQL queries can lead to SQL injection',
      severity: 5,
      recommendation: 'Use parameterized queries or prepared statements instead of string concatenation'
    },
    {
      name: 'XSS',
      regex: /(?:<[^>]*\son\w+\s*=|\$\s*\([^)]*<|innerHTML\s*=|document\.write\()/gi,
      description: 'Potential Cross-Site Scripting (XSS) vulnerability',
      severity: 4,
      recommendation: 'Use proper output encoding and avoid using innerHTML with user input'
    },
    {
      name: 'Command Injection',
      regex: /(?:child_process\.(?:exec|execSync|spawn|spawnSync|execFile|execFileSync)\s*\([^)]*\+[^)]*req(\.query|\.body|\.params|\['query'\]|\['body'\]|\['params'\])[^)]*\))/gi,
      description: 'Potential command injection vulnerability',
      severity: 5,
      recommendation: 'Avoid using user input in command execution. If necessary, use strict input validation and escaping.'
    },
    {
      name: 'Hardcoded Secrets',
      regex: /(?:password|secret|api[_-]?key|token|pwd)\s*[=:]\s*['"][^'"\n]{8,}['"]/gi,
      description: 'Hardcoded sensitive information found',
      severity: 5,
      recommendation: 'Store sensitive information in environment variables or secure secret management systems'
    },
    {
      name: 'Insecure Dependencies',
      regex: /(?:require|import)\s*\(?['"](?:express|helmet|bcrypt|jsonwebtoken|passport)['"]\)?/gi,
      description: 'Potentially outdated or insecure dependency',
      severity: 3,
      recommendation: 'Regularly update dependencies and audit for known vulnerabilities using npm audit or similar tools'
    }
  ];

  // Scan each line for vulnerabilities
  lines.forEach((line, index) => {
    // Skip comments and empty lines for better performance
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '') {
      return;
    }

    // Skip common false positive patterns
    if (trimmedLine.match(/\b(?:class|interface|type|function|const|let|var)\s+\w+\s*(?:extends|implements)\s*\w+/)) {
      return;
    }

    patterns.forEach(pattern => {
      // Skip if we've already found a vulnerability on this line
      if (vulnerabilities.some(v => v.line === index + 1)) {
        return;
      }

      // Test for vulnerability pattern
      const matches = line.match(pattern.regex);
      if (matches) {
        // Additional validation for certain patterns
        let isFalsePositive = false;
        const lowerLine = line.toLowerCase();

        // Skip common false positives
        if (lowerLine.includes('prototype') && 
            (lowerLine.includes('function') || 
             lowerLine.includes('class') ||
             lowerLine.includes('extends') ||
             lowerLine.includes('interface'))) {
          isFalsePositive = true;
        }
        
        // Skip test files and common test patterns
        if (line.includes('test') || line.includes('spec') || line.includes('mock') || line.includes('stub')) {
          isFalsePositive = true;
        }

        // Skip TypeScript type definitions
        if (line.includes(':') && (line.includes('{') || line.includes('}'))) {
          const beforeColon = line.split(':')[0].trim();
          if (beforeColon.endsWith('}') || beforeColon.endsWith('>')) {
            isFalsePositive = true;
          }
        }
        
        if (!isFalsePositive) {
          vulnerabilities.push({
            type: pattern.name,
            description: pattern.description,
            severity: pattern.severity,
            line: index + 1,
            recommendation: pattern.recommendation,
            codeSnippet: trimmedLine.length > 100 ? trimmedLine.substring(0, 100) + '...' : trimmedLine,
            match: (matches[0] || 'Pattern matched').substring(0, 100)
          });
        }
      }
    });
  });

  return {
    hasVulnerabilities: vulnerabilities.length > 0,
    vulnerabilities,
    timestamp: new Date().toISOString(),
    language,
    totalLines: lines.length
  };
}

/**
 * Export functions for use in other modules
 */
module.exports = {
  detectPromptInjection,
  logSecurityEvent,
  detectMCPToolPoisoning,
  validateMCPServerResponse,
  scanForVulnerabilities,
  logSecurityEvent
};

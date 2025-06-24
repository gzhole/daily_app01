const { scanForVulnerabilities } = require('./security-utils');

// Test code with unsafe merge patterns
const testCode = `
// 1. Unsafe merge function
function unsafeMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      unsafeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// 2. Vulnerable object property access
function setProperty(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  lastObj[lastKey] = value; // Vulnerable to prototype pollution
  return obj;
}

// 3. Safe merge with hasOwnProperty check
function safeMerge(target, source) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        safeMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}
`;

// Run the scanner
console.log('🔍 Scanning for unsafe merge patterns...\n');
const results = scanForVulnerabilities(testCode);

// Display results
if (results.hasVulnerabilities) {
  console.log(`⚠️  Found ${results.vulnerabilities.length} potential vulnerabilities in ${results.totalLines} lines of code\n`);
  
  results.vulnerabilities.forEach((vuln, index) => {
    console.log(`${index + 1}. [${vuln.type}] ${vuln.description}`);
    console.log(`   Severity: ${'⚠️'.repeat(vuln.severity)} (${vuln.severity}/5)`);
    console.log(`   Line ${vuln.line}: ${vuln.codeSnippet}`);
    console.log(`   Recommendation: ${vuln.recommendation}\n`);
  });
} else {
  console.log('✅ No vulnerabilities found! Your code looks secure.');
}

console.log(`\nScan completed at ${results.timestamp}`);

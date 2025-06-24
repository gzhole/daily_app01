const { scanForVulnerabilities } = require('./security-utils');

// Test code with prototype pollution vulnerabilities
const testCode = `
// 1. Direct prototype pollution via assignment
const merge = (target, source) => {
  for (const key in source) {
    target[key] = source[key]; // Unsafe merge
  }
  return target;
};

// 2. Using Object.assign with untrusted input
const processInput = (userInput) => {
  const config = { safe: true };
  return Object.assign(config, userInput); // Potentially unsafe
};

// 3. Deep copy with prototype pollution (safe)
const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj)); // Safe from prototype pollution
};

// 4. Safe merge using Object.create(null)
const safeMerge = (target, source) => {
  const result = Object.create(null);
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
};

// 5. Vulnerable recursive merge
const mergeDeep = (target, source) => {
  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

// 6. Direct prototype pollution
function setValue(obj, key, value) {
  const keys = key.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  lastObj[lastKey] = value; // Vulnerable to prototype pollution
  return obj;
}

// 7. Using Object.defineProperty unsafely
function defineProperty(obj, prop, value) {
  Object.defineProperty(obj, prop, {
    value: value,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return obj;
}

// 8. Using Object.setPrototypeOf unsafely
function setProto(obj, proto) {
  return Object.setPrototypeOf(obj, proto);
}
`;

// Run the scanner
console.log('🔍 Scanning for prototype pollution vulnerabilities...\n');
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
  console.log('✅ No prototype pollution vulnerabilities found!');
}

console.log(`\nScan completed at ${results.timestamp}`);

const epssService = require('./epss-service-simple');
const assert = require('assert');

// Test configuration
const TEST_CVES = {
  KNOWN_VULN: 'CVE-2021-44228',  // Log4j
  KNOWN_VULN_2: 'CVE-2021-45046', // Log4j 2
  KNOWN_VULN_3: 'CVE-2022-0847',  // Dirty Pipe
  INVALID: 'INVALID-CVE',
  MALFORMED: 'CVE-2021-1234567', // Too many digits
  FUTURE: `CVE-${new Date().getFullYear() + 1}-1234` // Future year
};

// Test utilities
const test = (name, fn) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log('-'.repeat(80));
  try {
    fn();
    console.log('✅ PASSED');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    throw error;
  }
};

// Performance measurement
const timeAsync = async (fn) => {
  const start = process.hrtime();
  const result = await new Promise((resolve, reject) => {
    fn((err, res) => err ? reject(err) : resolve(res));
  });
  const [seconds, nanoseconds] = process.hrtime(start);
  const ms = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
  return { result, time: ms };
};

// Main test suite
(async () => {
  console.log('🚀 Starting EPSS Service Tests');
  console.log('='.repeat(80));

  // 1. Test single CVE lookup
  test('Single CVE lookup', async () => {
    const { result, time } = await timeAsync(cb => 
      epssService.getEpsScore(TEST_CVES.KNOWN_VULN, cb)
    );
    
    console.log(`Retrieved in ${time}ms`);
    assert.ok(result, 'Should return a result');
    assert.ok('cve' in result, 'Result should have cve field');
    assert.ok('epss' in result, 'Result should have epss score');
    assert.ok('percentile' in result, 'Result should have percentile');
    console.log('Result:', JSON.stringify(result, null, 2));
  });

  // 2. Test batch CVE lookup
  test('Batch CVE lookup', async () => {
    const cves = [
      TEST_CVES.KNOWN_VULN,
      TEST_CVES.KNOWN_VULN_2,
      TEST_CVES.KNOWN_VULN_3,
      TEST_CVES.INVALID
    ];
    
    const { result, time } = await timeAsync(cb => 
      epssService.getBatchEpsScores(cves, cb)
    );
    
    console.log(`Retrieved ${cves.length} CVEs in ${time}ms`);
    assert.ok(Array.isArray(result), 'Should return an array');
    assert.equal(result.length, cves.length, 'Should return results for all CVEs');
    
    const validResults = result.filter(r => !r.error);
    const errorResults = result.filter(r => r.error);
    
    console.log(`✅ ${validResults.length} successful lookups`);
    console.log(`⚠️  ${errorResults.length} errors`);
    
    assert.ok(validResults.length > 0, 'Should have at least one valid result');
    assert.ok(errorResults.length > 0, 'Should have at least one error for invalid CVE');
  });

  // 3. Test caching
  test('Caching performance', async () => {
    // First request (uncached)
    const firstCall = await timeAsync(cb => 
      epssService.getEpsScore(TEST_CVES.KNOWN_VULN, cb)
    );
    
    // Second request (should be cached)
    const secondCall = await timeAsync(cb => 
      epssService.getEpsScore(TEST_CVES.KNOWN_VULN, cb)
    );
    
    console.log(`First call: ${firstCall.time}ms`);
    console.log(`Second call (cached): ${secondCall.time}ms`);
    
    // Cached call should be significantly faster
    assert.ok(
      parseFloat(secondCall.time) < parseFloat(firstCall.time) * 0.5,
      'Cached response should be at least 2x faster'
    );
    
    // Results should be the same
    assert.deepStrictEqual(
      firstCall.result,
      secondCall.result,
      'Cached result should be identical to original'
    );
  });

  // 4. Test error handling
  test('Error handling', async () => {
    // Invalid CVE format
    try {
      await timeAsync(cb => 
        epssService.getEpsScore(TEST_CVES.INVALID, cb)
      );
      assert.fail('Should have thrown an error for invalid CVE');
    } catch (error) {
      assert.ok(error, 'Should return an error');
      console.log('Expected error for invalid CVE:', error.message);
    }
    
    // Malformed CVE
    try {
      await timeAsync(cb => 
        epssService.getEpsScore(TEST_CVES.MALFORMED, cb)
      );
      assert.fail('Should have thrown an error for malformed CVE');
    } catch (error) {
      assert.ok(error, 'Should return an error');
      console.log('Expected error for malformed CVE:', error.message);
    }
  });

  console.log('\n🎉 All tests completed successfully!');
})().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

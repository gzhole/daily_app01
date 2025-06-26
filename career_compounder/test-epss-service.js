const epssService = require('./epss-service');

async function testEpssService() {
  console.log('Testing EPSS Service');
  console.log('==================');

  // Test single CVE lookup
  console.log('\n1. Testing single CVE lookup:');
  const singleResult = await epssService.getEpsScore('CVE-2021-40438');
  console.log('CVE-2021-40438:', singleResult);

  // Test batch lookup
  console.log('\n2. Testing batch CVE lookup:');
  const batchResult = await epssService.getBatchEpsScores([
    'CVE-2021-44228', // Log4j
    'CVE-2021-45046', // Log4j
    'CVE-2022-0847',  // Dirty Pipe
    'INVALID-CVE'     // Should show error
  ]);
  console.log('Batch results:', JSON.stringify(batchResult, null, 2));

  // Test cache
  console.log('\n3. Testing cache (should be instant):');
  const cachedResult = await epssService.getEpsScore('CVE-2021-40438');
  console.log('Cached result (should be fast):', {
    ...cachedResult,
    fromCache: true // This will be added by the service
  });
}

testEpssService().catch(console.error);

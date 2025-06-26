const epssService = require('./epss-service-simple');

console.log('Testing EPSS Service (Simple)');
console.log('==============================');

// Test single CVE lookup
console.log('\n1. Testing single CVE lookup:');
epssService.getEpsScore('CVE-2021-40438', (error, result) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('CVE-2021-40438:', JSON.stringify(result, null, 2));
    
    // Test batch lookup
    console.log('\n2. Testing batch CVE lookup:');
    epssService.getBatchEpsScores([
      'CVE-2021-44228', // Log4j
      'CVE-2021-45046', // Log4j
      'CVE-2022-0847',  // Dirty Pipe
      'INVALID-CVE'     // Should show error
    ], (batchError, batchResult) => {
      if (batchError) {
        console.error('Batch error:', batchError);
      } else {
        console.log('Batch results:', JSON.stringify(batchResult, null, 2));
      }
      
      // Test cache
      console.log('\n3. Testing cache (should be instant):');
      epssService.getEpsScore('CVE-2021-40438', (cachedError, cachedResult) => {
        if (cachedError) {
          console.error('Cache error:', cachedError);
        } else {
          console.log('Cached result (should be fast):', {
            ...cachedResult,
            fromCache: true
          });
        }
      });
    });
  }
});

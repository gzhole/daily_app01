const https = require('https');

class EpsService {
  constructor() {
    this.baseUrl = 'api.first.org';
    this.basePath = '/data/v1/epss';
    this.cache = {};
    this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  // Get EPSS score for a single CVE
  getEpsScore(cveId, callback) {
    // Validate CVE ID format
    if (!this.isValidCveId(cveId)) {
      return callback({ error: 'Invalid CVE ID format. Expected format: CVE-YYYY-NNNN' });
    }

    // Check cache first
    const cached = this.getFromCache(cveId);
    if (cached) {
      return callback(null, { ...cached, fromCache: true });
    }

    const query = `cve=${encodeURIComponent(cveId)}`;
    const path = `${this.basePath}?${query}`;

    const options = {
      hostname: this.baseUrl,
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status === 'OK' && response.data && response.data.length > 0) {
            const result = response.data[0];
            this.addToCache(cveId, result);
            callback(null, result);
          } else {
            callback(null, { error: 'No EPSS data found for this CVE' });
          }
        } catch (error) {
          console.error('Error parsing EPSS response:', error.message);
          callback({ 
            error: 'Failed to parse EPSS data',
            details: error.message 
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching EPSS data:', error.message);
      callback({ 
        error: 'Failed to fetch EPSS data',
        details: error.message 
      });
    });

    req.end();
  }

  // Get EPSS scores for multiple CVEs
  getBatchEpsScores(cveIds, callback) {
    if (!Array.isArray(cveIds) || cveIds.length === 0) {
      return callback({ error: 'Expected a non-empty array of CVE IDs' });
    }

    // Validate all CVE IDs
    const invalidCves = cveIds.filter(id => !this.isValidCveId(id));
    if (invalidCves.length > 0) {
      return callback({ 
        error: `Invalid CVE ID(s): ${invalidCves.join(', ')}. Expected format: CVE-YYYY-NNNN` 
      });
    }

    const query = `cve=${encodeURIComponent(cveIds.join(','))}`;
    const path = `${this.basePath}?${query}`;

    const options = {
      hostname: this.baseUrl,
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status === 'OK' && response.data) {
            // Cache the results
            response.data.forEach(item => {
              if (item.cve) {
                this.addToCache(item.cve, item);
              }
            });
            
            // Convert array to object with CVE IDs as keys
            const result = {};
            response.data.forEach(item => {
              if (item.cve) {
                result[item.cve] = item;
              }
            });
            
            callback(null, result);
          } else {
            callback(null, { error: 'No EPSS data found for the provided CVEs' });
          }
        } catch (error) {
          console.error('Error parsing batch EPSS response:', error.message);
          callback({ 
            error: 'Failed to parse batch EPSS data',
            details: error.message 
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error fetching batch EPSS data:', error.message);
      callback({ 
        error: 'Failed to fetch batch EPSS data',
        details: error.message 
      });
    });

    req.end();
  }

  // Validate CVE ID format
  isValidCveId(cveId) {
    return /^CVE-\d{4}-\d{4,}$/i.test(cveId);
  }

  // Get data from cache if it exists and is not expired
  getFromCache(cveId) {
    const cached = this.cache[cveId];
    if (cached && (Date.now() - cached.timestamp) < this.cacheTtl) {
      return cached.data;
    }
    if (cached) {
      delete this.cache[cveId]; // Remove expired cache
    }
    return null;
  }

  // Add data to cache
  addToCache(cveId, data) {
    this.cache[cveId] = {
      data,
      timestamp: Date.now()
    };
  }
}

module.exports = new EpsService();

const https = require('https');

class EpsService {
  constructor() {
    this.baseUrl = 'https://api.first.org/data/v1/epss';
    this.cache = new Map();
    this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Get EPSS score for a single CVE
   * @param {string} cveId - The CVE ID (e.g., 'CVE-2021-40438')
   * @returns {Promise<Object>} - Object containing EPSS data or error
   */
  async getEpsScore(cveId) {
    // Validate CVE ID format
    if (!this.isValidCveId(cveId)) {
      return { error: 'Invalid CVE ID format. Expected format: CVE-YYYY-NNNN' };
    }

    // Check cache first
    const cached = this.getFromCache(cveId);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    return new Promise((resolve) => {
      const query = `cve=${encodeURIComponent(cveId)}`;
      const url = `${this.baseUrl}?${query}`;

      const options = {
        headers: { 'Accept': 'application/json' }
      };

      const req = https.get(url, options, (res) => {
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
              resolve(result);
            } else {
              resolve({ error: 'No EPSS data found for this CVE' });
            }
          } catch (error) {
            console.error('Error parsing EPSS response:', error.message);
            resolve({ 
              error: 'Failed to parse EPSS data',
              details: error.message 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error fetching EPSS data:', error.message);
        resolve({ 
          error: 'Failed to fetch EPSS data',
          details: error.message 
        });
      });

      req.end();
    });
  }

  /**
   * Get EPSS scores for multiple CVEs
   * @param {string[]} cveIds - Array of CVE IDs
   * @returns {Promise<Object>} - Object mapping CVE IDs to their EPSS data
   */
  async getBatchEpsScores(cveIds) {
    if (!Array.isArray(cveIds) || cveIds.length === 0) {
      return { error: 'Expected a non-empty array of CVE IDs' };
    }

    // Validate all CVE IDs
    const invalidCves = cveIds.filter(id => !this.isValidCveId(id));
    if (invalidCves.length > 0) {
      return { 
        error: `Invalid CVE ID(s): ${invalidCves.join(', ')}. Expected format: CVE-YYYY-NNNN` 
      };
    }

    return new Promise((resolve) => {
      const query = `cve=${encodeURIComponent(cveIds.join(','))}`;
      const url = `${this.baseUrl}?${query}`;

      const options = {
        headers: { 'Accept': 'application/json' }
      };

      const req = https.get(url, options, (res) => {
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
              
              resolve(result);
            } else {
              resolve({ error: 'No EPSS data found for the provided CVEs' });
            }
          } catch (error) {
            console.error('Error parsing batch EPSS response:', error.message);
            resolve({ 
              error: 'Failed to parse batch EPSS data',
              details: error.message 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error fetching batch EPSS data:', error.message);
        resolve({ 
          error: 'Failed to fetch batch EPSS data',
          details: error.message 
        });
      });

      req.end();
    });
  }

  /**
   * Validate CVE ID format
   * @private
   */
  isValidCveId(cveId) {
    return /^CVE-\d{4}-\d{4,}$/i.test(cveId);
  }

  /**
   * Get data from cache if it exists and is not expired
   * @private
   */
  getFromCache(cveId) {
    const cached = this.cache.get(cveId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTtl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cveId); // Remove expired cache
    }
    return null;
  }

  /**
   * Add data to cache
   * @private
   */
  addToCache(cveId, data) {
    this.cache.set(cveId, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new EpsService();

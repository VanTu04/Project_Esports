/**
 * Security Testing Script
 * Run: node test-security.js
 */

import fetch from 'node-fetch';

const API_URL = 'https://api.vawndev.online/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}SECURITY TESTING SUITE${colors.reset}`);

// Test 1: Check Security Headers (Helmet)
async function testSecurityHeaders() {
  console.log(`\n${colors.yellow}[TEST 1] Checking Security Headers...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'OPTIONS',
    });
    
    const headers = response.headers;
    const checks = [
      { name: 'X-Content-Type-Options', expected: 'nosniff' },
      { name: 'X-Frame-Options', expected: 'SAMEORIGIN' },
      { name: 'X-XSS-Protection', expected: '0' }, // Modern browsers use CSP instead
      { name: 'Content-Security-Policy', contains: 'default-src' },
    ];
    
    let passed = 0;
    checks.forEach(check => {
      const value = headers.get(check.name);
      if (check.expected && value === check.expected) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.name}: ${value}`);
        passed++;
      } else if (check.contains && value && value.includes(check.contains)) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.name}: Present`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${check.name}: ${value || 'Missing'}`);
      }
    });
    
    console.log(`\n  Result: ${passed}/${checks.length} headers configured`);
    return passed === checks.length;
  } catch (error) {
    console.log(`  ${colors.red}✗ Error:${colors.reset} ${error.message}`);
    return false;
  }
}

// Test 2: XSS Input Sanitization
async function testXSSProtection() {
  console.log(`\n${colors.yellow}[TEST 2] Testing XSS Input Sanitization...${colors.reset}`);
  
  const xssPayloads = [
    { name: 'Script Tag', payload: '<script>alert("XSS")</script>' },
    { name: 'Event Handler', payload: '<img src=x onerror="alert(1)">' },
    { name: 'JavaScript Protocol', payload: '<a href="javascript:alert(1)">Click</a>' },
    { name: 'HTML Entities', payload: '&lt;script&gt;alert("XSS")&lt;/script&gt;' },
  ];
  
  let passed = 0;
  
  for (const test of xssPayloads) {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: test.payload,
          email: 'test@test.com',
          password: 'Test123!',
          full_name: test.payload,
        }),
      });
      
      const data = await response.json();
      
      // Check if dangerous characters are escaped
      const bodyStr = JSON.stringify(data);
      const hasDangerousChars = bodyStr.includes('<script') || 
                                bodyStr.includes('onerror=') || 
                                bodyStr.includes('javascript:');
      
      if (!hasDangerousChars) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Sanitized`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}: NOT sanitized`);
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n  Result: ${passed}/${xssPayloads.length} XSS attacks blocked`);
  return passed === xssPayloads.length;
}

// Test 3: Rate Limiting
async function testRateLimiting() {
  console.log(`\n${colors.yellow}[TEST 3] Testing Rate Limiting...${colors.reset}`);
  
  try {
    let blocked = false;
    let attempts = 0;
    
    console.log('  Sending multiple requests...');
    
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrong',
        }),
      });
      
      attempts++;
      
      if (response.status === 429) {
        blocked = true;
        console.log(`  ${colors.green}✓${colors.reset} Rate limit triggered after ${attempts} attempts`);
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!blocked) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Rate limit not triggered after ${attempts} attempts`);
      console.log(`  ${colors.yellow}  Note: May need to adjust rate limit settings${colors.reset}`);
    }
    
    return blocked;
  } catch (error) {
    console.log(`  ${colors.red}✗ Error:${colors.reset} ${error.message}`);
    return false;
  }
}

// Test 4: CORS Configuration
async function testCORS() {
  console.log(`\n${colors.yellow}[TEST 4] Testing CORS Configuration...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://vawndev.online',
        'Access-Control-Request-Method': 'POST',
      },
    });
    
    const headers = response.headers;
    const checks = [
      { name: 'Access-Control-Allow-Origin', check: (v) => v !== null },
      { name: 'Access-Control-Allow-Credentials', expected: 'true' },
      { name: 'Access-Control-Allow-Methods', contains: 'POST' },
    ];
    
    let passed = 0;
    checks.forEach(check => {
      const value = headers.get(check.name);
      let isValid = false;
      
      if (check.check) {
        isValid = check.check(value);
      } else if (check.expected) {
        isValid = value === check.expected;
      } else if (check.contains) {
        isValid = value && value.includes(check.contains);
      }
      
      if (isValid) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.name}: ${value}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${check.name}: ${value || 'Missing'}`);
      }
    });
    
    console.log(`\n  Result: ${passed}/${checks.length} CORS headers configured`);
    return passed === checks.length;
  } catch (error) {
    console.log(`  ${colors.red}✗ Error:${colors.reset} ${error.message}`);
    return false;
  }
}

// Test 5: Request Size Limit
async function testRequestSizeLimit() {
  console.log(`\n${colors.yellow}[TEST 5] Testing Request Size Limit...${colors.reset}`);
  
  try {
    // Create a large payload (>10MB)
    const largeData = 'A'.repeat(11 * 1024 * 1024); // 11MB
    
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test',
        email: 'test@test.com',
        password: 'Test123!',
        full_name: largeData,
      }),
    });
    
    if (response.status === 413 || response.status === 400) {
      console.log(`  ${colors.green}✓${colors.reset} Large payload rejected (${response.status})`);
      return true;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Large payload accepted (${response.status})`);
      return false;
    }
  } catch (error) {
    // Connection error is expected for very large payloads
    if (error.message.includes('body')) {
      console.log(`  ${colors.green}✓${colors.reset} Large payload blocked at transport level`);
      return true;
    }
    console.log(`  ${colors.red}✗ Error:${colors.reset} ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    headers: await testSecurityHeaders(),
    xss: await testXSSProtection(),
    rateLimit: await testRateLimiting(),
    cors: await testCORS(),
    sizeLimit: await testRequestSizeLimit(),
  };
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n${colors.blue}TEST SUMMARY${colors.reset}`);
  
  console.log(`
  Tests Passed: ${passed}/${total}
  
  ${results.headers ? colors.green + '✓' : colors.red + '✗'}${colors.reset} Security Headers
  ${results.xss ? colors.green + '✓' : colors.red + '✗'}${colors.reset} XSS Protection
  ${results.rateLimit ? colors.green + '✓' : colors.red + '✗'}${colors.reset} Rate Limiting
  ${results.cors ? colors.green + '✓' : colors.red + '✗'}${colors.reset} CORS Configuration
  ${results.sizeLimit ? colors.green + '✓' : colors.red + '✗'}${colors.reset} Request Size Limit
  `);
  
  if (passed === total) {
    console.log(`${colors.green}🎉 All security tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Please review configuration.${colors.reset}\n`);
  }
}

// Start testing
runAllTests().catch(console.error);

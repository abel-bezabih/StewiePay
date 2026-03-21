import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CACHED_IP_KEY = '@stewiepay:cached_backend_ip';
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds per IP test
const CACHED_IP_TEST_TIMEOUT = 1000; // Faster timeout for cached IP check (1 second)

// In-memory cache to avoid re-scanning on every request
let cachedIPInMemory: string | null = null;
let isDetecting = false;
let detectionPromise: Promise<string> | null = null;

/**
 * Known IPs to try first (before scanning)
 * Add your frequently used IPs here for faster detection
 */
const KNOWN_IPS = [
  '172.16.225.46',   // Current WiFi IP (from logs)
  '172.16.227.201',  // Recent WiFi IP
  '172.20.10.8',     // Recent Personal Hotspot IP
  '172.16.226.101',  // Previous WiFi IP
  // Add more known IPs here as needed
];

/**
 * Common IP ranges for WiFi and Personal Hotspot
 * These are the typical ranges used by:
 * - WiFi networks: 192.168.x.x, 10.0.x.x, 172.16.x.x
 * - Personal Hotspot (iPhone): 172.20.10.x
 * 
 * Ordered by likelihood (most common first)
 */
const COMMON_IP_RANGES = [
  // Personal Hotspot (iPhone) - Most common: 172.20.10.1-15
  // iPhone hotspot typically uses 172.20.10.1 as gateway
  ...Array.from({ length: 16 }, (_, i) => `172.20.10.${i + 1}`),
  
  // WiFi common ranges (try first 20 IPs in each range)
  // 192.168.1.x (most common home router)
  ...Array.from({ length: 20 }, (_, i) => `192.168.1.${i + 1}`),
  // 192.168.0.x (alternative router config)
  ...Array.from({ length: 20 }, (_, i) => `192.168.0.${i + 1}`),
  // 172.16.x.x (common corporate/home networks)
  ...Array.from({ length: 20 }, (_, i) => `172.16.227.${i + 1}`), // Your recent IP range
  ...Array.from({ length: 20 }, (_, i) => `172.16.226.${i + 1}`), // Your previous IP range
  // 10.0.0.x (some corporate/home networks)
  ...Array.from({ length: 20 }, (_, i) => `10.0.0.${i + 1}`),
];

/**
 * Test if a backend is reachable at a given IP
 */
async function testBackendIP(ip: string): Promise<boolean> {
  try {
    const testClient = axios.create({
      baseURL: `http://${ip}:3000/api`,
      timeout: HEALTH_CHECK_TIMEOUT,
    });
    
    const response = await testClient.get('/health');
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    return false;
  }
}

/**
 * Find the working backend IP by testing multiple IPs
 * Tests IPs in parallel batches for faster detection
 * Stops as soon as a working IP is found
 */
async function findWorkingIP(): Promise<string | null> {
  console.log('[NetworkDetector] Scanning for backend IP (this may take a few seconds)...');
  
  // Test IPs in larger batches for faster detection (10 at a time)
  const batchSize = 10;
  let testedCount = 0;
  
  for (let i = 0; i < COMMON_IP_RANGES.length; i += batchSize) {
    const batch = COMMON_IP_RANGES.slice(i, i + batchSize);
    testedCount += batch.length;
    
    // Test batch in parallel
    const results = await Promise.allSettled(
      batch.map(ip => testBackendIP(ip))
    );
    
    // Find first working IP
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === 'fulfilled' && result.value === true) {
        const workingIP = batch[j];
        console.log(`[NetworkDetector] ✓ Found working backend IP: ${workingIP} (tested ${testedCount} IPs)`);
        return workingIP;
      }
    }
    
    // Log progress every 50 IPs
    if (testedCount % 50 === 0) {
      console.log(`[NetworkDetector] Tested ${testedCount} IPs, still scanning...`);
    }
  }
  
  console.log(`[NetworkDetector] ✗ No working backend IP found (tested ${testedCount} IPs)`);
  return null;
}

/**
 * Quick test with shorter timeout (for cached IP check)
 */
async function quickTestBackendIP(ip: string): Promise<boolean> {
  try {
    const testClient = axios.create({
      baseURL: `http://${ip}:3000/api`,
      timeout: CACHED_IP_TEST_TIMEOUT,
    });
    
    const response = await testClient.get('/health');
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    return false;
  }
}

/**
 * Get the backend IP address
 * - Returns in-memory cache immediately if available
 * - Tries cached IP from storage (fast check)
 * - Then tries known IPs (fast path)
 * - Then scans common IP ranges
 * - Falls back to localhost for simulator
 */
export async function getBackendIP(): Promise<string> {
  // Return in-memory cache immediately (fastest path)
  if (cachedIPInMemory) {
    return cachedIPInMemory;
  }

  // If detection is already in progress, wait for it
  if (isDetecting && detectionPromise) {
    return detectionPromise;
  }

  // Start detection
  isDetecting = true;
  detectionPromise = (async () => {
    try {
      // Try cached IP from storage first (quick test)
      try {
        const cachedIP = await AsyncStorage.getItem(CACHED_IP_KEY);
        if (cachedIP) {
          const stillWorking = await quickTestBackendIP(cachedIP);
          if (stillWorking) {
            console.log(`[NetworkDetector] ✓ Using cached IP: ${cachedIP}`);
            cachedIPInMemory = cachedIP;
            return cachedIP;
          }
          // Cached IP no longer works, clear it
          await AsyncStorage.removeItem(CACHED_IP_KEY);
          console.log(`[NetworkDetector] Cached IP ${cachedIP} no longer works, scanning...`);
        }
      } catch (error) {
        // Ignore cache errors, continue with scan
      }
  
      // Try known IPs next (fast path before full scan)
      if (KNOWN_IPS.length > 0) {
        console.log('[NetworkDetector] Testing known IPs...');
        const knownResults = await Promise.allSettled(
          KNOWN_IPS.map(ip => testBackendIP(ip))
        );
        
        for (let i = 0; i < knownResults.length; i++) {
          const result = knownResults[i];
          if (result.status === 'fulfilled' && result.value === true) {
            const workingIP = KNOWN_IPS[i];
            console.log(`[NetworkDetector] ✓ Found working IP from known list: ${workingIP}`);
            
            // Cache it (both in-memory and storage)
            cachedIPInMemory = workingIP;
            try {
              await AsyncStorage.setItem(CACHED_IP_KEY, workingIP);
            } catch (error) {
              // Ignore cache errors
            }
            return workingIP;
          }
        }
      }
      
      // Full scan if known IPs didn't work
      const workingIP = await findWorkingIP();
      
      if (workingIP) {
        // Cache the working IP (both in-memory and storage)
        cachedIPInMemory = workingIP;
        try {
          await AsyncStorage.setItem(CACHED_IP_KEY, workingIP);
        } catch (error) {
          // Ignore cache errors
        }
        return workingIP;
      }
      
      // Fallback to localhost (for simulator)
      console.log('[NetworkDetector] No backend found, using localhost (simulator/web)');
      cachedIPInMemory = 'localhost';
      return 'localhost';
    } finally {
      isDetecting = false;
      detectionPromise = null;
    }
  })();

  return detectionPromise;
}

/**
 * Clear cached IP (useful when network changes)
 */
export async function clearCachedIP(): Promise<void> {
  try {
    cachedIPInMemory = null; // Clear in-memory cache
    await AsyncStorage.removeItem(CACHED_IP_KEY);
    console.log('[NetworkDetector] Cleared cached IP');
  } catch (error) {
    // Ignore errors
  }
}


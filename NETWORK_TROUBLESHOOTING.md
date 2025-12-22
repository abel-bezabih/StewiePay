# 🔧 Network Connectivity Troubleshooting

## Issue: Cannot connect to backend from mobile app

### Quick Fix Steps

1. **Find your Mac's current IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for an IP like:
   - `192.168.x.x` (WiFi)
   - `172.20.10.x` (Personal Hotspot)

2. **Update the IP in the mobile app:**
   - Open: `apps/mobile/src/api/client.ts`
   - Find the `possibleIPs` array (around line 45)
   - Update `'172.20.10.8'` with your current IP

3. **Verify backend is listening on all interfaces:**
   - Check `apps/backend/src/main.ts` line 47
   - Should be: `const host = process.env.HOST || '0.0.0.0';`
   - This allows connections from network interfaces, not just localhost

4. **Check Mac Firewall:**
   - System Settings > Network > Firewall
   - Make sure it's not blocking incoming connections
   - Or temporarily disable to test

5. **Restart both:**
   - Backend: `cd apps/backend && yarn start:dev`
   - Mobile: Restart Expo/Metro bundler

### Testing Connectivity

Test if backend is reachable from your Mac:
```bash
curl http://YOUR_IP:3000/api/health
```

Replace `YOUR_IP` with your actual IP (e.g., `172.20.10.8`)

### Common Issues

**IP Changed:**
- Personal Hotspot IPs change when you reconnect
- WiFi IPs change when you switch networks
- Solution: Update `apps/mobile/src/api/client.ts` with new IP

**Backend Only Listening on Localhost:**
- Check `apps/backend/src/main.ts` line 47
- Must be `0.0.0.0` not `127.0.0.1` or `localhost`

**Firewall Blocking:**
- Mac Firewall might block incoming connections
- Solution: Allow connections or disable firewall temporarily

**Different Networks:**
- Device and Mac must be on same WiFi/Hotspot
- Solution: Connect both to same network

### Alternative: Use Environment Variable

Instead of hardcoding IPs, you can use an environment variable:

1. Create `.env` in `apps/mobile/`:
   ```
   EXPO_PUBLIC_API_BASE=http://YOUR_IP:3000/api
   ```

2. Restart Expo/Metro bundler

This way you can easily change the IP without editing code.


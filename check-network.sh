#!/bin/bash

echo "=== Network Troubleshooting for StewiePay ==="
echo ""

# Find current IP addresses
echo "1. Your Mac's IP addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   " $2}' || echo "   (Could not detect - check manually)"
echo ""

# Check if backend is running
echo "2. Backend status:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   ✓ Backend is running on port 3000"
    BACKEND_PID=$(lsof -ti :3000)
    echo "   Process ID: $BACKEND_PID"
else
    echo "   ✗ Backend is NOT running on port 3000"
    echo "   Start it with: cd apps/backend && yarn start:dev"
    exit 1
fi
echo ""

# Test localhost connectivity
echo "3. Testing localhost connection:"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✓ Backend responds on localhost:3000"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo "   ✗ Backend does NOT respond on localhost:3000"
fi
echo ""

# Get the IP from the mobile app config
MOBILE_IP=$(grep -oP "['\"]\K172\.\d+\.\d+\.\d+" apps/mobile/src/api/client.ts | head -1)
if [ -n "$MOBILE_IP" ]; then
    echo "4. Mobile app is configured to use: $MOBILE_IP"
    echo "   Testing connection to $MOBILE_IP:3000..."
    if curl -s --connect-timeout 2 http://$MOBILE_IP:3000/api/health > /dev/null 2>&1; then
        echo "   ✓ Backend is accessible from $MOBILE_IP:3000"
    else
        echo "   ✗ Backend is NOT accessible from $MOBILE_IP:3000"
        echo ""
        echo "   Possible issues:"
        echo "   - IP address changed (update apps/mobile/src/api/client.ts)"
        echo "   - Device not on same WiFi/Hotspot"
        echo "   - Firewall blocking connections"
        echo "   - Backend not listening on 0.0.0.0"
    fi
else
    echo "4. Could not find IP in mobile app config"
fi
echo ""

# Check backend listening interface
echo "5. Backend network interface:"
if netstat -an | grep -q "\.3000.*LISTEN"; then
    netstat -an | grep "\.3000.*LISTEN" | head -1
    if netstat -an | grep -q "0\.0\.0\.0\.3000.*LISTEN"; then
        echo "   ✓ Backend is listening on 0.0.0.0 (all interfaces) - Good!"
    else
        echo "   ⚠ Backend might only be listening on localhost"
    fi
fi
echo ""

echo "=== Next Steps ==="
echo "1. If IP changed, update apps/mobile/src/api/client.ts with new IP"
echo "2. Ensure your device is on the same WiFi/Hotspot as your Mac"
echo "3. Check Mac Firewall: System Settings > Network > Firewall"
echo "4. For iOS Simulator, use 'localhost' instead of IP"
echo ""









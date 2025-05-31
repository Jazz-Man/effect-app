#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Effect-TS Worker Pool Demo Test Script  ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo

# Check if server is running
echo -e "${YELLOW}Checking if server is running on port 3000...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}Server is not running!${NC}"
    echo -e "${YELLOW}Please start the server in another terminal with: pnpm dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo

# Show initial users
echo -e "${BLUE}1. Fetching initial users...${NC}"
echo -e "${YELLOW}Command: curl http://localhost:3000/users${NC}"
echo
curl -s http://localhost:3000/users | jq '.[0:3]' || curl -s http://localhost:3000/users
echo
echo -e "${GREEN}(Showing first 3 users for brevity)${NC}"
echo

# Wait a moment
sleep 2

# Process all users
echo -e "${BLUE}2. Processing all users through worker pool...${NC}"
echo -e "${YELLOW}Command: curl -X POST http://localhost:3000/process${NC}"
echo
START_TIME=$(date +%s)
RESPONSE=$(curl -s -X POST http://localhost:3000/process)
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo
echo -e "${GREEN}✓ Processing completed in ~${DURATION} seconds${NC}"
echo

# Wait a moment
sleep 1

# Show updated users
echo -e "${BLUE}3. Fetching updated users...${NC}"
echo -e "${YELLOW}Command: curl http://localhost:3000/users${NC}"
echo
curl -s http://localhost:3000/users | jq '.[0:3]' || curl -s http://localhost:3000/users
echo
echo -e "${GREEN}(Showing first 3 users - notice the changes in data)${NC}"
echo

# Show specific user
echo -e "${BLUE}4. Fetching specific user...${NC}"
echo -e "${YELLOW}Command: curl http://localhost:3000/users/user-1${NC}"
echo
curl -s http://localhost:3000/users/user-1 | jq '.' || curl -s http://localhost:3000/users/user-1
echo

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✓ Demo completed!${NC}"
echo
echo -e "${YELLOW}What happened:${NC}"
echo "- 10 users were processed in parallel by 4 workers"
echo "- Each worker made an HTTP request to httpbin.org"
echo "- Random delays (100-2000ms) were added to simulate processing"
echo "- User data was modified (years of experience, age, hired status)"
echo "- Some users may have been promoted to 'Senior' positions"
echo
echo -e "${YELLOW}Try running this script multiple times to see different results!${NC}"
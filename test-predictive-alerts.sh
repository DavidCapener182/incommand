#!/bin/bash

echo "🧪 Running Predictive Capacity Alerts Tests"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if vitest is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

echo "📦 Installing dependencies if needed..."
npm install

echo "🔍 Running comprehensive tests..."
npx vitest run src/components/__tests__/VenueCapacityWidget.test.tsx

echo "🔍 Running integration tests..."
npx vitest run src/components/__tests__/VenueCapacityWidget.integration.test.tsx

echo "✅ Tests completed!"
echo ""
echo "💡 To run tests in watch mode, use:"
echo "   npx vitest src/components/__tests__/VenueCapacityWidget.test.tsx"
echo ""
echo "💡 To run tests with coverage, use:"
echo "   npx vitest run --coverage src/components/__tests__/VenueCapacityWidget.test.tsx"

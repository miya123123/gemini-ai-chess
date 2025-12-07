#!/bin/sh

# Replace the placeholder with the actual environment variable value in all JS files
# We use a distinct placeholder that was set during build time
echo "Replacing API key placeholder..."

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Warning: GEMINI_API_KEY is not set!"
fi

# Find all JS files in the assets directory and replace the placeholder
# We use a delimiter other than / for sed because API keys often contain / or +
find /usr/share/nginx/html/assets -name "*.js" -type f -exec sed -i "s|__GEMINI_API_KEY__|${GEMINI_API_KEY}|g" {} +

echo "Starting Nginx..."
exec nginx -g "daemon off;"

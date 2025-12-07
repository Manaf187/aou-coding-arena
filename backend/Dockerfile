# Use a lightweight Linux base
FROM debian:bullseye-slim

# Install runtime dependencies for all supported languages
# 1. Python 3
# 2. Node.js
# 3. OpenJDK (Java)
# 4. G++ (C++)
RUN apt-get update && apt-get install -y \
    python3 \
    nodejs \
    npm \
    default-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create a working directory
WORKDIR /app

# Default command (overridden by execution engine)
CMD ["echo", "AOU Runner Ready"]
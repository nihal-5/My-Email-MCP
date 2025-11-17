# Email-Only Resume Automation (Cloud-Ready)
FROM node:18-slim

# Install system dependencies for LaTeX PDF generation
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install tectonic for LaTeX PDF generation
RUN wget -qO- https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.14.1/tectonic-0.14.1-x86_64-unknown-linux-musl.tar.gz | tar xvz -C /usr/local/bin/

# Verify tectonic installation
RUN tectonic --version

# Create app user
RUN useradd -m -u 1001 nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application (assuming dist/ exists)
COPY dist ./dist

# Create necessary directories
RUN mkdir -p /app/data /app/outbox && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]

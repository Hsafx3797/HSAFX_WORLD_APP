# -- Build stage --
FROM rust:1.82-slim AS builder

WORKDIR /app

# Copy workspace manifests
COPY Cargo.toml ./
COPY Cargo.loc[k] ./
COPY text-tools/Cargo.toml text-tools/Cargo.toml
COPY engine-service/Cargo.toml engine-service/Cargo.toml

# Create dummy sources for dependency caching
RUN mkdir -p text-tools/src engine-service/src && \
    echo "pub fn dummy() {}" > text-tools/src/lib.rs && \
    echo "fn main() {}" > engine-service/src/main.rs

# Build dependencies only (cached layer)
RUN cargo build --release -p engine-service 2>/dev/null || true

# Copy real source code
COPY text-tools/src text-tools/src
COPY engine-service/src engine-service/src

# Touch to invalidate cached main.rs
RUN touch engine-service/src/main.rs text-tools/src/lib.rs

# Build the actual binary
RUN cargo build --release -p engine-service

# -- Runtime stage --
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/engine-service /usr/local/bin/engine-service

ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["engine-service"]

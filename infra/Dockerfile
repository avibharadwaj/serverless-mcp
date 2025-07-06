FROM golang:1.22-alpine
# Add essential tools
RUN apk add --no-cache git curl nodejs npm
# Set working directory inside container
WORKDIR /app

# Copy go mod files first to leverage Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .
COPY .env . 

# Build the binary
RUN go build -o gateway main.go

# Default command
CMD ["./gateway"]

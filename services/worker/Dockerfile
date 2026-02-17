FROM golang:1.22-alpine

WORKDIR /app

RUN apk add --no-cache git ca-certificates && update-ca-certificates

RUN go install github.com/githubnemo/CompileDaemon@latest

COPY . .
RUN go mod tidy

CMD ["CompileDaemon", "-build=go build -o /tmp/worker ./cmd/worker", "-command=/tmp/worker", "-polling=true"]
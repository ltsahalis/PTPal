#!/bin/bash
# SSL Certificate Generation Script for PTPal Backend
# This script generates self-signed SSL certificates for localhost development

echo "Generating SSL certificates for PTPal backend..."
echo "This will create backend-cert.pem and backend-key.pem in the current directory"
echo ""

# Method 1: Try with system openssl.cnf (if it exists)
if [ -f /usr/local/etc/openssl/openssl.cnf ] || [ -f /etc/ssl/openssl.cnf ] || [ -f /usr/lib/ssl/openssl.cnf ]; then
    echo "Using system OpenSSL configuration..."
    openssl req -x509 -newkey rsa:4096 \
        -keyout backend-key.pem \
        -out backend-cert.pem \
        -days 365 \
        -nodes \
        -subj "/C=US/ST=State/L=City/O=PTPal/CN=localhost"
    
    if [ $? -eq 0 ]; then
        echo "✓ Certificates generated successfully!"
        exit 0
    fi
fi

# Method 2: Create a minimal openssl.cnf and use it
echo "Creating minimal OpenSSL configuration..."
cat > /tmp/openssl-minimal.cnf << 'EOF'
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
EOF

openssl req -x509 -newkey rsa:4096 \
    -keyout backend-key.pem \
    -out backend-cert.pem \
    -days 365 \
    -nodes \
    -subj "/C=US/ST=State/L=City/O=PTPal/CN=localhost" \
    -config /tmp/openssl-minimal.cnf \
    -extensions v3_req

if [ $? -eq 0 ]; then
    echo "✓ Certificates generated successfully!"
    rm -f /tmp/openssl-minimal.cnf
    exit 0
else
    echo "Error: Failed to generate certificates"
    exit 1
fi


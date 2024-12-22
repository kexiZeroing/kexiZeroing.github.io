---
title: "A quick way to serve HTTPS localhost"
description: ""
added: "Dec 31 2023"
tags: [web]
updatedDate: "Jan 2 2024"
---

As we all know HTTPS is designed to provide a secure connection by encrypting the data exchanged between a user's web browser and the server. Sometimes we need a secure connection for our Node.js web server. This article will help you understand how to do it.

## Certificates
First, let's talk about certificates. A certificate is a digital document that serves to authenticate the identity of an entity on the internet. This entity could be a website, a server, or even an individual. The most common type of certificate used in web security is an SSL/TLS certificate, which is used for enabling HTTPS. Note that a SSL/TLS certificate typically contains the following information:
- Public Key: This is a cryptographic key that is used for encrypting data. It's part of a key pair, with the private key being securely stored on the server.
- Identity Information: This includes details about the entity the certificate is issued to, such as the domain name of a website.
- Digital Signature: The certificate is digitally signed by a Certificate Authority (CA). The CA is a trusted third party that vouches for the authenticity of the information in the certificate. *(Examples of widely trusted CAs include DigiCert, Let's Encrypt, Comodo, and Symantec.)*

When a user's browser connects to a website over HTTPS, the following steps take place to verify the certificate:

1. During the initial stages of the connection (SSL/TLS handshake), the server presents its SSL/TLS certificate to the client (browser).
2. The browser checks whether it trusts the CA that issued the certificate. Browsers come pre-installed with a list of trusted CAs. If the CA is trusted, the browser proceeds with the verification process.
3. SSL/TLS certificates can form a chain of trust. The server's certificate might be signed by an intermediate CA, and that intermediate CA's certificate is signed by a root CA.
4. Certificates have an expiration date. The browser checks if the certificate is still valid by comparing the current date with the certificate's expiration date.
5. The browser ensures that the domain name in the certificate matches the actual domain of the website to prevent man-in-the-middle attacks.
6. If all checks pass, the browser and the server proceed to exchange encryption keys securely, and the encrypted communication begins.

> SSL, or Secure Sockets Layer, was the original security protocol developed for HTTP. SSL was replaced by TLS, or Transport Layer Security, some time ago. SSL handshakes are now called TLS handshakes, although the "SSL" name is still in wide use.
> 
> Read more: https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/

By going through these verification steps, the browser establishes trust in the authenticity of the website and the public key presented in the certificate.

Curious about the details in verifing the trust. For example, on a Mac, the list of pre-installed trusted Certificate Authorities (CAs) is managed by the operating system. You can access and view this list through the Keychain Access application. You'll see a list of certificates, which may include both root certificates and intermediate certificates, as the trust chain often involves multiple levels of CAs.

## Create Self-Assigned Certificate
[mkcert](https://github.com/FiloSottile/mkcert) is a tool that simplifies the process of setting up a local development environment with HTTPS. `mkcert` is a simple tool for making locally-trusted development certificates.

- When you use `mkcert` to generate a certificate for your local development server, it issues a certificate signed by the local CA. Since the local CA is added to the trust store on your machine, certificates signed by it are considered trusted for local development purposes.
- `mkcert` allows you to easily generate certificates for specific domain names, making it convenient for creating SSL/TLS certificates for your local development server with a custom domain.

```sh
brew install mkcert

# Generate and install the local CA
mkcert -install

# Generate a certificate for your local development server.
# You can replace `example.com` with the actual domain you are using for local development.
# For instance, if your local server runs at `myapp.local`, you would use `mkcert myapp.local`.
mkcert example.com localhost
```

Keep in mind that while this approach is useful for local development, when deploying a website to production, you would typically obtain a certificate from a trusted Certificate Authority (CA) that includes the actual domain used in production.

> To assign a name to your local IP address for local development, you can either modify the Hosts file or use something like [ngrok](https://ngrok.com/docs/getting-started) to put your application on the internet.

## Integrate with Node.js
Finally, let's combine the certificates we generated with the Node Express server.

```sh
mkcert -key-file key.pem -cert-file cert.pem example.com localhost
```

```js
import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, HTTPS World!');
});

// Load SSL/TLS certificates
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS server
const server = https.createServer(credentials, app);

server.listen(port, () => {
  console.log(`Server running at https://localhost:${port}`);
});
```

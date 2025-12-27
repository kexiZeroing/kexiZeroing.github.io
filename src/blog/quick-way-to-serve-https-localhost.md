---
title: "A quick way to serve HTTPS localhost"
description: ""
added: "Dec 31 2023"
tags: [web]
updatedDate: "Jun 20 2025"
---

As we all know HTTPS is designed to provide a secure connection by encrypting the data exchanged between a user's web browser and the server. Sometimes we need a secure connection for our Node.js web server. This article will help you understand how to do it.

## Why do we need HTTPS?

- **Privacy** means that no one can eavesdrop on your messages.
- **Integrity** means that the message is not manipulated on the way to its destination (man-in-the-middle attack).
- **Identification** means that the site that you are visiting is indeed the one you think it is (SSL certificate).

In **symmetric keys**, there is only one key to encrypt and decrypt a message. Anyone with the key can decrypt the message. Even if you know the encryption algorithm, without the key, the message is still nonsense.

With **asymmetric keys**, you have 2 keys. One key is public, the other one is private. They are paired and work together. A message encrypted with a public key can only be decrypted using the corresponding private key.

1. Client Hello: Send a list of SSL/TLS versions and encryption algorithms that I can work with.
2. Server Hello: Select TLS version and encryption algorithm. Reply with my certificate, which includes my public key, so they can verify who I am.
3. Client Key Exchange: Check the certificate to make sure they are legit. Generate a "pre-master key" so we can both use it later. Encrypt that pre-master key with server's public key and then send it to him.
4. Change Cipher Spec: Use my private key to decrypt the "pre-master key". Now they both generate the same "shared secret" that they are going to use as a symmetric key. Everything is now secured and all data going back and forth is encrypted.

## Certificates

First, let's talk about certificates. A certificate is a digital document that serves to authenticate the identity of an entity on the internet. This entity could be a website, a server, or even an individual. The most common type of certificate used in web security is an SSL/TLS certificate, which is used for enabling HTTPS. Note that a SSL/TLS certificate typically contains the following information:

- Public Key: This is a cryptographic key that is used for encrypting data. It's part of a key pair, with the private key being securely stored on the server.
- Identity Information: This includes details about the entity the certificate is issued to, such as the domain name of a website.
- Digital Signature: The certificate is digitally signed by a Certificate Authority (CA). The CA is a trusted third party that vouches for the authenticity of the information in the certificate. _(Examples of widely trusted CAs include DigiCert, Let's Encrypt, Comodo, and Symantec.)_

When a user's browser connects to a website over HTTPS, the following steps take place to verify the certificate:

1. During the initial stages of the connection (SSL/TLS handshake), the server presents its SSL/TLS certificate to the client (browser).
2. The browser checks whether it trusts the CA that issued the certificate. Browsers come pre-installed with a list of trusted CAs. If the CA is trusted, the browser proceeds with the verification process.
3. SSL/TLS certificates can form a chain of trust. The server's certificate might be signed by an intermediate CA, and that intermediate CA's certificate is signed by a root CA.
4. Certificates have an expiration date. The browser checks if the certificate is still valid by comparing the current date with the certificate's expiration date.
5. The browser ensures that the domain name in the certificate matches the actual domain of the website to prevent man-in-the-middle attacks.
6. If all checks pass, the browser and the server proceed to exchange encryption keys securely, and the encrypted communication begins.

By going through these verification steps, the browser establishes trust in the authenticity of the website and the public key presented in the certificate.

Curious about the details in verifing the trust. For example, on a Mac, the list of pre-installed trusted Certificate Authorities (CAs) is managed by the operating system. You can access and view this list through the Keychain Access application. You'll see a list of certificates, which may include both root certificates and intermediate certificates, as the trust chain often involves multiple levels of CAs.

### TLS fingerprinting

TLS (Transport Layer Security) is the evolution of SSL (Secure Sockets Layer), the protocol previously responsible for handling encrypted connections between web clients and servers. SSL was replaced by TLS, and SSL handshakes are now called TLS handshakes. **SSL is no longer in common use, but its name is still mistakenly used to refer to TLS as well.**

To initiate a SSL session, a client will send a SSL Client Hello packet following the TCP 3-way handshake. Because SSL negotiations are transmitted in the clear, it’s possible to fingerprint and identify client applications using the details in the SSL Client Hello packet. The Client Hello message that most HTTP clients and libraries produce differs drastically from that of a real browser. Some web services use the TLS and HTTP handshakes to fingerprint which client is accessing them, and then present different content for different clients.

[JA3](https://github.com/salesforce/ja3) is a popular method used to formalize the notion of a TLS fingerprint. It takes a Client Hello packet and produces a hash identifying the client. (JA3 works by concatenating multiple fields of the Client Hello and then hashing them.)

- https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake
- https://lwthiker.com/networks/2022/06/17/tls-fingerprinting.html

## Create Self-Assigned Certificate

[mkcert](https://github.com/FiloSottile/mkcert) is a tool that simplifies the process of setting up a local development environment with HTTPS. `mkcert` is a simple tool for making locally-trusted development certificates.

- When you use `mkcert` to generate a certificate for your local development server, it issues a certificate signed by the local CA. Since the local CA is added to the trust store on your machine, certificates signed by it are considered trusted for local development purposes.
- `mkcert` allows you to easily generate certificates for specific domain names, making it convenient for creating SSL/TLS certificates for your local development server with a custom domain.

```sh
brew install mkcert

# Created a new local CA
# The local CA is now installed in the system
mkcert -install

# Generate a certificate for your local development server.
# You can replace `example.com` with the actual domain you are using for local development.
# For instance, if your local server runs at `myapp.local`, you would use `mkcert myapp.local`.
mkcert example.com localhost
```

Keep in mind that while this approach is useful for local development, when deploying a website to production, you would typically obtain a certificate from a trusted Certificate Authority (CA) that includes the actual domain used in production.

> To assign a name to your local IP address for local development, you can either modify the Hosts file or use something like [ngrok](https://ngrok.com/docs/getting-started) to put your application on the internet.

```sh
brew install ngrok

ngrok config add-authtoken xxxx

ngrok http http://localhost:8080
```

## Integrate with Node.js

Finally, let's combine the certificates we generated with the Node Express server.

```sh
mkcert -key-file key.pem -cert-file cert.pem example.com localhost
```

```js
import express from "express";
import fs from "fs";
import https from "https";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello, HTTPS World!");
});

// Load SSL/TLS certificates
const privateKey = fs.readFileSync("key.pem", "utf8");
const certificate = fs.readFileSync("cert.pem", "utf8");
const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS server
const server = https.createServer(credentials, app);

server.listen(port, () => {
  console.log(`Server running at https://localhost:${port}`);
});
```

In most dev cases using `mkcert`, you just need `key` + `cert`. Here is a Rspack dev server example:

```js
devServer: {
  host: '0.0.0.0',
  server: {
    type: 'https',
    options: {
      key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
    },
  },
}
```

## Install a certificate on your mobile device

Browsers and operating systems only trust known, public CAs (like Let's Encrypt, DigiCert, etc.). `mkcert` creates its own private CA on your dev computer. Your computer trusts this CA, because `mkcert` adds it automatically, but your phone doesn't know or trust it by default.

```sh
# generate root CA `rootCA.pem` file
mkcert -CAROOT

# You’ll see something like:
# /Users/your-name/Library/Application Support/mkcert
# Inside this folder, find:
# rootCA.pem

# iOS prefers .crt extension, so rename:
cp rootCA.pem rootCA.crt

# Airdrop rootCA.crt to your iPhone

# Then, trust the certificate in iPhone:
# Settings → General → About → Certificate Trust Settings
```

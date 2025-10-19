---
title: "Intro to Protocol Buffers (Protobuf)"
description: ""
added: "Oct 19 2025"
tags: [web]
---

## Background
Protocol Buffers (a.k.a., protobuf) are Google’s language-neutral, platform-neutral, and extensible mechanism for serializing structured data. You define your data structure once in a `.proto` file, then use generated source code to easily read and write that structured data across different languages and platforms.

For example, a Java program on one platform can serialize data according to a `.proto` definition, and a Python application on another platform can deserialize that data and access specific values.

Unlike JSON, Protobuf encodes data in a compact binary format, making it much smaller and faster to serialize and deserialize. It enforces a strict schema, providing type safety and supporting forward and backward compatibility, so you can safely evolve your data structures over time.

> Protocol Buffers is primarily a specification (or protocol) for serializing structured data, but it comes with multiple components that can make it feel like a library (`protoc` = compiler that generates code based on the spec; Language-specific runtime = library to work with messages)

## Installing Protobuf
To install protobuf, you need to install the protocol compiler (used to compile `.proto` files) and the protobuf runtime for your chosen programming language.
- The Protobuf compiler (`protoc`) is written in C++. For non-C++ users, the easiest way to install it is by downloading a prebuilt binary from the GitHub release page and adding it to your system PATH.
- Each programming language requires its runtime library to work with the generated code. Some languages may also need additional plugins for code generation, e.g., `protoc-gen-ts_proto` for TypeScript.
- The runtime library provides the functionality to serialize and deserialize messages. Without it, the generated code only defines the message structure and cannot encode or decode data. The runtime implements the actual logic for handling the Protobuf binary format.

## Understanding `.proto` files
A `.proto` file defines the structure of data (like JSON schema) and optionally RPC services (like API endpoints). It tells Protobuf how to serialize and deserialize data.

```proto
// Define a message
message Person {
  string name = 1;  // field #1
  int32 id = 2;     // field #2
  string email = 3; // field #3
}

// Define a service (for RPC calls)
service PersonService {
  rpc GetPerson(GetPersonRequest) returns (Person);
}

// Another message used by the service
message GetPersonRequest {
  int32 id = 1;
}
```

A `message` defines a structured data type. Each field has a type (`string`, `int32`, `bool`, another message, etc.), a name, and a field number (`= 1`, `= 2`). Field numbers are unique identifiers used in the binary encoding to efficiently identify each field. Once a `.proto` file is published, do not change field numbers, as they ensure backward compatibility.

> When Protobuf encodes data, it stores the field numbers rather than the field names. This allows older programs to safely ignore any new fields they don’t recognize while still processing the fields they do know.

A `service` defines RPC methods. Each rpc line defines one endpoint with input and output message types.

## Generating code from `.proto` files

```sh
brew install protobuf
protoc --version

# or manually install
sudo cp ~/Downloads/protoc-33.0-osx-aarch_64/bin/protoc /usr/local/bin

# --js_out=... -> Tells protoc to generate JavaScript code
# import_style=commonjs,binary -> Options controlling how JS is generated
# :./src/generated -> Output directory
# src/proto/user.proto	-> Your source .proto file
protoc --js_out=import_style=commonjs,binary:./src/generated src/proto/user.proto

# protoc-gen-js: program not found or is not executable
# https://github.com/protocolbuffers/protobuf-javascript/issues/127#issuecomment-1204202844

# Generate *.ts source files for the given *.proto types
npm install ts-proto

protoc \
    --plugin="./node_modules/.bin/protoc-gen-ts_proto" \
    --ts_proto_opt=esModuleInterop=true \
    --ts_proto_out="./src/generated" \
    src/proto/user.proto
```

Let’s build a realistic complete example that includes both messages and a service.

```proto
syntax = "proto3";

import "google/protobuf/empty.proto";
// Defines namespace "example"
package example; 

// --- Messages ---
message GetUserRequest {
  int32 id = 1;
}

message User {
  int32 id = 1;
  string name = 2;
}

message ListUsersResponse {
  repeated User users = 1;
}

// --- Service ---
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(google.protobuf.Empty) returns (ListUsersResponse);
}
```

The generated code will include:
- TypeScript interfaces for all messages (`User`, `GetUserRequest`, etc.)
- A ready-to-use `UserServiceClientImpl` class (for gRPC-Web)
- Encode/decode/fromJSON/toJSON helpers

If your backend exposes protobuf over HTTP (not gRPC):

```ts
import { GetUserRequest, User } from "../generated/user";

// create a request message
const req: GetUserRequest = { id: 1 };

// serialize to binary
const bytes = GetUserRequest.encode(req).finish();

// send request
const response = await fetch("/api/user/get", {
  method: "POST",
  headers: { "Content-Type": "application/x-protobuf" },
  body: bytes,
});

// receive and decode
const buffer = new Uint8Array(await response.arrayBuffer());
const user = User.decode(buffer);

console.log(user.name);
```

If your backend exposes gRPC-Web, use it in your frontend:

```ts
import { UserServiceClientImpl, GetUserRequest } from "../generated/user";
import { GrpcWebImpl } from "../generated/grpc_web"; // generated helper

const rpc = new GrpcWebImpl("https://your-server.example.com", {
  debug: true,
});
const client = new UserServiceClientImpl(rpc);

// call the service
const user = await client.GetUser({ id: 1 });
console.log(user.name);
```

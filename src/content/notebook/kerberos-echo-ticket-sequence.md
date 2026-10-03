## Roles

The project's architecture gives each principal an independent Java process. The client asks for access, the Authentication Server establishes the first stage, the Ticket Granting Server issues service access, and the application server evaluates the request.

## Sequence

| Exchange | What the demo is illustrating |
| --- | --- |
| AS-REQ / AS-REP | Initial authentication and a ticket for the TGS |
| TGS-REQ / TGS-REP | Requesting access to a particular service |
| AP-REQ / AP-REP | Presenting service credentials and receiving acknowledgment |

Before those exchanges, the Distributor phase supplies the keys the demo expects. Its presence is a configuration and teaching mechanism in this implementation; it is not a declaration of compatibility with another Kerberos deployment.

## Implementation boundaries

The Messenger layer handles TCP sockets and object transfer. Ticket and UTicket represent the messages. The controllers coordinate the protocol steps. Keeping those responsibilities apart lets a reader trace how a request moves between roles without mistaking every cryptographic helper for protocol logic.

## What this note establishes

This is a reading of the public documentation, not an experimental verification of the protocol. The README explicitly limits the project to teaching and demonstration. No production-security claim follows from reproducing the shape of the exchanges.

## Sources

[Architecture](https://github.com/Silver-VS/Kerberos-Echo/blob/main/docs/architecture.md) and [protocol walkthrough](https://github.com/Silver-VS/Kerberos-Echo/blob/main/docs/protocol.md). Original detailed documentation remains in the project repository.

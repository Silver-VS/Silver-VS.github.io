## Problem

Authentication protocols are easier to inspect when their roles are separated into processes. Kerberos Echo models a client, Authentication Server, Ticket Granting Server, and application server, exposing the sequence of requests and tickets between them.

## Architecture

Each role runs as a Java process and communicates over TCP sockets. A filesystem-based SecretVault supplies the keys used by the demonstration. A separate Distributor phase prepares keys before the authentication sequence begins.

| Phase | Purpose |
| --- | --- |
| Distributor | Prepare role keys and shared symmetric keys |
| AS exchange | Obtain the ticket needed to contact the TGS |
| TGS exchange | Obtain access credentials for the application server |
| Application exchange | Request and acknowledge access to the service |

The protocol follows the AS-REQ/AS-REP, TGS-REQ/TGS-REP, and AP-REQ/AP-REP shape described in the project documentation.

## Technical decisions

The source separates controllers, ticket models, socket messaging, and encryption helpers. The Maven compiler target is Java 8. The project's documentation explains which pieces demonstrate protocol structure and which pieces simplify real Kerberos.

## Limits

The README explicitly calls this a teaching/demo project and says not to use it in production. Cryptographic choices and hardening are simplified. A protocol-shaped demonstration does not establish production authentication security or interoperability with an existing Kerberos installation.

Earlier public repositories, Kerberos and KerberosAndDistribution, are retained as related implementations. Their relationship here is a shared subject and code structure, not a claim that they are interchangeable releases.

## Sources

[README](https://github.com/Silver-VS/Kerberos-Echo/blob/main/README.md), [architecture](https://github.com/Silver-VS/Kerberos-Echo/blob/main/docs/architecture.md), [protocol](https://github.com/Silver-VS/Kerberos-Echo/blob/main/docs/protocol.md), and [Maven configuration](https://github.com/Silver-VS/Kerberos-Echo/blob/main/pom.xml). This case file is based on source inspection, not a fresh execution of the demo.

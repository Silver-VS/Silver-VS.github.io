## Context

FirmaDigitalWeb is a Java web application packaged as a WAR. Its source separates the signing helper from the servlet controllers and JSP pages.

## Implementation

`SignDocument` accepts a String, a File, or a byte array. Strings are converted to UTF-8 bytes, files are read as bytes, and the core method initializes a Java `Signature` with a private key before producing the signature.

The signing implementation selects `MD5WithRSA`. The Maven configuration targets Java 8 and the `javax.servlet` 4.0.1 API. These are the actual historical choices in the repository; this entry does not substitute a newer stack or claim a modern production-security design.

## Scope and limits

This is retained as a learning implementation. The public code was inspected, but deployment and end-to-end verification were not executed during cataloging. Signing-key contents are not reproduced on this site.

## Sources

[Signing helper](https://github.com/Silver-VS/FirmaDigitalWeb/blob/master/src/main/java/swya/firmas/controlador/SignDocument.java), [signing servlet](https://github.com/Silver-VS/FirmaDigitalWeb/blob/master/src/main/java/swya/firmas/controlador/Firmar.java), [verification controller](https://github.com/Silver-VS/FirmaDigitalWeb/blob/master/src/main/java/swya/firmas/controlador/Comprobar.java), and [WAR configuration](https://github.com/Silver-VS/FirmaDigitalWeb/blob/master/pom.xml).

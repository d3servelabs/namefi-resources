---
title: Clave Pública
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: La mitad compartible del par de claves blockchain, derivada de la clave privada; se usa para recibir fondos y verificar firmas.
keywords: ['clave pública', 'dirección', 'clave de verificación', 'criptografía asimétrica', 'cuenta blockchain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
---

Una **clave pública** es la mitad compartible del par de claves criptográficas de una cuenta blockchain. Ella — o la dirección derivada de ella — puede publicarse abiertamente: es donde otros envían tokens o llaman a contratos inteligentes en tu nombre. La clave pública se deriva de la [clave privada](/es/glossary/private-key/) mediante matemáticas de curva elíptica de sentido único, de modo que compartirla nunca expone el secreto que autoriza las transacciones. Verificar una firma digital con la clave pública prueba que el mensaje fue firmado por quien posee la clave privada correspondiente, que es la forma en que la red confirma que una transacción está genuinamente autorizada.

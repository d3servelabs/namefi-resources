---
title: Privacidad WHOIS
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Servicio que oculta los datos de contacto personales del registrante en los registros públicos WHOIS o RDAP.
keywords: ['privacidad WHOIS', 'protección de privacidad', 'RDAP', 'privacidad del registrante', 'enmascaramiento de contacto']
also_known_as: ['Protección de privacidad']
level: 1
sources:
  - https://www.icann.org/rdap
---

La **privacidad WHOIS** (también llamada *protección de privacidad*) es un servicio ofrecido por la mayoría de los [registradores](/es/glossary/registrar/) que sustituye un contacto proxy — generalmente la propia dirección del registrador y un correo electrónico de reenvío — por el nombre real, la dirección postal, el teléfono y el correo electrónico del [registrante](/es/glossary/registrant/) en los registros públicos de [WHOIS](/es/glossary/whois/) y RDAP. Sin ella, esos datos son consultables abiertamente, convirtiéndose los propietarios en objetivos de spam, intentos de ingeniería social y phishing dirigido destinado a comprometer las credenciales del registrador. La aplicación del RGPD desde 2018 ha llevado a muchos registros a anonimizar los datos personales por defecto en el WHOIS de los gTLD, pero la protección varía según el TLD y el registrador, por lo que activar explícitamente un servicio de privacidad sigue siendo una buena práctica. Es importante entender lo que la protección de privacidad no hace: oculta los datos de contacto, pero no impide que un atacante técnicamente hábil utilice la enumeración DNS o los registros de transparencia de certificados para mapear la infraestructura de un dominio.

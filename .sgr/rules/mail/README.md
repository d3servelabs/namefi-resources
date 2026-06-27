# Mail

This folder contains ast-grep rules for React Email and transactional-mail safety
checks. The YAML rules enforce conventions around preview props, recipient handling,
generated links, and external-link rewrites.

## File Relationships

- YAML files are ast-grep rule definitions grouped by the code area they protect.
- Update `.sgr/README.md` or this folder README when adding a new rule family.

## Structure

```text
.sgr/rules/mail/
|-- README.md
|-- no-defaultTo-pattern.yml
|-- no-defaultTo-usage.yml
|-- no-hardcoded-namefi-urls.yml
|-- previewprops-after-component.yml
|-- require-buildTemplate-hoc.yml
|-- require-poweredByNamefiDomain-hook.yml
|-- require-poweredByNamefiDomain-prop.yml
|-- require-preview-props.yml
|-- require-recipient-props.yml
|-- require-rehype-external-links.yml
```

## Maintenance

Update this README when rules are added, removed, or regrouped.

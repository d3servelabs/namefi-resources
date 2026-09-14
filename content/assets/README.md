# Shared content images

Images referenced by locale content files, including OpenGraph covers and inline illustrations. Locale articles reuse the same underlying assets.

```text
assets/
  <slug>-og.jpg       Social cover, referenced by ogImage
  <slug>-NN.jpg       Ordered inline illustration
  <existing-assets>  Other content images and brand assets
```

The search-opportunity set uses prefixes `how-to-transfer-a-domain-to-a-buyer`, `brandable-domain-name-examples`, and `keyword-domains-seo-exact-match`. Covers are 1200 × 630 pixels; inline images are 1200 × 675 pixels. Generation uses the repository's gpt-image-2 house-style harness, with the official Namefi logotype composited afterward. Temporary prompts and API responses are not committed.

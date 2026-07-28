# External adapter browser spike

This workspace compares candidate Design System foundations under the same two
business pilots and browser checks. It is intentionally isolated from Meridian's
runtime packages: none of these dependencies becomes canonical merely by being
installed here.

Pinned candidates:

- shadcn CLI/source snapshot `4.8.3`, materialized unchanged and compiled as
  new-york-v4 TSX with Tailwind v4
- `radix-ui@1.6.7`
- `react-aria-components@1.19.0`
- `@mui/material@9.2.0` with `@mui/x-data-grid@9.10.1`
- `@carbon/react@1.112.0` with `@carbon/styles@1.111.0`

The runner uses an installed Chrome executable and does not infer accessibility
conformance from library documentation. It records only the checks it actually
performs, including keyboard-only business journeys, focus-style deltas,
accessibility-tree inventory, 24 CSS pixel target geometry, and responsive
fixtures. Human assistive-technology checks remain separate evidence.

The shadcn candidate is built from the captured registry file contents, whose
per-file digests are validated before materialization. Meridian's adapter owns
only the vendor-neutral business composition and theme-token boundary; it does
not rewrite the captured component modules.

Commands:

```sh
npm install
npm run build
npm run evaluate
```

Generated browser evidence is written to the repository-level path declared by
the evaluation plan. It is digest-bound to the runner, pilots, adapters, styles,
configuration, lockfile, screenshots, and current build closure. Installing or
evaluating a candidate does not select it; selection still requires a
decision-ready Research Gate and human approval.

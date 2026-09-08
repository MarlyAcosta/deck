# Working Brief: Update Recovery and Config Resilience

## Intent and authorization

Repair the update path so an older Deck binary can replace itself even when the active preferences contain newer optional fields, and provide an external recovery mode for installations that are already blocked. The user authorized implementation on a new branch and preparation of a PR. Merge, release publication, changes to `v0.4.0`, and changes to the user's installed binary or configuration are not authorized.

Base: `7b4dfc36159328a904f661bf3bcb9e193d47e14b`.
Branch: `codex/fix-update-recovery`.
Implementation worktree: `/tmp/opencode/deck-update-recovery`.

## Observed failure

Deck `0.3.0` rejects `adaptiveMemory.enabled` before its TUI updater stages or replaces the binary. The TUI eagerly calls `DeckConfigStore.readRequired()` even for a binary-only release. Main and `v0.4.0` recognize the field, but publishing a corrected binary cannot change the already-installed updater that fails before replacement.

The documented installer verifies the release archive checksum but currently copies directly over the executable, may edit a shell startup file, and verifies with unsupported `deck --version` behavior. It is therefore not yet an adequate recovery contract.

## Acceptance

1. A binary-only update MUST stage, verify, back up, replace, and verify the binary without requiring optional Deck configuration to parse.
2. Configuration-dependent content synchronization MUST continue to read and strictly validate the user's real configuration. Invalid configuration MUST fail that content operation rather than silently applying defaults.
3. The documented installer MUST expose an explicit recovery mode that is non-interactive, checksum-verified, rejects insecure operation and privilege escalation, does not edit shell startup files, refuses ambiguous symlink targets, and replaces the destination atomically on the destination filesystem with rollback if verification fails.
4. Installer verification MUST invoke the supported `deck version` command and fail when the installed candidate cannot report a valid Deck version.
5. Tests MUST first reproduce the eager-validation and unsafe installer contracts, then verify binary-only resilience, strict content behavior, atomic recovery/rollback, checksum and symlink boundaries, and no shell/config mutation.
6. A bounded opt-in check SHOULD exercise the recovery flow with a real previous-version binary using only temporary HOME/XDG/install paths and no user filesystem writes. Normal test gates MUST remain hermetic and network-free.
7. The original worktree, user configuration, installed binary, existing release/tag/assets, and historical OpenSpec artifacts MUST remain untouched.

## Decisions and boundaries

- Reuse `scripts/install.sh` rather than create a second downloader that could drift from release naming and checksum behavior.
- Keep configuration validation strict at the boundary where content synchronization consumes configuration; make it lazy elsewhere.
- Stage replacements beside the destination so rename semantics remain atomic on one filesystem.
- Recovery mode will not follow or replace symlinked destinations and will not invoke `sudo`.
- Do not relax unknown-field validation globally, add schema negotiation, alter release assets, or run the live updater.

## Verification and risk

The installer is a public, effectful security boundary. Focused contract tests, TypeScript, affected updater tests, hermetic shell integration tests, a temporary previous-version exercise, and independent quality review are required before PR preparation. Any real-version fixture or artifact download must be retained outside tracked source and checksum-verified; tests must not depend on live network availability.

## Progress

- Root cause and current installer risks traced against source and the `v0.3.0` tag.
- Isolated branch and worktree created from `origin/main`.
- TUI upgrade composition now passes a lazy strict config reader, and runner backup target collection is skipped entirely when the descriptor has no content items. Binary-only updates therefore do not parse optional configuration; content synchronization still does.
- The installer now supports `--version` and `--recovery`, verifies checksums and the exact reported Deck version, refuses insecure recovery and ambiguous targets, does not edit shell startup files in recovery, and uses same-filesystem staged replacement with backup and atomic rollback.
- Test-first evidence is retained outside the repository under `/tmp/opencode/deck-update-recovery-evidence/`. Focused final checks passed with 43 tests and one opt-in skip. The full Bun 1.3.12 suite passed with 4,849 tests, two explicit skips, and zero failures across 312 files; TypeScript, shell syntax, and diff whitespace checks also passed.
- The opt-in recovery check passed using a locally retained real Deck 0.3.0 binary and only temporary HOME/XDG/install paths.
- Quality override used: the installer transaction and hermetic security regressions exceed the advisory code-size signal because atomic replacement, rollback, checksum, path, symlink, privilege, version, and shell-mutation boundaries require explicit coverage.
- Repeated independent adversarial review reproduced and then closed lock ownership, concurrent installer, interruption, cleanup-error, symlink/directory race, backup mutation, transport, portability-fixture, and missing-directory defects. Final verdict is GO WITH FOLLOW-UPS with zero Critical or Required findings.
- Non-blocking limits: native macOS execution has not been performed, and installer version parsing remains intentionally narrower than full SemVer. These do not weaken checksum, exact-version, atomic replacement, or rollback guarantees for supported release versions.
- The candidate is ready for authorized commit and PR preparation only. No user installation/configuration or existing release artifact has been changed.

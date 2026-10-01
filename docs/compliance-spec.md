# BIPA-Compliant Consent Gate Specification

## Hard gate

- Camera access APIs MUST remain unreachable until affirmative clickwrap consent is stored.
- Consent is affirmative only when the user selects **Enable camera**, then the action is recorded with actor, UTC timestamp, UUID, and policy version.
- Loading, prewarming, or enumerating camera devices before consent is prohibited.

## Consent record

- Store the record locally in browser storage selected by the application.
- Every record uses `packages/compliance/src/ClickwrapConsent.ts` as the sole creation path.
- Camera initialization verifies the current policy version and rejects if consent is absent.
- Withdrawal clears the record and MUST stop and release every `MediaStreamTrack`.

## Modal requirements

- Present purpose, biometric data types, local-only processing, zero network transmission, retention period, BIPA rights, and contact route before the consent control.
- Keep **Enable camera** and **Do not enable** as distinct controls; no preselection, timeout, or implied consent.
- Preserve accessibility: keyboard focus, screen-reader labels, and a visible disabled state before the explicit action.

## Edge-only processing

- Perception executes only in the browser through an approved local runtime listed in `packages/perception/src/index.ts`.
- Raw frames and landmark tensors remain in volatile JavaScript/linear memory and are zeroed after each use.
- Server APIs, remote model downloads, telemetry, analytics, crash reporting, and third-party network calls are prohibited in perception paths.
- Model artifacts must be integrity-verified, locally bundled or cached before camera activation, and loaded without runtime network access.

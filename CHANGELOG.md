# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.6.0...v1.6.1) (2026-10-13)


### Bug Fixes

* **build:** remediate Qodo review Emscripten generation findings ([a4d9d2b](https://github.com/bmifsud/POC-ARTRIOUT/commit/a4d9d2b9528b33234a6f7b91d74884b74fe3d3fd))
* **build:** remediate Qodo review Emscripten generation findings ([24ce4b5](https://github.com/bmifsud/POC-ARTRIOUT/commit/24ce4b591399b69225341d54c0c95551f71a0d4e))
* **build:** remove incompatible shebang and use local runner ([20e452e](https://github.com/bmifsud/POC-ARTRIOUT/commit/20e452e63f82ef668cfea9097e6185666d3097ab))
* **build:** resolve docker and CI build failures from missing emcc ([1ce98cf](https://github.com/bmifsud/POC-ARTRIOUT/commit/1ce98cf4c8aaa01e9b9512aa763893ee2d7cbaae))
* **build:** resolve WASM build script merge conflict for Render deployment ([1f5ff9d](https://github.com/bmifsud/POC-ARTRIOUT/commit/1f5ff9d3f896cbe7ae9873520b9e7b7ad388f362))
* **ci:** remove vulnerable issues trigger from close-low-priority-issues workflow ([b76d84a](https://github.com/bmifsud/POC-ARTRIOUT/commit/b76d84ac2a9a6778b3fba6a944c2bc695a263dab))
* **ci:** replace gh pr list with paginated graphql in autorebase ([74899fb](https://github.com/bmifsud/POC-ARTRIOUT/commit/74899fba6e1b8a2ee00f2cac030faa1fd137a94d))
* **ci:** resolve Qodo review defects on WASM compilation script ([6a904ed](https://github.com/bmifsud/POC-ARTRIOUT/commit/6a904edfa0191ad41dbb56a5dd7b0a79f0ec2932))
* **ci:** resolve Qodo review defects on WASM compilation script ([5f84f77](https://github.com/bmifsud/POC-ARTRIOUT/commit/5f84f77606364d23a19fe36bbf81995e69799166))
* **ci:** resolve Qodo review defects on WASM compilation script ([04d6561](https://github.com/bmifsud/POC-ARTRIOUT/commit/04d65618115d8c9f2bfdbfb22124d8b066a79729))
* **ci:** resolve wasm build script failure and missing emscripten artifact ([c2147b1](https://github.com/bmifsud/POC-ARTRIOUT/commit/c2147b1f77b1c7fae48681290ca035d47adb93b9))
* **ci:** skip release branches in autorebase open pr loop ([5f40144](https://github.com/bmifsud/POC-ARTRIOUT/commit/5f40144ad0a074d70bf23dbdd4ffe3e5f0c036ef))
* **ci:** strictly enforce Emscripten CI mock fallback and valid WASM generation ([148dba8](https://github.com/bmifsud/POC-ARTRIOUT/commit/148dba88265189fee6f6e5034d9b974d32d55629))
* **ci:** update Qodo defect fixer to ignore placeholder comments and trigger on edits ([7a1dd24](https://github.com/bmifsud/POC-ARTRIOUT/commit/7a1dd2460dbc9b3b70cdbfa2334464e0f17a7c11))
* **compliance:** replace insecure ID generation with CSPRNG for BIPA consent records ([4d9748a](https://github.com/bmifsud/POC-ARTRIOUT/commit/4d9748a5f2cd1b3b13aeac5049badf9184a39d36))
* **deploy:** set NODE_ENV before building to enable production fallbacks ([b29d7ba](https://github.com/bmifsud/POC-ARTRIOUT/commit/b29d7ba12ef27b10fb3e7feae0605490bb45adb0))
* **docker:** update entrypoint CMD to node scripts/serve.js ([3121ffd](https://github.com/bmifsud/POC-ARTRIOUT/commit/3121ffde62ff09e03a737af9b150f1d8dc3ac6cd))
* resolve branch deletion failure for fork PRs in cleanup script ([6181755](https://github.com/bmifsud/POC-ARTRIOUT/commit/6181755b2bf94e87e28b4f312507c1cc4c462f8f))

## [1.6.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.5.0...v1.6.0) (2026-10-12)


### Features

* **ci:** configure workflow to scan and resolve all issues ([7144dc0](https://github.com/bmifsud/POC-ARTRIOUT/commit/7144dc02c82234054e136054137ef62849fb68ab))
* **ci:** configure workflow to scan and resolve all issues ([f1eca2c](https://github.com/bmifsud/POC-ARTRIOUT/commit/f1eca2cbddceecb80978261168ef6249428db55e))

## [1.5.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.4.2...v1.5.0) (2026-10-12)


### Features

* **ci:** add automated Qodo defect fixer workflow ([42ba7a6](https://github.com/bmifsud/POC-ARTRIOUT/commit/42ba7a6dcb64fa086537791197590e146c05609c))


### Bug Fixes

* **ci:** resolve Qodo Code Review issues in conflict workflows ([2ccbfac](https://github.com/bmifsud/POC-ARTRIOUT/commit/2ccbfacdc757c76eafc4c5a23bdd9940a054d873))

## [1.4.2](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.4.1...v1.4.2) (2026-10-12)


### Bug Fixes

* **security:** remediate code scanning alerts and path traversal vulnerability ([f8bb10e](https://github.com/bmifsud/POC-ARTRIOUT/commit/f8bb10e7d7f73899a720678465431ccbe48dc9e8))

## [1.4.1](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.4.0...v1.4.1) (2026-10-12)


### Bug Fixes

* **ci:** improve autorebase workflow branch parsing and workspace isolation ([9c41671](https://github.com/bmifsud/POC-ARTRIOUT/commit/9c416713c7ff778883d953ffe2efa7115ae6b17f))
* **ci:** update workflow configuration to recognize conflict labels and trigger conflict resolution ([d64c62f](https://github.com/bmifsud/POC-ARTRIOUT/commit/d64c62f7ec2a77436278a0351b85d45c339d60f1))
* **ci:** update workflow configuration to recognize conflict labels and trigger conflict resolution ([dcdb807](https://github.com/bmifsud/POC-ARTRIOUT/commit/dcdb807409b11bcc17855a8e6df6495001150d0f))
* **compliance:** resolve camera startup, consent handling, and customization defects ([0656167](https://github.com/bmifsud/POC-ARTRIOUT/commit/06561670cf0d2506874647c01bb60ef91ea3e610))
* **deploy:** update Dockerfile startup command to node scripts/serve.js ([5f67fdf](https://github.com/bmifsud/POC-ARTRIOUT/commit/5f67fdfe2d4e1e4e6f87d42659e2e1632e55d006))
* **deploy:** update server entrypoint in Dockerfile and package.json ([6f603f0](https://github.com/bmifsud/POC-ARTRIOUT/commit/6f603f06b8f969f6955ba9699736105ffd096e14))
* **deploy:** update start command and Dockerfile to run scripts/serve.js ([1d460a8](https://github.com/bmifsud/POC-ARTRIOUT/commit/1d460a841014ef682569cbb4349ed0a3d7b8f003))

## [1.4.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.3.0...v1.4.0) (2026-10-12)


### Features

* **ci:** add automated merge conflict detection and resolution workflows ([8b140b3](https://github.com/bmifsud/POC-ARTRIOUT/commit/8b140b34b675927e34f840c3c63685f984c0dddd))

## [1.3.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.2.1...v1.3.0) (2026-10-11)


### Features

* **hosting:** generate universal static landing page and edge build ([27e4aba](https://github.com/bmifsud/POC-ARTRIOUT/commit/27e4aba778aa28114227ae4f71db33baff7157f7))
* **hosting:** generate universal static landing page and edge build ([87325d2](https://github.com/bmifsud/POC-ARTRIOUT/commit/87325d248cd582b7486bd5ddf0e45255e2a8da5e))
* **hosting:** generate universal static landing page and edge build ([8ff5004](https://github.com/bmifsud/POC-ARTRIOUT/commit/8ff50040c5b86e92a4724bfa722e6ddc6eedcb06))
* **hosting:** generate universal static landing page and edge build ([44907e2](https://github.com/bmifsud/POC-ARTRIOUT/commit/44907e2793a0fcc230623652c3f61624e152a778))
* **hosting:** generate universal static landing page and edge build ([c137b4a](https://github.com/bmifsud/POC-ARTRIOUT/commit/c137b4a616f244617658dab394e1ad761fb133d7))
* **hosting:** generate universal static landing page and edge build ([dd9eca7](https://github.com/bmifsud/POC-ARTRIOUT/commit/dd9eca7ca347736ced6353fd93bbda316d77a4a7))
* **hosting:** generate universal static landing page and edge build ([7fdab40](https://github.com/bmifsud/POC-ARTRIOUT/commit/7fdab402815776822573efcad22cd1f95729bcc4))
* **hosting:** generate universal static landing page and edge build ([f660675](https://github.com/bmifsud/POC-ARTRIOUT/commit/f660675799a8cb90b907a985773c7fd395193ab1))
* **storefront-widget:** add Nail Lab AR Proof of Concept frontend widget ([fe47dd5](https://github.com/bmifsud/POC-ARTRIOUT/commit/fe47dd56d140203ef7ef08b980be68b86ed0e492))


### Bug Fixes

* **static-landing:** serve bundled widget entry in static path ([5f74ebb](https://github.com/bmifsud/POC-ARTRIOUT/commit/5f74ebb19cfabe18c383cbda09ca957664b903ef))
* **static-landing:** serve bundled widget entry in static path ([3da7c5f](https://github.com/bmifsud/POC-ARTRIOUT/commit/3da7c5fff8f7f1823911f61afa1e32e0b6dd9266))
* **static-landing:** serve bundled widget entry in static path ([cd9e0fe](https://github.com/bmifsud/POC-ARTRIOUT/commit/cd9e0fe779833515ba027d3dc7df0ad73c8e9418))
* **static-landing:** serve bundled widget entry in static path ([ca95106](https://github.com/bmifsud/POC-ARTRIOUT/commit/ca95106e39dc750c755c5d87e4a8de85c1a9560f))

## [1.2.1](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.2.0...v1.2.1) (2026-10-09)


### Bug Fixes

* **ci:** pin jules action tag to v1.0.0 ([815dddb](https://github.com/bmifsud/POC-ARTRIOUT/commit/815dddbae48c4c5cce57a82146cee5c7de2b18ff))
* **ci:** update jules github action repository reference ([6ed8dbe](https://github.com/bmifsud/POC-ARTRIOUT/commit/6ed8dbe19e78baff38fb85e357907b13763576f4))

## [1.2.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.1.0...v1.2.0) (2026-10-09)
## [1.4.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.3.0...v1.4.0) (2026-10-12)


### Features

* **ci:** add automated merge conflict detection and resolution workflows ([8b140b3](https://github.com/bmifsud/POC-ARTRIOUT/commit/8b140b34b675927e34f840c3c63685f984c0dddd))

## [1.3.0](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.2.1...v1.3.0) (2026-10-11)


### Features

* **hosting:** generate universal static landing page and edge build ([27e4aba](https://github.com/bmifsud/POC-ARTRIOUT/commit/27e4aba778aa28114227ae4f71db33baff7157f7))
* **storefront-widget:** add Nail Lab AR Proof of Concept frontend widget ([fe47dd5](https://github.com/bmifsud/POC-ARTRIOUT/commit/fe47dd56d140203ef7ef08b980be68b86ed0e492))

## [1.2.1](https://github.com/bmifsud/POC-ARTRIOUT/compare/v1.2.0...v1.2.1) (2026-10-09)

## 1.0.0 (2026-10-06)

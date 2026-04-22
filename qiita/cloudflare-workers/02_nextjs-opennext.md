---
title: "Next.js 14 の OpsKitPro を OpenNext で Cloudflare Workers に載せる"
tags:
  - Next.js
  - OpenNext
  - CloudflareWorkers
  - ビルド
  - 運用
published: false
---

# Next.js 14 の OpsKitPro を OpenNext で Cloudflare Workers に載せる

OpsKitPro は Next.js 14 で書いていますが、そのままでは Cloudflare Workers で動きません。  
そこで OpenNext を使って、Next.js のビルド成果物を Workers 向けに変換しています。

## 何をしているのか

現在の `package.json` では、配信に `opennextjs-cloudflare build && opennextjs-cloudflare deploy` を使っています。  
つまり、開発時は Next.js、配信時は OpenNext 経由で Workers に載せる構成です。

この方式の良いところは、Next.js の開発体験を保ちながら、Cloudflare 向けの配信を成立させられることです。

## `output: 'standalone'` を使う理由

`next.config.mjs` では `output: 'standalone'` を指定しています。  
これは OpenNext 側で変換しやすくするための前提として、かなり大事です。

また、画像は `images.unoptimized = true` にしています。  
診断系サイトでは、画像最適化に強く依存しすぎるより、静的資産を素直に扱うほうが安定しやすいと感じました。

## ビルド時に意識したこと

### 1. 実装を複雑にしすぎない
Workers に載せる都合で、Node 依存の強い処理はなるべく減らしています。

### 2. 静的と動的の境界をはっきりさせる
ブログや favicon、OGP は静的資産として扱い、診断 API は別の責務として分離しています。

### 3. ビルドで壊れたらすぐ分かるようにする
テストと build を通してから deploy する流れを固定しています。

## どういう時に効くのか

この構成は、以下のようなサイトで特に効きます。

- そこまで巨大ではない
- でも API と UI はどちらも必要
- そして Edge に寄せたい

OpsKitPro はまさにその範囲にありました。

## まとめ

OpenNext は、Next.js を Cloudflare Workers に持っていくための橋渡しです。  
OpsKitPro では、この橋渡しがあったことで、開発と配信の距離をかなり縮められました。

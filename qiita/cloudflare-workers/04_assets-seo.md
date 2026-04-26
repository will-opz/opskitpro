---
title: "Cloudflare Workers 上のサイトで静的資産と SEO をどう扱うか"
tags:
  - SEO
  - OGP
  - favicon
  - Next.js
  - CloudflareWorkers
published: false
---

# Cloudflare Workers 上のサイトで静的資産と SEO をどう扱うか

OpsKitPro では、ブログの cover image、favicon、OGP、apple touch icon などの静的資産をかなり意識して整理しています。  
診断ツールのサイトではありますが、見た目と検索面の土台も重要です。

## 静的資産で気をつけたこと

### 1. favicon と icon を分けて管理する
ブラウザタブ、ショートカット、ホーム画面で見えるものは少しずつ違うので、資産の役割を分けています。

### 2. blog cover を用意する
記事一覧がただのテキストだと弱く見えるので、各記事に cover image を付けています。

### 3. OGP を統一する
メタデータの `openGraph.images` を揃えて、共有時の見え方を安定させています。

## SEO で見ているポイント

OpsKitPro のようなサイトでは、SEO は「検索流入のため」だけではありません。  
たとえば次のような役割があります。

- 何のサイトかを明確にする
- 多言語の入口を整理する
- ブログや知識ベースの関係を分かりやすくする

そのため、`canonical` と `alternates` をきちんと持たせるようにしました。

## Workers で静的資産を扱う時の感覚

Cloudflare Workers は軽い一方で、静的資産の整理を雑にするとすぐ見た目が崩れます。  
なので、`public/` に置くもの、メタデータで参照するもの、知識ベースに逃がすものを、あらかじめ分けています。

## まとめ

静的資産と SEO は、Workers 上の小さなサイトほど効いてきます。  
OpsKitPro では、見た目の統一感と検索時の見え方を同時に整えることを意識しました。

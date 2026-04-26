---
title: "OpsKitPro を Cloudflare Workers に載せるまでの全体像"
tags:
  - OpsKitPro
  - CloudflareWorkers
  - Next.js
  - Edge
  - 運用
published: false
---

# OpsKitPro を Cloudflare Workers に載せるまでの全体像

このシリーズでは、OpsKitPro を `opskitpro.com` として Cloudflare Workers 上で動かすまでの流れを、いくつかの観点に分けて整理します。

単に「デプロイできました」で終わるのではなく、なぜその構成にしたのか、どこでつまずきやすいのか、何を軽くしておくべきか、という話まで残しておきたいと思います。

## このシリーズで扱うこと

- Cloudflare Workers を選んだ理由
- Next.js 14 と OpenNext の接続方法
- 多言語ルーティングと canonical URL の整理
- 静的資産、OGP、favicon の扱い
- 実運用でのデプロイと確認ポイント

## 前提になっている構成

OpsKitPro は、運用や排障でよく使う確認作業をまとめたツール集です。  
そのため、実装面では次のような前提があります。

- サイトは軽く保ちたい
- 海外や日本からの体感を安定させたい
- 多言語を扱いたい
- 記事や長文は知識ベースに逃がしたい

Cloudflare Workers は、この条件とかなり相性が良かったです。

## どんな順番で読むとよいか

1. まず全体像
2. Next.js と OpenNext の接続
3. middleware による locale routing
4. 静的資産と SEO
5. デプロイ運用

この順番で読むと、OpsKitPro の構成がそのまま追いやすくなると思います。

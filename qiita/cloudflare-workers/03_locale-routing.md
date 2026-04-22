---
title: "多言語サイトの locale routing を middleware で整理する"
tags:
  - Next.js
  - Middleware
  - i18n
  - Cloudflare
  - OpsKitPro
published: false
---

# 多言語サイトの locale routing を middleware で整理する

OpsKitPro は日本語・英語・簡体字・繁体字の 4 言語で動いています。  
この多言語対応を支えているのが、`middleware.ts` での locale routing です。

## 何をしているか

middleware では主に次のことをしています。

- `cf-ipcountry` から初期言語を推定する
- `NEXT_LOCALE` cookie を保存する
- `/zh` や `/en` のような prefix を内部 rewrite する
- downstream の layout に locale を伝える

## なぜ middleware でやるのか

多言語処理をページごとに散らすと、挙動がばらつきやすくなります。  
そこで、最初の入口で言語を決めてしまうと、後段の実装がかなり楽になります。

### 1. 言語の判断が一箇所に集まる
どの言語で見せるかを middleware 側で決めるので、ページごとに判定を書く必要がありません。

### 2. URL と内部ルーティングを分けられる
ユーザーには `/ja/tools/ip-lookup` のように見せつつ、内部では `/tools/ip-lookup` として扱えます。

### 3. cookie で次回の表示を安定させられる
前回の選択を覚えておけるので、毎回言語が揺れません。

## 実装で気をつけたこと

### 1. API や静的資産は巻き込まない
`/api` や `_next` は middleware の対象外にしています。  
これを外さないと、配信が壊れやすくなります。

### 2. canonical URL を組み立てやすくする
Layout 側で `x-pathname` を使えるようにして、メタデータ生成と合わせやすくしています。

### 3. 日本語だけを特別扱いしすぎない
日本向けに最適化しつつも、他言語の挙動が崩れないようにしています。

## まとめ

多言語サイトの難しさは、翻訳より routing にあります。  
OpsKitPro では middleware を入口に置くことで、言語の判断を一箇所へ集約できました。

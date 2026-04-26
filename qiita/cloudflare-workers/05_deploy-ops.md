---
title: "OpsKitPro のデプロイ運用。Cloudflare Workers への更新を安定させる"
tags:
  - デプロイ
  - CloudflareWorkers
  - OpsKitPro
  - CI
  - 運用
published: false
---

# OpsKitPro のデプロイ運用。Cloudflare Workers への更新を安定させる

OpsKitPro は、コードを書いて終わりではなく、テストと build を通してから配信するようにしています。  
ツール系のサイトは、小さな変更でも壊れるとすぐ分かるので、運用の安定性を優先しています。

## 基本の流れ

今の流れはかなりシンプルです。

1. 実装する
2. `npm test` を通す
3. `npm run build` を通す
4. `npm run deploy` で Cloudflare Workers に反映する

この順番を固定しておくと、何が壊れたかが追いやすくなります。

## 何を確認しているか

### 1. テスト
API 契約や UI の分岐が壊れていないかを見ます。

### 2. build
Next.js と OpenNext の変換が通るかを見ます。

### 3. 実際の配信
Worker に反映されたあと、ホーム、IP、DNS、website-check、about をざっと確認します。

## リリースで意識したこと

### 1. 1 回の変更を小さくする
大きな変更を一度に入れると、どこで壊れたか追いにくくなります。

### 2. 文章と実装を同期する
README、Qiita 草稿、知識ベース、実際の UI で、言葉がズレないようにしています。

### 3. 失敗時の戻し先を作る
ブログや文章は知識ベースに分離し、メインサイトを軽く保つことで、配信面のリスクを下げています。

## まとめ

Cloudflare Workers に載せたあとも、やることはシンプルです。  
テスト、build、deploy をきちんと回し、反映後の画面を確認する。  
それだけですが、その繰り返しが一番安定します。

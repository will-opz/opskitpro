---
title: "websocket を作った理由。接続後の操作を楽にしたかった"
tags:
  - OpsKitPro
  - websocket
  - 背景
  - 課題
published: true
published_at: "2026-05-13T09:02:09+09:00"
qiita_url: "https://qiita.com/opskitpro/items/0d87bbc8fac032af05b4"
qiita_id: "0d87bbc8fac032af05b4"
---

# websocket を作った理由。接続後の操作を楽にしたかった

WebSocket は便利ですが、接続したあとに何を送るか、どうログを見るかで少し面倒になります。
接続後のやり取りをその場で試せる環境がほしかった、というのが websocket ツールの出発点です。

## どこが面倒だったか

- 接続 URL を毎回手で入れる
- 送るメッセージをその都度書き直す
- ログを見ながら再送したい
- 複数接続を比較したい

WebSocket は一度つながると状態が残るので、接続後の操作のしやすさが大事です。
そこで websocket では、接続後の作業を短くすることを優先しました。

## このツールでやりたいこと

接続して終わりではなく、
送る・見る・比べる・再利用する、までをひとつにまとめること。
それが websocket の目的です。

次の記事では、そのためにどんな UI にしたかを整理します。

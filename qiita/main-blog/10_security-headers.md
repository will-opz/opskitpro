---
title: "Security Headers の確認ガイド：HSTS、CSP、X-Frame-Options は何を守るのか"
tags:
  - OpsKitPro
  - SecurityHeaders
  - WebSecurity
  - SRE
published: false
published_at: null
qiita_url: null
qiita_id: null
---

# Security Headers の確認ガイド：HSTS、CSP、X-Frame-Options は何を守るのか

Web サイトは、HTTP 200 が返っていて、SSL 証明書が有効で、DNS も正しく引けていれば「とりあえず動いている」と判断できます。

ただ、運用やセキュリティの視点では、それだけでは少し足りません。

ブラウザに対して「このサイトはどう扱われるべきか」を伝えるための HTTP レスポンスヘッダーがあります。これが Security Headers です。

OpsKitPro の `website-check` にも、DNS / HTTP / SSL / CDN に加えて Security Headers の確認を追加しました。

https://opskitpro.com/tools/website-check

この記事では、よく見る Security Headers が何を守っているのか、どう確認すればよいのかを整理します。

## Security Headers とは

Security Headers は、Web サーバーがレスポンスに付ける HTTP ヘッダーです。

たとえば、ブラウザに対して次のような指示を出します。

- HTTP ではなく HTTPS を使う
- 許可したスクリプトだけ実行する
- 外部サイトから iframe 埋め込みさせない
- MIME type を勝手に推測させない
- Referrer 情報を出しすぎない
- カメラや位置情報などのブラウザ機能を制限する

アプリケーションコードの脆弱性そのものを消すものではありません。
ただし、ブラウザ側の防御層としてかなり重要です。

## HSTS

正式名は `Strict-Transport-Security` です。

HSTS は、ブラウザに「次回以降、このドメインには HTTPS で接続してほしい」と伝えるためのヘッダーです。

例:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

これが有効だと、ユーザーが `http://example.com` にアクセスしても、ブラウザは HTTPS を優先します。

主に防ぎたいのは、HTTP へのダウングレードや中間者攻撃です。

注意点もあります。
HTTPS 設定が不安定な状態で `includeSubDomains` や `preload` を強く入れると、サブドメインも含めて戻しにくくなります。
まずは HTTPS が安定していることを確認してから有効化するのが安全です。

## Content-Security-Policy

`Content-Security-Policy`、略して CSP は、読み込めるスクリプト、画像、CSS、iframe などを制限するためのヘッダーです。

例:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';
```

CSP は XSS 対策の補助として有効です。
仮に HTML にスクリプトを差し込まれても、許可していない場所からのスクリプト実行を止められる可能性があります。

ただし、CSP はいきなり厳しくすると壊れやすいです。
外部 CDN、広告、計測タグ、埋め込み widget を使っている場合は、まず `Content-Security-Policy-Report-Only` で影響を見るのが現実的です。

## X-Frame-Options

`X-Frame-Options` は、ページを iframe で埋め込めるかどうかを制御します。

例:

```http
X-Frame-Options: DENY
```

または:

```http
X-Frame-Options: SAMEORIGIN
```

主にクリックジャッキング対策です。

管理画面、ログイン画面、決済画面など、他サイトに埋め込まれる必要がないページでは、基本的に `DENY` または `SAMEORIGIN` を設定しておくとよいです。

近年は CSP の `frame-ancestors` でも制御できますが、`X-Frame-Options` はまだ確認対象としてよく見ます。

## X-Content-Type-Options

よく使われる値は `nosniff` です。

```http
X-Content-Type-Options: nosniff
```

これは、ブラウザに MIME type を勝手に推測させないためのヘッダーです。

たとえば、サーバーが `text/plain` として返したものを、ブラウザが JavaScript として解釈してしまうような挙動を抑えます。

設定はシンプルですが、効果は地味に大きいです。

## Referrer-Policy

`Referrer-Policy` は、別ページへ移動するときに、どこから来たかという情報をどこまで送るかを制御します。

例:

```http
Referrer-Policy: strict-origin-when-cross-origin
```

何も設定していないと、URL に含まれるパスやクエリが外部サイトに渡りすぎることがあります。

おすすめは、多くのサイトでは `strict-origin-when-cross-origin` から始めることです。

## Permissions-Policy

`Permissions-Policy` は、ブラウザ機能の利用を制限するためのヘッダーです。

例:

```http
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

カメラ、マイク、位置情報、支払い API など、サイトで使わない機能を明示的に無効化できます。

必須ではありませんが、不要な機能を閉じておくという意味で、公開サイトでは確認しておきたい項目です。

## まず何から対応するとよいか

全部を一気に完璧にする必要はありません。

個人的には、次の順番で見るのが現実的です。

1. HTTPS が安定しているか確認する
2. HSTS を入れる
3. `X-Content-Type-Options: nosniff` を入れる
4. `X-Frame-Options` または CSP `frame-ancestors` を入れる
5. CSP を Report-Only から試す
6. Referrer-Policy を設定する
7. Permissions-Policy で不要な機能を閉じる

特に CSP は、既存サイトに後から入れると壊れることがあります。
ログを見ながら段階的に調整する方が安全です。

## OpsKitPro で確認する

OpsKitPro の `website-check` では、ドメインを入力すると次の項目をまとめて確認できます。

- DNS 解決
- HTTP ステータス
- SSL 証明書
- CDN 判定
- WHOIS / RDAP
- Security Headers

Security Headers では、HSTS、CSP、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy を確認し、簡単なスコアと不足項目を表示します。

https://opskitpro.com/tools/website-check

診断結果は Markdown と JSON でコピーできるので、チーム内のメモや障害調査ログにも貼りやすくしています。

## まとめ

Web サイトの診断では、DNS、HTTP、SSL だけでなく、ブラウザに渡す Security Headers も見ておくと安心です。

特に次の 4 つは、優先して確認する価値があります。

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options: nosniff`

サイトが「表示できる」ことと、「安全に扱われる」ことは少し違います。

Security Headers は、その差を埋めるための地味だけど重要な設定です。

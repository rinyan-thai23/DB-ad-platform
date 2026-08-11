import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'docs');
const dataFile = join(root, 'ad_network_database_2026-08-11.tsv');
const siteUrl = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const basePath = (process.env.BASE_PATH ?? '/DB-ad-platform').replace(/\/$/, '');
const generatedAt = '2026-08-11';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href = path => `${basePath}${path}` || '/';
const canonical = path => `${siteUrl}${basePath}${path}`;
const rows = parseTsv(await readFile(dataFile, 'utf8')).sort((a,b) => Number(a.recommendation_rank_jp_beginner)-Number(b.recommendation_rank_jp_beginner));

function parseTsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((value, i) => [headers[i], value])));
}

const categories = [
  { group:'初心者・サイト条件', slug:'beginner', title:'初心者向け', short:'0円から最初の収益を目指す', description:'ゼロから収益化を始めやすい、スコア4以上の広告サービス。', filter:r=>Number(r.zero_to_one_score_1_5)>=4 },
  { group:'初心者・サイト条件', slug:'no-minimum-traffic', title:'最低PVなし・非公開', short:'小規模サイトから検討', description:'公開された最低トラフィック条件がない、または固定閾値がないサービス。審査通過を保証するものではありません。', filter:r=>/なし|固定閾値なし/.test(r.minimum_traffic) },
  { group:'初心者・サイト条件', slug:'no-site-age', title:'サイト年齢要件なし', short:'新しいサイトから検討', description:'公開された最低サイト年齢の要件がないサービス。媒体審査は別途行われる場合があります。', filter:r=>r.minimum_site_age==='公開要件なし' },
  { group:'初心者・サイト条件', slug:'zero-setup-fee', title:'初期費用0円', short:'導入費をかけずに開始', description:'公開情報で初期費用0円または0と確認できる広告サービス。', filter:r=>/^(0|0円)$/.test(r.setup_fee) },
  { group:'初心者・サイト条件', slug:'non-exclusive', title:'独占契約なし', short:'他広告との併用候補', description:'契約上の独占が「なし」と記載されている広告サービス。個別の広告配置規約は確認してください。', filter:r=>/^なし(?:$|\/)/.test(r.contract_exclusivity) },
  { group:'初心者・サイト条件', slug:'japanese-ui', title:'日本語UI・サポート', short:'日本語で管理しやすい', description:'管理画面またはサポートの日本語対応があるサービス。', filter:r=>/^あり/.test(r.japanese_ui_support) },
  { group:'サイト・ホスティング', slug:'free-subdomain', title:'無料サブドメイン候補', short:'Blogspotや静的ホストを比較', description:'いずれかの無料URLで公式OK・条件付き・技術推定OKとなるサービス。', filter:r=>['blogspot_free_url','wordpress_com_free_url','github_pages_free_url','vercel_free_subdomain','cloudflare_pages_free_subdomain'].some(k=>['公式OK','条件付き','技術推定OK'].includes(r[k])) },
  { group:'サイト・ホスティング', slug:'github-pages', title:'GitHub Pages候補', short:'github.ioで試せる可能性', description:'GitHub Pages無料URLで技術的に設置可能、または条件付きで審査対象となる候補。', filter:r=>['公式OK','条件付き','技術推定OK'].includes(r.github_pages_free_url) },
  { group:'サイト・ホスティング', slug:'blogspot', title:'Blogspot候補', short:'無料ブログから収益化', description:'Blogspot無料URLで公式OK、条件付き、または技術推定OKのサービス。', filter:r=>['公式OK','条件付き','技術推定OK'].includes(r.blogspot_free_url) },
  { group:'サイト・ホスティング', slug:'wordpress-com', title:'WordPress.com候補', short:'無料WordPressを比較', description:'WordPress.com無料URLで公式OK、条件付き、または技術推定OKのサービス。広告コード設置可否も確認してください。', filter:r=>['公式OK','条件付き','技術推定OK'].includes(r.wordpress_com_free_url) },
  { group:'サイト・ホスティング', slug:'vercel', title:'Vercel候補', short:'vercel.appでの技術適合', description:'Vercel無料サブドメインで公式OK、条件付き、または技術推定OKのサービス。', filter:r=>['公式OK','条件付き','技術推定OK'].includes(r.vercel_free_subdomain) },
  { group:'サイト・ホスティング', slug:'cloudflare-pages', title:'Cloudflare Pages候補', short:'pages.devでの技術適合', description:'Cloudflare Pages無料サブドメインで公式OK、条件付き、または技術推定OKのサービス。', filter:r=>['公式OK','条件付き','技術推定OK'].includes(r.cloudflare_pages_free_subdomain) },
  { group:'サイト・ホスティング', slug:'static-sites', title:'静的サイト対応候補', short:'HTML・JavaScriptで導入', description:'静的HTMLサイトへ技術的に導入できると判断した広告サービス。媒体承認は別途必要です。', filter:r=>/技術推定OK|技術的OK|広告タグを置ければ/.test(r.static_site_technical_fit) },
  { group:'支払い方法', slug:'japan-bank', title:'日本の銀行だけで完結', short:'外部ウォレットを経由しない', description:'日本の銀行口座への支払いを公式情報で確認できたサービス。', filter:r=>r.japan_bank_only_complete==='Yes' },
  { group:'支払い方法', slug:'paypal', title:'PayPal対応', short:'PayPalで広告収益を受取', description:'Publisherへの支払い方法としてPayPal対応を確認できた広告サービス。地域やアカウント条件を確認してください。', filter:r=>/^Yes/.test(r.paypal) },
  { group:'支払い方法', slug:'payoneer', title:'Payoneer対応', short:'国境を越えた受取手段', description:'Publisherへの支払い方法としてPayoneer対応を確認できた広告サービス。', filter:r=>/^Yes/.test(r.payoneer) },
  { group:'支払い方法', slug:'wise-revolut', title:'Wise・Revolut対応', short:'海外送金サービスを利用', description:'Wise、Revolut、Payseraの対応を明示的に確認できた広告サービス。', filter:r=>/Wise Yes|Revolut Yes|Revolutあり|Wise\/Revolut\/Paysera Yes/.test(r.wise_revolut) },
  { group:'支払い方法', slug:'stripe', title:'Stripe対応', short:'StripeでPublisher支払', description:'Publisherへの支払いレールとしてStripe対応を確認できた広告サービス。', filter:r=>/^Yes/.test(r.stripe_payout) },
  { group:'支払い方法', slug:'crypto', title:'暗号資産払い対応', short:'暗号資産ウォレットで受取', description:'Publisher報酬の暗号資産払いに対応すると確認できた広告サービス。', filter:r=>/^Yes/.test(r.crypto) },
  { group:'支払い方法', slug:'international-wire', title:'国際銀行送金対応', short:'Wire・SWIFTで海外から受取', description:'International Wire、Bank Wire、SWIFTなど国境を越える銀行送金に対応するサービス。手数料と最低額に注意してください。', filter:r=>/Wire|SWIFT/i.test(r.bank_method) },
  { group:'支払い方法', slug:'local-bank-transfer', title:'Local Bank Transfer対応', short:'現地銀行向け送金', description:'Local Bank Transferまたは国内銀行振込に対応する広告サービス。利用国と通貨条件を確認してください。', filter:r=>/Local [Bb]ank|国内銀行|日本国内銀行/.test(r.bank_method) },
  { group:'支払い方法', slug:'low-payout', title:'低い支払基準', short:'初回出金までを短く', description:'全体の最低支払額が円建て8,000円以下、または外貨100以下と読み取れるサービス。支払方法により条件が変わります。', filter:r=>/500円|3,000円|5,000円|8,000円|\$1\b|\$5\b|\$20\b|\$25\b|\$50\b|\$100\b|20 EUR/.test(r.minimum_payout_overall) },
  { group:'広告形式・運用', slug:'banner-ads', title:'バナー広告対応', short:'標準的なディスプレイ枠', description:'バナー広告形式を明示している広告サービス。', filter:r=>/Banner|バナー/i.test(r.ad_formats) },
  { group:'広告形式・運用', slug:'native-ads', title:'ネイティブ広告', short:'コンテンツになじむ形式', description:'Native、In-text、レコメンド型広告を扱うサービス。', filter:r=>/Native|ネイティブ|InText|In-text|レコメンド/i.test(`${r.platform_type} ${r.ad_formats}`) },
  { group:'広告形式・運用', slug:'video-ads', title:'動画広告対応', short:'Video広告を掲載', description:'動画またはVideo広告形式を明示している広告サービス。', filter:r=>/Video|動画/i.test(r.ad_formats) },
  { group:'広告形式・運用', slug:'pop-push-ads', title:'Pop・Push広告対応', short:'高い収益性と強いUX', description:'Popunder、Onclick、Pushなど侵襲性が比較的高い広告形式を扱うサービス。', filter:r=>/Pop|Push|Onclick/i.test(r.ad_formats) },
  { group:'広告形式・運用', slug:'programmatic', title:'Programmatic・Header Bidding', short:'運用型広告で収益最適化', description:'Programmatic、Header Bidding、SSP、RTBを扱う広告サービス。', filter:r=>/Programmatic|Header|SSP|RTB/i.test(`${r.platform_type} ${r.header_bidding_or_programmatic}`) },
  { group:'広告形式・運用', slug:'adult-supported', title:'成人向けカテゴリ対応', short:'成人向け媒体を正式対応', description:'成人向けカテゴリを正式に扱うと確認できた広告サービス。個別規約を必ず確認してください。', filter:r=>/成人向けカテゴリを正式に扱う/.test(r.adult_policy) },
  { group:'広告形式・運用', slug:'brand-safe', title:'ブランドセーフ重視', short:'品質・安全性を重視', description:'ブランドセーフまたはブランドセーフティ審査を明示する広告サービス。', filter:r=>/ブランドセーフ/.test(r.adult_policy) },
  { group:'市場・成長段階', slug:'domestic', title:'国内サービス', short:'日本語対応を重視', description:'日本企業が運営する国内向け広告ネットワーク・SSP。', filter:r=>r.home_region.includes('日本') },
  { group:'市場・成長段階', slug:'growth', title:'成長後の乗り換え先', short:'1万PV以上・運用型', description:'一定の規模や収益実績を求めるManaged Programmatic・成長メディア向けサービス。', filter:r=>/Growth|Enterprise/.test(r.beginner_tier) }
].filter(category => rows.some(category.filter));

function layout({title, description, path='/', body, schema='', robots='index,follow'}) {
  return `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonical(path))}"><link rel="stylesheet" href="${href('/assets/styles.css')}">
<meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical(path))}">
${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
</head><body><a class="skip" href="#main">本文へ移動</a>
<header class="site-header"><div class="wrap header-inner"><a class="brand" href="${href('/')}"><span class="brand-mark">AD</span><span>広告DB 日本版</span></a><nav class="nav" aria-label="メインナビ"><a href="${href('/#database')}">広告を探す</a><a href="${href('/categories/')}">カテゴリ</a><a href="${href('/guide/')}">選び方</a><a href="${href('/about/')}">調査方針</a></nav></div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap footer-inner"><div><strong>広告DB 日本版</strong><br>初心者が条件から広告サービスを比較するための調査データベース。<br>最終確認日: ${generatedAt}</div><div class="footer-links"><a href="${href('/about/')}">運営・調査方針</a><a href="${href('/guide/')}">広告の選び方</a><a href="${href('/categories/')}">カテゴリ一覧</a></div></div></footer>
<script src="${href('/assets/app.js')}" defer></script></body></html>`;
}

function tags(r) {
  return `<div class="tags"><span class="tag ${r.japan_bank_only_complete==='Yes'?'good':'warn'}">日本の銀行: ${esc(r.japan_bank_only_complete)}</span><span class="tag">初心者 ${esc(r.beginner_tier)}</span><span class="tag">UX ${esc(r.UX_intrusiveness_1_5)}/5</span></div>`;
}

function card(r) {
  const search = `${r.service_name} ${r.company} ${r.platform_type} ${r.japanese_site_fit} ${r.beginner_recommendation}`.toLowerCase();
  const hosting = [r.blogspot_free_url,r.wordpress_com_free_url,r.github_pages_free_url,r.vercel_free_subdomain,r.cloudflare_pages_free_subdomain].join(' ');
  return `<article class="card" data-service-card data-search="${esc(search)}" data-tier="${esc(r.beginner_tier)}" data-bank="${esc(r.japan_bank_only_complete)}" data-hosting="${esc(hosting)}"><div class="card-top"><span class="rank">RANK ${String(r.recommendation_rank_jp_beginner).padStart(2,'0')}</span><span class="score" title="0→1スコア">${esc(r.zero_to_one_score_1_5)}</span></div><h3>${esc(r.service_name)}</h3><div class="card-type">${esc(r.platform_type)}</div>${tags(r)}<p class="card-copy">${esc(r.beginner_recommendation)}</p><a class="card-link" href="${href(`/services/${r.slug}/`)}">詳細を見る</a></article>`;
}

function toolbar() {
  return `<div class="toolbar" aria-label="広告サービスを絞り込む"><div class="field"><label for="search">キーワード</label><input id="search" type="search" placeholder="サービス名・広告形式など"></div><div class="field"><label for="tier">初心者ランク</label><select id="tier"><option value="">すべて</option>${[...new Set(rows.map(r=>r.beginner_tier))].map(v=>`<option>${esc(v)}</option>`).join('')}</select></div><div class="field"><label for="bank">日本の銀行だけ</label><select id="bank"><option value="">すべて</option><option>Yes</option><option>Conditional</option><option>Unknown</option></select></div><div class="field"><label for="hosting">無料URL</label><select id="hosting"><option value="">すべて</option><option>公式OK</option><option>条件付き</option><option>技術推定OK</option><option>実質NG</option></select></div></div><p class="result-count" id="result-count">${rows.length}件を表示中</p>`;
}

function homePage() {
  const featuredSlugs = ['beginner','japan-bank','paypal','international-wire','free-subdomain','github-pages','low-payout','native-ads'];
  const featuredCategories = featuredSlugs.map(slug => categories.find(category => category.slug === slug)).filter(Boolean);
  const itemList = JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'広告プラットフォーム比較',numberOfItems:rows.length,itemListElement:rows.map((r,i)=>({'@type':'ListItem',position:i+1,url:canonical(`/services/${r.slug}/`),name:r.service_name}))});
  const body = `<section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">Japanese Publisher Database · 2026</p><h1>広告を、単価ではなく<br><em>始めやすさ</em>で選ぶ。</h1><p class="lead">日本語サイト、無料URL、日本の銀行口座。あなたの今の条件から、使える広告プラットフォームを絞り込みます。</p></div><aside class="hero-panel"><div class="big-number">30</div><div class="metric-label">広告サービスを同一基準で比較</div><p class="metric-sub">60以上の調査項目／公式情報と技術推定を分離／毎月更新を想定</p></aside></div></section>
  <section class="section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Quick paths</p><h2>条件から近道する</h2></div><p>よく使う選別条件は、検索エンジンから直接たどれる静的カテゴリページにもしています。</p></div><div class="category-grid">${featuredCategories.map(c=>`<a class="category-tile" href="${href(`/categories/${c.slug}/`)}"><strong>${esc(c.title)}</strong><span>${esc(c.short)} →</span></a>`).join('')}</div></div></section>
  <section class="section" id="database"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Full database</p><h2>全サービスを比較</h2></div><p>「技術的に貼れる」と「審査で承認される」は別です。各詳細ページで根拠レベルも確認してください。</p></div>${toolbar()}<div class="cards">${rows.map(card).join('')}</div></div></section>`;
  return layout({title:'広告プラットフォーム比較DB｜日本語サイト初心者向け',description:'日本語サイトの広告サービス30社を、初心者適性、最低PV、日本の銀行振込、無料サブドメイン対応で比較。',body,schema:itemList});
}

const labels = {
  company:'運営会社',home_region:'主な地域',platform_type:'サービス種別',growth_stage:'想定ステージ',japanese_site_fit:'日本語サイト適合',japanese_site_fit_reason:'日本語適合の根拠',japanese_ui_support:'日本語UI・サポート',minimum_traffic:'最低トラフィック',minimum_site_age:'最低サイト年齢',review_required:'媒体審査',review_speed:'審査速度',custom_domain_requirement:'独自ドメイン',free_subdomain_policy:'無料サブドメイン方針',hosting_evidence_level:'ホスティング根拠',static_site_technical_fit:'静的サイト適合',install_method:'導入方法',ads_txt:'ads.txt',bank_transfer:'銀行振込',japan_bank_only_complete:'日本の銀行だけで完結',bank_method:'銀行への支払方法',payout_processor:'支払プロセッサ',paypal:'PayPal',payoneer:'Payoneer',wise_revolut:'Wise / Revolut',stripe_payout:'Stripe',crypto:'暗号資産',minimum_payout_overall:'最低支払額',minimum_payout_bank:'銀行振込の最低額',payout_schedule:'支払周期',payout_currency:'支払通貨',payout_fee_note:'支払手数料',setup_fee:'初期費用',contract_exclusivity:'独占・契約',ad_models:'課金モデル',ad_formats:'広告形式',header_bidding_or_programmatic:'プログラマティック',adult_policy:'成人向け方針',AI_content_policy_note:'AIコンテンツ',adsense_good_standing_required:'AdSense良好状態',change_risk:'変更リスク',confidence:'調査確度',last_verified_date:'最終確認日'
};
const hostLabels = {blogspot_free_url:'Blogspot',wordpress_com_free_url:'WordPress.com',github_pages_free_url:'GitHub Pages',vercel_free_subdomain:'Vercel',cloudflare_pages_free_subdomain:'Cloudflare Pages'};
const sections = [
  ['参加条件',['company','home_region','platform_type','growth_stage','japanese_site_fit','japanese_site_fit_reason','japanese_ui_support','minimum_traffic','minimum_site_age','review_required','review_speed']],
  ['サイト・導入条件',['custom_domain_requirement','free_subdomain_policy','hosting_evidence_level','static_site_technical_fit','install_method','ads_txt']],
  ['支払い',['bank_transfer','japan_bank_only_complete','bank_method','payout_processor','paypal','payoneer','wise_revolut','stripe_payout','crypto','minimum_payout_overall','minimum_payout_bank','payout_schedule','payout_currency','payout_fee_note']],
  ['広告と契約',['setup_fee','contract_exclusivity','ad_models','ad_formats','header_bidding_or_programmatic','adult_policy','AI_content_policy_note','adsense_good_standing_required']],
  ['調査情報',['change_risk','confidence','last_verified_date']]
];

function factList(r, fields) { return `<dl class="facts">${fields.map(k=>`<dt>${esc(labels[k])}</dt><dd>${esc(r[k] || '不明')}</dd>`).join('')}</dl>`; }
function servicePage(r) {
  const outbound = r.affiliate_url || r.official_site_url;
  const sources = [...new Set([r.source_primary_url,r.source_requirements_url,r.source_payment_url,r.source_domain_url].filter(Boolean))];
  const title = `${r.service_name}の審査・最低PV・支払い条件｜広告DB`;
  const description = `${r.service_name}を日本語サイト初心者向けに調査。最低トラフィック、無料URL、日本の銀行振込、最低支払額、広告形式を比較します。`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:r.service_name,applicationCategory:'AdvertisingApplication',operatingSystem:'Web',url:canonical(`/services/${r.slug}/`),description,provider:{'@type':'Organization',name:r.company,url:r.official_site_url}});
  const body = `<div class="wrap breadcrumb"><a href="${href('/')}">トップ</a> / <a href="${href('/#database')}">広告サービス</a> / ${esc(r.service_name)}</div><section class="detail-hero"><div class="wrap"><div class="detail-title"><div><p class="eyebrow">${esc(r.platform_type)}</p><h1>${esc(r.service_name)}</h1><p class="lead">${esc(r.beginner_recommendation)}</p></div><div class="rank-box"><span>初心者順位</span><b>${esc(r.recommendation_rank_jp_beginner)}</b><small>/ 30</small></div></div><div class="summary-grid"><div class="summary-cell"><span>0→1スコア</span><b>${esc(r.zero_to_one_score_1_5)} / 5</b></div><div class="summary-cell"><span>日本語サイト</span><b>${esc(r.japanese_site_fit)}</b></div><div class="summary-cell"><span>最低トラフィック</span><b>${esc(r.minimum_traffic)}</b></div><div class="summary-cell"><span>日本の銀行だけ</span><b>${esc(r.japan_bank_only_complete)}</b></div></div></div></section>
  <section class="section"><div class="wrap detail-layout"><div><div class="panel"><h2>無料URL・ホスティング適合</h2><dl class="facts">${Object.entries(hostLabels).map(([k,v])=>`<dt>${v}</dt><dd>${esc(r[k])}</dd>`).join('')}</dl><p class="notice">「技術推定OK」はタグを置ける可能性を示すもので、広告会社による媒体承認の保証ではありません。</p></div>${sections.map(([name,fields])=>`<div class="panel"><h2>${name}</h2>${factList(r,fields)}</div>`).join('')}<div class="panel"><h2>一次情報・参照先</h2>${sources.length?`<ul class="sources">${sources.map(u=>`<li><a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(u)}</a></li>`).join('')}</ul>`:'<p>公開一次情報のURLは確認できていません。</p>'}${r.notes?`<p class="notice">${esc(r.notes)}</p>`:''}</div></div><aside class="sticky"><div class="panel"><p class="eyebrow">Official website</p><h2>${esc(r.service_name)}を確認</h2><p>申込前に最新条件を公式サイトまたは管理画面で再確認してください。</p><a class="cta" href="${esc(outbound)}" rel="sponsored nofollow noopener" target="_blank">公式サイトへ進む</a><p class="disclosure">このリンクは affiliate_url が設定された場合、成果リンクに自動で切り替わります。</p></div></aside></div></section>`;
  return layout({title,description,path:`/services/${r.slug}/`,body,schema});
}

function categoryPage(c) {
  const list = rows.filter(c.filter);
  const body = `<div class="wrap breadcrumb"><a href="${href('/')}">トップ</a> / <a href="${href('/categories/')}">カテゴリ</a> / ${esc(c.title)}</div><section class="page-intro"><div class="wrap"><p class="eyebrow">Category · ${list.length} services</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.description)}</p></div></section><section class="section"><div class="wrap"><div class="cards">${list.map(card).join('')}</div></div></section>`;
  return layout({title:`${c.title}の広告サービス一覧｜広告DB`,description:c.description,path:`/categories/${c.slug}/`,body});
}

function categoriesPage() {
  const groups = [...new Set(categories.map(category => category.group))];
  const groupedCategories = groups.map(group => `<section class="category-group"><div class="section-head"><div><p class="eyebrow">Genre</p><h2>${esc(group)}</h2></div></div><div class="category-grid">${categories.filter(category => category.group === group).map(c=>`<a class="category-tile" href="${href(`/categories/${c.slug}/`)}"><strong>${esc(c.title)}</strong><span>${rows.filter(c.filter).length}サービス · ${esc(c.short)} →</span></a>`).join('')}</div></section>`).join('');
  const body = `<section class="page-intro"><div class="wrap"><p class="eyebrow">Explore by condition</p><h1>条件別カテゴリ</h1><p class="lead">サイト規模、受取方法、無料URL、広告形式から${categories.length}ジャンルに絞り込めます。</p></div></section><section class="section"><div class="wrap">${groupedCategories}</div></section>`;
  return layout({title:'広告サービスの条件別カテゴリ一覧｜広告DB',description:'初心者向け、日本の銀行振込、無料サブドメイン、最低PVなしなどの条件から広告サービスを選べます。',path:'/categories/',body});
}

function infoPage(kind) {
  const guide = kind==='guide';
  const title = guide?'初心者向け広告サービスの選び方':'この広告データベースについて';
  const body = guide ? `<section class="page-intro"><div class="wrap prose"><p class="eyebrow">Starter guide</p><h1>${title}</h1><p class="lead">単価より先に、審査・設置・出金の3つを確認すると失敗を減らせます。</p><h2>1. まず「承認されるか」を確認</h2><p>広告タグを設置できても、無料サブドメインが媒体として承認されるとは限りません。本DBは公式確認と技術推定を分けています。</p><h2>2. 出金経路を確認</h2><p>最低支払額だけでなく、日本の銀行までPayPalやPayoneerなしで到達できるかを確認してください。海外Wireは中継銀行手数料が発生する場合があります。</p><h2>3. UXに合う広告形式を選ぶ</h2><p>Pop・Pushは収益化しやすい一方で侵襲性が高くなります。長期運営する日本語サイトではBanner・Nativeから試すのが無難です。</p></div></section>` : `<section class="page-intro"><div class="wrap prose"><p class="eyebrow">Methodology</p><h1>${title}</h1><p class="lead">日本語サイト初心者の「0円から初収益」を支えるための比較DBです。</p><h2>評価の優先順位</h2><p>広告単価ランキングではありません。初心者適性、日本語サイトへの適合、日本の銀行口座までの出金、無料サブドメイン・静的サイト適合を重視します。</p><h2>情報の確度</h2><p>公式ページで確認できた事実と、HTML・JavaScriptの設置可否から判断した技術推定を分離します。不明な項目は推測で埋めません。</p><h2>更新</h2><p>原則として月1回、変更リスクHighのサービスから公式ページを確認し、TSV更新後に全HTMLを再生成します。最終確認日は各サービスページに表示します。</p><h2>免責</h2><p>審査・支払方法・最低額はアカウント、国、時期により変わる場合があります。申込前に必ず公式情報を確認してください。</p></div></section>`;
  return layout({title:`${title}｜広告DB`,description:guide?'日本語サイト初心者が広告サービスを選ぶときの審査、出金、UXの確認ポイント。':'広告プラットフォームDBの調査方法、評価基準、更新方針。',path:`/${kind}/`,body});
}

async function save(path, content) { const target=join(dist,path); await mkdir(join(target,'..'),{recursive:true}); await writeFile(target,content,'utf8'); }

await rm(dist,{recursive:true,force:true});
await mkdir(join(dist,'assets'),{recursive:true});
await cp(join(root,'src','styles.css'),join(dist,'assets','styles.css'));
await cp(join(root,'src','app.js'),join(dist,'assets','app.js'));
await save('index.html',homePage());
for (const r of rows) await save(join('services',r.slug,'index.html'),servicePage(r));
await save(join('categories','index.html'),categoriesPage());
for (const c of categories) await save(join('categories',c.slug,'index.html'),categoryPage(c));
await save(join('guide','index.html'),infoPage('guide'));
await save(join('about','index.html'),infoPage('about'));
await save('404.html',layout({title:'ページが見つかりません｜広告DB',description:'ページが見つかりません。',robots:'noindex,nofollow',body:`<section class="page-intro"><div class="wrap"><h1>404</h1><p class="lead">ページが見つかりません。<a href="${href('/')}">トップへ戻る</a></p></div></section>`}));

const paths = ['/',...rows.map(r=>`/services/${r.slug}/`),'/categories/',...categories.map(c=>`/categories/${c.slug}/`),'/guide/','/about/'];
await save('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${esc(canonical(p))}</loc><lastmod>${generatedAt}</lastmod></url>`).join('')}</urlset>`);
await save('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${canonical('/sitemap.xml')}\n`);
await save('.nojekyll','');
console.log(`Built ${paths.length} indexable HTML pages from ${rows.length} services.`);

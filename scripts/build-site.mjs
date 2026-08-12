import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const dist = join(root, 'docs');
const dataFile = join(root, 'ad_network_database_2026-08-11.tsv');
const siteUrl = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const basePath = (process.env.BASE_PATH ?? '/DB-ad-platform').replace(/\/$/, '');
const generatedAt = '2026-08-11';
const assetVersion = createHash('sha256').update(await readFile(join(root, 'src', 'styles.css'))).update(await readFile(join(root, 'src', 'app.js'))).digest('hex').slice(0, 10);

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
  { group:'AdSense代替', slug:'adsense-alternatives', title:'AdSenseに通らない人の代替候補', short:'AdSense以外の収益化を探す', description:'Google AdSenseの審査に通らない、または審査で停滞している人が比較するための代替広告サービス。', filter:r=>r.id!=='6' },
  { group:'初心者・サイト条件', slug:'beginner', title:'初心者向け', short:'0円から最初の収益を目指す', description:'ゼロから収益化を始めやすい、スコア4以上の広告サービス。', filter:r=>Number(r.zero_to_one_score_1_5)>=4 },
  { group:'初心者・サイト条件', slug:'no-minimum-traffic', title:'最低PVなし・非公開', short:'小規模サイトから検討', description:'公開された最低トラフィック条件がない、または固定閾値がないサービス。審査通過を保証するものではありません。', filter:r=>/なし|固定閾値なし/.test(r.minimum_traffic) },
  { group:'初心者・サイト条件', slug:'no-site-age', title:'サイト年齢要件なし', short:'新しいサイトから検討', description:'公開された最低サイト年齢の要件がないサービス。媒体審査は別途行われる場合があります。', filter:r=>r.minimum_site_age==='公開要件なし' },
  { group:'初心者・サイト条件', slug:'zero-setup-fee', title:'初期費用0円', short:'導入費をかけずに開始', description:'公開情報で初期費用0円または0と確認できる広告サービス。', filter:r=>/^(0|0円)$/.test(r.setup_fee) },
  { group:'初心者・サイト条件', slug:'non-exclusive', title:'独占契約なし', short:'他広告との併用候補', description:'契約上の独占が「なし」と記載されている広告サービス。個別の広告配置規約は確認してください。', filter:r=>/^なし(?:$|\/)/.test(r.contract_exclusivity) },
  { group:'初心者・サイト条件', slug:'japanese-ui', title:'日本語UI・サポート', short:'日本語で管理しやすい', description:'管理画面またはサポートの日本語対応があるサービス。', filter:r=>/^あり/.test(r.japanese_ui_support) },
  { group:'サイト条件', slug:'custom-domain-required', title:'独自ドメイン必須', short:'独自ドメインでの運営が前提', description:'公開要件や対象サービスの性質から、独自ドメインが必須と判断した広告サービス。', filter:r=>r.custom_domain_requirement==='必須' },
  { group:'サイト条件', slug:'no-custom-domain', title:'独自ドメイン必須ではない', short:'独自ドメインなしでも申請候補', description:'独自ドメインがなくても利用経路や例外が確認できる広告サービス。媒体審査の通過を保証するものではありません。', filter:r=>r.custom_domain_requirement==='必須ではない' },
  { group:'サイト条件', slug:'custom-domain-unknown', title:'独自ドメインは要確認', short:'申請前に公式・担当者へ確認', description:'公開情報だけでは独自ドメインの必要性を断定できない広告サービス。申請前に公式情報や担当者へ確認してください。', filter:r=>r.custom_domain_requirement==='要確認' },
  { group:'支払い方法', slug:'japan-bank', title:'日本の銀行だけで完結', short:'外部ウォレットを経由しない', description:'日本の銀行口座への支払いを公式情報で確認できたサービス。', filter:r=>r.japan_bank_only_complete==='Yes' },
  { group:'支払い方法', slug:'paypal', title:'PayPal対応', short:'PayPalで広告収益を受取', description:'媒体運営者への支払い方法としてPayPal対応を確認できた広告サービス。地域やアカウント条件を確認してください。', filter:r=>/^Yes/.test(r.paypal) },
  { group:'支払い方法', slug:'payoneer', title:'Payoneer対応', short:'国境を越えた受取手段', description:'媒体運営者への支払い方法としてPayoneer対応を確認できた広告サービス。', filter:r=>/^Yes/.test(r.payoneer) },
  { group:'支払い方法', slug:'wise-revolut', title:'Wise・Revolut対応', short:'海外送金サービスを利用', description:'Wise、Revolut、Payseraの対応を明示的に確認できた広告サービス。', filter:r=>/Wise Yes|Revolut Yes|Revolutあり|Wise\/Revolut\/Paysera Yes/.test(r.wise_revolut) },
  { group:'支払い方法', slug:'stripe', title:'Stripe対応', short:'Stripeで広告収益を受取', description:'媒体運営者への支払い経路としてStripe対応を確認できた広告サービス。', filter:r=>/^Yes/.test(r.stripe_payout) },
  { group:'支払い方法', slug:'crypto', title:'暗号資産払い対応', short:'暗号資産ウォレットで受取', description:'媒体運営者への報酬を暗号資産で受け取れると確認できた広告サービス。', filter:r=>/^Yes/.test(r.crypto) },
  { group:'支払い方法', slug:'international-wire', title:'国際銀行送金対応', short:'Wire・SWIFTで海外から受取', description:'International Wire、Bank Wire、SWIFTなど国境を越える銀行送金に対応するサービス。手数料と最低額に注意してください。', filter:r=>/Wire|SWIFT/i.test(r.bank_method) },
  { group:'支払い方法', slug:'local-bank-transfer', title:'Local Bank Transfer対応', short:'現地銀行向け送金', description:'Local Bank Transferまたは国内銀行振込に対応する広告サービス。利用国と通貨条件を確認してください。', filter:r=>/Local [Bb]ank|国内銀行|日本国内銀行/.test(r.bank_method) },
  { group:'支払い方法', slug:'low-payout', title:'低い支払基準', short:'初回出金までを短く', description:'全体の最低支払額が円建て8,000円以下、または外貨100以下と読み取れるサービス。支払方法により条件が変わります。', filter:r=>/500円|3,000円|5,000円|8,000円|\$1\b|\$5\b|\$20\b|\$25\b|\$50\b|\$100\b|20 EUR/.test(r.minimum_payout_overall) },
  { group:'広告形式・運用', slug:'banner-ads', title:'バナー広告対応', short:'標準的なディスプレイ枠', description:'バナー広告形式を明示している広告サービス。', filter:r=>/Banner|バナー/i.test(r.ad_formats) },
  { group:'広告形式・運用', slug:'native-ads', title:'ネイティブ広告', short:'コンテンツになじむ形式', description:'Native、In-text、レコメンド型広告を扱うサービス。', filter:r=>/Native|ネイティブ|InText|In-text|レコメンド/i.test(`${r.platform_type} ${r.ad_formats}`) },
  { group:'広告形式・運用', slug:'video-ads', title:'動画広告対応', short:'Video広告を掲載', description:'動画またはVideo広告形式を明示している広告サービス。', filter:r=>/Video|動画/i.test(r.ad_formats) },
  { group:'広告形式・運用', slug:'pop-push-ads', title:'Pop・Push広告対応', short:'収益性と閲覧への影響を比較', description:'Popunder、Onclick、Pushなど、読者の操作を妨げやすい広告形式を扱うサービス。', filter:r=>/Pop|Push|Onclick/i.test(r.ad_formats) },
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
<link rel="canonical" href="${esc(canonical(path))}"><link rel="stylesheet" href="${href('/assets/styles.css')}?v=${assetVersion}">
<meta property="og:type" content="website"><meta property="og:locale" content="ja_JP"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical(path))}">
${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
</head><body><a class="skip" href="#main">本文へ移動</a>
<header class="site-header"><div class="wrap header-inner"><a class="brand" href="${href('/')}"><span class="brand-mark">AD</span><span>広告DB 日本版</span></a><nav class="nav" aria-label="メインナビ"><a href="${href('/#database')}">広告を探す</a><a href="${href('/categories/')}">カテゴリ</a><a href="${href('/guide/')}">選び方</a><a href="${href('/about/')}">調査方針</a></nav></div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap footer-inner"><div><strong>広告DB 日本版</strong><br>初心者が条件から広告サービスを比較するための調査データベース。<br>最終確認日: ${generatedAt}</div><div class="footer-links"><a href="${href('/about/')}">運営・調査方針</a><a href="${href('/guide/')}">広告の選び方</a><a href="${href('/categories/')}">カテゴリ一覧</a></div></div></footer>
<script src="${href('/assets/app.js')}?v=${assetVersion}" defer></script></body></html>`;
}

function tags(r) {
  const bankLabel = r.japan_bank_only_complete === 'Yes' ? '対応' : r.japan_bank_only_complete === 'Conditional' ? '条件付き' : r.japan_bank_only_complete === 'No' ? '非対応' : '不明';
  const domainLabel = `独自ドメイン: ${r.custom_domain_requirement}`;
  return `<div class="tags"><span class="tag ${r.japan_bank_only_complete==='Yes'?'good':'warn'}">日本の銀行のみ: ${bankLabel}</span><span class="tag">${domainLabel}</span><span class="tag">初心者適性: ${esc(r.beginner_tier)}</span><span class="tag">広告の強さ: ${esc(r.UX_intrusiveness_1_5)}/5</span></div>`;
}

function card(r) {
  const search = `${r.service_name} ${r.company} ${r.platform_type} ${r.japanese_site_fit} ${r.beginner_recommendation}`.toLowerCase();
  const payments = [
    [/^Yes/.test(r.paypal),'paypal'],[/^Yes/.test(r.payoneer),'payoneer'],[/Wise Yes|Revolut Yes|Revolutあり|Wise\/Revolut\/Paysera Yes/.test(r.wise_revolut),'wise-revolut'],[/^Yes/.test(r.crypto),'crypto'],[/Wire|SWIFT/i.test(r.bank_method),'wire'],[/Local [Bb]ank|国内銀行|日本国内銀行/.test(r.bank_method),'local-bank']
  ].filter(([matched])=>matched).map(([,key])=>key).join(' ');
  const formats = [
    [/Banner|バナー/i.test(r.ad_formats),'banner'],[/Native|ネイティブ|InText|In-text|レコメンド/i.test(`${r.platform_type} ${r.ad_formats}`),'native'],[/Video|動画/i.test(r.ad_formats),'video'],[/Pop|Push|Onclick/i.test(r.ad_formats),'pop-push'],[/Programmatic|Header|SSP|RTB/i.test(`${r.platform_type} ${r.header_bidding_or_programmatic}`),'programmatic']
  ].filter(([matched])=>matched).map(([,key])=>key).join(' ');
  const region = r.home_region.includes('日本') ? 'domestic' : 'overseas';
  return `<article class="card" data-service-card data-search="${esc(search)}" data-score="${esc(r.zero_to_one_score_1_5)}" data-bank="${esc(r.japan_bank_only_complete)}" data-domain="${esc(r.custom_domain_requirement)}" data-payment="${esc(payments)}" data-format="${esc(formats)}" data-region="${region}"><div class="card-top"><span class="rank">初心者向け順位 ${String(r.recommendation_rank_jp_beginner).padStart(2,'0')}</span><span class="score" title="初収益までの始めやすさ。5点満点"><small>始めやすさ</small><strong>${esc(r.zero_to_one_score_1_5)}/5</strong></span></div><h3>${esc(r.service_name)}</h3><div class="card-type">${esc(r.platform_type)}</div>${tags(r)}<p class="card-copy">${esc(r.beginner_recommendation)}</p><a class="card-link" href="${href(`/services/${r.slug}/`)}">詳細を見る</a></article>`;
}

function toolbar() {
  return `<form class="filter-panel" id="filter-form"><div class="filter-heading"><div><p class="eyebrow">条件を組み合わせて検索</p><h3>あなたのサイトに合う広告を探す</h3></div><button class="reset-button" id="reset-filters" type="button">条件をリセット</button></div><div class="toolbar" aria-label="広告サービスを絞り込む"><div class="field field-search"><label for="search">サービス名・特徴</label><input id="search" type="search" placeholder="例: AdSense、ネイティブ広告"></div><div class="field field-primary"><label for="domain">独自ドメイン</label><select id="domain"><option value="">指定なし</option><option value="必須ではない">必須ではない</option><option value="必須">必須</option><option value="要確認">要確認</option></select></div><div class="field"><label for="score">始めやすさ</label><select id="score"><option value="">指定なし</option><option value="4">4点以上</option><option value="3">3点以上</option><option value="2">2点以上</option></select></div><div class="field"><label for="bank">日本の銀行だけで完結</label><select id="bank"><option value="">指定なし</option><option value="Yes">対応</option><option value="Conditional">条件付き</option><option value="Unknown">不明</option></select></div><div class="field"><label for="payment">受取方法</label><select id="payment"><option value="">指定なし</option><option value="paypal">PayPal</option><option value="payoneer">Payoneer</option><option value="wise-revolut">Wise・Revolut</option><option value="crypto">暗号資産</option><option value="wire">国際銀行送金</option><option value="local-bank">国内・現地銀行送金</option></select></div><div class="field"><label for="format">広告形式</label><select id="format"><option value="">指定なし</option><option value="banner">バナー</option><option value="native">ネイティブ</option><option value="video">動画</option><option value="pop-push">Pop・Push</option><option value="programmatic">運用型・Header Bidding</option></select></div><div class="field"><label for="region">運営地域</label><select id="region"><option value="">指定なし</option><option value="domestic">国内・日本企業</option><option value="overseas">海外サービス</option></select></div></div><div class="filter-footer"><p class="result-count" id="result-count" aria-live="polite"><strong>${rows.length}</strong>件中 ${rows.length}件を表示</p><button class="search-button" type="submit">この条件で検索</button></div></form>`;
}

function homePage() {
  const featuredSlugs = ['adsense-alternatives','beginner','no-custom-domain','japan-bank','paypal','low-payout','native-ads','growth'];
  const featuredCategories = featuredSlugs.map(slug => categories.find(category => category.slug === slug)).filter(Boolean);
  const itemList = JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'広告プラットフォーム比較',numberOfItems:rows.length,itemListElement:rows.map((r,i)=>({'@type':'ListItem',position:i+1,url:canonical(`/services/${r.slug}/`),name:r.service_name}))});
  const body = `<section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">AdSenseの審査で止まった人へ</p><h1>広告を、単価ではなく<br><em>始めやすさ</em>で選ぶ。</h1><p class="lead">AdSenseに通らなくても、収益化の選択肢はあります。日本語サイト、独自ドメイン、日本の銀行口座など、今の条件から代替サービスを絞り込みます。</p></div><aside class="hero-panel"><div class="big-number">30</div><div class="metric-label">広告サービスを同一基準で比較</div><p class="metric-sub">50以上の調査項目／公式情報と推定を分離／毎月更新を想定</p></aside></div></section>
  <section class="section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">よく使われる条件</p><h2>条件から近道する</h2></div><p>よく使う選別条件は、検索エンジンから直接たどれる静的カテゴリページにもしています。</p></div><div class="category-grid">${featuredCategories.map(c=>`<a class="category-tile" href="${href(`/categories/${c.slug}/`)}"><strong>${esc(c.title)}</strong><span>${esc(c.short)} →</span></a>`).join('')}</div></div></section>
  <section class="section" id="database"><div class="wrap"><div class="section-head"><div><p class="eyebrow">広告サービス一覧</p><h2>全サービスを比較</h2></div><p>「技術的に貼れる」と「審査で承認される」は別です。各詳細ページで根拠レベルも確認してください。</p></div>${toolbar()}<div class="cards">${rows.map(card).join('')}</div></div></section>`;
  return layout({title:'広告プラットフォーム比較DB｜日本語サイト初心者向け',description:'日本語サイトの広告サービス30社を、初心者適性、最低PV、日本の銀行振込、独自ドメイン要件で比較。',body,schema:itemList});
}

const labels = {
  company:'運営会社',home_region:'主な地域',platform_type:'サービス種別',growth_stage:'想定ステージ',japanese_site_fit:'日本語サイト適合',japanese_site_fit_reason:'日本語適合の根拠',japanese_ui_support:'日本語UI・サポート',minimum_traffic:'最低トラフィック',minimum_site_age:'最低サイト年齢',review_required:'媒体審査',review_speed:'審査速度',custom_domain_requirement:'独自ドメイン',install_method:'導入方法',ads_txt:'ads.txt',bank_transfer:'銀行振込',japan_bank_only_complete:'日本の銀行だけで完結',bank_method:'銀行への支払方法',payout_processor:'支払プロセッサ',paypal:'PayPal',payoneer:'Payoneer',wise_revolut:'Wise / Revolut',stripe_payout:'Stripe',crypto:'暗号資産',minimum_payout_overall:'最低支払額',minimum_payout_bank:'銀行振込の最低額',payout_schedule:'支払周期',payout_currency:'支払通貨',payout_fee_note:'支払手数料',setup_fee:'初期費用',contract_exclusivity:'独占・契約',ad_models:'課金モデル',ad_formats:'広告形式',header_bidding_or_programmatic:'プログラマティック',adult_policy:'成人向け方針',AI_content_policy_note:'AIコンテンツ',adsense_good_standing_required:'AdSense良好状態',change_risk:'変更リスク',confidence:'調査確度',last_verified_date:'最終確認日'
};
const sections = [
  ['参加条件',['company','home_region','platform_type','growth_stage','japanese_site_fit','japanese_site_fit_reason','japanese_ui_support','minimum_traffic','minimum_site_age','review_required','review_speed']],
  ['サイト・導入条件',['custom_domain_requirement','install_method','ads_txt']],
  ['支払い',['bank_transfer','japan_bank_only_complete','bank_method','payout_processor','paypal','payoneer','wise_revolut','stripe_payout','crypto','minimum_payout_overall','minimum_payout_bank','payout_schedule','payout_currency','payout_fee_note']],
  ['広告と契約',['setup_fee','contract_exclusivity','ad_models','ad_formats','header_bidding_or_programmatic','adult_policy','AI_content_policy_note','adsense_good_standing_required']],
  ['調査情報',['change_risk','confidence','last_verified_date']]
];

function factList(r, fields) { return `<dl class="facts">${fields.map(k=>`<dt>${esc(labels[k])}</dt><dd>${esc(r[k] || '不明')}</dd>`).join('')}</dl>`; }
function voiceList(items, urls) {
  const points = (items || '').split('｜').filter(Boolean);
  const sources = (urls || '').split('|');
  return `<ul class="voice-list">${points.map((point,index)=>`<li><span>${esc(point)}</span>${sources[index] ? `<a href="${esc(sources[index])}" rel="nofollow noopener" target="_blank">体験記事を確認</a>` : ''}</li>`).join('')}</ul>`;
}
function servicePage(r) {
  const outbound = r.affiliate_url || r.official_site_url;
  const sources = [...new Set([r.source_primary_url,r.source_requirements_url,r.source_payment_url].filter(Boolean))];
  const relatedCategories = categories.filter(category => category.filter(r));
  const title = `${r.service_name}の審査・最低PV・支払い条件｜広告DB`;
  const description = `${r.service_name}を日本語サイト初心者向けに調査。最低トラフィック、独自ドメイン、日本の銀行振込、最低支払額、広告形式を比較します。`;
  const schema = JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'SoftwareApplication',name:r.service_name,applicationCategory:'AdvertisingApplication',operatingSystem:'Web',url:canonical(`/services/${r.slug}/`),description,provider:{'@type':'Organization',name:r.company,url:r.official_site_url}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:canonical('/')},{'@type':'ListItem',position:2,name:'広告サービス',item:canonical('/#database')},{'@type':'ListItem',position:3,name:r.service_name,item:canonical(`/services/${r.slug}/`)}]}]});
  const bankDisplay = r.japan_bank_only_complete === 'Yes' ? '対応' : r.japan_bank_only_complete === 'Conditional' ? '条件付き' : r.japan_bank_only_complete === 'No' ? '非対応' : '不明';
  const domainNote = r.custom_domain_requirement === '必須' ? 'このサービスでは独自ドメインが必要です。' : r.custom_domain_requirement === '必須ではない' ? '独自ドメインがなくても申請候補になります。媒体審査の通過は保証されません。' : '公開情報だけでは断定できません。申請前に公式情報または担当者へ確認してください。';
  const editorial = r.pros && r.cons && r.recommended_for ? `<div class="editorial-grid" data-editorial-review><p class="voice-note">第三者の体験記事・レビューを要約しています。収益や審査結果は媒体・時期・アクセス地域で変わるため、個人の体験としてお読みください。</p><section class="editorial-card editorial-pros"><p class="eyebrow">PROS</p><h2>利用者が挙げた良い点</h2>${voiceList(r.pros,r.pros_source_urls)}</section><section class="editorial-card editorial-cons"><p class="eyebrow">CONS</p><h2>利用者が挙げた注意点</h2>${voiceList(r.cons,r.cons_source_urls)}</section><section class="editorial-card editorial-fit"><p class="eyebrow">BEST FOR</p><h2>口コミから見る、こんな人におすすめ</h2><p>${esc(r.recommended_for)}</p></section></div>` : '';
  const adsenseWarning = (r.id === '6' ? `<div class="panel warning-panel"><p class="eyebrow">本DBでの位置づけ</p><h2>AdSenseは代替候補ではありません</h2><p>このDBは、AdSenseの審査に通らず次の収益化方法を探している人を主な対象にしています。AdSenseは比較基準として残していますが、初心者向け順位は最下位です。不承認理由はコンテンツ量・品質・ナビゲーション・トラフィックなど複数にわたり、修正箇所を絞り込みにくい場合があります。</p><a class="text-link" href="${href('/categories/adsense-alternatives/')}">AdSense以外の候補を見る</a></div>` : '') + editorial;
  const body = `<div class="wrap breadcrumb"><a href="${href('/')}">トップ</a> / <a href="${href('/#database')}">広告サービス</a> / ${esc(r.service_name)}</div><section class="detail-hero"><div class="wrap"><div class="detail-title"><div><p class="eyebrow">${esc(r.platform_type)}</p><h1>${esc(r.service_name)}</h1><p class="lead">${esc(r.beginner_recommendation)}</p></div><div class="rank-box"><span>初心者向け順位</span><b>${esc(r.recommendation_rank_jp_beginner)}</b><small>30サービス中</small></div></div><div class="summary-grid"><div class="summary-cell"><span>初収益までの始めやすさ</span><b>${esc(r.zero_to_one_score_1_5)} / 5点</b></div><div class="summary-cell"><span>日本語サイト</span><b>${esc(r.japanese_site_fit)}</b></div><div class="summary-cell"><span>最低トラフィック</span><b>${esc(r.minimum_traffic)}</b></div><div class="summary-cell"><span>日本の銀行だけで完結</span><b>${bankDisplay}</b></div></div></div></section>
  <section class="section"><div class="wrap detail-layout"><div>${adsenseWarning}<div class="panel genre-panel" data-related-genres><div class="panel-heading"><div><p class="eyebrow">該当ジャンル・${relatedCategories.length}件</p><h2>このサービスが属するジャンル</h2></div><a class="text-link" href="${href('/categories/')}">全ジャンルを見る</a></div><div class="genre-list">${relatedCategories.map(category=>`<a class="genre-chip" href="${href(`/categories/${category.slug}/`)}"><small>${esc(category.group)}</small><strong>${esc(category.title)}</strong></a>`).join('')}</div></div><div class="panel"><h2>独自ドメイン</h2><div class="domain-verdict"><span>サイト条件</span><strong>${esc(r.custom_domain_requirement)}</strong><p>${domainNote}</p></div></div>${sections.map(([name,fields])=>`<div class="panel"><h2>${name}</h2>${factList(r,fields)}</div>`).join('')}<div class="panel"><h2>一次情報・参照先</h2>${sources.length?`<ul class="sources">${sources.map(u=>`<li><a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(u)}</a></li>`).join('')}</ul>`:'<p>公開一次情報のURLは確認できていません。</p>'}${r.notes?`<p class="notice">${esc(r.notes)}</p>`:''}</div></div><aside class="sticky"><div class="panel"><p class="eyebrow">公式サイト</p><h2>${esc(r.service_name)}を確認</h2><p>申込前に最新条件を公式サイトまたは管理画面で再確認してください。</p><a class="cta" href="${esc(outbound)}" rel="sponsored nofollow noopener" target="_blank">公式サイトへ進む</a><p class="disclosure">affiliate_urlが設定されている場合は、成果報酬リンクへ自動的に切り替わります。</p></div></aside></div></section>`;
  return layout({title,description,path:`/services/${r.slug}/`,body,schema});
}

function categoryPage(c) {
  const list = rows.filter(c.filter);
  const siblings = categories.filter(category => category.group === c.group && category.slug !== c.slug);
  const pagePath = `/categories/${c.slug}/`;
  const schema = JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'CollectionPage',name:`${c.title}の広告サービス一覧`,url:canonical(pagePath),description:c.description,mainEntity:{'@type':'ItemList',numberOfItems:list.length,itemListElement:list.map((r,index)=>({'@type':'ListItem',position:index+1,name:r.service_name,url:canonical(`/services/${r.slug}/`)}))}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:canonical('/')},{'@type':'ListItem',position:2,name:'カテゴリ',item:canonical('/categories/')},{'@type':'ListItem',position:3,name:c.title,item:canonical(pagePath)}]}]});
  const body = `<div class="wrap breadcrumb"><a href="${href('/')}">トップ</a> / <a href="${href('/categories/')}">カテゴリ</a> / ${esc(c.title)}</div><section class="page-intro"><div class="wrap"><p class="eyebrow">${esc(c.group)}・該当${list.length}件</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.description)}</p></div></section><section class="section category-results" data-category-context><div class="wrap"><div class="category-context"><div><p class="eyebrow">カテゴリの判定基準</p><h2>このジャンルの判定</h2><p>${esc(c.description)}</p><p class="category-count"><strong>${list.length}</strong>件が現在のDB条件に一致しています。</p></div><aside><p class="eyebrow">関連ジャンル</p><div class="related-links">${siblings.length?siblings.map(category=>`<a href="${href(`/categories/${category.slug}/`)}">${esc(category.title)} <span>${rows.filter(category.filter).length}</span></a>`).join(''):`<a href="${href('/categories/')}">全ジャンルを見る</a>`}</div></aside></div><div class="section-head results-heading"><div><p class="eyebrow">該当サービス</p><h2>${esc(c.title)}の比較一覧</h2></div><a class="text-link" href="${href('/categories/')}">全ジャンルを見る</a></div><div class="cards">${list.map(card).join('')}</div></div></section>`;
  return layout({title:`${c.title}の広告サービス一覧｜広告DB`,description:c.description,path:pagePath,body,schema});
}

function categoriesPage() {
  const groups = [...new Set(categories.map(category => category.group))];
  const groupedCategories = groups.map(group => `<section class="category-group"><div class="section-head"><div><p class="eyebrow">カテゴリ</p><h2>${esc(group)}</h2></div></div><div class="category-grid">${categories.filter(category => category.group === group).map(c=>`<a class="category-tile" href="${href(`/categories/${c.slug}/`)}"><strong>${esc(c.title)}</strong><span>${rows.filter(c.filter).length}サービス・${esc(c.short)} →</span></a>`).join('')}</div></section>`).join('');
  const body = `<section class="page-intro"><div class="wrap"><p class="eyebrow">条件から探す</p><h1>条件別カテゴリ</h1><p class="lead">サイト規模、独自ドメイン、受取方法、広告形式から${categories.length}ジャンルに絞り込めます。</p></div></section><section class="section"><div class="wrap">${groupedCategories}</div></section>`;
  return layout({title:'広告サービスの条件別カテゴリ一覧｜広告DB',description:'初心者向け、日本の銀行振込、独自ドメイン、最低PVなしなどの条件から広告サービスを選べます。',path:'/categories/',body});
}

function infoPage(kind) {
  const guide = kind==='guide';
  const title = guide?'初心者向け広告サービスの選び方':'この広告データベースについて';
  const body = guide ? `<section class="page-intro"><div class="wrap prose"><p class="eyebrow">初心者向けガイド</p><h1>${title}</h1><p class="lead">単価より先に、審査・設置・出金の3つを確認すると失敗を減らせます。</p><h2>1. まず「承認されるか」を確認</h2><p>独自ドメインが必須ではなくても、媒体審査で承認されるとは限りません。「要確認」のサービスは申請前に公式情報を確認してください。</p><h2>2. 出金経路を確認</h2><p>最低支払額だけでなく、日本の銀行までPayPalやPayoneerなしで到達できるかを確認してください。国際銀行送金は中継銀行手数料が発生する場合があります。</p><h2>3. 読みやすさに合う広告形式を選ぶ</h2><p>Pop・Pushは収益化しやすい一方で、読者の操作を妨げやすい形式です。長期運営する日本語サイトではバナー・ネイティブ広告から試すのが無難です。</p></div></section>` : `<section class="page-intro"><div class="wrap prose"><p class="eyebrow">調査方法</p><h1>${title}</h1><p class="lead">日本語サイト初心者の「0円から初収益」を支えるための比較DBです。</p><h2>評価の優先順位</h2><p>広告単価ランキングではありません。初心者適性、日本語サイトへの適合、日本の銀行口座までの出金、独自ドメイン要件を重視します。</p><h2>情報の確度</h2><p>公式ページで確認できた事実と、確認できない項目を分離します。不明な項目は推測で埋めず「要確認」とします。</p><h2>更新</h2><p>原則として月1回、変更リスクHighのサービスから公式ページを確認し、TSV更新後に全HTMLを再生成します。最終確認日は各サービスページに表示します。</p><h2>免責</h2><p>審査・支払方法・最低額はアカウント、国、時期により変わる場合があります。申込前に必ず公式情報を確認してください。</p></div></section>`;
  return layout({title:`${title}｜広告DB`,description:guide?'日本語サイト初心者が広告サービスを選ぶときの審査、出金、読みやすさの確認ポイント。':'広告プラットフォームDBの調査方法、評価基準、更新方針。',path:`/${kind}/`,body});
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

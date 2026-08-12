$ErrorActionPreference = 'Stop'

$dbPath = Join-Path $PSScriptRoot '..\ad_network_database_2026-08-11.tsv'
$rows = @(Import-Csv -Delimiter "`t" -LiteralPath $dbPath)

$slugs = @{
  '1'='ninja-admax'; '2'='imobile-ad-network'; '3'='zucks-ad-network'; '4'='adsterra'; '5'='adstir';
  '6'='google-adsense'; '7'='admaven'; '8'='infolinks'; '9'='adcash'; '10'='hilltopads';
  '11'='popads'; '12'='clickadu'; '13'='bidvertiser'; '14'='monetag'; '15'='exoclick';
  '16'='revcontent'; '17'='mgid'; '18'='journey-by-mediavine'; '19'='monumetric'; '20'='newor-media';
  '21'='raptive'; '22'='ezoic'; '23'='setupad'; '24'='mediavine-official'; '25'='publift';
  '26'='microad-compass'; '27'='logly-ads-context'; '28'='fluct-ssp'; '29'='geniee-ssp'; '30'='freestar'
}

foreach ($row in $rows) {
  if (-not $row.PSObject.Properties['slug']) {
    $row | Add-Member -NotePropertyName slug -NotePropertyValue $slugs[$row.id]
  } elseif ([string]::IsNullOrWhiteSpace($row.slug)) {
    $row.slug = $slugs[$row.id]
  }
  if (-not $row.PSObject.Properties['affiliate_url']) {
    $row | Add-Member -NotePropertyName affiliate_url -NotePropertyValue ''
  }
  foreach ($field in @('pros', 'cons', 'recommended_for')) {
    if (-not $row.PSObject.Properties[$field]) {
      $row | Add-Member -NotePropertyName $field -NotePropertyValue ''
    }
  }
$domainNotRequiredIds = @('4', '13')
$domainRequiredIds = @('6', '14', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '28', '29', '30')
  if ($row.id -in $domainNotRequiredIds) {
    $row.custom_domain_requirement = '必須ではない'
  } elseif ($row.id -in $domainRequiredIds) {
    $row.custom_domain_requirement = '必須'
  } else {
    $row.custom_domain_requirement = '要確認'
  }
}

$editorialResearch = @{
  '1' = @{ pros = '最短5分で掲載を始められ、問題がなければ初回バナー表示後30分程度で配信される。30社以上の広告会社を横断して広告を自動選別し、PC・スマートフォンを一つの管理画面で扱える。'; cons = '報酬はまず忍者ポイントで付与され、現金化には交換手続きが必要。広告枠の自動審査があり、禁止コンテンツや枠の状態によっては配信されない。'; recommended_for = '日本語の小規模サイトで、複雑な広告調整をせず、まず少額でも広告収益を発生させたい人。国内サービスと日本円での受取を重視する人。' }
  '2' = @{ pros = '18歳以上で日本国内の銀行口座があれば登録でき、最低支払額は3,000円。サイト審査は通常2〜3営業日で、他社広告との併用も認められている。'; cons = '振込時に一律250円の事務手数料がかかり、報酬の繰越期限は2年間。サイトごとの審査が必要で、管理画面はスマートフォン向けに最適化されていない。'; recommended_for = '国内銀行で完結させたい日本語サイト運営者で、数日の審査を待てる人。3,000円からの受取と国内事業者の運用を重視する人。' }
  '3' = @{ pros = 'バナーに加えて動画・ネイティブなど複数形式を扱い、AMPやUnity、AdMobメディエーションにも対応。3,000円を超えた月の翌月末に支払われる。'; cons = '掲載媒体の審査があり、承認日数は公開されていない。振込手数料は一律300円で、報酬の通常の繰越期間は1年間。'; recommended_for = 'スマートフォン向けサイトやアプリで、バナー以外の広告形式も試したい人。国内銀行振込と翌月末払いを重視する人。' }
  '4' = @{ pros = '最低トラフィック要件がなく、公式案内では承認は約10分。バナー、ネイティブ、Social Bar、Popunder、Smartlinkなど広告形式が多く、Webサイトがない導線にも対応する。'; cons = '管理・サポート情報は英語中心。Popunderやインタースティシャルなどは読者体験を損ねる可能性があるため、形式を選んで慎重に配置する必要がある。支払下限は受取方法ごとに異なる。'; recommended_for = 'AdSense以外を早く試したい小規模サイトや、海外トラフィックも収益化したい人。英語の管理画面や本人確認に対応でき、穏当な広告形式を自分で選べる人。' }
  '5' = @{ pros = '日本語で登録でき、個人も申込み可能。Webサイトとアプリの両方に対応し、バナー、ネイティブ、動画、インタースティシャルなど複数形式を一つのSSPで扱える。'; cons = '媒体審査があり、審査期間や最低トラフィックの明確な公開目安は確認できない。最低支払額は5,000円（税抜）で、超小規模サイトでは受取まで時間がかかる可能性がある。'; recommended_for = '日本語サポートを重視し、スマートフォン向けサイトまたはアプリを複数の広告形式で収益化したい人。5,000円まで報酬を積み上げられる人。' }
}

foreach ($row in $rows) {
  if ($editorialResearch.ContainsKey($row.id)) {
    $row.pros = $editorialResearch[$row.id].pros
    $row.cons = $editorialResearch[$row.id].cons
    $row.recommended_for = $editorialResearch[$row.id].recommended_for
    $row.last_verified_date = '2026-08-12'
  }
}

$jpFitMap = @{
  '高確度OK/個別審査' = '個別審査'
  '個別審査/不明' = '個別審査'
  '個別審査/実質不向き' = '実質不向き'
  '実質不向き/個別審査' = '実質不向き'
  '実質不向き（日本国内流入中心）' = '実質不向き'
}

foreach ($row in $rows) {
  if ($jpFitMap.ContainsKey($row.japanese_site_fit)) {
    $row.japanese_site_fit = $jpFitMap[$row.japanese_site_fit]
  }
  if ($row.bank_transfer -notin @('Yes', 'No', 'Conditional', 'Unknown')) {
    $row.bank_transfer = 'Unknown'
  }
  if ($row.japan_bank_only_complete -like 'Yes*') {
    $row.japan_bank_only_complete = 'Yes'
  } elseif ($row.japan_bank_only_complete -like 'Conditional*' -or $row.japan_bank_only_complete -like 'Likely Yes*') {
    $row.japan_bank_only_complete = 'Conditional'
  }
  if ($row.change_risk -eq 'Low-Medium') {
    $row.change_risk = 'Medium'
  }
}

$microAd = $rows | Where-Object id -eq '26'
$microAd.bank_transfer = 'Yes'
$microAd.japan_bank_only_complete = 'Yes'
$microAd.bank_method = '国内銀行振込'
$microAd.payout_processor = '自社支払'
$microAd.minimum_payout_overall = '8,000円（税抜。未満は繰越）'
$microAd.minimum_payout_bank = '8,000円（税抜）'
$microAd.payout_schedule = '月末締め・翌々月末まで'
$microAd.payout_currency = 'JPY'
$microAd.payout_fee_note = '振込手数料はMicroAd負担'
$microAd.source_requirements_url = 'https://www.microad.co.jp/contact/compass/'
$microAd.source_payment_url = 'https://www.microad.co.jp/contact/compass/'
$microAd.confidence = 'High'
$microAd.notes = '公式利用規約Article 12で国内銀行振込、8,000円（税抜）、翌々月末、振込手数料MicroAd負担を確認。'

$exoClick = $rows | Where-Object id -eq '15'
$exoClick.minimum_payout_overall = '20 EUR/USD（BitPay・Paxum）'
$exoClick.minimum_payout_bank = '200 EUR/USD（Wire）'
$exoClick.payout_schedule = '週次Net7（月曜）または月次Net20'
$exoClick.payout_currency = 'EUR/USD'
$exoClick.source_payment_url = 'https://docs.exoclick.com/publishers/payments/payment-options-timescales'
$exoClick.confidence = 'High'
$exoClick.notes = '公式Payments文書でWire最低200 EUR/USD、週次Net7または月次Net20を確認。日本の銀行での受取可否・中継銀行手数料は口座ごとに確認。'

foreach ($row in $rows) {
  if ($row.id -eq '6') {
    $row.recommendation_rank_jp_beginner = '30'
    $row.beginner_tier = 'C'
    $row.zero_to_one_score_1_5 = '1'
    $row.growth_stage = '比較基準 / AdSense審査通過後'
    $row.custom_domain_requirement = '必須'
    $row.beginner_recommendation = '本DBでは非推奨の比較基準。通常サイト申請は独自ドメイン前提で、審査不承認時に修正点を絞り込みにくい。AdSenseに通らない人は上位の代替候補を比較。'
    $row.source_requirements_url = 'https://support.google.com/adsense/answer/2784438?hl=ja'
    $row.notes = '通常サイト申請は標準ドメインURLを入力。Blogger等Host Partnerは別申請経路のため、このDBの独自ドメイン判定から除外。Googleは承認率を公表していないため、非公式な却下率は採用しない。'
  } elseif ([int]$row.id -gt 6) {
    $row.recommendation_rank_jp_beginner = [string]([int]$row.id - 1)
  } else {
    $row.recommendation_rank_jp_beginner = $row.id
  }
}

$removedDomainColumns = @(
  'free_subdomain_policy',
  'hosting_evidence_level',
  'blogspot_free_url',
  'wordpress_com_free_url',
  'github_pages_free_url',
  'vercel_free_subdomain',
  'cloudflare_pages_free_subdomain',
  'static_site_technical_fit',
  'source_domain_url',
  'custom_domain_category'
)
foreach ($row in $rows) {
  foreach ($column in $removedDomainColumns) {
    $row.PSObject.Properties.Remove($column)
  }
}

$headers = @($rows[0].PSObject.Properties.Name)
$output = [System.Collections.Generic.List[string]]::new()
$output.Add(($headers -join "`t"))
foreach ($row in $rows) {
  $values = foreach ($header in $headers) {
    ([string]$row.$header).Replace("`t", ' ').Replace("`r", ' ').Replace("`n", ' ')
  }
  $output.Add(($values -join "`t"))
}
$output | Set-Content -LiteralPath $dbPath -Encoding utf8

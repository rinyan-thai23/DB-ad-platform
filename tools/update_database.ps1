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

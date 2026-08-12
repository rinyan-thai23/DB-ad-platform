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
  foreach ($field in @('operator_country', 'publisher_content_languages', 'recommended_audience_geos', 'language_revenue_note', 'source_language_geo_url')) {
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

$marketProfiles = @{
  '1'=@('日本','日本語','日本','日本語サイト向け。広告需要が国内中心のため、日本語以外の媒体は案件充足を要確認。','https://www.ninja.co.jp/admax/')
  '2'=@('日本','日本語','日本','日本語の国内トラフィック向け。媒体言語より訪問者の所在地と国内広告需要が収益を左右する。','https://adpf-info.i-mobile.co.jp/')
  '3'=@('日本','日本語中心','日本','日本のスマートフォン利用者向け案件が中心。外国語サイトは対象国の広告在庫を事前確認。','https://zucks.co.jp/publisher/adnetwork/')
  '4'=@('キプロス','多言語','世界各国（日本を含む）','サイトが英語である必要はない。広告は訪問者の国に合わせて配信され、公式データでも国・端末によりCPMが大きく異なる。','https://adsterra.com/blog/how-much-adsterra-pays/')
  '5'=@('日本','日本語中心','日本','国内案件中心。日本語以外でも技術的な掲載可否とは別に、その言語圏・地域向け広告在庫で収益が変わる。','https://ja.ad-stir.com/')
  '6'=@('アメリカ','多言語','世界各国','コンテンツ言語に対応した広告を配信できるが、Page RPMは訪問者の国、分野、広告需要で変動する。','https://support.google.com/adsense/answer/9727?hl=ja')
  '7'=@('イスラエル','多言語','世界各国','全ての国のトラフィックを受け付ける。言語そのものより訪問者の国・品質・広告形式でCPMが変わる。','https://webflow.ad-maven.com/publishers')
  '8'=@('アメリカ','多言語','世界各国','世界のPublisherを対象とするコンテキスト広告。ページ文脈と言語に合う広告需要が少ない市場では収益が下がり得る。','https://www.infolinks.com/')
  '9'=@('エストニア','多言語','世界各国','現地語サイトも収益化可能。事例ではベトナム語・インドネシア語の地域特化が有効で、同じ言語でも訪問者の国によりRPMが異なる。','https://adcash.com/knowledge/three-case-studies-playbook-in-southeast-asia/')
  '10'=@('イギリス','多言語','世界各国','多国籍トラフィック向け。英語必須ではなく、訪問者の国・広告形式・端末構成が単価を左右する。','https://hilltopads.com/publishers/')
  '11'=@('コスタリカ','多言語','40か国以上','英語サイト限定ではない。公式は米国訪問者の収益例を示しており、国別の広告需要差が大きい。','https://www.popads.net/publishers.html')
  '12'=@('チェコ','多言語','世界各国','多地域のトラフィックを扱う。Publisher収益は訪問者の国、広告主需要、形式、品質に依存する。','https://www.clickadu.com/cpm-ad-network')
  '13'=@('イスラエル','多言語','世界各国','固定単価はなく、公式説明ではトラフィックの品質・量と広告主の入札水準で収益が変わる。','https://zendesk.bidvertiser.com/hc/en-us/articles/213569789-Why-haven-t-I-generated-any-revenue')
  '14'=@('キプロス','多言語','世界各国','英語以外も対象。国別CPM差が大きく、同じ言語でも訪問者の所在地・広告形式・端末で収益が変わる。','https://monetag.com/blog/twitter-7k-case-study/')
  '15'=@('スペイン','多言語','世界各国','世界各国・複数言語の媒体を扱う。特に成人・娯楽系では国別需要と端末別の広告形式が収益を左右する。','https://www.exoclick.com/publishers/')
  '16'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏Publisher向けのNative広告色が強い。日本語媒体での案件充足・収益性は事前確認が必要。','https://www.revcontent.com/publishers/')
  '17'=@('アメリカ','多言語','世界各国','多言語Native広告に対応するが、記事言語と広告需要の一致が重要。訪問者の国・分野で収益が変わる。','https://www.mgid.com/publishers')
  '18'=@('アメリカ','英語中心','アメリカ・カナダ・イギリス等','英語以外を一律禁止する意味ではないが、プレミアム英語圏トラフィック比率がRPMに強く影響する。','https://www.journeymv.com/')
  '19'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏向けManaged広告。日本語など非英語トラフィックでは広告需要と審査適合を要確認。','https://www.monumetric.com/')
  '20'=@('アメリカ','英語中心','アメリカ中心','英語圏トラフィックを主対象とするManaged広告。サイト言語より米国訪問者比率が収益性に影響する。','https://newormedia.com/')
  '21'=@('アメリカ','英語中心','アメリカ・カナダ・イギリス・オーストラリア・ニュージーランド','プレミアム英語圏トラフィック中心。日本語サイトは主要対象外となる可能性が高い。','https://raptive.com/creator/')
  '22'=@('アメリカ','多言語','世界各国','多言語媒体を扱えるが、EPMVは訪問者の国・広告需要・サイト分野で変動する。','https://www.ezoic.com/')
  '23'=@('ラトビア','多言語','ヨーロッパ・世界各国','多言語Publisherに対応。Header Biddingの需要は訪問者の国ごとに異なり、欧米トラフィックが有利になりやすい。','https://setupad.com/')
  '24'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏の高品質トラフィックを主対象とする。非英語媒体は申請可否と広告需要を個別確認。','https://www.mediavine.com/')
  '25'=@('オーストラリア','英語中心','オーストラリア・北米・イギリス等','主に英語圏のPremium Publisher向け。日本語媒体は規模と対象地域を個別相談。','https://www.publift.com/')
  '26'=@('日本','日本語中心','日本','国内Publisher向け。外国語媒体は訪問者地域に合うDSP需要があるか個別確認。','https://www.microad.co.jp/services/adplatform/microad-compass/')
  '27'=@('日本','日本語','日本','日本語記事の文脈解析を強みとするため、日本語媒体向き。外国語コンテンツの解析・案件は要確認。','https://lift.logly.co.jp/')
  '28'=@('日本','日本語中心','日本','国内SSPとして日本の広告需要に強い。外国語サイトは対象地域と接続需要を個別相談。','https://corp.fluct.jp/service/ssp/')
  '29'=@('日本','多言語','日本・世界各国','国内外の広告需要に接続し海外ユーザーも収益化可能。言語より訪問者の国と接続先需要が重要。','https://geniee.co.jp/products/ssp/')
  '30'=@('アメリカ','英語中心','主に北米・英語圏','大規模英語圏Publisher向け。非英語媒体は対象地域・規模・広告需要を個別確認。','https://freestar.com/')
}

foreach ($row in $rows) {
  $profile = $marketProfiles[$row.id]
  $row.operator_country = $profile[0]
  $row.publisher_content_languages = $profile[1]
  $row.recommended_audience_geos = $profile[2]
  $row.language_revenue_note = $profile[3]
  $row.source_language_geo_url = $profile[4]
  $row.home_region = if ($profile[0] -eq '日本') { '日本' } else { "海外/$($profile[0])" }
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
  } elseif ($row.id -eq '1') {
    $row.recommendation_rank_jp_beginner = '29'
    $row.beginner_tier = 'C'
    $row.zero_to_one_score_1_5 = '2'
    $row.beginner_recommendation = '登録・設置は容易だが、公開された実収益例では極めて低収益の報告が複数ある。広告設置の練習用途を除き、主な収益源としては非推奨。'
    $row.notes = '公開実例として12か月・36,721表示で17円、月間約10万PVで約50円という報告を確認。媒体差はあるが、旧1位評価は収益実態と整合しないため29位へ変更。'
  } elseif ([int]$row.id -ge 2 -and [int]$row.id -le 5) {
    $row.recommendation_rank_jp_beginner = [string]([int]$row.id - 1)
  } elseif ([int]$row.id -gt 6) {
    $row.recommendation_rank_jp_beginner = [string]([int]$row.id - 2)
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
  'custom_domain_category',
  'pros',
  'cons',
  'recommended_for',
  'pros_source_urls',
  'cons_source_urls'
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

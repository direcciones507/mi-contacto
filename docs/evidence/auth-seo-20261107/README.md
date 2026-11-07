# Authentication and public SEO — 2026-11-07

## Real delivery and authentication

Existing service and PostgreSQL reused. Public registration at https://micontacto.online returned 202 for the owner-controlled address ventas@direcciones507.com. Resend confirmed:

- Verification delivered: 01a1b7b1-57a5-7cef-b4d3-3c15c6c6fe32.
- Recovery delivered: 01a1b7b2-6944-7d26-88f8-558771589872.

Live checks are recorded in live-auth-results.json. The account has no published profile; no existing account, profile, photo or payment was changed. Random test credentials and email tokens are excluded from the repository. The owner can use normal password recovery for this account.

## Outlook blocker (not resolved)

Message 01a1b79e-9b5d-7a72-9be1-845a47d09030 bounced. Raw Resend response obtained through its API request log contained:

`smtp; 550 5.7.1 Message rejected: Message lacks SPF/DKIM/DMARC Auth Records (AS9031519)`

Resend: mail.direcciones507.com verified; sending enabled. Public DNS confirms DKIM at resend._domainkey.mail.direcciones507.com and SPF at send.mail.direcciones507.com. Public DNS returns NXDOMAIN for both _dmarc.mail.direcciones507.com and _dmarc.direcciones507.com.

Required DNS addition on direcciones507.com:

| Type | Name | Content | TTL |
|---|---|---|---|
| TXT | _dmarc.mail | v=DMARC1; p=none; adkim=r; aspf=r | Auto or 300 |

No available connected integration can edit the authoritative DNS zone. This record must be added by the owner or through an authorized DNS connection. After propagation, re-verify the domain and retry an Outlook verification message. Missing DMARC is confirmed; successful delivery after adding it is NOT yet proven. Do not claim authentication works for every provider until Outlook delivery is confirmed.

## Verification

32 targeted authentication/Google/SEO tests passed before the expanded populated-directory assertions. Directory SQL validation also passed. Full suite: 177 passed, 20 failed; baseline at 9b4089d: 162 passed, 34 failed. All remaining failure names also fail on baseline. Legacy assertions for Google scope and recipient allowlists were updated to current production behavior; Google implementation was unchanged.

Browser execution was attempted but Chromium was blocked by the environment: socket() failed: Operation not permitted. Physical phone/tablet/desktop journeys are not claimed complete.

## SEO policy

Public indexable routes: /, /directorio, /directorio/{country}, /directorio/{country}/region/{id}, /directorio/{country}/localidad/{id}. Regions include provincial and municipal levels from the existing catalogue. Canonical, title, description and Open Graph are rendered server-side, without login. Country and regional navigation is crawlable HTML. Directory cards use only the existing published-profile visibility rules and are marked data-nosnippet.

All other existing routes retain noindex, including personal cards, access/registration, private dashboards, API and payment pages. Sitemap contains the home, general directory, enabled countries, and populated regions/localities derived only from active published consenting profiles. Location consent is required to include their geography. No profile identifiers, names, contact data or individual profile URLs enter the sitemap. More than 50,000 URLs are partitioned into child sitemaps. Empty locations remain navigable but are not promoted in the sitemap.

## Search engine ownership

Owner can add https://micontacto.online/ as a URL-prefix property in Google Search Console and Bing Webmaster Tools. Use each provider's actual supplied verification token (HTML meta tag or DNS TXT); no token has been invented or installed. Submit https://micontacto.online/sitemap.xml after ownership verification. No Google/Bing indexing or submission is claimed.

import re

path = 'src/features/marketing/presentation/navigation.ts'
with open(path, 'r') as f:
    content = f.read()

target = r"(\{\s*href:\s*ROUTES\.security,\s*label:\s*t\.t\('nav\.security'\)\s*\},)"
replacement = r"\1\n\t\t\t\t{ href: ROUTES.about, label: 'About Us' },\n\t\t\t],\n\t\t},\n\t\t{\n\t\t\ttitle: 'Support',\n\t\t\tlinks: [\n\t\t\t\t{ href: ROUTES.faq, label: 'FAQ' },\n\t\t\t\t{ href: ROUTES.support, label: 'Help & Support' },"

# Replace only the first occurrence which is in siteNavItems? No, siteNavItems is an array of length 4. siteFooterGroups is later.
# Actually, siteNavItems:
# return [
#   { href: ROUTES.howItWorks, label: t.t('nav.howItWorks') },
#   { href: ROUTES.useCases, label: t.t('nav.useCases') },
#   { href: ROUTES.pricing, label: t.t('nav.pricing') },
#   { href: ROUTES.security, label: t.t('nav.security') },
# ];
#
# siteFooterGroups:
# {
#   title: t.t('footer.product'),
#   links: [
#     { href: ROUTES.howItWorks, label: t.t('nav.howItWorks') },
#     { href: ROUTES.pricing, label: t.t('nav.pricing') },
#     { href: ROUTES.security, label: t.t('nav.security') },
#   ],
# }
# So replacing the SECOND occurrence is correct!

occurrences = list(re.finditer(target, content))
if len(occurrences) >= 2:
    start, end = occurrences[1].span()
    new_content = content[:start] + re.sub(target, replacement, content[start:end]) + content[end:]
    with open(path, 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print(f"Found {len(occurrences)} occurrences")

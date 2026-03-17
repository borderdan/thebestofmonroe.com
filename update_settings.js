const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/app/settings/page.tsx', 'utf8');

if (!content.includes('import { useTranslations } from \'next-intl\'')) {
  content = content.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { useTranslations } from 'next-intl'");
}

if (!content.includes('const t = useTranslations(\'settings\')')) {
  content = content.replace("export default function SettingsPage() {", "export default function SettingsPage() {\n  const t = useTranslations('settings')");
}

content = content.replace(/<h1 className="text-3xl font-bold tracking-tight">Business Settings<\/h1>/g, '<h1 className="text-3xl font-bold tracking-tight">{t(\'title\')}</h1>');
content = content.replace(/<p className="text-muted-foreground">Manage your public profile and global branding.<\/p>/g, '<p className="text-muted-foreground">{t(\'subtitle\')}</p>');

content = content.replace(/<CardTitle>Branding Assets<\/CardTitle>/g, '<CardTitle>{t(\'branding\')}</CardTitle>');
content = content.replace(/<CardDescription>Upload your logo and cover photo for the public directory.<\/CardDescription>/g, '<CardDescription>{t(\'brandingDesc\')}</CardDescription>');
content = content.replace(/<Label>Business Logo \(1:1\)<\/Label>/g, '<Label>{t(\'logo\')}</Label>');
content = content.replace(/<Label>Cover Photo \(16:9\)<\/Label>/g, '<Label>{t(\'cover\')}</Label>');

content = content.replace(/<CardTitle>Basic Information<\/CardTitle>/g, '<CardTitle>{t(\'basicInfo\')}</CardTitle>');
content = content.replace(/<CardDescription>Core details used for generating your URL slug and receipts.<\/CardDescription>/g, '<CardDescription>{t(\'basicInfoDesc\')}</CardDescription>');
content = content.replace(/<Label htmlFor="name">Business Name<\/Label>/g, '<Label htmlFor="name">{t(\'bizName\')}</Label>');
content = content.replace(/<Label htmlFor="city">Operating City<\/Label>/g, '<Label htmlFor="city">{t(\'city\')}</Label>');

content = content.replace(/<CardTitle>Contact Information<\/CardTitle>/g, '<CardTitle>{t(\'contactInfo\')}</CardTitle>');
content = content.replace(/<CardDescription>How customers can reach you.<\/CardDescription>/g, '<CardDescription>{t(\'contactDesc\')}</CardDescription>');
content = content.replace(/<Label htmlFor="email">Public Email<\/Label>/g, '<Label htmlFor="email">{t(\'email\')}</Label>');
content = content.replace(/<Label htmlFor="phone">Phone Number<\/Label>/g, '<Label htmlFor="phone">{t(\'phone\')}</Label>');
content = content.replace(/<Label htmlFor="website">Website<\/Label>/g, '<Label htmlFor="website">{t(\'website\')}</Label>');

content = content.replace(/<CardTitle>Location<\/CardTitle>/g, '<CardTitle>{t(\'location\')}</CardTitle>');
content = content.replace(/<CardDescription>Your physical business address.<\/CardDescription>/g, '<CardDescription>{t(\'locationDesc\')}</CardDescription>');
content = content.replace(/<Label htmlFor="address">Address<\/Label>/g, '<Label htmlFor="address">{t(\'address\')}</Label>');

content = content.replace(/<CardTitle>Loyalty Program<\/CardTitle>/g, '<CardTitle>{t(\'loyalty\')}</CardTitle>');
content = content.replace(/<CardDescription className="mt-1">\s+Reward regular customers with &quot;BOM Points&quot; on every purchase.\s+<\/CardDescription>/g, '<CardDescription className="mt-1">\n                {t(\'loyaltyDesc\')}\n              </CardDescription>');
content = content.replace(/<Label htmlFor="points_rate">Points Earned per \$1 MXN<\/Label>/g, '<Label htmlFor="points_rate">{t(\'pointsRate\')}</Label>');
content = content.replace(/<p className="text-\[10px\] text-muted-foreground">e.g. 1.0 = 1 point per peso spent.<\/p>/g, '<p className="text-[10px] text-muted-foreground">{t(\'pointsRateHelp\')}</p>');
content = content.replace(/<Label htmlFor="redemption_ratio">Redemption Value \(\$ per point\)<\/Label>/g, '<Label htmlFor="redemption_ratio">{t(\'redemptionValue\')}</Label>');
content = content.replace(/<p className="text-\[10px\] text-muted-foreground">e.g. 0.05 = 100 points give a \$5 discount.<\/p>/g, '<p className="text-[10px] text-muted-foreground">{t(\'redemptionHelp\')}</p>');
content = content.replace(/<Label htmlFor="min_points">Min. Points to Redeem<\/Label>/g, '<Label htmlFor="min_points">{t(\'minPoints\')}</Label>');
content = content.replace(/<p className="text-\[10px\] text-muted-foreground">Threshold before points can be used.<\/p>/g, '<p className="text-[10px] text-muted-foreground">{t(\'minPointsHelp\')}</p>');

content = content.replace(/<CardTitle>Currency & Payments<\/CardTitle>/g, '<CardTitle>{t(\'currencyTitle\')}</CardTitle>');
content = content.replace(/<CardDescription>\s+Select which currencies your POS terminals will accept and set your primary currency.\s+<\/CardDescription>/g, '<CardDescription>\n              {t(\'currencyDesc\')}\n            </CardDescription>');
content = content.replace(/<Label>Accepted Currencies<\/Label>/g, '<Label>{t(\'acceptedCurrencies\')}</Label>');
content = content.replace(/<Label htmlFor="default_currency">Default \/ Primary Currency<\/Label>/g, '<Label htmlFor="default_currency">{t(\'defaultCurrency\')}</Label>');
content = content.replace(/<p className="text-\[10px\] text-muted-foreground italic">\s+Exchange rates are updated automatically every 4 hours.\s+<\/p>/g, '<p className="text-[10px] text-muted-foreground italic">\n                {t(\'currencyHelp\')}\n              </p>');

content = content.replace(/<CardTitle>Automated Business Reports<\/CardTitle>/g, '<CardTitle>{t(\'reportsTitle\')}</CardTitle>');
content = content.replace(/<CardDescription className="mt-1">\s+Receive weekly PDF summaries of your revenue, hot leads, and inventory alerts.\s+<\/CardDescription>/g, '<CardDescription className="mt-1">\n                {t(\'reportsDesc\')}\n              </CardDescription>');
content = content.replace(/<Label htmlFor="report_email">Recipient Email<\/Label>/g, '<Label htmlFor="report_email">{t(\'recipientEmail\')}</Label>');
content = content.replace(/<p className="text-\[10px\] text-muted-foreground italic">\s+Leave blank to send to the business owner&apos;s primary email.\s+<\/p>/g, '<p className="text-[10px] text-muted-foreground italic">\n                  {t(\'recipientHelp\')}\n                </p>');
content = content.replace(/<Label>Frequency<\/Label>/g, '<Label>{t(\'frequency\')}</Label>');
content = content.replace(/Weekly \(Mondays 8:00 AM\)/g, '{t(\'weekly\')}');
content = content.replace(/Save Changes/g, '{t(\'saveChanges\')}');

fs.writeFileSync('src/app/[locale]/app/settings/page.tsx', content);
console.log('Settings updated!');

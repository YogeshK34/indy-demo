const fs = require('fs');

function replaceFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content);
}

replaceFile('./app/holder/holder-client.tsx', [
  {
    from: /<Card key=\{cred\.id\}>/,
    to: `<Card key={cred.id} className="border-l-[6px] border-l-[#0A0A0A] dark:border-l-white">`
  },
  {
    from: /<CardTitle className="text-base">\s*\{cred\.credential_type\}\s*<\/CardTitle>/,
    to: `<CardTitle className="text-base font-bold uppercase">\n                          {cred.credential_type}\n                        </CardTitle>`
  },
  {
    from: /<CardDescription className="font-mono text-xs mt-1">\s*Issuer: \{cred\.issuer_did\.slice\(0, 40\)\}…\s*<\/CardDescription>/,
    to: `<CardDescription className="font-mono text-xs mt-1">\n                          {cred.issuer_did.slice(0, 40)}…\n                        </CardDescription>`
  },
  {
    from: /<Badge\s*variant=\{\s*cred\.status === "active" \? "secondary" : "destructive"\s*\}\s*className="capitalize"\s*>\s*\{cred\.status\}\s*<\/Badge>/,
    to: `<Badge\s*variant={cred.status === "active" ? "default" : "destructive"}\s*className="uppercase">\n                        {cred.status}\n                      </Badge>`
  },
  {
    from: /<Button\s*size="sm"\s*onClick=\{([^}]*)\}\s*disabled=\{([^\}]*)\}\s*>/,
    to: `<Button\n                        size="sm"\n                        onClick={$1}\n                        disabled={$2}\n                        className="bg-[#FFDD00] text-black border-2 border-black hover:bg-[#FFDD00]/90"\n                      >`
  },
  {
    from: /<CardTitle className="flex items-center gap-2 text-base">\s*<ShieldCheck className="size-4" \/>\s*Prove Key Ownership\s*<\/CardTitle>/,
    to: `<CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">\n            <ShieldCheck className="size-4" />\n            PROVE OWNERSHIP\n          </CardTitle>`
  },
  {
    from: /<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">\s*Challenge \(what was signed\)\s*<\/p>/,
    to: `<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">\n                  ONLY YOUR KEY CAN PRODUCE THIS\n                </p>`
  },
  {
    from: /<pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono break-all">/g,
    to: `<pre className="border-2 border-black bg-white dark:bg-black px-4 py-3 text-xs font-mono break-all">`
  },
  {
    from: /<pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono break-all whitespace-pre-wrap">/g,
    to: `<pre className="border-2 border-black bg-white dark:bg-black px-4 py-3 text-xs font-mono break-all whitespace-pre-wrap">`
  },
  {
    from: /<pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">/g,
    to: `<pre className="border-2 border-black bg-[#0A0A0A] text-[#00C853] p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">`
  }
]);

console.log('holder updated');

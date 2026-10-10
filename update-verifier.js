const fs = require('fs');

function replaceFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content);
}

replaceFile('./app/verifier/verifier-client.tsx', [
  {
    from: /rows=\{6\}/,
    to: `rows={8}`
  },
  {
    from: /<Button\n\s*onClick=\{handleVerify\}\n\s*disabled=\{verifying \|\| !jwtVp\.trim\(\)\}\n\s*>/,
    to: `<Button\n            onClick={handleVerify}\n            disabled={verifying || !jwtVp.trim()}\n            className="w-full"\n            size="lg"\n          >`
  },
  {
    from: /<Alert\n\s*variant=\{result\.valid \? "default" : "destructive"\}\n\s*className=\{\n\s*result\.valid\n\s*\? "border-green-600 bg-green-50 dark:bg-green-950"\n\s*: undefined\n\s*\}\n\s*>/,
    to: `<Alert\n            variant={result.valid ? "success" : "destructive"}\n          >`
  },
  {
    from: /\{result\.valid \? \(\n\s*<CheckCircle className="size-4 text-green-600" \/>\n\s*\) : \(\n\s*<XCircle className="size-4" \/>\n\s*\)\}/,
    to: `{result.valid ? (\n              <CheckCircle className="size-4" />\n            ) : (\n              <XCircle className="size-4" />\n            )}`
  },
  {
    from: /<AlertDescription className="font-medium">\n\s*\{result\.valid \? \(\n\s*<>\n\s*✓ Credential is\{" "\}\n\s*<span className="text-green-700 dark:text-green-400">\n\s*VALID\n\s*<\/span>\{" "\}\n\s*— Issued by\{" "\}/,
    to: `<div className="font-[900] text-lg uppercase tracking-tight mb-2">\n              {result.valid ? "✓ CREDENTIAL VALID" : "✗ VERIFICATION FAILED"}\n            </div>\n            <AlertDescription className="font-medium text-sm">\n              {result.valid ? (\n                <>\n                  Issued by{" "}`
  },
  {
    from: /<span className="text-destructive">FAILED<\/span>\n\s*\{result\.result\.error && \(\n\s*<>\s*—\s*\{result\.result\.error\}<\/([^>]+)>\n\s*\)\}/,
    to: `{result.result.error && (\n                    <>Reason: {result.result.error}</>\n                  )}`
  },
  {
    from: /<div\n\s*key=\{check\.label\}\n\s*className="flex items-start gap-3 py-2"\n\s*>/g,
    to: `<div\n                  key={check.label}\n                  className="flex items-center justify-between py-3 border-b border-black last:border-0"\n                >`
  },
  {
    from: /\{check\.passed \? \(\n\s*<CheckCircle className="size-5 text-green-600 shrink-0 mt-0\.5" \/>\n\s*\) : \(\n\s*<XCircle className="size-5 text-destructive shrink-0 mt-0\.5" \/>\n\s*\)\}/,
    to: ``
  },
  {
    from: /<div className="flex items-center gap-2">\n\s*<span className="text-sm font-medium">\{check\.label\}<\/span>\n\s*<Badge\n\s*variant=\{check\.passed \? "secondary" : "destructive"\}\n\s*className="text-xs"\n\s*>\n\s*\{check\.passed \? "PASS" : "FAIL"\}\n\s*<\/Badge>\n\s*<\/div>\n\s*<p className="text-xs text-muted-foreground">\n\s*\{check\.description\}\n\s*<\/p>/g,
    to: `<span className="text-sm font-mono font-bold uppercase tracking-wide">{check.label}</span>\n                  <Badge\n                    variant={check.passed ? "success" : "destructive"}\n                    className="text-xs rounded-none"\n                  >\n                    {check.passed ? "✓ PASS" : "✗ FAIL"}\n                  </Badge>`
  }
]);

console.log('verifier updated');

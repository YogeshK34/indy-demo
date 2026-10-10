const fs = require('fs');

function replaceFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content);
}

// Label
replaceFile('./components/ui/label.tsx', [
  {
    from: /const labelVariants = cva\([\s\S]*?\)\n/,
    to: `const labelVariants = cva(
  "text-xs font-bold uppercase tracking-[0.08em] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)\n`
  }
]);

// issuer-client
replaceFile('./app/issuer/issuer-client.tsx', [
  {
    from: /<Card>/,
    to: `<Card className="shadow-[6px_6px_0px_#0A0A0A] dark:shadow-[6px_6px_0px_#F5F5F0]">`
  },
  {
    from: /<Button type="submit" disabled=\{submitting\}>/,
    to: `<Button type="submit" disabled={submitting} className="w-full" size="lg">`
  },
  {
    from: /<CardTitle className="text-base">Decoded Payload<\/CardTitle>/,
    to: `<CardTitle className="text-base uppercase tracking-tight">DECODED PAYLOAD</CardTitle>`
  },
  {
    from: /<CardTitle className="text-base">Raw JWT \(jwt_vc\)<\/CardTitle>/,
    to: `<CardTitle className="text-base uppercase tracking-tight">RAW JWT</CardTitle>`
  },
  {
    from: /<pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\s*\{JSON\.stringify\(issued\.decodedPayload, null, 2\)\}\s*<\/pre>/,
    to: `<pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\n                  {JSON.stringify(issued.decodedPayload, null, 2)}\n                </pre>`
  },
  {
    from: /<pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\s*\{issued\.jwtVc\}\s*<\/pre>/,
    to: `<pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\n                  {issued.jwtVc}\n                </pre>`
  }
]);

console.log('issuer updated');

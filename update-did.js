const fs = require('fs');

function replaceFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content);
}

replaceFile('./app/did/did-client.tsx', [
  {
    from: /<Button onClick=\{generateDID\} disabled=\{generating\}>/,
    to: `<Button onClick={generateDID} disabled={generating} className="w-full" size="lg">`
  },
  {
    from: /<pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono break-all whitespace-pre-wrap">\s*\{state\.did\}\s*<\/pre>/,
    to: `<pre className="border-2 border-black bg-white dark:bg-black p-4 font-mono text-sm break-all whitespace-pre-wrap">\n                  {state.did}\n                </pre>`
  },
  {
    from: /<pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono break-all">\s*\{state\.publicKeyBase58\}\s*<\/pre>/,
    to: `<pre className="border-2 border-black bg-white dark:bg-black p-4 font-mono text-sm break-all">\n                  {state.publicKeyBase58}\n                </pre>`
  },
  {
    from: /<pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono break-all flex-1">\s*\{state\.cheqdTxHash\}\s*<\/pre>/,
    to: `<pre className="text-muted-foreground underline-offset-4 hover:underline font-mono text-sm break-all flex-1">\n                      {state.cheqdTxHash}\n                    </pre>`
  },
  {
    from: /<Button\n\s*onClick=\{anchorOnCheqd\}\n\s*disabled=\{anchoring\}\n\s*variant="secondary"\n\s*>/,
    to: `<Button\n                      onClick={anchorOnCheqd}\n                      disabled={anchoring}\n                      variant="secondary"\n                      className="bg-[#FFDD00] border-2 border-black"\n                    >`
  },
  {
    from: /<pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\s*\{JSON\.stringify\(state\.didDocument, null, 2\)\}\s*<\/pre>/,
    to: `<pre className="bg-[#0A0A0A] text-[#00C853] border-2 border-black p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">\n                  {JSON.stringify(state.didDocument, null, 2)}\n                </pre>`
  }
]);

console.log('did-client updated');

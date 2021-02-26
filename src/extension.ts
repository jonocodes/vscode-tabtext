import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

const icon_map = [vscode.SymbolKind.Namespace,
	vscode.SymbolKind.Interface,
	vscode.SymbolKind.Class,
	vscode.SymbolKind.Function,
	vscode.SymbolKind.String];

const max_level = icon_map.length;

const empty_line = /^\s*$/;

export function activate(context: ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(
		{language: "tabtext"}, new TabtextDocumentSymbolProvider()
	));
}

function make_symbol_tree(line_data: string | any[], level=0): vscode.DocumentSymbol[] {

	const symbols = [] as vscode.DocumentSymbol[];

  for (let i=0; i<line_data.length; i++) {

		const current = line_data[i];
    let next = {'level':-1};

    if (i+1 < line_data.length) {
      next = line_data[i+1];
    }

		if (current['level'] > level) {
			continue;
    }
		if (current['level'] < level) {
			return symbols;
    }

		const symbol = new vscode.DocumentSymbol(
			current['name'], '', icon_map[level], current['line'].range, current['line'].range);

		if (next['level'] == level){
			symbols.push(symbol);
    }
		else if (next['level'] > level) {

			if (level >= max_level) {
				symbol.detail = '....';
			} else {
				const subtree = make_symbol_tree(line_data.slice(i+1), next['level']);
				for (let c=0; c<subtree.length; c++) {
					symbol.children.push(subtree[c]);
				}
			}

			symbols.push(symbol);
    }
		else {
			symbols.push(symbol);
			return symbols;
    }
  }

	return symbols;
}

class TabtextDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	public provideDocumentSymbols(document: vscode.TextDocument,
					token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {
			return new Promise((resolve, reject) => {
					let symbols = [];
					const lines_data = [];

					// preparse lines to find their levels
					for (let i=0; i<document.lineCount; i++) {
						const line = document.lineAt(i);
						if (!empty_line.test(line.text)) {
							const name = line.text.replace(/^\t*/, '');
							lines_data.push({'name': name, 'line': line,
								'level': line.text.length - name.length,});
						}
					}

					symbols = make_symbol_tree(lines_data);

					resolve(symbols);
			});
	}
}

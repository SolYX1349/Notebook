export class CodeHighlighter {
    static escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/  /g, '&nbsp; ');
    }

    static detectLanguage(code) {
        const trimmed = code.trim();

        const hasDoctype = /<!DOCTYPE\s+html/i.test(trimmed);
        const hasHtmlClosingTag = /<\/(html|head|body|div|span|p|a|h[1-6]|ul|ol|li|table|tr|td|th|form|button|section|header|footer|nav)>/i.test(trimmed);
        const hasCommonHtmlTag = /<(html|head|body|div|span|p|a|h[1-6]|ul|ol|li|table|tr|td|th|form|input|button|textarea|select|option|img|script|style|link|meta|header|footer|nav|section|article|aside|main)\b/i.test(trimmed);
        const htmlTagCount = (trimmed.match(/<\/?[a-zA-Z0-9:-]+(?:\s+[^"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/g) || []).length;

        const sqlKeywordMatches = (trimmed.match(/\b(SELECT|FROM|WHERE|INSERT\s+INTO|UPDATE|DELETE|JOIN|GROUP\s+BY|ORDER\s+BY|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|PRIMARY\s+KEY|FOREIGN\s+KEY|VARCHAR|BOOLEAN|INTEGER)\b/gi) || []).length;
        const javaKeywordMatches = (trimmed.match(/\b(public|private|protected|class|void|interface|implements|extends|static|final|new|return|package|import|System\.out|this\.|super)\b/g) || []).length;
        const javaBraceMatches = (trimmed.match(/[{}]/g) || []).length;

        if (hasDoctype || hasHtmlClosingTag || (hasCommonHtmlTag && javaKeywordMatches === 0 && sqlKeywordMatches === 0)) {
            return 'html';
        }

        if (htmlTagCount > 0 && htmlTagCount > sqlKeywordMatches && htmlTagCount > javaKeywordMatches && javaBraceMatches === 0) {
            return 'html';
        }

        if (sqlKeywordMatches > javaKeywordMatches) {
            return 'sql';
        }
        if (javaKeywordMatches > 0 || javaBraceMatches > 0) {
            return 'java';
        }

        if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|SHOW|DESCRIBE|USE)\b/i.test(trimmed)) {
            return 'sql';
        }

        if (htmlTagCount > 0) {
            return 'html';
        }

        return 'java';
    }

    static highlightJava(code) {
        const tokenRegex = /(?:\/\*[\s\S]*?\*\/)|(?:\/\/.*)|(?:"""[\s\S]*?""")|(?:"(?:\\.|[^"\\])*")|(?:'\\?.')|([\[\]])|([{}])|([()])|([;])|(\.)|(@[a-zA-Z_]\w*)|(\b\d+(?:\.\d+)?(?:[fFdDlL])?\b|0x[0-9a-fA-F]+)|(\b(?:public|private|protected|static|final|abstract|synchronized|volatile|transient|native|this|super)\b)|(\b(?:class|interface|enum|record|extends|implements|package|import|new|return|if|else|switch|case|default|while|for|do|break|continue|try|catch|finally|throw|throws|instanceof|void|int|double|float|long|short|byte|boolean|char|var|null|true|false)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|(\b[a-zA-Z_]\w*(?=\s*\())|([=+\-*/%&|^!~<>?:,])/g;

        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = tokenRegex.exec(code)) !== null) {
            if (match.index > lastIndex) {
                result += this.escapeHtml(code.slice(lastIndex, match.index));
            }

            const token = match[0];
            const squareBracket = match[1];
            const curlyBrace = match[2];
            const parenthesis = match[3];
            const semicolon = match[4];
            const dot = match[5];
            const annotation = match[6];
            const number = match[7];
            const modifierAttr = match[8];
            const keyword = match[9];
            const className = match[10];
            const methodName = match[11];
            const operator = match[12];

            if (token.startsWith('/*') || token.startsWith('//')) {
                result += `<span class="code-comment">${this.escapeHtml(token)}</span>`;
            } else if (token.startsWith('"') || token.startsWith("'")) {
                result += `<span class="code-string">${this.escapeHtml(token)}</span>`;
            } else if (squareBracket) {
                result += `<span class="code-bracket code-bracket-square">${this.escapeHtml(token)}</span>`;
            } else if (curlyBrace) {
                result += `<span class="code-bracket code-bracket-curly">${this.escapeHtml(token)}</span>`;
            } else if (parenthesis) {
                result += `<span class="code-bracket code-bracket-paren">${this.escapeHtml(token)}</span>`;
            } else if (semicolon) {
                result += `<span class="code-punct code-semicolon">${this.escapeHtml(token)}</span>`;
            } else if (dot) {
                result += `<span class="code-punct code-dot">${this.escapeHtml(token)}</span>`;
            } else if (annotation) {
                result += `<span class="code-annotation">${this.escapeHtml(token)}</span>`;
            } else if (number) {
                result += `<span class="code-number">${this.escapeHtml(token)}</span>`;
            } else if (modifierAttr) {
                result += `<span class="code-keyword code-attr-modifier">${this.escapeHtml(token)}</span>`;
            } else if (keyword) {
                if (/\b(int|double|float|long|short|byte|boolean|char|void)\b/.test(keyword)) {
                    result += `<span class="code-type">${this.escapeHtml(token)}</span>`;
                } else if (/\b(null|true|false)\b/.test(keyword)) {
                    result += `<span class="code-number">${this.escapeHtml(token)}</span>`;
                } else {
                    result += `<span class="code-keyword">${this.escapeHtml(token)}</span>`;
                }
            } else if (className) {
                result += `<span class="code-class">${this.escapeHtml(token)}</span>`;
            } else if (methodName) {
                result += `<span class="code-method">${this.escapeHtml(token)}</span>`;
            } else if (operator) {
                result += `<span class="code-operator">${this.escapeHtml(token)}</span>`;
            } else {
                result += this.escapeHtml(token);
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < code.length) {
            result += this.escapeHtml(code.slice(lastIndex));
        }

        return result;
    }

    static highlightSql(code) {
        const tokenRegex = /(?:--.*)|(?:#.*)|(?:\/\*[\s\S]*?\*\/)|(?:'(?:''|\\.|[^'\\])*')|(?:"(?:\\.|[^"\\])*")|([\[\]])|([()])|([;])|([,])|(\.)|(\b\d+(?:\.\d+)?\b)|(\b(?:SELECT|FROM|WHERE|INSERT\s+INTO|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|NATURAL\s+JOIN|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+DATABASE|DROP\s+DATABASE|CREATE\s+VIEW|DROP\s+VIEW|CREATE\s+INDEX|DROP\s+INDEX|CREATE|ALTER|DROP|TABLE|DATABASE|VIEW|INDEX|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|CHECK|DEFAULT|UNIQUE|NOT\s+NULL|NULL|AND|OR|NOT|IN|BETWEEN|LIKE|ILIKE|IS|AS|DISTINCT|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|CAST|TRUNCATE|DESC|ASC|SHOW|USE|DESCRIBE|EXPLAIN|GRANT|REVOKE|COMMIT|ROLLBACK|BEGIN|TRANSACTION)\b)|(\b(?:VARCHAR|CHAR|TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT|INT|INTEGER|BIGINT|SMALLINT|TINYINT|BOOLEAN|BOOL|DATE|DATETIME|TIMESTAMP|TIME|YEAR|DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|BLOB|TINYBLOB|MEDIUMBLOB|LONGBLOB|JSON|SERIAL|UUID)\b)|(\b(?:COUNT|SUM|AVG|MIN|MAX|COALESCE|CONCAT|SUBSTRING|SUBSTR|LENGTH|ROUND|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|UPPER|LOWER|TRIM|LTRIM|RTRIM|IFNULL|NVL|DATEDIFF|DATE_ADD|DATE_SUB|ROW_NUMBER|RANK|DENSE_RANK|GROUP_CONCAT)\b)|([=<>!+\-*/%&|^~]+)/gi;

        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = tokenRegex.exec(code)) !== null) {
            if (match.index > lastIndex) {
                result += this.escapeHtml(code.slice(lastIndex, match.index));
            }

            const token = match[0];
            const squareBracket = match[1];
            const parenthesis = match[2];
            const semicolon = match[3];
            const comma = match[4];
            const dot = match[5];
            const number = match[6];
            const sqlKeyword = match[7];
            const sqlType = match[8];
            const sqlFunction = match[9];
            const operator = match[10];

            if (token.startsWith('--') || token.startsWith('#') || token.startsWith('/*')) {
                result += `<span class="code-comment">${this.escapeHtml(token)}</span>`;
            } else if (token.startsWith("'") || token.startsWith('"')) {
                result += `<span class="code-string">${this.escapeHtml(token)}</span>`;
            } else if (squareBracket) {
                result += `<span class="code-bracket code-bracket-square">${this.escapeHtml(token)}</span>`;
            } else if (parenthesis) {
                result += `<span class="code-bracket code-bracket-paren">${this.escapeHtml(token)}</span>`;
            } else if (semicolon) {
                result += `<span class="code-punct code-semicolon">${this.escapeHtml(token)}</span>`;
            } else if (comma) {
                result += `<span class="code-punct code-comma">${this.escapeHtml(token)}</span>`;
            } else if (dot) {
                result += `<span class="code-punct code-dot">${this.escapeHtml(token)}</span>`;
            } else if (number) {
                result += `<span class="code-number">${this.escapeHtml(token)}</span>`;
            } else if (sqlKeyword) {
                result += `<span class="code-sql-keyword">${this.escapeHtml(token)}</span>`;
            } else if (sqlType) {
                result += `<span class="code-type">${this.escapeHtml(token)}</span>`;
            } else if (sqlFunction) {
                result += `<span class="code-method">${this.escapeHtml(token)}</span>`;
            } else if (operator) {
                result += `<span class="code-operator">${this.escapeHtml(token)}</span>`;
            } else {
                result += this.escapeHtml(token);
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < code.length) {
            result += this.escapeHtml(code.slice(lastIndex));
        }

        return result;
    }

    static highlightHtml(code) {
        const tokenRegex = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?[a-zA-Z0-9:-]+(?:\s+[^"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>)|(&[a-zA-Z0-9#]+;)/gi;

        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = tokenRegex.exec(code)) !== null) {
            if (match.index > lastIndex) {
                result += this.escapeHtml(code.slice(lastIndex, match.index));
            }

            const comment = match[1];
            const doctype = match[2];
            const tagStr = match[3];
            const entity = match[4];

            if (comment) {
                result += `<span class="code-comment">${this.escapeHtml(comment)}</span>`;
            } else if (doctype) {
                result += `<span class="code-keyword code-doctype">${this.escapeHtml(doctype)}</span>`;
            } else if (tagStr) {
                result += this.formatHtmlTag(tagStr);
            } else if (entity) {
                result += `<span class="code-entity">${this.escapeHtml(entity)}</span>`;
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < code.length) {
            result += this.escapeHtml(code.slice(lastIndex));
        }

        return result;
    }

    static formatHtmlTag(tagStr) {
        const tagMatch = tagStr.match(/^(<\/?)(\w[\w:-]*)([\s\S]*?)(\/?>)$/);
        if (!tagMatch) {
            return this.escapeHtml(tagStr);
        }

        const openDelim = tagMatch[1];
        const tagName = tagMatch[2];
        const attrsStr = tagMatch[3];
        const closeDelim = tagMatch[4];

        let formatted = `<span class="code-bracket">${this.escapeHtml(openDelim)}</span><span class="code-tag">${this.escapeHtml(tagName)}</span>`;

        if (attrsStr) {
            const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*(=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
            let lastAttrIndex = 0;
            let attrMatch;

            while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
                if (attrMatch.index > lastAttrIndex) {
                    formatted += this.escapeHtml(attrsStr.slice(lastAttrIndex, attrMatch.index));
                }

                const attrName = attrMatch[1];
                const eq = attrMatch[2];
                const doubleVal = attrMatch[3];
                const singleVal = attrMatch[4];
                const rawVal = attrMatch[5];

                formatted += `<span class="code-attr">${this.escapeHtml(attrName)}</span>`;

                if (eq) {
                    formatted += `<span class="code-operator">${this.escapeHtml(eq)}</span>`;
                    if (doubleVal !== undefined) {
                        formatted += `<span class="code-string">&quot;${this.escapeHtml(doubleVal)}&quot;</span>`;
                    } else if (singleVal !== undefined) {
                        formatted += `<span class="code-string">&#039;${this.escapeHtml(singleVal)}&#039;</span>`;
                    } else if (rawVal !== undefined) {
                        formatted += `<span class="code-string">${this.escapeHtml(rawVal)}</span>`;
                    }
                }

                lastAttrIndex = attrRegex.lastIndex;
            }

            if (lastAttrIndex < attrsStr.length) {
                formatted += this.escapeHtml(attrsStr.slice(lastAttrIndex));
            }
        }

        formatted += `<span class="code-bracket">${this.escapeHtml(closeDelim)}</span>`;
        return formatted;
    }

    static highlight(code, language = 'auto') {
        const lang = (language === 'auto') ? this.detectLanguage(code) : language;
        let html = '';
        if (lang === 'html') {
            html = this.highlightHtml(code);
        } else if (lang === 'sql') {
            html = this.highlightSql(code);
        } else {
            html = this.highlightJava(code);
        }
        return { html, lang };
    }

    static highlightLine(lineText, language = 'auto') {
        const leadingSpacesMatch = lineText.match(/^([ \t\u00a0]+)/);
        let prefix = '';
        let codeToHighlight = lineText;

        if (leadingSpacesMatch) {
            prefix = leadingSpacesMatch[1]
                .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                .replace(/[ \u00a0]/g, '&nbsp;');
            codeToHighlight = lineText.slice(leadingSpacesMatch[1].length);
        }

        const { html, lang } = this.highlight(codeToHighlight, language);
        return { html: prefix + html, lang };
    }

    static formatSelection(code, language = 'auto') {
        const { html, lang } = this.highlight(code, language);
        return `<span class="code-text-span" data-code-lang="${lang}">${html}</span>`;
    }

    static formatSelectionInline(code, language = 'auto') {
        const { html, lang } = this.highlight(code, language);
        return `<span class="code-inline" data-code-lang="${lang}">${html}</span>`;
    }
}

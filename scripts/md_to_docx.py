import os
import re
import zipfile
import xml.sax.saxutils as saxutils

def escape_xml(s):
    return saxutils.escape(s).replace('"', '&quot;').replace("'", '&apos;')

def create_docx(markdown_path, output_docx_path):
    with open(markdown_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # Pre-parse markdown into blocks
    lines = md_text.splitlines()
    body_elements = []

    in_code_block = False
    code_block_lines = []
    
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        
        # Build table XML
        tbl_xml = ['<w:tbl>']
        tbl_xml.append('''<w:tblPr>
            <w:tblStyle w:val="TableGrid"/>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:jc w:val="center"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
                <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
                <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
                <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
        </w:tblPr>''')

        # Filter out separator rows like |:---|:---|
        cleaned_rows = []
        for r in table_rows:
            # check if it's a separator row
            cells = [c.strip() for c in r.strip('|').split('|')]
            if all(re.match(r'^:?-+:?$', c) for c in cells if c):
                continue
            cleaned_rows.append(cells)

        for row_idx, cells in enumerate(cleaned_rows):
            is_header = (row_idx == 0)
            tbl_xml.append('<w:tr>')
            if is_header:
                tbl_xml.append('<w:trPr><w:tblHeader/></w:trPr>')
            
            for c in cells:
                tbl_xml.append('<w:tc>')
                tc_pr = ['<w:tcPr>']
                if is_header:
                    tc_pr.append('<w:shd w:val="clear" w:color="auto" w:fill="EDF2F7"/>')
                tc_pr.append('''<w:tcMar>
                    <w:top w:w="120" w:type="dxa"/>
                    <w:left w:w="160" w:type="dxa"/>
                    <w:bottom w:w="120" w:type="dxa"/>
                    <w:right w:w="160" w:type="dxa"/>
                </w:tcMar></w:tcPr>''')
                tbl_xml.append("".join(tc_pr))

                # parse cell text
                cell_p = format_paragraph(c, is_table_header=is_header)
                tbl_xml.append(cell_p)
                tbl_xml.append('</w:tc>')
            
            tbl_xml.append('</w:tr>')

        tbl_xml.append('</w:tbl>')
        body_elements.append("".join(tbl_xml))
        table_rows = []
        in_table = False

    def flush_code_block():
        nonlocal in_code_block, code_block_lines
        if not code_block_lines:
            in_code_block = False
            return
        
        # Build shaded code block
        code_p = ['<w:p>']
        code_p.append('''<w:pPr>
            <w:pBdr>
                <w:top w:val="single" w:sz="4" w:space="4" w:color="CBD5E0"/>
                <w:left w:val="single" w:sz="12" w:space="8" w:color="3182CE"/>
                <w:bottom w:val="single" w:sz="4" w:space="4" w:color="CBD5E0"/>
                <w:right w:val="single" w:sz="4" w:space="4" w:color="CBD5E0"/>
            </w:pBdr>
            <w:shd w:val="clear" w:color="auto" w:fill="F7FAFC"/>
            <w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/>
        </w:pPr>''')

        for idx, cl in enumerate(code_block_lines):
            code_p.append('<w:r>')
            code_p.append('''<w:rPr>
                <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
                <w:sz w:val="18"/>
                <w:color w:val="2D3748"/>
            </w:rPr>''')
            code_p.append(f'<w:t xml:space="preserve">{escape_xml(cl)}</w:t>')
            code_p.append('</w:r>')
            if idx < len(code_block_lines) - 1:
                code_p.append('<w:r><w:br/></w:r>')

        code_p.append('</w:p>')
        body_elements.append("".join(code_p))
        code_block_lines = []
        in_code_block = False

    def format_inline_runs(text, is_bold=False, is_italic=False, text_color="2D3748", font_size="24"):
        # Split text into bold, italic, code fragments
        # Pattern: (`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|[^*`]+)
        runs_xml = []
        tokens = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', text)
        for t in tokens:
            if not t:
                continue
            cur_bold = is_bold
            cur_italic = is_italic
            cur_code = False
            content = t

            if t.startswith('**') and t.endswith('**') and len(t) >= 4:
                cur_bold = True
                content = t[2:-2]
            elif t.startswith('*') and t.endswith('*') and len(t) >= 2:
                cur_italic = True
                content = t[1:-1]
            elif t.startswith('`') and t.endswith('`') and len(t) >= 2:
                cur_code = True
                content = t[1:-1]

            r_pr = ['<w:rPr>']
            if cur_code:
                r_pr.append('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>')
                r_pr.append('<w:shd w:val="clear" w:color="auto" w:fill="EDF2F7"/>')
                r_pr.append('<w:color w:val="C53030"/>')
                r_pr.append(f'<w:sz w:val="{font_size}"/>')
            else:
                r_pr.append('<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Khmer OS Battambang"/>')
                r_pr.append(f'<w:color w:val="{text_color}"/>')
                r_pr.append(f'<w:sz w:val="{font_size}"/>')

            if cur_bold:
                r_pr.append('<w:b/><w:bCs/>')
            if cur_italic:
                r_pr.append('<w:i/><w:iCs/>')

            r_pr.append('</w:rPr>')
            runs_xml.append(f'<w:r>{"".join(r_pr)}<w:t xml:space="preserve">{escape_xml(content)}</w:t></w:r>')

        return "".join(runs_xml)

    def format_paragraph(text, is_table_header=False, align="left", spacing_before=60, spacing_after=60):
        p_xml = ['<w:p>']
        p_pr = ['<w:pPr>']
        if align != "left":
            p_pr.append(f'<w:jc w:val="{align}"/>')
        p_pr.append(f'<w:spacing w:before="{spacing_before}" w:after="{spacing_after}" w:line="320" w:lineRule="auto"/>')
        p_pr.append('</w:pPr>')
        p_xml.append("".join(p_pr))

        runs = format_inline_runs(text, is_bold=is_table_header, font_size="22" if is_table_header else "22")
        p_xml.append(runs)
        p_xml.append('</w:p>')
        return "".join(p_xml)

    for line in lines:
        stripped = line.strip()

        # Handle Code Fences
        if stripped.startswith('```'):
            if in_code_block:
                flush_code_block()
            else:
                if in_table:
                    flush_table()
                in_code_block = True
                code_block_lines = []
            continue

        if in_code_block:
            code_block_lines.append(line)
            continue

        # Handle Tables
        if stripped.startswith('|') and stripped.endswith('|'):
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(stripped)
            continue
        else:
            if in_table:
                flush_table()

        # Handle Horizontal Rules / Page Break indicator
        if stripped in ('---', '***', '___'):
            # Insert page break or visual divider
            body_elements.append('''<w:p>
                <w:pPr>
                    <w:pBdr>
                        <w:bottom w:val="single" w:sz="6" w:space="8" w:color="CBD5E0"/>
                    </w:pBdr>
                    <w:spacing w:before="180" w:after="180"/>
                </w:pPr>
            </w:p>''')
            continue

        if not stripped:
            continue

        # Handle Headings
        if stripped.startswith('# '):
            title_text = stripped[2:].strip()
            # If it's a major chapter header, add page break before it
            is_chapter = ('ជំពូកទី' in title_text or 'មាតិកា' in title_text or 'អារម្ភកថា' in title_text or 'ឯកសារយោង' in title_text or 'ឧបសម្ព័ន្ធ' in title_text)
            p_xml = ['<w:p>']
            p_pr = ['<w:pPr>']
            if is_chapter:
                p_pr.append('<w:pageBreakBefore/>')
                p_pr.append('<w:jc w:val="center"/>')
            p_pr.append('<w:spacing w:before="360" w:after="180" w:line="360" w:lineRule="auto"/>')
            p_pr.append('</w:pPr>')
            p_xml.append("".join(p_pr))
            runs = format_inline_runs(title_text, is_bold=True, text_color="1A365D", font_size="32")
            p_xml.append(runs)
            p_xml.append('</w:p>')
            body_elements.append("".join(p_xml))
            continue

        if stripped.startswith('## '):
            h2_text = stripped[3:].strip()
            p_xml = ['<w:p>']
            p_pr = ['<w:pPr>']
            p_pr.append('<w:spacing w:before="240" w:after="120" w:line="340" w:lineRule="auto"/>')
            p_pr.append('</w:pPr>')
            p_xml.append("".join(p_pr))
            runs = format_inline_runs(h2_text, is_bold=True, text_color="2B6CB0", font_size="28")
            p_xml.append(runs)
            p_xml.append('</w:p>')
            body_elements.append("".join(p_xml))
            continue

        if stripped.startswith('### '):
            h3_text = stripped[4:].strip()
            p_xml = ['<w:p>']
            p_pr = ['<w:pPr>']
            p_pr.append('<w:spacing w:before="180" w:after="90" w:line="320" w:lineRule="auto"/>')
            p_pr.append('</w:pPr>')
            p_xml.append("".join(p_pr))
            runs = format_inline_runs(h3_text, is_bold=True, text_color="2D3748", font_size="26")
            p_xml.append(runs)
            p_xml.append('</w:p>')
            body_elements.append("".join(p_xml))
            continue

        if stripped.startswith('#### '):
            h4_text = stripped[5:].strip()
            p_xml = ['<w:p>']
            p_pr = ['<w:pPr>']
            p_pr.append('<w:spacing w:before="140" w:after="70" w:line="300" w:lineRule="auto"/>')
            p_pr.append('</w:pPr>')
            p_xml.append("".join(p_pr))
            runs = format_inline_runs(h4_text, is_bold=True, text_color="4A5568", font_size="24")
            p_xml.append(runs)
            p_xml.append('</w:p>')
            body_elements.append("".join(p_xml))
            continue

        # Handle List items
        bullet_match = re.match(r'^(\s*)([-*+]|\d+\.)\s+(.+)$', line)
        if bullet_match:
            indent_spaces = len(bullet_match.group(1))
            bullet_char = bullet_match.group(2)
            item_text = bullet_match.group(3)

            level = 1 if indent_spaces >= 4 else 0
            left_indent = 480 if level == 0 else 960

            p_xml = ['<w:p>']
            p_pr = [f'''<w:pPr>
                <w:ind w:left="{left_indent}" w:hanging="240"/>
                <w:spacing w:before="40" w:after="40" w:line="300" w:lineRule="auto"/>
            </w:pPr>''']
            p_xml.append("".join(p_pr))
            
            # bullet icon
            bullet_symbol = "• " if bullet_char in ('-', '*', '+') else f"{bullet_char} "
            p_xml.append(f'''<w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Khmer OS Battambang"/>
                    <w:color w:val="3182CE"/>
                    <w:b/><w:bCs/>
                    <w:sz w:val="22"/>
                </w:rPr>
                <w:t xml:space="preserve">{bullet_symbol}</w:t>
            </w:r>''')

            runs = format_inline_runs(item_text, font_size="22")
            p_xml.append(runs)
            p_xml.append('</w:p>')
            body_elements.append("".join(p_xml))
            continue

        # Normal Paragraph
        is_centered = (stripped.startswith('**រៀបចំដោយ') or stripped.startswith('Assignment') or stripped.startswith('សាកលវិទ្យាល័យ') or stripped.startswith('សៀមរាប'))
        align = "center" if is_centered else "both"
        
        p_xml = ['<w:p>']
        p_pr = [f'''<w:pPr>
            <w:jc w:val="{align}"/>
            <w:spacing w:before="60" w:after="80" w:line="320" w:lineRule="auto"/>
        </w:pPr>''']
        p_xml.append("".join(p_pr))
        runs = format_inline_runs(stripped, font_size="22")
        p_xml.append(runs)
        p_xml.append('</w:p>')
        body_elements.append("".join(p_xml))

    # Flush remaining tables/blocks
    if in_table:
        flush_table()
    if in_code_block:
        flush_code_block()

    # Document wrapper
    document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {"".join(body_elements)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

    doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
</Relationships>'''

    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Khmer OS Battambang"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="km-KH"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>'''

    settings_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>'''

    font_table_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fontTable xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Calibri"/>
  <w:font w:name="Khmer OS Battambang"/>
  <w:font w:name="Consolas"/>
</w:fontTable>'''

    # Assemble ZIP file
    os.makedirs(os.path.dirname(output_docx_path), exist_ok=True)
    with zipfile.ZipFile(output_docx_path, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/_rels/document.xml.rels', doc_rels)
        docx.writestr('word/document.xml', document_xml)
        docx.writestr('word/styles.xml', styles_xml)
        docx.writestr('word/settings.xml', settings_xml)
        docx.writestr('word/fontTable.xml', font_table_xml)

    print(f"Successfully created: {output_docx_path} ({os.path.getsize(output_docx_path)} bytes)")

if __name__ == '__main__':
    # 1. Generate full Master Book (.docx)
    create_docx('docs/CAREERLENS_MASTER_BOOK_FULL.md', 'docs/CAREERLENS_MASTER_BOOK_FULL.docx')
    # 2. Generate Chapter 3 to End (.docx)
    create_docx('docs/CAREERLENS_BOOK_CHAPTER_3_TO_END.md', 'docs/CAREERLENS_BOOK_CHAPTER_3_TO_END.docx')

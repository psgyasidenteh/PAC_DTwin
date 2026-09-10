import fitz, os, sys

sys.stdout.reconfigure(encoding='utf-8')

pdf1 = r'Refs/A_Methodology_for_Generating_a_Digital_Twin_for_Process_Industry_A_Case_Study_of_a_Fiber_Processing_Pilot_Plant.pdf'
pdf2 = r'Refs/Digital Twin and IIoT in Optimizing Manufacturing Process an Quality Management SA.pdf'

def analyze_pdf(path, out_prefix):
    doc = fitz.open(path)
    print(f"=== {os.path.basename(path)} ===")
    print(f"Total pages: {len(doc)}")
    
    full_toc = doc.get_toc()
    print("TOC:", full_toc[:20])
    
    # Extract first 5 pages
    intro_text = ""
    for i in range(min(5, len(doc))):
        intro_text += f"\n--- Page {i+1} ---\n" + doc[i].get_text()
        
    with open(f"{out_prefix}_intro.txt", "w", encoding="utf-8") as f:
        f.write(intro_text)
        
    # Search for framework, methodology, architecture keywords
    key_sections = []
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        for kw in ["framework", "methodology", "architecture", "ISO", "NAMUR", "RAMI", "IIoT", "pipeline", "layers", "model"]:
            if kw.lower() in text.lower():
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                # find headings
                for l in lines:
                    if any(l.startswith(prefix) for prefix in ["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "IV.", "V.", "VI.", "Figure", "Table"]) and len(l) < 100:
                        key_sections.append(f"Page {page_num+1}: {l}")
    
    with open(f"{out_prefix}_headings.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(key_sections[:150]))
    print(f"Extracted {out_prefix} data successfully.")

analyze_pdf(pdf1, "ref1")
analyze_pdf(pdf2, "ref2")

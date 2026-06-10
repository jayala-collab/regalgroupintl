#!/usr/bin/env python3
"""Build the Regal Group International branded 'Financing Document Checklists' PDF."""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONTDIR = "/Users/juanayala/CODE/assets/fonts"
pdfmetrics.registerFont(TTFont("Inter",          os.path.join(FONTDIR, "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", os.path.join(FONTDIR, "Inter-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("EBGaramond",     os.path.join(FONTDIR, "EBGaramond-Medium.ttf")))
pdfmetrics.registerFont(TTFont("EBGaramond-It",  os.path.join(FONTDIR, "EBGaramond-Italic.ttf")))

ASSETS = "/Users/juanayala/CODE/assets/img"
OUT = "/Users/juanayala/CODE/assets/docs/Regal-Financing-Checklists.pdf"

# ---- brand palette ----
NAVY   = (0.043, 0.075, 0.125)   # #0B1320
NAVY2  = (0.114, 0.184, 0.286)   # #1d2f49
GOLD   = (0.776, 0.635, 0.298)   # #C6A24C
GOLD_D = (0.662, 0.525, 0.227)
INK    = (0.090, 0.110, 0.150)
GRAY   = (0.40, 0.44, 0.50)
IVORY  = (0.965, 0.949, 0.918)
LINE   = (0.86, 0.82, 0.74)

SERIF = "EBGaramond"; SERIF_B = "EBGaramond"; SERIF_I = "EBGaramond-It"
SANS  = "Inter";      SANS_B  = "Inter-SemiBold"

W, H = letter
LOGO = os.path.join(ASSETS, "regal-logo.png")          # white wordmark
MARK_W = os.path.join(ASSETS, "regal-mark.png")        # white monogram
MARK_N = os.path.join(ASSETS, "regal-mark-navy.png")   # navy monogram

CONTACT = "2525 Ponce de Leon Blvd, Suite 300, Coral Gables, FL 33134"
PHONES  = "(305) 200-8807  ·  (786) 247-0244"
EMAIL   = "info@regalgroupintl.com"
WEB     = "regalgroupintl.com"
SITE_URL = "https://www.regalgroupintl.com"

# -------- content: financing verticals --------
CHECKLISTS = [
  ("Commercial Lending", "Acquisition, refinance & bridge capital for income-producing property.", [
    ("Borrower & Entity", [
      "Government-issued photo ID — all principals/guarantors",
      "Entity documents: Articles, Operating Agreement, EIN letter",
      "Certificate of Good Standing",
      "Personal Financial Statement — each guarantor (≥20%)",
      "Schedule of Real Estate Owned",
    ]),
    ("Financials", [
      "Business tax returns — last 2–3 years",
      "Personal tax returns — last 2 years (each guarantor)",
      "Year-to-date P&L and Balance Sheet",
      "Business bank statements — last 3 months",
      "Existing debt schedule",
    ]),
    ("Property", [
      "Purchase contract or Letter of Intent",
      "Current rent roll & trailing-12 operating statements",
      "Property photos & interior/exterior condition notes",
      "Appraisal and/or Phase I environmental (if available)",
      "Evidence of property insurance",
    ]),
    ("Deal", [
      "Use of funds / sources & uses",
      "Executive summary or investment thesis",
    ]),
  ]),
  ("Residential Lending", "Primary, second-home & investment residences — incl. foreign-national programs.", [
    ("Borrower", [
      "Government-issued photo ID; SSN or ITIN",
      "Completed loan application (1003)",
      "Credit authorization",
    ]),
    ("Income", [
      "W-2s / 1099s — last 2 years",
      "Most recent 30 days of pay stubs",
      "Tax returns — last 2 years (self-employed)",
    ]),
    ("Assets", [
      "Bank/asset statements — last 2 months",
      "Down-payment & reserves verification",
      "Gift letter (if applicable)",
    ]),
    ("Property", [
      "Purchase contract",
      "Homeowner's insurance quote",
      "HOA / condo information (if applicable)",
    ]),
    ("Foreign-National Program", [
      "Valid passport and U.S. visa",
      "International bank reference & foreign credit reference",
      "Verified reserves (typically 6–12 months)",
    ]),
  ]),
  ("Construction Financing", "Ground-up & value-add construction capital with draw structures.", [
    ("Borrower & Entity", [
      "Photo ID — all principals/guarantors",
      "Entity documents & Certificate of Good Standing",
      "Personal Financial Statement; Schedule of Real Estate Owned",
      "Construction experience / completed-projects résumé",
    ]),
    ("Project", [
      "Detailed line-item construction budget",
      "Architectural plans & specifications",
      "Permits and municipal approvals",
      "General Contractor agreement, license & insurance",
      "Project timeline & proposed draw schedule",
      "Builder's risk insurance",
    ]),
    ("Property", [
      "Land purchase contract or proof of ownership",
      "Survey & zoning verification",
      "As-completed appraisal",
    ]),
    ("Financials", [
      "Business & personal tax returns — last 2 years",
      "Bank statements & proof of equity injection",
    ]),
  ]),
  ("Private Equity & Bridge", "Fast private capital for business-purpose commercial & residential deals.", [
    ("Borrower & Entity", [
      "Photo ID — all principals/guarantors",
      "Entity documents (Articles, Operating Agreement, EIN)",
      "Personal Financial Statement",
    ]),
    ("Asset", [
      "Current appraisal, BPO, or valuation",
      "Purchase contract or proof of ownership",
      "Rent roll (if income-producing) & property photos",
      "Title / preliminary title report",
    ]),
    ("Deal", [
      "Executive summary & exit strategy",
      "Use of funds / sources & uses",
      "Payoff statement (if refinance)",
    ]),
    ("Financials", [
      "Bank statements — proof of liquidity",
      "Schedule of Real Estate Owned",
    ]),
  ]),
  ("CRE Lines of Credit", "Revolving liquidity secured by commercial real estate.", [
    ("Borrower & Entity", [
      "Photo ID — all principals/guarantors",
      "Entity documents & Certificate of Good Standing",
      "Personal Financial Statement — each guarantor",
    ]),
    ("Collateral", [
      "Schedule of CRE collateral offered",
      "Current appraisals / valuations",
      "Rent rolls & trailing-12 operating statements",
      "Mortgage statements / payoff figures",
      "Evidence of property insurance",
    ]),
    ("Financials", [
      "Business & personal tax returns — last 2–3 years",
      "Year-to-date financial statements",
      "Existing debt schedule",
    ]),
    ("Request", [
      "Requested line amount & intended use",
      "Anticipated draw activity",
    ]),
  ]),
  ("Aircraft Financing", "Acquisition & refinance for private and business aircraft.", [
    ("Borrower & Entity", [
      "Photo ID — all principals/guarantors",
      "Entity / ownership-structure documents",
      "Personal Financial Statement",
    ]),
    ("Aircraft", [
      "Purchase agreement or Letter of Intent",
      "Specs: make, model, year, serial & tail number",
      "Logbooks & maintenance records",
      "Pre-buy inspection report",
      "Appraisal / valuation; damage history",
      "Current registration & title",
    ]),
    ("Operations", [
      "Intended use (Part 91 / Part 135)",
      "Management or charter agreement (if any)",
      "Insurance binder",
    ]),
    ("Financials", [
      "Tax returns — last 2–3 years; bank statements",
      "Proof of down payment & liquidity verification",
    ]),
  ]),
  ("Maritime Financing", "Vessel & yacht financing for private and commercial maritime assets.", [
    ("Borrower & Entity", [
      "Photo ID — all principals/guarantors",
      "Entity / ownership-structure documents",
      "Personal Financial Statement",
    ]),
    ("Vessel", [
      "Purchase agreement or Letter of Intent",
      "Specs: make, model, year, HIN, length & flag",
      "Marine survey (condition & valuation)",
      "Sea-trial report",
      "Documentation / registration & title",
      "Prior ownership & service history",
    ]),
    ("Operations", [
      "Intended use (private / charter)",
      "Captain & crew information (if applicable)",
      "Marine insurance binder; moorage / marina info",
    ]),
    ("Financials", [
      "Tax returns — last 2–3 years; bank statements",
      "Proof of down payment & liquidity verification",
    ]),
  ]),
]


def set_fill(c, rgb): c.setFillColorRGB(*rgb)
def set_stroke(c, rgb): c.setStrokeColorRGB(*rgb)


def cover(c):
    c.setFillColorRGB(*NAVY); c.rect(0, 0, W, H, fill=1, stroke=0)
    # faint gold rule frame
    set_stroke(c, GOLD_D); c.setLineWidth(0.8)
    c.rect(0.5*inch, 0.5*inch, W-1*inch, H-1*inch, fill=0, stroke=1)
    # logo
    img = ImageReader(LOGO); iw, ih = img.getSize(); lw = 3.3*inch; lh = lw*ih/iw
    c.drawImage(img, (W-lw)/2, H-3.4*inch, lw, lh, mask='auto')
    # title
    set_fill(c, IVORY); c.setFont(SERIF, 33)
    c.drawCentredString(W/2, H-4.55*inch, "Financing Document Checklists")
    # gold divider
    set_stroke(c, GOLD); c.setLineWidth(1.2)
    c.line(W/2-0.9*inch, H-4.95*inch, W/2+0.9*inch, H-4.95*inch)
    set_fill(c, (0.80,0.78,0.72)); c.setFont(SANS, 11.5)
    c.drawCentredString(W/2, H-5.35*inch, "What you'll need to move quickly — organized by financing type.")
    # index of sections
    set_fill(c, GOLD); c.setFont(SANS_B, 9.5)
    c.drawCentredString(W/2, H-6.15*inch, "I N S I D E")
    set_fill(c, (0.86,0.84,0.80)); c.setFont(SERIF, 12.5)
    items = [t for (t,_,_) in CHECKLISTS]
    y = H-6.5*inch
    for t in items:
        c.drawCentredString(W/2, y, t); y -= 0.26*inch
    # contact footer
    set_stroke(c, NAVY2); c.setLineWidth(1); c.line(1*inch, 1.35*inch, W-1*inch, 1.35*inch)
    set_fill(c, (0.78,0.76,0.72)); c.setFont(SANS, 9.5)
    c.drawCentredString(W/2, 1.12*inch, CONTACT)
    c.drawCentredString(W/2, 0.96*inch, PHONES + "    ·    " + EMAIL + "    ·    " + WEB)
    set_fill(c, GRAY); c.setFont(SANS, 7.4)
    c.drawCentredString(W/2, 0.72*inch, "General guidance only — specific requirements vary by program, lender and transaction. "
                                        "Not a commitment to lend. Equal Opportunity Lender.")
    c.showPage()


def wrap(c, text, font, size, maxw):
    words = text.split(); lines=[]; cur=""
    for w in words:
        t = (cur+" "+w).strip()
        if c.stringWidth(t, font, size) <= maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines


def header(c, idx=None, total=None):
    bh = 0.95*inch
    c.setFillColorRGB(*NAVY); c.rect(0, H-bh, W, bh, fill=1, stroke=0)
    # monogram + wordmark
    m = ImageReader(MARK_W); ms = 0.5*inch
    c.drawImage(m, 0.7*inch, H-bh/2-ms/2, ms, ms, mask='auto')
    set_fill(c, IVORY); c.setFont(SANS_B, 11)
    c.drawString(1.35*inch, H-bh/2+2, "REGAL GROUP INTERNATIONAL")
    set_fill(c, GOLD); c.setFont(SANS, 7.5)
    c.drawString(1.355*inch, H-bh/2-11, "P R I V A T E   C A P I T A L")
    set_fill(c, GOLD); c.setFont(SANS_B, 8.5)
    c.drawRightString(W-0.7*inch, H-bh/2+4, "FINANCING DOCUMENT CHECKLIST")
    if idx and total:
        set_fill(c, (0.7,0.74,0.8)); c.setFont(SANS, 7.5)
        c.drawRightString(W-0.7*inch, H-bh/2-9, "Page %d of %d" % (idx, total))


def footer(c):
    bh = 0.62*inch
    c.setFillColorRGB(*NAVY); c.rect(0, 0, W, bh, fill=1, stroke=0)
    set_fill(c, (0.80,0.78,0.74)); c.setFont(SANS, 8)
    c.drawCentredString(W/2, bh-0.20*inch, PHONES + "    ·    " + EMAIL + "    ·    " + WEB)
    set_fill(c, GRAY); c.setFont(SANS, 6.8)
    c.drawCentredString(W/2, bh-0.36*inch, CONTACT + "   |   General guidance only; requirements vary by program & transaction. Equal Opportunity Lender.")
    # make the contact line clickable back to the website
    c.linkURL(SITE_URL, (0.7*inch, bh-0.27*inch, W-0.7*inch, bh-0.13*inch), relative=0)


def checklist_page(c, title, desc, groups, idx=None, total=None):
    header(c, idx, total)
    footer(c)
    lm = 0.85*inch; rm = W-0.85*inch; colw = rm-lm
    y = H-0.95*inch-0.55*inch
    # title
    set_fill(c, INK); c.setFont(SERIF, 25)
    c.drawString(lm, y, title)
    y -= 0.10*inch
    set_stroke(c, GOLD); c.setLineWidth(1.6); c.line(lm, y, lm+0.85*inch, y)
    y -= 0.24*inch
    set_fill(c, GRAY); c.setFont(SERIF_I, 11.5)
    c.drawString(lm, y, desc)
    y -= 0.34*inch

    # two columns for density
    gap = 0.4*inch; cw = (colw-gap)/2
    col_x = [lm, lm+cw+gap]
    col_y = [y, y]
    # distribute groups across two columns by running height estimate
    def gh(g):
        h = 0.26*inch
        for it in g[1]:
            h += 0.205*inch * len(wrap(c, it, SANS, 9.3, cw-0.28*inch))
            h += 0.02*inch
        return h + 0.12*inch
    heights = [gh(g) for g in groups]
    total_h = sum(heights)
    col = 0; acc = 0
    for g, hh in zip(groups, heights):
        if col == 0 and acc > total_h/2 - 0.2*inch:
            col = 1
        x = col_x[col]
        yy = col_y[col]
        # group label
        set_fill(c, GOLD_D); c.setFont(SANS_B, 9)
        c.drawString(x, yy, g[0].upper())
        set_stroke(c, LINE); c.setLineWidth(0.6)
        c.line(x, yy-4, x+cw, yy-4)
        yy -= 0.22*inch
        for it in g[1]:
            lines = wrap(c, it, SANS, 9.3, cw-0.30*inch)
            # checkbox
            set_stroke(c, NAVY2); c.setLineWidth(0.9)
            c.rect(x, yy-1.5, 8, 8, fill=0, stroke=1)
            set_fill(c, INK); c.setFont(SANS, 9.3)
            for li, ln in enumerate(lines):
                c.drawString(x+0.20*inch, yy - li*0.155*inch, ln)
            yy -= 0.155*inch*len(lines) + 0.066*inch
        yy -= 0.12*inch
        col_y[col] = yy
        acc += hh

    # --- clickable CTA pill back to the site (just above the footer band) ---
    pw, ph = 3.7*inch, 0.42*inch
    px, py = (W-pw)/2, 1.02*inch
    set_fill(c, NAVY2); set_stroke(c, GOLD); c.setLineWidth(1)
    c.roundRect(px, py, pw, ph, 4, fill=1, stroke=1)
    set_fill(c, GOLD); c.setFont(SANS_B, 9)
    c.drawCentredString(W/2, py+ph/2+2.5, "BEGIN YOUR CONSULTATION")
    set_fill(c, IVORY); c.setFont(SANS, 8)
    c.drawCentredString(W/2, py+ph/2-9, "Start your financing at  " + WEB)
    c.linkURL(SITE_URL, (px, py, px+pw, py+ph), relative=0)
    c.showPage()


import re
DOCDIR = os.path.dirname(OUT)

def slug(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

def build_individual():
    """One self-contained, branded single-page PDF per financing program."""
    os.makedirs(DOCDIR, exist_ok=True)
    written = []
    for title, desc, groups in CHECKLISTS:
        fn = slug(title) + "-checklist.pdf"
        path = os.path.join(DOCDIR, fn)
        c = canvas.Canvas(path, pagesize=letter)
        c.setTitle("Regal Group International — %s Document Checklist" % title)
        c.setAuthor("Regal Group International")
        checklist_page(c, title, desc, groups)   # standalone: no "page x of y"
        c.save()
        written.append(fn)
    return written

def build_combined():
    c = canvas.Canvas(OUT, pagesize=letter)
    c.setTitle("Regal Group International — Financing Document Checklists")
    c.setAuthor("Regal Group International")
    cover(c)
    total = len(CHECKLISTS)
    for i,(title,desc,groups) in enumerate(CHECKLISTS, 1):
        checklist_page(c, title, desc, groups, idx=i, total=total)
    c.save()
    return OUT

if __name__ == "__main__":
    for fn in build_individual():
        print("wrote", fn)

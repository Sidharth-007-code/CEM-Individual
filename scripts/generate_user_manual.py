#!/usr/bin/env python3
"""
Campus Marketplace - Comprehensive User Manual & Operations Guide Generator
Generates:
  1. docs/docx/Campus_Marketplace_User_Manual.docx
  2. docs/docx/Campus_Marketplace_User_Manual.pdf
  3. docs/USER_MANUAL.docx
  4. docs/USER_MANUAL.pdf
  5. docs/USER_MANUAL.md
"""

import os
import shutil
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

def set_cell_background(cell, fill_hex):
    """Sets background color of a Word table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets padding for a Word table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_docx(output_path):
    doc = Document()

    # Page Margins: 0.75 in
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Base Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)

    # ─────────────────────────────────────────────────────────────
    # COVER / HEADER
    # ─────────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(4)
    run_inst = title_p.add_run("M.S. RAMAIAH UNIVERSITY OF APPLIED SCIENCES\n")
    run_inst.font.size = Pt(12)
    run_inst.font.bold = True
    run_inst.font.color.rgb = RGBColor(100, 116, 139)

    run_title = title_p.add_run("CAMPUS MARKETPLACE")
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Official System User Manual, Security Architecture & Operations Guide (v2.0 Enterprise)")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Meta Table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("System URL / Web App", "Production Vercel Cloud Deployment & Localhost 3000"),
        ("Source Code Repository", "https://github.com/shreyasadiga82/campus_e_marketplace (main)"),
        ("Institutional Domain", "@msruas.ac.in (Strict Domain Lock)"),
        ("Version & Architecture", "v2.0 Enterprise • Next.js 14 App Router • Firebase Serverless"),
        ("Author / Engineering Lead", "Shreyas Adiga & Google DeepMind Antigravity AI Engineering")
    ]
    for idx, (lbl, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.8)
        set_cell_background(cell_lbl, "F1F5F9")
        set_cell_background(cell_val, "FFFFFF")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
        
        p0 = cell_lbl.paragraphs[0]
        r0 = p0.add_run(lbl)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(15, 23, 42)
        
        p1 = cell_val.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # Helper for headings
    def add_custom_heading(text, level=1):
        h = doc.add_heading(text, level=level)
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        for r in h.runs:
            if level == 1:
                r.font.size = Pt(16)
                r.font.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            elif level == 2:
                r.font.size = Pt(13)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            elif level == 3:
                r.font.size = Pt(11.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(51, 65, 85)
        return h

    # ─────────────────────────────────────────────────────────────
    # SECTION 1: EXECUTIVE SUMMARY
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("1. Executive Summary & Platform Purpose", level=1)
    
    p = doc.add_paragraph(
        "Campus Marketplace is a purpose-built, secure Peer-to-Peer (P2P) academic notice board and student commerce platform "
        "engineered exclusively for M.S. Ramaiah University of Applied Sciences (MSRUAS). The platform addresses the critical "
        "deficiencies of informal social media trading (WhatsApp groups, unvetted Telegram channels, OLX) by providing a unified, "
        "governed digital environment for trading senior textbooks, lab equipment, engineering drafting kits, electronics, and hostel essentials."
    )
    p.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Key Pillars of the System:"
    )
    bullet_items = [
        ("Institutional Identity Verification", "Only authenticated university accounts with @msruas.ac.in emails are permitted. External email domains (@gmail.com, @yahoo.com) are strictly rejected."),
        ("AI Fair-Trade Price & Quality Assessment", "Integrated client-side AI analysis checks listings against standard textbook curricula, evaluates physical condition, flags forbidden items, and bounds prices within student-fair brackets."),
        ("Student Council Quality Verification", "Physical items requiring campus safety oversight (calculators, lab coats, bicycles) enter a verification queue before publication on the notice board."),
        ("Safe Campus CCTV Meetup Handover", "Transactions culminate in designated, CCTV-monitored university exchange points (Library Foyer, Main Canteen, Peenya Gate), completely eliminating off-campus risks."),
        ("Role-Based Governance Consoles", "Dedicated Dean Executive Console (/admin) for academic administration, Verifier Quality Workstation (/verifier) for student council inspectors, and unified Dual-Mode Dashboard (/dashboard) for students.")
    ]
    for b_title, b_desc in bullet_items:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(4)
        r_bt = bp.add_run(f"{b_title}: ")
        r_bt.font.bold = True
        r_bt.font.color.rgb = RGBColor(15, 23, 42)
        bp.add_run(b_desc)

    # ─────────────────────────────────────────────────────────────
    # SECTION 2: ARCHITECTURE & TECH STACK
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("2. System Architecture & Technology Stack", level=1)
    
    p = doc.add_paragraph(
        "The application is architected as a high-performance modern web system leveraging Next.js 14 and Google Cloud Firebase:"
    )
    p.paragraph_format.space_after = Pt(8)

    tech_headers = ["Layer / Subsystem", "Technology / Framework", "Purpose & Architectural Role"]
    tech_rows = [
        ("Frontend Application", "Next.js 14 (App Router), React 18, TypeScript", "Server and client rendered responsive web application."),
        ("Styling & Design System", "Tailwind CSS, Lucide Icons, Custom Neo-Brutalism", "High-contrast 2px solid black borders, brutal drop shadows (4px 4px 0px #000), accessible palette."),
        ("Backend & APIs", "Next.js Route Handlers (/api/*)", "Edge API routes handling OTP generation, cryptographic HMAC verification, and profile management."),
        ("Cloud Database", "Google Cloud Firestore (NoSQL)", "Real-time document storage for listings, orders, conversations, messages, wishlists, and audit logs."),
        ("Cloud Storage", "Firebase Storage / Data-URL Store", "Multi-angle physical product photography storage with responsive client viewing."),
        ("Security Rules", "Firestore Security Rules (Declarative)", "Transactional listing locks, participant-only chat authorization, role-based admin guards."),
        ("Email & Auth Transport", "Nodemailer, Google SMTP, HMAC-SHA256", "Secure institutional OTP delivery with 10-minute validity and per-IP rate limiting."),
        ("Testing Suite", "Vitest, @firebase/rules-unit-testing", "137 unit tests covering academic lock, inactivity timeout, AI validation, and security rules.")
    ]
    tech_table = doc.add_table(rows=len(tech_rows) + 1, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header row
    for col_idx, text in enumerate(tech_headers):
        cell = tech_table.rows[0].cells[col_idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, row_data in enumerate(tech_rows, start=1):
        row = tech_table.rows[row_idx]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True

    # Column widths
    for row in tech_table.rows:
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(2.2)
        row.cells[2].width = Inches(3.0)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ─────────────────────────────────────────────────────────────
    # SECTION 3: MASTER CREDENTIALS & PASSWORDS DIRECTORY
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("3. Master Credentials & Password Directory", level=1)
    
    p = doc.add_paragraph(
        "For system demonstration, institutional evaluation, and administrative oversight, the platform provides pre-seeded accounts "
        "spanning all primary university roles. Direct 1-click login buttons have been intentionally removed from the login page "
        "to reflect genuine production security. Use the exact email and password combinations listed below to sign in via /login:"
    )
    p.paragraph_format.space_after = Pt(8)

    cred_table = doc.add_table(rows=7, cols=5)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cred_headers = ["Role & Persona", "Display Name", "University Email", "Password", "Assigned Console URL"]
    cred_data = [
        ("Administrator / Dean", "Dean of Student Affairs", "admin@msruas.ac.in", "CampusAdmin@2024", "/admin"),
        ("Quality Verifier", "Verifier Desk (Council)", "verifier@msruas.ac.in", "CampusVerifier@2024", "/verifier"),
        ("Student (Senior Seller)", "Aarav Sharma (4th Yr CSE)", "aarav.sharma@msruas.ac.in", "StudentPass@2024", "/dashboard (Selling Mode)"),
        ("Student (Junior Buyer)", "Priya Patel (3rd Yr ECE)", "priya.patel@msruas.ac.in", "StudentPass@2024", "/dashboard (Buying Mode)"),
        ("Student (Maker / Hosteler)", "Rohit Kumar (2nd Yr ME)", "rohit.kumar@msruas.ac.in", "StudentPass@2024", "/browse & /orders"),
        ("Suspended Student (Test)", "Suspended Sam", "sam@msruas.ac.in", "StudentPass@2024", "/forbidden (Auto-Guarded)")
    ]

    for col_idx, text in enumerate(cred_headers):
        cell = cred_table.rows[0].cells[col_idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, row_data in enumerate(cred_data, start=1):
        row = cred_table.rows[row_idx]
        bg = "FEFCE8" if "Admin" in row_data[0] else ("ECFDF5" if "Verifier" in row_data[0] else ("F8FAFC" if row_idx % 2 == 1 else "FFFFFF"))
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True
            elif col_idx in (2, 3):
                r.font.name = 'Consolas'
                r.font.bold = True
                if col_idx == 3:
                    r.font.color.rgb = RGBColor(185, 28, 28)

    for row in cred_table.rows:
        row.cells[0].width = Inches(1.6)
        row.cells[1].width = Inches(1.5)
        row.cells[2].width = Inches(1.8)
        row.cells[3].width = Inches(1.5)
        row.cells[4].width = Inches(1.4)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Callout note
    callout = doc.add_paragraph()
    set_cell_background_p = callout.add_run(
        "SECURITY NOTICE: All university accounts require a password of at least 8 characters containing both alphabetical letters "
        "and numerical digits. For new registrations, an automated 6-digit OTP is dispatched via SMTP from campus.marketplace.ruas@gmail.com "
        "with an HMAC-SHA256 signature and a 10-minute expiry."
    )
    set_cell_background_p.font.size = Pt(9.5)
    set_cell_background_p.font.italic = True
    set_cell_background_p.font.color.rgb = RGBColor(71, 85, 105)
    callout.paragraph_format.space_after = Pt(14)

    # ─────────────────────────────────────────────────────────────
    # SECTION 4: DEMO DATA CATALOG
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("4. Seeded Demo Data Inventory", level=1)
    
    p = doc.add_paragraph(
        "The platform includes 12 realistic university items, populated across various categories, conditions, and lifecycle states:"
    )
    p.paragraph_format.space_after = Pt(8)

    items_table = doc.add_table(rows=13, cols=6)
    items_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    item_headers = ["Item ID", "Title & Specifications", "Category", "Condition", "Price", "Status"]
    item_rows = [
        ("lst_calc_01", "Casio fx-991EX ClassWiz Calculator", "Electronics", "Like New", "₹950", "Available"),
        ("lst_book_01", "Higher Engg Mathematics (B.S. Grewal 44th)", "Textbooks", "Good", "₹450", "Available"),
        ("lst_coat_01", "White Lab Coat with MSRUAS Crest (Size M)", "Lab Gear", "Good", "₹320", "Available"),
        ("lst_cycle_01", "Hercules Roadeo 21-Speed Mountain Bike", "Mobility", "Good", "₹4,200", "Available"),
        ("lst_micro_01", "Microcontroller 8051 Kit + Breadboard", "Electronics", "Good", "₹1,200", "Available"),
        ("lst_book_02", "Data Structures & Algorithms (Karumanchi)", "Textbooks", "Like New", "₹380", "Available"),
        ("lst_kettle_01", "Pigeon 1.5L Stainless Steel Electric Kettle", "Hostel Gear", "Good", "₹480", "Available"),
        ("lst_draft_01", "Omega Mini Drafter & Drawing Sheet Tube", "Stationery", "Good", "₹260", "Available"),
        ("lst_lamp_01", "LED Desk Study Lamp (3 Brightness Levels)", "Hostel Gear", "Like New", "₹350", "Available"),
        ("lst_meter_pending", "Digital Multimeter with Test Probes", "Lab Gear", "Good", "₹400", "Pending (Verifier)"),
        ("lst_book_sold", "Digital Logic & Computer Design (Morris Mano)", "Textbooks", "Good", "₹320", "Sold (Order Demo)"),
        ("lst_spam_hidden", "Unverified Luxury Smartwatch Replica", "Electronics", "Fair", "₹2,500", "Hidden (3 Reports)")
    ]

    for col_idx, text in enumerate(item_headers):
        cell = items_table.rows[0].cells[col_idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, row_data in enumerate(item_rows, start=1):
        row = items_table.rows[row_idx]
        bg = "FEF2F2" if "Hidden" in row_data[5] else ("FFFBEB" if "Pending" in row_data[5] else ("F1F5F9" if "Sold" in row_data[5] else ("F8FAFC" if row_idx % 2 == 1 else "FFFFFF")))
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.name = 'Consolas'
                r.font.bold = True
            elif col_idx == 4:
                r.font.bold = True
            elif col_idx == 5:
                r.font.bold = True
                if "Available" in text:
                    r.font.color.rgb = RGBColor(22, 101, 52)
                elif "Pending" in text:
                    r.font.color.rgb = RGBColor(161, 98, 7)
                elif "Hidden" in text:
                    r.font.color.rgb = RGBColor(185, 28, 28)

    for row in items_table.rows:
        row.cells[0].width = Inches(1.3)
        row.cells[1].width = Inches(2.3)
        row.cells[2].width = Inches(1.1)
        row.cells[3].width = Inches(0.9)
        row.cells[4].width = Inches(0.8)
        row.cells[5].width = Inches(1.2)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Sample Order details
    add_custom_heading("Sample Order Demonstration (ord_demo_101):", level=3)
    p = doc.add_paragraph(
        "• Order ID: ord_demo_101\n"
        "• Item: Digital Logic & Computer Design by M. Morris Mano (lst_book_sold)\n"
        "• Buyer: Rohit Kumar (usr_student_3) | Seller: Priya Patel (usr_student_2)\n"
        "• Agreed Handover Spot: Main Campus Canteen (GF) | CCTV Monitored\n"
        "• Agreed Amount: ₹320 (UPI Simulator Confirmed)\n"
        "• Invoice Number: MSRUAS-2026-DEMO101 (Printable Voucher available at /orders/ord_demo_101/invoice)"
    )
    p.paragraph_format.space_after = Pt(14)

    # ─────────────────────────────────────────────────────────────
    # SECTION 5: STEP-BY-STEP USER MANUAL BY PERSONA
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("5. Role-Based User Manual & Step-by-Step Workflows", level=1)

    # 5.1 Student Buyer
    add_custom_heading("5.1 Student Buyer Workflow (Finding, Inspecting & Purchasing Items)", level=2)
    buyer_steps = [
        ("Step 1: Sign In or Register", "Navigate to /login. Enter your university email (e.g. priya.patel@msruas.ac.in) and password (StudentPass@2024). First-time students click 'Verify student email & register' at /register, receive a 6-digit email OTP, and complete their academic profile."),
        ("Step 2: Browse the Notice Board", "Visit /browse. Use the top search bar to find items by keyword ('calculator', 'grewal', 'kettle') or select category chips ('Textbooks & Notes', 'Electronics & Calculators', 'Hostel Essentials'). Filter by condition ('Like New', 'Good', 'Fair')."),
        ("Step 3: Item Inspection & Valuation", "Click on any listing card to open /listings/[id]. Review 3 distinct photographic angles, check the AI Fair-Price Benchmark (which evaluates market ranges like ₹850-₹1100 for Casio fx-991EX), and inspect the seller's verified student badge, course, and campus."),
        ("Step 4: Real-Time Chat with Seller", "Click the 'Chat with Seller' button on the listing page. The system instantly initializes a private, participant-only chat thread at /messages/[id]. Message the seller to agree on meetup timing or ask questions. Sellers with listed phone numbers also display a direct 'Call Seller' button."),
        ("Step 5: Checkout & Payment Simulation", "Click 'Buy Now' to proceed to /checkout/[id]. Select an approved CCTV-monitored campus meetup spot (e.g., 'University Library Entrance') and choose your payment method ('Cash on Handover' or 'Simulated Campus UPI'). The listing status atomically locks from 'available' to 'sold'."),
        ("Step 6: Order Tracking & Printable Invoice", "Track the transaction stages at /orders/[id]: Placed -> Payment Confirmed -> Meetup Scheduled -> Handover Complete. Click 'View Printable Invoice' to generate an official GST-exempt campus handover voucher."),
        ("Step 7: Handover & Issue Resolution", "Inspect the physical item at the CCTV spot. If satisfied, confirm completion. If misrepresented or damaged, click 'Report Issue / Request Return' within 48 hours to initiate student mediation.")
    ]
    for s_title, s_desc in buyer_steps:
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(4)
        r = sp.add_run(f"{s_title}: ")
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        sp.add_run(s_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 5.2 Student Seller
    add_custom_heading("5.2 Student Seller Workflow (Listing, Pricing & Handover Management)", level=2)
    seller_steps = [
        ("Step 1: Switch to Selling Mode", "From the top navigation bar or /dashboard, click 'Selling Mode'. The dashboard transforms to show your Active Inventory, Pending Verifier Approvals, and Completed Peer Sales."),
        ("Step 2: Post a New Listing", "Click '+ Post New Listing' to open /listings/new. Provide the item title, description, category, physical condition, and price in INR. Upload 1 to 5 clear photographs of the actual physical item."),
        ("Step 3: Automated AI Quality Pre-Check", "Before submission, the client-side AI analysis evaluates your listing in real time. It confirms academic relevance, verifies that the price falls within peer fair-trade benchmarks, and ensures no prohibited items (weapons, chemicals, contraband) are present."),
        ("Step 4: Student Council Verification Queue", "High-value and safety-critical gear is submitted to the Verifier Queue with status 'pending'. You will receive an automated campus notification when the student council verifier approves your item."),
        ("Step 5: Coordinate with Prospective Buyers", "Access /messages to view incoming inquiries from peer buyers. Coordinate a convenient exchange time at one of the designated CCTV campus meetup spots."),
        ("Step 6: Confirm Handover & Receive Payment", "Meet the buyer at the scheduled spot, present the item for inspection, collect cash or UPI payment, and mark the order as 'Handover Complete' in /orders/[id].")
    ]
    for s_title, s_desc in seller_steps:
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(4)
        r = sp.add_run(f"{s_title}: ")
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        sp.add_run(s_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 5.3 Quality Verifier
    add_custom_heading("5.3 Verifier Quality Workstation Workflow (/verifier)", level=2)
    p = doc.add_paragraph(
        "The Verifier Desk is reserved exclusively for appointed Student Council Representatives and Lab Technicians. "
        "Log in as verifier@msruas.ac.in (CampusVerifier@2024) to access the dedicated /verifier console:"
    )
    p.paragraph_format.space_after = Pt(6)
    verifier_steps = [
        ("Inspection Queue Review", "Review newly submitted listings with 'pending' status. The workstation presents full item photographs, description, proposed price, seller profile, and AI pre-check flags."),
        ("Authenticity Checklist", "Verify that textbook editions match active MSRUAS academic syllabi, calculators feature approved non-programmable exam badges, lab coats display the embroidered crest, and electronics are functional."),
        ("One-Click Approval", "Click 'Approve Listing' with an optional verifier stamp note. The item status transitions to 'available' and immediately publishes to the public notice board."),
        ("Constructive Rejection", "If an item is substandard, overpriced, or prohibited, click 'Reject Listing' and provide a mandatory explanatory note. The seller receives an instant notification advising corrective action."),
        ("Verification Audit History", "Browse past verification decisions with exact timestamps and inspector signatures to ensure institutional transparency.")
    ]
    for s_title, s_desc in verifier_steps:
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(4)
        r = sp.add_run(f"{s_title}: ")
        r.font.bold = True
        r.font.color.rgb = RGBColor(22, 101, 52)
        sp.add_run(s_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 5.4 Dean / Administrator
    add_custom_heading("5.4 Dean Executive Console Workflow (/admin)", level=2)
    p = doc.add_paragraph(
        "The Dean Executive Console is the highest-tier administrative interface, engineered for the Dean of Student Affairs, "
        "Chief Proctor, and University System Administrators. Log in as admin@msruas.ac.in (CampusAdmin@2024) to access /admin:"
    )
    p.paragraph_format.space_after = Pt(6)
    admin_steps = [
        ("Executive KPI Dashboard", "Monitor real-time campus metrics: Total Enrolled Students, Active Notice Board Inventory, Completed Peer Transactions, and Outstanding Disciplinary Reports."),
        ("User Account Governance & Disciplinary Actions", "Search any student by name, email, or Student Registration Number (SRN). View their complete listing and purchase history. One-click 'Freeze / Suspend Account' immediately revokes write privileges and redirects offender sessions to /forbidden."),
        ("Moderation Queue & Takedown Authority", "Review items flagged by students for counterfeit, price gouging, or spam. Investigate reporter claims, view evidence, and execute unilateral 'Permanently Delete Listing' or 'Dismiss Report'."),
        ("Dispute Mediation & Return Adjudication", "Inspect unresolved return requests between buyers and sellers. Review chat logs and make final binding determinations on refund or item return."),
        ("Immutable System Audit Log", "Inspect an unalterable chronological ledger of all high-privilege system actions (logins, status changes, account bans, deletions) recorded with actor IDs, IP references, and server timestamps.")
    ]
    for s_title, s_desc in admin_steps:
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(4)
        r = sp.add_run(f"{s_title}: ")
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        sp.add_run(s_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ─────────────────────────────────────────────────────────────
    # SECTION 6: SECURITY & GOVERNANCE POLICIES
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("6. University Security & Governance Policies", level=1)

    sec_rules = [
        ("1. Strict Academic Domain Lock", "Only institutional emails terminating in @msruas.ac.in or subdomains like .msruas.ac.in are accepted. Registrations using Gmail, Yahoo, Outlook, or protonmail are blocked at the edge API layer and in security rules."),
        ("2. 10-Minute Inactivity Session Timeout", "To protect shared laboratory and library workstations, the application runs a client-side inactivity listener. After 10 minutes without mouse or keyboard activity, the user session is securely terminated and redirected to /login?reason=session_expired."),
        ("3. Cryptographic HMAC OTP Validation", "OTP tokens are hashed using HMAC-SHA256 with server-side secrets. The plain code is never stored in the database, has a 10-minute expiry, and is rate-limited to 3 requests per IP per 15 minutes."),
        ("4. Declarative Firestore Security Rules", "Transactional sale locking ensures a listing can only transition to 'sold' if the order price matches the listing price exactly and the buyer is not the seller. Conversation reads and writes are restricted exclusively to participant UIDs. Audit logs are strictly admin-writable."),
        ("5. Automated Anti-Spam Community Shield", "Any listing that receives 3 distinct student reports automatically transitions from 'available' to 'hidden', disappearing from the notice board until audited by the Dean's desk."),
        ("6. Official CCTV Meetup Zones", "All transactions must select one of the university's approved CCTV zones: (1) Main Campus Canteen (GF), (2) University Library Foyer, (3) Peenya Campus Tech Gate, (4) Ganga/Kaveri Hostel Security Post, or (5) Student Activity Center.")
    ]
    for r_title, r_desc in sec_rules:
        rp = doc.add_paragraph()
        rp.paragraph_format.space_after = Pt(4)
        r = rp.add_run(f"{r_title}: ")
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        rp.add_run(r_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ─────────────────────────────────────────────────────────────
    # SECTION 7: TROUBLESHOOTING & SUPPORT
    # ─────────────────────────────────────────────────────────────
    add_custom_heading("7. Troubleshooting & University Support Contacts", level=1)

    faq_items = [
        ("Q: Why was my listing hidden automatically?", "A: If a listing receives 3 reports from fellow students regarding pricing or condition inaccuracies, the system automatically places it in 'hidden' state pending review by the Dean or Verifier Desk."),
        ("Q: I forgot my password or cannot log in.", "A: Use your official university email. If you need a credential reset, contact campus.marketplace.ruas@gmail.com with your student ID card scan."),
        ("Q: Can I buy items using cash?", "A: Yes. During checkout, select 'Cash on Handover'. Payment occurs physically when you inspect and collect the item at the designated CCTV meetup spot."),
        ("Q: What if the item received does not match the photos?", "A: Open /orders/[id] and click 'Report Issue / Request Return' within 48 hours of physical exchange. The Dean's office will arbitrate the dispute using the chat transcript and initial listing specifications.")
    ]
    for q, a in faq_items:
        fp = doc.add_paragraph()
        fp.paragraph_format.space_after = Pt(4)
        rq = fp.add_run(f"{q}\n")
        rq.font.bold = True
        rq.font.color.rgb = RGBColor(15, 23, 42)
        ra = fp.add_run(a)
        ra.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # Footer note
    foot = doc.add_paragraph()
    rf = foot.add_run("M.S. Ramaiah University of Applied Sciences • Directorate of Student Affairs & Academic Computing • 2026")
    rf.font.size = Pt(8.5)
    rf.font.bold = True
    rf.font.color.rgb = RGBColor(148, 163, 184)
    foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Save DOCX
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"✓ Word Document successfully generated: {output_path}")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Campus Marketplace — User Manual & Operations Guide (MSRUAS)")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL — FOR MSRUAS STUDENTS, FACULTY & AUDITORS")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)
        self.restoreState()

def generate_pdf(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")
    c_secondary = colors.HexColor("#1E293B")
    c_accent = colors.HexColor("#FFE500")
    c_muted = colors.HexColor("#475569")
    c_border = colors.HexColor("#000000")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=4
    )
    inst_style = ParagraphStyle(
        'DocInst',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_muted,
        spaceAfter=2
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        textColor=c_muted,
        spaceAfter=14
    )
    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_secondary,
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#991B1B")
    )
    th_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    td_style = ParagraphStyle(
        'TDStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_secondary
    )
    td_bold_style = ParagraphStyle(
        'TDBoldStyle',
        parent=td_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # Title Banner
    story.append(Paragraph("M.S. RAMAIAH UNIVERSITY OF APPLIED SCIENCES", inst_style))
    story.append(Paragraph("CAMPUS MARKETPLACE", title_style))
    story.append(Paragraph("Official System User Manual, Security Architecture & Operations Guide (v2.0 Enterprise)", sub_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_border, spaceBefore=0, spaceAfter=12))

    # Meta Table
    meta_data = [
        [Paragraph("<b>System URL / Web App</b>", td_style), Paragraph("Production Vercel Cloud Deployment & Localhost 3000", td_style)],
        [Paragraph("<b>Source Code Repository</b>", td_style), Paragraph("https://github.com/shreyasadiga82/campus_e_marketplace (main)", td_style)],
        [Paragraph("<b>Institutional Domain</b>", td_style), Paragraph("<b>@msruas.ac.in</b> (Strict Domain Lock & Institutional Regex)", td_style)],
        [Paragraph("<b>Version & Architecture</b>", td_style), Paragraph("v2.0 Enterprise • Next.js 14 App Router • Firebase Serverless Cloud", td_style)],
        [Paragraph("<b>Author / Engineering Lead</b>", td_style), Paragraph("Shreyas Adiga & Google DeepMind Antigravity AI Engineering", td_style)]
    ]
    t_meta = Table(meta_data, colWidths=[150, 354])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#FFFFFF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Section 1
    story.append(Paragraph("1. Executive Summary & Platform Purpose", h1_style))
    story.append(Paragraph(
        "Campus Marketplace is a purpose-built, secure Peer-to-Peer (P2P) academic notice board and student commerce platform "
        "engineered exclusively for M.S. Ramaiah University of Applied Sciences (MSRUAS). The platform eliminates the dangers of "
        "unvetted social media trading (WhatsApp groups, random Telegram channels, OLX) by enforcing verified academic email logins, "
        "AI fair-price valuation bounds, student council quality verification, and safe CCTV-monitored campus handovers.",
        body_style
    ))
    story.append(Paragraph("• <b>Institutional Identity Verification:</b> Restricted strictly to authenticated @msruas.ac.in accounts.", bullet_style))
    story.append(Paragraph("• <b>AI Fair-Price Valuation:</b> Bounds item pricing within fair brackets to prevent price gouging.", bullet_style))
    story.append(Paragraph("• <b>Council Verification:</b> Laboratory and academic gear passes inspection before board publication.", bullet_style))
    story.append(Paragraph("• <b>CCTV Safe Handover:</b> All physical exchanges occur at authorized on-campus CCTV locations.", bullet_style))
    story.append(Paragraph("• <b>Role Consoles:</b> Distinct dashboards for Dean (/admin), Verifier (/verifier), and Students (/dashboard).", bullet_style))

    # Section 2
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    arch_data = [
        [Paragraph("Layer", th_style), Paragraph("Framework / Tool", th_style), Paragraph("Architectural Role", th_style)],
        [Paragraph("Frontend", td_bold_style), Paragraph("Next.js 14 App Router, React 18, TS", td_style), Paragraph("Server & Client rendered responsive application", td_style)],
        [Paragraph("Design System", td_bold_style), Paragraph("Tailwind CSS, Custom Neo-Brutalism", td_style), Paragraph("Solid 2px black borders, 4px brutal shadows, vibrant palette", td_style)],
        [Paragraph("Database", td_bold_style), Paragraph("Google Cloud Firestore", td_style), Paragraph("Real-time NoSQL document store with declarative rules", td_style)],
        [Paragraph("Storage", td_bold_style), Paragraph("Firebase Storage / Image Store", td_style), Paragraph("High-resolution multi-angle product photography", td_style)],
        [Paragraph("Security", td_bold_style), Paragraph("Firestore Rules, Inactivity Watchdog", td_style), Paragraph("10-minute inactivity timeout, atomic sale locking, participant chat", td_style)],
        [Paragraph("SMTP / Auth", td_bold_style), Paragraph("Nodemailer, HMAC-SHA256", td_style), Paragraph("Encrypted 6-digit OTP delivery with rate-limiting", td_style)]
    ]
    t_arch = Table(arch_data, colWidths=[90, 190, 224])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # Section 3
    story.append(Paragraph("3. Master Credentials & Passwords Directory", h1_style))
    story.append(Paragraph(
        "Direct 1-click login buttons have been permanently removed from the login page to enforce authentic institutional security. "
        "Use the official email and password credentials below to access the respective roles via <b>/login</b>:",
        body_style
    ))
    
    cred_pdf_data = [
        [Paragraph("Role", th_style), Paragraph("Name", th_style), Paragraph("University Email", th_style), Paragraph("Password", th_style), Paragraph("Panel", th_style)],
        [Paragraph("<b>Administrator / Dean</b>", td_style), Paragraph("Dean of Student Affairs", td_style), Paragraph("admin@msruas.ac.in", td_style), Paragraph("CampusAdmin@2024", code_style), Paragraph("/admin", td_style)],
        [Paragraph("<b>Quality Verifier</b>", td_style), Paragraph("Verifier Desk (Council)", td_style), Paragraph("verifier@msruas.ac.in", td_style), Paragraph("CampusVerifier@2024", code_style), Paragraph("/verifier", td_style)],
        [Paragraph("<b>Student (Seller)</b>", td_style), Paragraph("Aarav Sharma (4th CSE)", td_style), Paragraph("aarav.sharma@msruas.ac.in", td_style), Paragraph("StudentPass@2024", code_style), Paragraph("/dashboard (Sell)", td_style)],
        [Paragraph("<b>Student (Buyer)</b>", td_style), Paragraph("Priya Patel (3rd ECE)", td_style), Paragraph("priya.patel@msruas.ac.in", td_style), Paragraph("StudentPass@2024", code_style), Paragraph("/dashboard (Buy)", td_style)],
        [Paragraph("<b>Student (Maker)</b>", td_style), Paragraph("Rohit Kumar (2nd ME)", td_style), Paragraph("rohit.kumar@msruas.ac.in", td_style), Paragraph("StudentPass@2024", code_style), Paragraph("/browse", td_style)],
        [Paragraph("<b>Suspended (Test)</b>", td_style), Paragraph("Suspended Sam", td_style), Paragraph("sam@msruas.ac.in", td_style), Paragraph("StudentPass@2024", code_style), Paragraph("/forbidden", td_style)]
    ]
    t_cred = Table(cred_pdf_data, colWidths=[100, 110, 134, 100, 60])
    t_cred.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FEFCE8"), colors.HexColor("#ECFDF5"), colors.HexColor("#F8FAFC"), colors.white, colors.HexColor("#F8FAFC"), colors.HexColor("#FEF2F2")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_cred)
    story.append(Spacer(1, 10))

    # Section 4
    story.append(Paragraph("4. Seeded Demo Data Inventory", h1_style))
    items_pdf_data = [
        [Paragraph("ID", th_style), Paragraph("Title", th_style), Paragraph("Category", th_style), Paragraph("Price", th_style), Paragraph("Status", th_style)],
        [Paragraph("lst_calc_01", td_bold_style), Paragraph("Casio fx-991EX ClassWiz Calculator", td_style), Paragraph("Electronics", td_style), Paragraph("₹950", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_book_01", td_bold_style), Paragraph("Higher Engg Math (B.S. Grewal 44th)", td_style), Paragraph("Textbooks", td_style), Paragraph("₹450", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_coat_01", td_bold_style), Paragraph("White Lab Coat (MSRUAS Crest, Size M)", td_style), Paragraph("Lab Gear", td_style), Paragraph("₹320", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_cycle_01", td_bold_style), Paragraph("Hercules Roadeo 21-Speed Mountain Bike", td_style), Paragraph("Mobility", td_style), Paragraph("₹4,200", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_micro_01", td_bold_style), Paragraph("Microcontroller 8051 Kit + Breadboard", td_style), Paragraph("Electronics", td_style), Paragraph("₹1,200", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_book_02", td_bold_style), Paragraph("Data Structures & Algorithms (Karumanchi)", td_style), Paragraph("Textbooks", td_style), Paragraph("₹380", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_kettle_01", td_bold_style), Paragraph("Pigeon 1.5L Electric Kettle for Hostel", td_style), Paragraph("Hostel", td_style), Paragraph("₹480", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_draft_01", td_bold_style), Paragraph("Omega Mini Drafter & Sheet Tube", td_style), Paragraph("Drafting", td_style), Paragraph("₹260", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_lamp_01", td_bold_style), Paragraph("LED Desk Study Lamp (3 Levels)", td_style), Paragraph("Hostel", td_style), Paragraph("₹350", td_bold_style), Paragraph("<font color='#166534'><b>Available</b></font>", td_style)],
        [Paragraph("lst_meter_pending", td_bold_style), Paragraph("Digital Multimeter with Test Probes", td_style), Paragraph("Lab Gear", td_style), Paragraph("₹400", td_bold_style), Paragraph("<font color='#A16207'><b>Pending (Queue)</b></font>", td_style)],
        [Paragraph("lst_book_sold", td_bold_style), Paragraph("Digital Logic Design (Morris Mano)", td_style), Paragraph("Textbooks", td_style), Paragraph("₹320", td_bold_style), Paragraph("<font color='#475569'><b>Sold (Demo)</b></font>", td_style)],
        [Paragraph("lst_spam_hidden", td_bold_style), Paragraph("Unverified Luxury Smartwatch Replica", td_style), Paragraph("Electronics", td_style), Paragraph("₹2,500", td_bold_style), Paragraph("<font color='#B91C1C'><b>Hidden (Flagged)</b></font>", td_style)]
    ]
    t_items = Table(items_pdf_data, colWidths=[90, 214, 80, 50, 70])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 10))

    # Section 5
    story.append(Paragraph("5. Step-by-Step User Manual by Persona", h1_style))
    story.append(Paragraph("<b>5.1 Student Buyer Workflow:</b>", h2_style))
    story.append(Paragraph("1. <b>Login:</b> Sign in at /login with official university credentials (e.g. priya.patel@msruas.ac.in / StudentPass@2024).", body_style))
    story.append(Paragraph("2. <b>Browse:</b> Open /browse to search notice board items with category filters and condition chips.", body_style))
    story.append(Paragraph("3. <b>Inspect & Chat:</b> Open listing detail at /listings/[id]. Check AI Fair-Price Benchmark. Click 'Chat with Seller' to open real-time chat at /messages/[id].", body_style))
    story.append(Paragraph("4. <b>Checkout:</b> Click 'Buy Now', choose an approved CCTV meetup spot, and select simulated payment. Listing locks to 'sold'.", body_style))
    story.append(Paragraph("5. <b>Handover & Invoice:</b> Track progress in /orders/[id], download printable invoice voucher, and confirm physical handover.", body_style))

    story.append(Paragraph("<b>5.2 Student Seller Workflow:</b>", h2_style))
    story.append(Paragraph("1. <b>Selling Mode:</b> Click 'Selling Mode' on /dashboard to view active items and sales.", body_style))
    story.append(Paragraph("2. <b>Post Listing:</b> Visit /listings/new, upload photos, provide condition and price. AI pre-check validates fair price bounds.", body_style))
    story.append(Paragraph("3. <b>Handover:</b> Coordinate with buyer in /messages, meet at selected CCTV spot, collect payment, and confirm order.", body_style))

    story.append(Paragraph("<b>5.3 Verifier Quality Workstation (/verifier):</b>", h2_style))
    story.append(Paragraph("1. Log in as <b>verifier@msruas.ac.in</b> (CampusVerifier@2024). Open <b>/verifier</b>.", body_style))
    story.append(Paragraph("2. Inspect items in pending queue (e.g. lst_meter_pending). Review AI quality scores, fair price band, and photos.", body_style))
    story.append(Paragraph("3. One-click 'Approve Listing' publishes item to notice board; 'Reject' dispatches explanatory note to seller.", body_style))

    story.append(Paragraph("<b>5.4 Dean Executive Console (/admin):</b>", h2_style))
    story.append(Paragraph("1. Log in as <b>admin@msruas.ac.in</b> (CampusAdmin@2024). Open <b>/admin</b>.", body_style))
    story.append(Paragraph("2. Review university KPI metrics, manage student accounts (one-click freeze/unfreeze), and resolve moderation reports.", body_style))
    story.append(Paragraph("3. Inspect immutable system audit log detailing privileged administrative and verification actions.", body_style))

    # Section 6 & 7
    story.append(Paragraph("6. Security & Support Policies", h1_style))
    story.append(Paragraph("• <b>Academic Lock:</b> Strict validation of @msruas.ac.in domain credentials.", bullet_style))
    story.append(Paragraph("• <b>Inactivity Watchdog:</b> Automatic session timeout after 10 minutes of inactivity.", bullet_style))
    story.append(Paragraph("• <b>CCTV Meetup Points:</b> Monitored zones (Library Foyer, Canteen, Peenya Gate, Hostel Security).", bullet_style))
    story.append(Paragraph("• <b>Support Desk:</b> For credential inquiries or dispute arbitration, email campus.marketplace.ruas@gmail.com.", bullet_style))

    # Build PDF with Page Numbering
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✓ PDF Document successfully generated: {output_path}")

def generate_markdown(output_path):
    md_content = """# M.S. Ramaiah University of Applied Sciences (MSRUAS)
# Campus Marketplace — Official User Manual & Operations Guide (v2.0 Enterprise)

**Document Classification:** Official Campus Operations Manual  
**Repository:** [github.com/shreyasadiga82/campus_e_marketplace](https://github.com/shreyasadiga82/campus_e_marketplace)  
**Academic Domain:** `@msruas.ac.in` (Strict Domain Lock)  
**Release Date:** November 2026  

---

## 1. Executive Summary & Platform Purpose
Campus Marketplace is an institutional Peer-to-Peer (P2P) student trading platform and digital notice board built specifically for M.S. Ramaiah University of Applied Sciences. The platform replaces informal, unvetted social media trading groups with an authenticated, verified ecosystem.

### Core Value Pillars:
1. **Institutional Domain Lock:** Access is exclusively restricted to verified `@msruas.ac.in` credentials.
2. **AI Fair-Trade Benchmark:** Gemini 1.5 Flash client-side rules analyze item descriptions and pricing to prevent price gouging.
3. **Student Council Quality Verifier:** Regulated academic gear (calculators, lab coats, hardware kits) requires verification before appearing on the notice board.
4. **CCTV Safe Exchange Zones:** In-person handovers are coordinated strictly at CCTV-monitored university hubs.
5. **Dedicated Role Consoles:** Independent interfaces for Deans (`/admin`), Quality Verifiers (`/verifier`), and Students (`/dashboard`).

---

## 2. Master Credentials & Passwords Directory

> **Important:** Direct 1-click demo login buttons have been permanently removed from the login page to mirror production security. Enter the credentials manually at `/login`.

| Role & Persona | Display Name | University Email | Password | Assigned Panel URL | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator / Dean** | Dean of Student Affairs | `admin@msruas.ac.in` | `CampusAdmin@2024` | `/admin` | University governance, user freeze/unfreeze, report resolution |
| **Quality Verifier** | Verifier Desk (Council) | `verifier@msruas.ac.in` | `CampusVerifier@2024` | `/verifier` | Pre-publication quality inspection & verification queue |
| **Student (Senior Seller)** | Aarav Sharma (4th Yr CSE) | `aarav.sharma@msruas.ac.in` | `StudentPass@2024` | `/dashboard` (Selling) | Managing active inventory, listing items, handover |
| **Student (Junior Buyer)** | Priya Patel (3rd Yr ECE) | `priya.patel@msruas.ac.in` | `StudentPass@2024` | `/dashboard` (Buying) | Browsing notice board, wishlisting, direct chat, checkout |
| **Student (Maker)** | Rohit Kumar (2nd Yr ME) | `rohit.kumar@msruas.ac.in` | `StudentPass@2024` | `/browse`, `/orders` | Peer equipment purchases, sample order demonstration |
| **Suspended Student (Test)** | Suspended Sam | `sam@msruas.ac.in` | `StudentPass@2024` | `/forbidden` | Security boundary test account (read/write blocked) |

*Support / System Email:* `campus.marketplace.ruas@gmail.com`

---

## 3. Seeded Demo Data Inventory

| Item ID | Title & Specifications | Category | Condition | Price | Status |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `lst_calc_01` | Casio fx-991EX ClassWiz Scientific Calculator | Electronics | Like New | ₹950 | Available |
| `lst_book_01` | Higher Engineering Mathematics (B.S. Grewal 44th Ed) | Textbooks | Good | ₹450 | Available |
| `lst_coat_01` | White Lab Coat with MSRUAS Embroidered Crest (Size M) | Lab Gear | Good | ₹320 | Available |
| `lst_cycle_01` | Hercules Roadeo 21-Speed Mountain Bicycle | Mobility | Good | ₹4,200 | Available |
| `lst_micro_01` | Microcontroller 8051 Development Kit with Breadboard | Electronics | Good | ₹1,200 | Available |
| `lst_book_02` | Data Structures & Algorithms Made Easy (Karumanchi) | Textbooks | Like New | ₹380 | Available |
| `lst_kettle_01` | Pigeon 1.5L Stainless Steel Electric Kettle for Hostel | Hostel Gear | Good | ₹480 | Available |
| `lst_draft_01` | Omega Engineering Mini Drafter & Drawing Sheet Tube | Stationery | Good | ₹260 | Available |
| `lst_lamp_01` | LED Desk Study Lamp with 3 Brightness Levels | Hostel Gear | Like New | ₹350 | Available |
| `lst_meter_pending` | Digital Multimeter with Test Probes & Transistor Tester | Lab Gear | Good | ₹400 | Pending (Verifier Queue) |
| `lst_book_sold` | Digital Logic & Computer Design by M. Morris Mano | Textbooks | Good | ₹320 | Sold (Sample Order Demo) |
| `lst_spam_hidden` | Unverified Luxury Smartwatch Replica | Electronics | Fair | ₹2,500 | Hidden (Auto-Hidden 3 Reports) |

### Sample Order Demonstration (`ord_demo_101`):
* **Order ID:** `ord_demo_101`
* **Item:** Digital Logic & Computer Design by M. Morris Mano (`lst_book_sold`)
* **Buyer:** Rohit Kumar (`usr_student_3`) | **Seller:** Priya Patel (`usr_student_2`)
* **Price:** ₹320 (UPI Simulator Confirmed)
* **Handover Point:** Main Campus Canteen (GF) | CCTV Monitored
* **Printable Invoice Voucher:** Accessible at `/orders/ord_demo_101/invoice`

---

## 4. Role-Based User Manual & Step-by-Step Workflows

### 4.1 Student Buyer Workflow
1. **Sign In:** Go to `/login` and sign in using your official email (`priya.patel@msruas.ac.in` / `StudentPass@2024`).
2. **Browse & Filter:** Visit `/browse`. Search keywords or filter by category and condition.
3. **Inspect Listing:** Open `/listings/[id]`. Check multi-angle photos and the AI Fair-Price Benchmark.
4. **Chat with Seller:** Click 'Chat with Seller' to open `/messages/[id]` and coordinate questions.
5. **Checkout:** Select an approved CCTV meetup spot and simulated payment method at `/checkout/[id]`.
6. **Order Tracking & Invoice:** Follow stages in `/orders/[id]`. Print invoice at `/orders/[id]/invoice`.
7. **Dispute Resolution:** In case of discrepancy, click 'Report Issue / Request Return' within 48 hours.

### 4.2 Student Seller Workflow
1. **Activate Selling Mode:** Click 'Selling Mode' on `/dashboard`.
2. **Post Listing:** Click '+ Post New Listing' (`/listings/new`). Upload photos and enter details.
3. **AI Pre-check:** Real-time AI analysis validates price benchmarks and flags non-academic items.
4. **Verifier Queue:** Regulated items enter `/verifier` queue and publish automatically once approved.
5. **Manage & Handover:** Coordinate with buyers in `/messages` and confirm handover at CCTV spot.

### 4.3 Verifier Quality Workstation (`/verifier`)
1. Log in as `verifier@msruas.ac.in` (`CampusVerifier@2024`) and open `/verifier`.
2. Inspect pending submissions (`lst_meter_pending`). Review photos, condition, and AI quality grade.
3. Click 'Approve Listing' to publish live or 'Reject Listing' with a required explanatory reason.

### 4.4 Dean Executive Console (`/admin`)
1. Log in as `admin@msruas.ac.in` (`CampusAdmin@2024`) and open `/admin`.
2. Review university marketplace KPIs (Users, Listings, Orders, Reports).
3. Manage enrolled students: one-click Freeze / Unfreeze user account status.
4. Moderate reported items and review immutable system audit logs.

---

## 5. Security Policies & Technical Safeguards
1. **Academic Domain Lock:** Rejects non-university email domains at API and security rules level.
2. **10-Minute Inactivity Session Timeout:** Automatically logs out idle sessions to protect shared library PCs.
3. **HMAC-SHA256 OTP:** Server-side cryptographic token validation with per-IP rate limiting.
4. **Transactional Sale Locking:** Listings atomically switch to 'sold' upon order creation.
5. **Anti-Spam Threshold:** 3 distinct user reports automatically transition listing to 'hidden'.
6. **Approved CCTV Spots:** Main Canteen (GF), Library Foyer, Peenya Tech Gate, Hostel Security Post.

---

## 6. Support & Contact
For account recovery or dispute mediation:
* **Support Email:** `campus.marketplace.ruas@gmail.com`
* **Department:** Directorate of Student Affairs & Academic Computing, MSRUAS Bengaluru
"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"✓ Markdown Document successfully generated: {output_path}")

def main():
    print("Generating comprehensive Campus Marketplace documentation suite...")
    
    # 1. Generate in docs/docx/
    generate_docx("docs/docx/Campus_Marketplace_User_Manual.docx")
    generate_pdf("docs/docx/Campus_Marketplace_User_Manual.pdf")
    
    # 2. Copy/Generate in docs/ root
    shutil.copyfile("docs/docx/Campus_Marketplace_User_Manual.docx", "docs/USER_MANUAL.docx")
    shutil.copyfile("docs/docx/Campus_Marketplace_User_Manual.pdf", "docs/USER_MANUAL.pdf")
    print("✓ Mirrored copies to docs/USER_MANUAL.docx and docs/USER_MANUAL.pdf")

    # 3. Generate Markdown
    generate_markdown("docs/USER_MANUAL.md")
    generate_markdown("docs/docx/Campus_Marketplace_User_Manual.md")

    print("\nAll manuals successfully compiled across .docx, .pdf, and .md formats!")

if __name__ == "__main__":
    main()

import os
from pathlib import Path
import fitz # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

def generate_synthetic_demos(demo_dir: Path):
    demo_dir.mkdir(parents=True, exist_ok=True)

    # 1. Synthetic Indian KYC PDF
    kyc_pdf_path = demo_dir / "synthetic_kyc_record.pdf"
    doc1 = fitz.open()
    page1 = doc1.new_page(width=595, height=842) # A4
    text1 = """
CONFIDENTIAL - CITIZEN KYC VERIFICATION RECORD
--------------------------------------------------------------------------------
GOVERNMENT OF INDIA - STATUTORY IDENTIFIERS FORM (SYNTHETIC DEMO)

Applicant Full Name: Ramesh Kumar Sharma
Date of Birth: 14/08/1986
Gender: Male

Permanent Account Number (PAN): ABCDE1234F
Aadhaar Identity Number: 2345 6789 0123
Voter ID (EPIC): ABC1234567

Contact Information:
Mobile Number: +91 98765 43210
Secondary Telephone: 044-28345678
Official Email: ramesh.sharma@example-corp.in
Residential Address: 42 Palm Meadows, Indiranagar, Bangalore, Karnataka 560038

Banking Information:
Bank Name: State Bank of India
IFSC Code: SBIN0001234
Account Status: Active KYC Verified

Verification Officer: Inspector A. K. Varma
Inspection Date: 12-September-2026
--------------------------------------------------------------------------------
Notice: This document contains sensitive Personally Identifiable Information (PII).
Unauthorized disclosure is prohibited under DPDP Act provisions.
"""
    page1.insert_text((50, 60), text1, fontsize=11, lineheight=1.4)
    doc1.save(str(kyc_pdf_path))
    doc1.close()

    # 2. Synthetic Medical Invoice PDF
    invoice_pdf_path = demo_dir / "synthetic_medical_invoice.pdf"
    doc2 = fitz.open()
    page2 = doc2.new_page(width=595, height=842)
    text2 = """
METROPOLITAN GENERAL HOSPITAL & SURGICAL CARE
100 Health Avenue, Suite 400, Chicago, IL 60601
Phone: (312) 555-0199 | billing@metro-health.org
--------------------------------------------------------------------------------
PATIENT STATEMENT & ENCOUNTER BILLING

Patient Name: Eleanor Vance
Date of Admission: 04/12/2026
Emergency Contact: David Vance (+1-312-555-0144)
Billing Contact: eleanor.vance@chicago-mail.net
Home Address: 742 Evergreen Terrace, Chicago, Illinois

Attending Physician: Dr. Marcus Brody, MD
Department: Cardiology & Diagnostic Imaging

Summary of Charges:
1. Advanced Echocardiogram .......................... $1,250.00
2. Inpatient Monitoring & Vitals ..................... $850.00
3. Prescription Medication .......................... $340.00
Total Due: $2,440.00

Payment Details:
Cardholder: Eleanor Vance
Payment Card Number: 4532 8901 2345 6789
Payment Method: VISA Platinum Card
Billing Authorization Ref: AUTH-8829104-IL
--------------------------------------------------------------------------------
HIPAA SECURITY ADVISORY:
Protected Health Information (PHI). Subject to federal privacy safeguards.
"""
    page2.insert_text((50, 60), text2, fontsize=11, lineheight=1.4)
    doc2.save(str(invoice_pdf_path))
    doc2.close()

    # 3. Synthetic Executive Resume PDF
    resume_pdf_path = demo_dir / "synthetic_executive_resume.pdf"
    doc3 = fitz.open()
    page3 = doc3.new_page(width=595, height=842)
    text3 = """
SARAH JENKINS
Senior Cybersecurity Architect & Privacy Engineer
San Francisco, CA | sarah.jenkins@privacy-tech.io | +1 (415) 555-9087
LinkedIn: https://linkedin.com/in/sarah-jenkins-synth | IP: 192.168.1.105

PROFESSIONAL SUMMARY
Results-driven Information Security Architect with 10+ years specializing in PII detection,
data loss prevention (DLP), zero-trust architecture, and GDPR / DPDP compliance engineering.

TECHNICAL EXPERTISE
- Frameworks: Microsoft Presidio, spaCy, PyMuPDF, OpenCV, Tesseract OCR
- Security Protocols: SOC2 Type II, ISO 27001, HIPAA, PCI-DSS, NIST 800-53
- Cloud Platforms: AWS GuardDuty, Google Cloud DLP, HashiCorp Vault

EMPLOYMENT HISTORY
Lead Security Engineer | Apex Financial Technologies | 2022 - Present
- Designed automated document redaction pipelines scrubbing sensitive cardholder data.
- Built identity de-anonymization defense systems protecting 4M+ user records.

Security Analyst | Pacific Data Systems | 2018 - 2022
- Managed privacy telemetry audits and incident response for financial institutions.

EDUCATION
B.S. in Computer Science - University of California, Berkeley (2018)
"""
    page3.insert_text((50, 60), text3, fontsize=11, lineheight=1.4)
    doc3.save(str(resume_pdf_path))
    doc3.close()

    # 4. Synthetic Scanned Identity Card PNG (for OCR testing)
    scan_png_path = demo_dir / "synthetic_scanned_id.png"
    img = Image.new("RGB", (700, 450), color=(245, 245, 240))
    d = ImageDraw.Draw(img)
    # Header bar
    d.rectangle([(0, 0), (700, 60)], fill=(30, 41, 59))
    d.text((30, 20), "SHIELDGRID SYNTHETIC CITIZEN ID - OCR DEMO", fill=(255, 255, 255))
    
    # ID Photo placeholder
    d.rectangle([(40, 100), (180, 260)], fill=(200, 210, 225), outline=(100, 116, 139), width=2)
    d.text((70, 170), "[PHOTO]", fill=(71, 85, 105))

    # Text details
    lines = [
        "NAME: VIKRAM RAJESH ADITYA",
        "PAN NUMBER: BCDPA1234K",
        "AADHAAR NO: 3456 7890 1234",
        "DATE OF ISSUE: 15/09/2024",
        "PHONE: +91 94433 22110",
        "IFSC: HDFC0000123",
        "ADDRESS: 15 GANDHI ROAD, CHENNAI, TN 600001"
    ]
    y = 100
    for line in lines:
        d.text((220, y), line, fill=(15, 23, 42))
        y += 35

    # Bottom notice
    d.rectangle([(0, 390), (700, 450)], fill=(226, 232, 240))
    d.text((30, 410), "SYNTHETIC SAMPLE FOR FORENSIC OCR & PRIVACY TESTING", fill=(100, 116, 139))
    img.save(str(scan_png_path))

    # 5. Synthetic Text Log file
    txt_path = demo_dir / "synthetic_access_log.txt"
    with open(txt_path, "w") as f:
        f.write("""SECURITY ACCESS & AUDIT LOG - SYSTEM SERVER 04
TIMESTAMP: 2026-09-12 10:14:22 UTC
OPERATOR: Alexander Hayes (alex.hayes@securenet.internal)
CLIENT IP: 198.51.100.42
USER ID: EMP-99214
CONTACT: +1-202-555-0188
AUTHORIZATION CARD: 4012888899991111
REASON: Database Maintenance & Key Rotation
STATUS: SUCCESSFUL_AUTHENTICATION
""")

if __name__ == "__main__":
    generate_synthetic_demos(Path(__file__).parent)
    print("Synthetic demo files generated successfully.")

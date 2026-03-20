"""
Generate sample resume PDFs for testing SkillForge.
Uses PyMuPDF (already installed) — no extra dependencies needed.

Usage: python create_sample_resume.py
"""

try:
    import fitz
except ImportError:
    import pymupdf as fitz


def create_tech_resume():
    """Create a sample tech resume PDF."""
    doc = fitz.open()
    page = doc.new_page()

    text = """ALEX SHARMA
Software Engineer | alex.sharma@email.com | github.com/alexsharma

SUMMARY
Passionate software engineer with 3 years of experience building web applications 
and backend services. Skilled in Python, JavaScript, and cloud technologies.

EXPERIENCE

Software Engineer — TechStartup Inc. (2023 - Present)
• Built REST APIs using Python and Flask serving 10K+ daily users
• Designed and managed PostgreSQL databases with complex queries
• Implemented CI/CD pipelines using GitHub Actions
• Deployed applications on AWS EC2 and S3
• Wrote unit tests achieving 85% code coverage

Junior Developer — WebAgency Co. (2021 - 2023)
• Developed responsive frontends using HTML, CSS, and JavaScript
• Built React components for a SaaS dashboard product
• Collaborated with UI/UX designers using Figma
• Managed version control with Git and GitHub

EDUCATION
B.Tech in Computer Science — State University (2021)
GPA: 3.6/4.0

SKILLS
Programming: Python, JavaScript, HTML, CSS, SQL
Frameworks: Flask, React, Express.js
Databases: PostgreSQL, MongoDB
Tools: Git, Docker, AWS (EC2, S3), GitHub Actions, VS Code
Soft Skills: Team Collaboration, Problem Solving, Communication

CERTIFICATIONS
• AWS Cloud Practitioner (2023)
• Python Institute PCAP (2022)

PROJECTS
• E-Commerce Platform: Full-stack app with Flask + React + PostgreSQL
• Weather Dashboard: React app with OpenWeatherMap API integration
• Blog Engine: Node.js + Express + MongoDB CRUD application
"""

    # Insert text onto page
    rect = fitz.Rect(50, 50, 550, 800)
    page.insert_textbox(rect, text, fontsize=9, fontname="helv")
    
    output_path = "sample_resume_tech.pdf"
    doc.save(output_path)
    doc.close()
    print(f"✅ Created: {output_path}")


def create_ops_resume():
    """Create a sample operations manager resume PDF."""
    doc = fitz.open()
    page = doc.new_page()

    text = """PRIYA PATEL
Operations Coordinator | priya.patel@email.com | (555) 123-4567

SUMMARY
Detail-oriented operations professional with 4 years of experience in 
manufacturing and warehouse environments. Strong track record in inventory 
management, team coordination, and safety compliance.

EXPERIENCE

Operations Coordinator — MegaFactory Corp. (2022 - Present)
• Coordinated daily production schedules for 30-person team
• Managed inventory tracking systems reducing stockouts by 20%
• Conducted weekly safety inspections and OSHA compliance checks
• Prepared monthly operational reports for senior management
• Trained 15 new employees on standard operating procedures

Warehouse Associate — LogiCorp (2020 - 2022)
• Processed 200+ daily orders using warehouse management system
• Operated forklift and maintained equipment safety records
• Assisted in quarterly inventory audits
• Maintained clean and organized workspace per safety standards

EDUCATION
B.S. in Business Administration — City College (2020)
Minor in Supply Chain Management

SKILLS
Operations: Inventory Management, Warehouse Operations, Production Scheduling
Safety: OSHA Awareness, Safety Inspections, Incident Reporting
Tools: Microsoft Excel, SAP (basic), Inventory Management Software
Communication: Team Coordination, Report Writing, Training Delivery
Leadership: Team Supervision, Onboarding, Performance Tracking

CERTIFICATIONS
• OSHA 10-Hour General Industry (2023)
• First Aid / CPR Certified (2023)
• Forklift Operator License (2021)

ACHIEVEMENTS
• Reduced inventory discrepancies by 25% through improved tracking
• Zero safety incidents in team for 12 consecutive months
• Employee of the Quarter — Q3 2023
"""

    rect = fitz.Rect(50, 50, 550, 800)
    page.insert_textbox(rect, text, fontsize=9, fontname="helv")
    
    output_path = "sample_resume_ops.pdf"
    doc.save(output_path)
    doc.close()
    print(f"✅ Created: {output_path}")


if __name__ == "__main__":
    create_tech_resume()
    create_ops_resume()
    print("\n🎉 Sample resumes ready! Upload them at http://localhost:5180/upload")
    print("   Then use the '⚡ Quick fill' dropdown to select a matching sample JD")

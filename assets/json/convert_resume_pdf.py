import json
import subprocess
import sys
import os
import re

def escape_latex(text):
    """Escape special LaTeX characters"""
    if not text:
        return ""
    replacements = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\^{}',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def format_date(date_str):
    """Format date string"""
    if not date_str or date_str == "Now":
        return "Now"
    try:
        from datetime import datetime
        date_obj = datetime.fromisoformat(date_str)
        month = date_obj.strftime("%b")
        year = date_obj.strftime("%Y")
        return f"{month}. {year}"
    except:
        return date_str

def two_column_list(rows):
    """Lay out (label, keywords) rows two per line; a leftover row spans the full width.
    Columns take their natural width, the left one flush left and the right one flush right."""
    cells = [
        f"\\textbf{{{escape_latex(label)}}}: {', '.join(escape_latex(k) for k in keywords)}."
        for label, keywords in rows if keywords
    ]
    lines = [f"{cells[i]} & {cells[i + 1]}" for i in range(0, len(cells) - 1, 2)]
    if len(cells) % 2:
        lines.append(f"\\multicolumn{{2}}{{@{{}}l@{{}}}}{{{cells[-1]}}}")
    return (
        "\\begin{tabular*}{\\linewidth}{@{}l@{\\extracolsep{\\fill}\\hspace{1em}}l@{}}\n"
        + " \\\\[2pt]\n".join(lines)
        + "\n\\end{tabular*}\n"
    )

def generate_latex(json_data):
    """Generate LaTeX document from JSON data"""

    basics = json_data.get('basics', {})
    education = json_data.get('education', [])
    work = json_data.get('work', [])
    publications = json_data.get('publications', [])
    skills = json_data.get('skills', [])
    languages = json_data.get('languages', [])
    awards = json_data.get('awards', [])
    interests = json_data.get('interests', [])
    interests_keywords = interests[0].get('keywords', []) if interests else []
    additional_languages = json_data.get('additionalLanguages', [])

    name = basics.get('name', '')
    email = basics.get('email', '')
    profiles = basics.get('profiles', [])

    google_scholar = next((p['url'] for p in profiles if p['network'] == 'Google Scholar'), '')
    github = next((p['url'] for p in profiles if p['network'] == 'GitHub'), '')
    website = next((p['url'] for p in profiles if p['network'] == 'Website'), '')

    links = [
        (r'\faGraduationCap', google_scholar, 'Google Scholar'),
        (r'\faGithub', github, 'GitHub'),
        (r'\faGlobe', website, 'Personal Website'),
    ]
    contacts = [f'\\faEnvelope~{escape_latex(email)}'] + [
        f'{icon}~\\href{{{url}}}{{{text}}}' for icon, url, text in links if url
    ]
    contact_line = r' \enspace\textcolor{gray}{\textbar}\enspace '.join(contacts)

    latex_content = r"""\documentclass[10pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{mathptmx}
\usepackage[margin=0.3in]{geometry}
\usepackage{xcolor}
\usepackage{hyperref}
\usepackage{fontawesome5}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{parskip}

\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    urlcolor=blue,
    citecolor=blue
}

\definecolor{venue}{RGB}{140,20,20}

\titleformat{\section}{\normalfont\large\bfseries}{\thesection}{1em}{}[\titlerule]
\titlespacing*{\section}{0pt}{12pt}{6pt}

\setlength{\parindent}{0pt}
\setlength{\parskip}{5pt}
\setlist{nosep, leftmargin=*, itemsep=0pt, topsep=0pt, parsep=4pt}

\pagestyle{empty}

\begin{document}

\begin{center}
{\LARGE \textbf{""" + escape_latex(name) + r"""}}\\[0.3em]
""" + contact_line + r"""
\end{center}

\section*{EDUCATION}
"""

    for edu in education:
        institution = escape_latex(edu.get('institution', ''))
        study_type = escape_latex(edu.get('studyType', ''))
        area = escape_latex(edu.get('area', ''))
        start = format_date(edu.get('startDate', ''))
        end = format_date(edu.get('endDate', 'Now'))
        location = escape_latex(edu.get('location', ''))
        score = escape_latex(edu.get('score', ''))
        supervisor = escape_latex(edu.get('supervisor', ''))
        courses = edu.get('courses', [])

        if end == "Now" and start:
            date_range = f"{start} - {end}"
        elif start and end:
            date_range = f"{start} - {end}"
        else:
            date_range = start or end

        latex_content += f"""\\textbf{{{study_type}}} \hfill \\textbf{{{date_range}}} \\\\
"""
        latex_content += f"""\\textbf{{{institution}}} \\hfill \\textbf{{{location}}}"""

        if courses:
            latex_content += f"""\\begin{{itemize}}
\\item \\textbf{{Core Fields}}: {', '.join([escape_latex(c) for c in courses])}.
"""
            if 'Ph.D' in study_type or 'candidate' in study_type.lower():
                latex_content += f"""\\item \\textbf{{Thesis Title}}: {area}. (\\textbf{{Mentor}}: {supervisor})
"""
            latex_content += "\\end{itemize}\n\n"
        else:
            latex_content += f"""\\begin{{itemize}}
\\item \\textbf{{Graduate Result}}: {score}
"""
            if 'M.Sc' in study_type or 'MSc' in study_type:
                latex_content += f"""\\item \\textbf{{Dissertation Title}}: {area}. (\\textbf{{Supervisor}}: {supervisor})
"""
            elif 'B.Sc' in study_type or 'BS' in study_type:
                latex_content += f"""\\item \\textbf{{Dissertation}}: {area}. (\\textbf{{Supervisor}}: {supervisor})
"""
            latex_content += "\\end{itemize}\n\n"

    latex_content += r"""\section*{WORK EXPERIENCE}
"""

    for job in work:
        company_name = escape_latex(job.get('name', ''))
        position = escape_latex(job.get('position', ''))
        start = format_date(job.get('startDate', ''))
        end = format_date(job.get('endDate', 'Now'))
        location = escape_latex(job.get('location', ''))
        supervisor = escape_latex(job.get('supervisor', ''))
        description = job.get('description', '')

        latex_content += f"""\\textbf{{{position}}} \\hfill \\textbf{{{start} - {end}}} \\\\
"""

        if supervisor:
            label = "Supervisors" if " and " in supervisor else "Supervisor"
            latex_content += f"""{company_name} ({label}: {supervisor}) \\hfill \\textbf{{{location}}}"""
        else:
            latex_content += f"""{company_name} \\hfill \\textbf{{{location}}}"""

        if description and description.strip():
            latex_content += f"""\\begin{{itemize}}
\\item {description}
\\end{{itemize}}

"""
        else:
            latex_content += "\n\\vspace{0.01em}\n\n"

    latex_content += r"""\section*{PUBLICATIONS}
\begin{enumerate}[label={[\arabic*]}, leftmargin=*, before=\raggedright]
"""

    user_name_clean = re.sub(r'\s*\([^)]*\)\s*', ' ', name).strip()
    escaped_user_name = escape_latex(user_name_clean)

    for pub in publications:
        first_author = escape_latex(pub.get('firstAuthor', ''))
        other_authors = escape_latex(pub.get('otherAuthors', ''))
        title = escape_latex(pub.get('name', ''))
        venue = escape_latex(pub.get('publisher', '').strip())
        status = pub.get('status', '')
        url = pub.get('url', '')

        # bold the CV owner's name, keeping any equal-contribution mark
        authors = re.sub(
            re.escape(escaped_user_name) + r'(?:[\*\u2217\u2020\u2021\u00a7\u00b6])*',
            lambda m: f"\\textbf{{{m.group(0)}}}",
            f"{first_author}, {other_authors}",
        )

        # \mbox keeps the venue on one line so it reads as one unit
        latex_content += f"""\\item {authors}. \\textit{{{title}}}. \\mbox{{\\textcolor{{venue}}{{\\textbf{{{venue}}}}}}}"""
        if status:
            latex_content += f""" \\textit{{({escape_latex(status)})}}"""
        if url:
            latex_content += f""" (\\href{{{url}}}{{Web}})"""
        latex_content += "\n"

    latex_content += r"""\end{enumerate}

\section*{SKILLS}
"""

    skill_rows = [(s.get('name', ''), s.get('keywords', [])) for s in skills]

    lang_list = [f"{lang.get('language', '')} ({lang.get('fluency', '').lower()})" for lang in languages]
    lang_list += [f"{lang.get('language', '')} ({lang.get('fluency', '')})" for lang in additional_languages]
    skill_rows.append(('Language skills', lang_list))
    skill_rows.append(('Interests', interests_keywords))

    latex_content += two_column_list(skill_rows)

    latex_content += r"""
\end{document}
"""

    return latex_content

def compile_latex(tex_content, output_name='cv'):
    """Compile LaTeX to PDF"""
    tex_file = f'{output_name}.tex'

    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(tex_content)

    print(f"Generated {tex_file}")

    try:
        output_dir = os.path.dirname(os.path.abspath(output_name))
        os.makedirs(output_dir, exist_ok=True)

        result = subprocess.run(
            ['pdflatex', f'-output-directory={output_dir}', '-interaction=nonstopmode', tex_file],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            print("LaTeX compilation failed:")
            print(result.stdout)
            print(result.stderr)
            return False

        subprocess.run(
            ['pdflatex', f'-output-directory={output_dir}', '-interaction=nonstopmode', tex_file],
            capture_output=True, timeout=30
        )

        for ext in ['.aux', '.log', '.out']:
            try:
                os.remove(f'{output_name}{ext}')
            except:
                pass

        print(f"Successfully generated {output_name}.pdf")
        return True

    except subprocess.TimeoutExpired:
        print("LaTeX compilation timed out")
        return False
    except FileNotFoundError:
        print("Error: pdflatex not found. Please install TeX Live or MiKTeX.")
        return False
    except Exception as e:
        print(f"Error during compilation: {str(e)}")
        return False

def main():
    json_file = "resume.json"
    output_name = "../pdf/my_resume"

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_file} not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {json_file}")
        sys.exit(1)

    latex_content = generate_latex(data)

    if compile_latex(latex_content, output_name):
        print(f"CV generated successfully: {output_name}.pdf")
    else:
        print("Failed to generate PDF")
        sys.exit(1)

if __name__ == '__main__':
    main()

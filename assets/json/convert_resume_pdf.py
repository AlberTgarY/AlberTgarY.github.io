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

def generate_latex(json_data):
    """Generate LaTeX document from JSON data"""
    
    basics = json_data.get('basics', {})
    education = json_data.get('education', [])
    work = json_data.get('work', [])
    publications = json_data.get('publications', [])
    languages = json_data.get('languages', [])
    awards = json_data.get('awards', [])
    interests = json_data.get('interests', [])
    additional_languages = json_data.get('additionalLanguages', [])
    
    name = basics.get('name', '')
    email = basics.get('email', '')
    profiles = basics.get('profiles', [])
    
    google_scholar = next((p['url'] for p in profiles if p['network'] == 'Google Scholar'), '')
    github = next((p['url'] for p in profiles if p['network'] == 'GitHub'), '')
    
    latex_content = r"""\documentclass[10pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{mathptmx}
\usepackage[margin=0.3in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{parskip}

\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    urlcolor=blue,
    citecolor=blue
}

\titleformat{\section}{\normalfont\large\bfseries}{\thesection}{1em}{}[\titlerule]
\titlespacing*{\section}{0pt}{12pt}{6pt}

\setlength{\parindent}{0pt}
\setlength{\parskip}{5pt}
\setlist{nosep, leftmargin=*, itemsep=0pt, topsep=0pt, parsep=4pt}

\pagestyle{empty}

\begin{document}

\begin{center}
{\LARGE \textbf{""" + escape_latex(name) + r"""}}\\[0.3em]
E-mail: """ + escape_latex(email) + r""" | \href{""" + google_scholar + r"""}{Google Scholar} | \href{""" + github + r"""}{GitHub}
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
            date_range = f"{start}-{end}"
        else:
            date_range = start or end
        
        latex_content += f"""\\textbf{{{study_type}"""
        
        # if 'candidate' not in study_type.lower():
        #     latex_content += f""" in {area}"""
        
        latex_content += f"""}} \hfill \\textbf{{{date_range}}} \\\\\n"""
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
                award_text = ""
                for award in awards:
                    if award.get('date') == '2021':
                        award_text = f"""\\item \\textbf{{Awards}}: Received {escape_latex(award['title'])} for excellent academic performance.
"""
                latex_content += award_text
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
        
        position_parts = position.split(' - ')
        if len(position_parts) == 2:
            main_position, detail = position_parts
            latex_content += f"""\\textbf{{{detail} | {main_position}}} \\hfill \\textbf{{{start}- {end}}} \\\\\n"""
        else:
            latex_content += f"""\\textbf{{{position}}} \\hfill \\textbf{{{start}- {end}}} \\\\\n"""
        
        if supervisor:
            latex_content += f"""\\textbf{{{company_name}}} (\\textbf{{Supervisor}}: {supervisor}) \\hfill \\textbf{{{location}}}"""
        else:
            latex_content += f"""\\textbf{{{company_name}}} \\hfill \\textbf{{{location}}}"""
        
        if description:
            latex_content += f"""\\begin{{itemize}}
\\item {description}
\\end{{itemize}}

"""
    
    latex_content += r"""\section*{PUBLICATIONS}
\begin{itemize}
"""
    
    user_name_clean = re.sub(r'\s*\([^)]*\)\s*', ' ', name).strip()
    escaped_user_name = escape_latex(user_name_clean)
    
    for pub in publications:
        first_author = escape_latex(pub.get('firstAuthor', ''))
        other_authors = escape_latex(pub.get('otherAuthors', ''))
        title = escape_latex(pub.get('name', ''))
        venue = escape_latex(pub.get('publisher', ''))
        status = pub.get('status', '')
        url = pub.get('url', '')
        
        if first_author == escaped_user_name:
            latex_content += f"""\\item \\textbf{{{first_author}}}, """
        else:
            latex_content += f"""\\item {first_author}, """
        
        if escaped_user_name in other_authors:
            other_authors = other_authors.replace(escaped_user_name, f"\\textbf{{{escaped_user_name}}}")
        
        latex_content += f"""{other_authors}, \\textit{{``{title}''}} """
        
        if status:
            latex_content += f"""{venue}. ({status}) """
        else:
            latex_content += f"""\\textit{{{venue}}}. """
        
        if url:
            latex_content += f"""(\\href{{{url}}}{{Web}})"""
        
        latex_content += "\n"
    
    latex_content += r"""\end{itemize}

\section*{SKILLS}
"""
    
    lang_list = []
    for lang in languages:
        language = escape_latex(lang.get('language', ''))
        fluency = escape_latex(lang.get('fluency', ''))
        lang_list.append(f"{language} ({fluency.lower()})")
    
    latex_content += f"""Language skills: {', '.join(lang_list)}"""
    
    if additional_languages:
        for lang in additional_languages:
            language = escape_latex(lang.get('language', ''))
            fluency = escape_latex(lang.get('fluency', ''))
            latex_content += f""", {language} ({fluency})"""
    
    latex_content += "\n\n"
    
    if interests:
        latex_content += f"""Interests: {', '.join(interests)}.

"""
    
    latex_content += r"""\end{document}
"""
    
    return latex_content

def compile_latex(tex_content, output_name='cv'):
    """Compile LaTeX to PDF"""
    tex_file = f'{output_name}.tex'
    
    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(tex_content)
    
    print(f"Generated {tex_file}")
    
    try:
        result = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', tex_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print("LaTeX compilation failed:")
            print(result.stdout)
            print(result.stderr)
            return False
        
        subprocess.run(['pdflatex', '-interaction=nonstopmode', tex_file], 
                      capture_output=True, timeout=30)
        
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
    # Hardcode input and output file names
    json_file = "resume.json"
    output_name = "my_resume"
    
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
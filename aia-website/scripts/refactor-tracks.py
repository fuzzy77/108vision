"""
Refactor tracks/ directories and files to use 108-X naming convention.
- Renames directories
- Renames files with new prefix
- Updates frontmatter (title, track) inside each .md file
- Merges sviluppo-progetto + factory into 108-dev
"""
import os, shutil, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = r'c:\Code\Documents\Lavoro\Personale\Vision\tracks'

# Mapping: old_dir -> (new_dir, brand_name, file_prefix)
TRACK_MAP = {
    'ai-platform':             ('108-ai',           '108 AI',           '108AI'),
    'ai-adoption':             ('108-ai-adoption',  '108 AI Adoption',  '108AIA'),
    'fractional-cto':          ('108-cto',          '108 CTO',          '108CTO'),
    'architettura':            ('108-arch',         '108 Arch',         '108ARCH'),
    'trasformazione-digitale': ('108-digital',      '108 Digital',      '108DIGI'),
    'leadership':              ('108-lead',         '108 Lead',         '108LEAD'),
    'agile-devops':            ('108-agile',        '108 Agile',        '108AGILE'),
    'wellbeing':               ('108-wellbeing',    '108 Wellbeing',    '108WELL'),
    'pubblica-amministrazione':('108-pa',           '108 PA',           '108PA'),
    'digital-starter':         ('108-starter',      '108 Starter',      '108START'),
    'sviluppo-progetto':       ('108-dev',          '108 Dev',          '108DEV'),
    'factory':                 ('108-dev',          '108 Dev',          '108DEV'),
    'compliance-ai-act':       ('108-compliance',   '108 Compliance',   '108COMP'),
    'nocode-automation':       ('108-nocode',       '108 NoCode',       '108NOCODE'),
    'data-analytics':          ('108-data',         '108 Data',         '108DATA'),
    'sales':                   ('108-sales',        '108 Sales',        '108SALES'),
}

# File rename mapping: old prefix -> new suffix
FILE_RENAMES = {
    'AIA-Playbook-Piattaforma.md':          'Playbook.md',
    'AIA-Manuale-Piattaforma.md':           'Manuale.md',
    'AIA-Sito-Piattaforma.md':              'Sito.md',
    'PLATFORM-AI-Assistente-Aziendale.md':  'Assistente-Aziendale.md',
    'MANUALE-Desktop-Bridge.md':            'Desktop-Bridge.md',
    'AI-Adoption-Manuale-PMI.md':           'Manuale.md',
    'AI-Adoption-Program-README.md':        'README.md',
    'AI-Adoption-Sito-Copy.md':             'Sito.md',
    'AI-Medie-Imprese.md':                  'Medie-Imprese.md',
    'AI-Piccole-Imprese.md':                'Piccole-Imprese.md',
    'FCTO-Playbook-FractionalCTO.md':       'Playbook.md',
    'FCTO-Manuale-FractionalCTO.md':        'Manuale.md',
    'FCTO-Sito-FractionalCTO.md':           'Sito.md',
    'ARCH-Playbook-Scaling.md':             'Playbook.md',
    'ARCH-Manuale-Scaling.md':              'Manuale.md',
    'ARCH-Sito-Scaling.md':                 'Sito.md',
    'DIGI-Playbook-Trasformazione.md':      'Playbook.md',
    'DIGI-Manuale-Trasformazione.md':       'Manuale.md',
    'DIGI-Sito-Trasformazione.md':          'Sito.md',
    'LEAD-Playbook-Leadership.md':          'Playbook.md',
    'LEAD-Manuale-Leadership.md':           'Manuale.md',
    'LEAD-Sito-Leadership.md':              'Sito.md',
    'AGILE-Playbook-AgileDevOps.md':        'Playbook.md',
    'AGILE-Manuale-AgileDevOps.md':         'Manuale.md',
    'AGILE-Sito-AgileDevOps.md':            'Sito.md',
    'WELL-Playbook-Wellbeing.md':           'Playbook.md',
    'WELL-Manuale-Wellbeing.md':            'Manuale.md',
    'WELL-Sito-Wellbeing.md':              'Sito.md',
    'PA-Playbook-PubblicaAmministrazione.md': 'Playbook.md',
    'PA-Manuale-PubblicaAmministrazione.md':  'Manuale.md',
    'PA-Sito-PubblicaAmministrazione.md':     'Sito.md',
    'ZERO-Playbook-FromScratch.md':         'Playbook.md',
    'ZERO-Manuale-FromScratch.md':          'Manuale.md',
    'ZERO-Sito-FromScratch.md':             'Sito.md',
    'PROJ-Playbook-SviluppoProgetto.md':    'Playbook-Progetto.md',
    'PROJ-Manuale-SviluppoProgetto.md':     'Manuale-Progetto.md',
    'PROJ-Sito-SviluppoProgetto.md':        'Sito-Progetto.md',
    'FACT-Playbook-Factory.md':             'Playbook-Factory.md',
    'FACT-Manuale-Factory.md':              'Manuale-Factory.md',
    'FACT-Sito-Factory.md':                 'Sito-Factory.md',
    'COMP-Playbook-ComplianceAIAct.md':     'Playbook.md',
    'COMP-Manuale-ComplianceAIAct.md':      'Manuale.md',
    'COMP-Sito-ComplianceAIAct.md':         'Sito.md',
    'NOCODE-Playbook-Automation.md':        'Playbook.md',
    'NOCODE-Manuale-Automation.md':         'Manuale.md',
    'NOCODE-Sito-Automation.md':            'Sito.md',
    'DATA-Playbook-Analytics.md':           'Playbook.md',
    'DATA-Manuale-Analytics.md':            'Manuale.md',
    'DATA-Sito-Analytics.md':              'Sito.md',
    'AI-Sales-Kit.md':                      'Sales-Kit.md',
    'AI-Content-Calendar.md':               'Content-Calendar.md',
}


def update_frontmatter(content, brand_name, new_track):
    """Update frontmatter fields in markdown content."""
    # Update track field
    content = re.sub(
        r'^(track:\s*)"?[^"\n]+"?\s*$',
        f'track: "{new_track}"',
        content,
        flags=re.MULTILINE
    )
    # Add brand field if not present
    if 'brand:' not in content and '---' in content:
        content = re.sub(
            r'^(---\n(?:.*\n)*?)(---)',
            lambda m: m.group(1) + f'brand: "108 Vision"\n' + m.group(2)
            if 'brand:' not in m.group(1) else m.group(0),
            content,
            count=1
        )
    # Update brand field
    content = re.sub(
        r'^(brand:\s*)"?[^"\n]+"?\s*$',
        f'brand: "108 Vision"',
        content,
        flags=re.MULTILINE
    )
    return content


def update_titles(content, brand_name):
    """Add brand prefix to main title if not present."""
    # Replace old prefixes like "AIA —", "FCTO —" with brand name
    old_prefixes = [
        'AIA', 'FCTO', 'ARCH', 'DIGI', 'LEAD', 'AGILE', 'WELL',
        'PA', 'ZERO', 'PROJ', 'FACT', 'COMP', 'NOCODE', 'DATA'
    ]
    for prefix in old_prefixes:
        content = re.sub(
            rf'^(#\s+){prefix}\s*[—\-]\s*',
            f'\\g<1>{brand_name} — ',
            content,
            flags=re.MULTILINE
        )
    return content


def process_track(old_dir_name):
    """Process a single track directory."""
    new_dir_name, brand_name, file_prefix = TRACK_MAP[old_dir_name]
    old_path = os.path.join(BASE, old_dir_name)
    new_path = os.path.join(BASE, new_dir_name)

    if not os.path.exists(old_path):
        print(f'  SKIP (not found): {old_dir_name}')
        return

    # Create target directory
    os.makedirs(new_path, exist_ok=True)

    # Process each file
    for filename in os.listdir(old_path):
        old_file = os.path.join(old_path, filename)
        if not os.path.isfile(old_file):
            continue

        # Determine new filename
        if filename in FILE_RENAMES:
            new_filename = f'{file_prefix}-{FILE_RENAMES[filename]}'
        else:
            new_filename = f'{file_prefix}-{filename}'

        new_file = os.path.join(new_path, new_filename)

        # For .md files: update content
        if filename.endswith('.md'):
            with open(old_file, 'r', encoding='utf-8') as f:
                content = f.read()

            content = update_frontmatter(content, brand_name, new_dir_name)
            content = update_titles(content, brand_name)

            with open(new_file, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            shutil.copy2(old_file, new_file)

        print(f'    {filename} -> {new_filename}')

    # Remove old directory (only if different from new)
    if old_dir_name != new_dir_name and old_path != new_path:
        shutil.rmtree(old_path)
        print(f'  REMOVED old: {old_dir_name}/')

    print(f'  OK: {old_dir_name}/ -> {new_dir_name}/')


def process_study():
    """Rename study files with 108 prefix."""
    study_path = os.path.join(BASE, 'study')
    if not os.path.exists(study_path):
        return

    study_renames = {
        'STUDY-AI-Adoption.md':       '108-STUDY-AI-Adoption.md',
        'STUDY-AIA-Piattaforma.md':   '108-STUDY-AI-Platform.md',
        'STUDY-ARCH-Scaling.md':      '108-STUDY-Arch.md',
        'STUDY-AGILE-DevOps.md':      '108-STUDY-Agile.md',
        'STUDY-DIGI-Trasformazione.md': '108-STUDY-Digital.md',
    }

    for old_name, new_name in study_renames.items():
        old_file = os.path.join(study_path, old_name)
        new_file = os.path.join(study_path, new_name)
        if os.path.exists(old_file):
            # Update content
            with open(old_file, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r'^(brand:\s*)"?[^"\n]+"?\s*$', 'brand: "108 Vision"', content, flags=re.MULTILINE)
            with open(new_file, 'w', encoding='utf-8') as f:
                f.write(content)
            os.remove(old_file)
            print(f'    {old_name} -> {new_name}')

    print('  OK: study/ files renamed')


print('=== Refactoring tracks to 108-X naming ===\n')

# Process each track
for old_dir in TRACK_MAP:
    if old_dir == 'factory' and os.path.exists(os.path.join(BASE, '108-dev')):
        # Factory merges into 108-dev (already created by sviluppo-progetto)
        print(f'\n[MERGE] {old_dir}/ -> 108-dev/')
        process_track(old_dir)
    else:
        print(f'\n[RENAME] {old_dir}/')
        process_track(old_dir)

# Process study
print(f'\n[UPDATE] study/')
process_study()

print('\n\n=== Done! ===')
print('\nNew structure:')
for d in sorted(os.listdir(BASE)):
    if os.path.isdir(os.path.join(BASE, d)):
        count = len(os.listdir(os.path.join(BASE, d)))
        print(f'  {d}/ ({count} files)')

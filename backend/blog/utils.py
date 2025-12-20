import re
from typing import Dict, List
from markdown import markdown


def parse_markdown_components(content: str) -> Dict:
    """
    Parse markdown content and extract custom components
    Returns: {
        'html': rendered HTML,
        'components': [list of component metadata for frontend]
    }
    """
    components = []
    component_pattern = r'\{\{(\w+):([^}]+)\}\}'

    def replace_component(match):
        component_type = match.group(1)
        component_data = match.group(2)

        # Generate unique ID for this component instance
        component_id = f"component-{len(components)}"

        # Store component metadata
        components.append({
            'id': component_id,
            'type': component_type,
            'data': component_data,
        })

        # Replace with placeholder div
        return f'<div id="{component_id}" data-component="{component_type}" data-params="{component_data}"></div>'

    # Replace custom syntax with placeholders
    content_with_placeholders = re.sub(component_pattern, replace_component, content)

    # Convert markdown to HTML
    html = markdown(content_with_placeholders, extensions=[
        'extra',          # Tables, footnotes, etc.
        'codehilite',     # Code syntax highlighting
        'toc',            # Table of contents
        'nl2br',          # Newlines to <br>
        'sane_lists',     # Better list handling
    ])

    return {
        'html': html,
        'components': components,
    }

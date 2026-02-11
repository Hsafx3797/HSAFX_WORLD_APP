#!/usr/bin/env python3
"""
Cheque PDF Generator with Layout Protocol
Generate PDF from JSON data with automatic validation and orientation
"""

import json
import logging
import os
import time
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from datetime import datetime
from dateutil.parser import parse as parse_date
from template_parser import TemplateParser
from layout_protocol import validate_template_file

# Base directory for backend (this script's folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def apply_orientation_logic(template_path, cheque_data):
    """Apply automatic orientation based on cheque data"""
    cheque_orientation = cheque_data.get('chequeOrientation', 'Portrait')
    
    # Load template to modify orientation
    # Resolve relative template path against backend directory
    if not os.path.isabs(template_path):
        template_path = os.path.join(BASE_DIR, template_path)

    with open(template_path, 'r', encoding='utf-8') as f:
        template = json.load(f)
    
    # Set orientation based on cheque data (CORRECTED LOGIC)
    if cheque_orientation.lower() == 'portrait':
        template['orientation'] = 0
        logger.info("Applied Portrait orientation (0° - upright)")
    elif cheque_orientation.lower() == 'landscape':
        template['orientation'] = 90
        logger.info("Applied Landscape orientation (90° - rotated)")
    
    # Save back to template file
    with open(template_path, 'w', encoding='utf-8') as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

def format_text_case(text, case_type):
    """Format text according to case type"""
    if case_type == "UpperCase":
        return text.upper()
    elif case_type == "TitleCase":
        return text.title()
    else:
        return text

def format_date(date_str, date_format):
    """Format date according to specified format"""
    try:
        # Parse the input date
        date_obj = parse_date(date_str)
        
        format_map = {
            "DD/MM/YYYY": "%d/%m/%Y",
            "DD-MM-YYYY": "%d-%m-%Y",
            "DD MMM YYYY": "%d %b %Y", 
            "DD-MMM-YYYY": "%d-%b-%Y"
        }
        
        if date_format in format_map:
            formatted = date_obj.strftime(format_map[date_format])
            # Make month uppercase
            if "MMM" in date_format:
                parts = formatted.split()
                if len(parts) >= 2:
                    parts[1] = parts[1].upper()
                    formatted = " ".join(parts) if "DD MMM YYYY" in date_format else "-".join(parts)
            return formatted
        else:
            return date_obj.strftime("%d/%m/%Y")
    except:
        return date_str

def draw_field_with_background(pdf_canvas, parser, field_config, field_value, field_name, cheque_data):
    """Draw field with all styling and effects"""
    if not field_value and not field_config.get("displayText"):
        return
        
    # Get field dimensions and position
    field_dims = parser.get_field_dimensions(field_config)
    
    # Convert to points
    x = parser.convert_to_points(field_dims['x_val'], field_dims['x_unit']) if field_dims['x_val'] != 'auto' else 0
    y = parser.convert_to_points(field_dims['y_val'], field_dims['y_unit']) 
    width = parser.convert_to_points(field_dims['width_val'], field_dims['width_unit'])
    height = parser.convert_to_points(field_dims['height_val'], field_dims['height_unit'])
    
    # Apply background color if specified
    if 'backgroundColor' in field_config:
        parser.apply_background_color(pdf_canvas, field_config, x, y, width, height)
    
    # Get processed text content (pass full data for formatted content)
    text_content = parser.get_field_content(field_name, field_config, cheque_data)
    
    if not text_content:
        return
    
    # Apply font styling
    parser.apply_font_style(pdf_canvas, field_config)
    parser.apply_text_color(pdf_canvas, field_config)
    
    # Handle rotation
    rotation = field_config.get('rotation', 0)
    if rotation != 0:
        pdf_canvas.saveState()
        pdf_canvas.translate(x + width/2, y + height/2)
        pdf_canvas.rotate(rotation)
        x, y = -width/2, -height/2
    
    # Apply border effects
    parser.apply_border_effects(pdf_canvas, field_config, x, y, width, height)
    
    # Draw text
    font_info = parser.get_font_info(field_config)
    font_name = font_info.get('name', 'Helvetica')
    font_size = font_info.get('size', 11)
    
    # Calculate text position
    text_x = parser.get_text_alignment_x(pdf_canvas, text_content, field_config, x, width, font_name, font_size)
    text_y = parser.get_text_alignment_y(field_config, y, height, font_size)
    
    # Handle multi-line text
    if field_config.get('wordWrap') == 'break-word':
        parser.draw_wrapped_text(pdf_canvas, text_content, field_config, text_x, text_y, width, height)
    else:
        # Apply letter spacing
        if 'letterSpacing' in field_config:
            spacing_val, spacing_unit = parser.parse_unit_value(field_config['letterSpacing'])
            spacing_points = parser.convert_to_points(spacing_val, spacing_unit)
            
            # Draw text with letter spacing
            char_x = text_x
            for char in text_content:
                pdf_canvas.drawString(char_x, text_y, char)
                char_width = pdf_canvas.stringWidth(char, font_name, font_size)
                char_x += char_width + spacing_points
        else:
            pdf_canvas.drawString(text_x, text_y, text_content)
    
    # Restore state if rotated
    if rotation != 0:
        pdf_canvas.restoreState()

def generate_cheque_pdf(data_file="cheque_data.json", template_file=None, output_file=None):
    """
    Generate PDF from JSON data and template with automatic protocol validation
    
    Args:
        data_file: Path to JSON data file
        template_file: Path to template JSON file
        output_file: Output PDF file path (auto-generated if None)
    
    Returns:
        Output file path on success, None on failure
    """
    
    logger.info(">> Starting PDF generation...")
    
    try:
        # Resolve paths relative to backend directory
        if data_file and not os.path.isabs(data_file):
            data_file = os.path.join(BASE_DIR, data_file)

        # Load data first
        try:
            with open(data_file, 'r') as f:
                cheque_data = json.load(f)
            logger.info(f">> Loaded data with {len(cheque_data)} fields")
        except FileNotFoundError:
            cheque_data = create_sample_data()
            logger.info("📝 Using sample data")
        # Determine template file: use mapping by countryName -> bankName if provided
        mapping_file = os.path.join(BASE_DIR, "data", "countries_and_bank.json")
        selected_template = None
        if template_file:
            selected_template = template_file
        else:
            try:
                with open(mapping_file, 'r', encoding='utf-8') as mf:
                    mapping = json.load(mf)
                country = cheque_data.get('countryName')
                bank = cheque_data.get('bankName')
                if country and bank:
                    country_map = mapping.get(country)
                    if country_map:
                        template_path = country_map.get(bank)
                        if template_path:
                            # Resolve mapping template path relative to backend dir
                            if not os.path.isabs(template_path):
                                template_path = os.path.join(BASE_DIR, template_path)
                            selected_template = template_path
                        else:
                            logger.warning(f"⚠️ Bank '{bank}' not found in mapping for country '{country}'. Using default template.")
                    else:
                        logger.warning(f"⚠️ Country '{country}' not found in mapping. Using default template.")
                else:
                    logger.info("ℹ️ countryName or bankName missing from data; using default template.")
            except FileNotFoundError:
                logger.warning(f"⚠️ Mapping file not found: {mapping_file}. Using default template.")

        # Fall back to previous default if no mapping/template selected
        if not selected_template:
            selected_template = os.path.join(BASE_DIR, "templates", "Pakistan", "Pakistan_Habib Bank Limited.json")

        # Apply automatic orientation
        apply_orientation_logic(selected_template, cheque_data)
        
        # Load and validate template
        validated_template, validation_report = validate_template_file(selected_template, mode="auto-fix")
        fixes_count = len(validation_report.get('validation_report', {}).get('fixes_applied', []))
        if fixes_count > 0:
            logger.info(f">> Template validated - {fixes_count} fixes applied")
        
        # Generate output filename
        if output_file is None:
            # Use temporary file instead of permanent storage
            payee_raw = cheque_data.get('payeeName', 'Unknown')
            # Sanitize filename by removing invalid characters
            import re
            payee_safe = re.sub(r'[<>:"/\\|?*]', '_', payee_raw).replace(' ', '_')
            temp_dir = tempfile.gettempdir()
            output_file = os.path.join(temp_dir, f"cheque_{payee_safe}_{int(time.time())}.pdf")
        
        # Initialize template parser
        parser = TemplateParser()
        
        # Use validated template
        template = validated_template
        
        # Create PDF
        pdf_canvas = canvas.Canvas(output_file, pagesize=A4)
        width, height = A4
        
        # Draw page background if specified
        if template.get('page', {}).get('backgroundColor'):
            parser.apply_background_color(pdf_canvas, template['page'], 0, height, width, height)
        
        # Get container configuration
        container = template.get('chequeContainer', {})
        
        # Copy orientation from root level to container for transformation
        if 'orientation' in template:
            container['orientation'] = template['orientation']
        
        # Get container dimensions
        container_dims = parser.get_field_dimensions(container)
        
        # Convert to points
        container_width = parser.convert_to_points(container_dims['width_val'], container_dims['width_unit'])
        container_height = parser.convert_to_points(container_dims['height_val'], container_dims['height_unit'])
        container_y = height - parser.convert_to_points(container_dims['y_val'], container_dims['y_unit']) - container_height
        
        # Handle container X position
        if container.get('x') == 'auto' or container.get('alignCenter'):
            container_x = (width - container_width) / 2  # Center horizontally
        else:
            container_x = parser.convert_to_points(container_dims['x_val'], container_dims['x_unit'])
        
        # ---------- NEW: render cheque into a form (local coords) ----------
        form_name = "cheque_form"
        
        # Begin a form with the cheque's own coordinate space (0,0) bottom-left
        pdf_canvas.beginForm(form_name, 0, 0, container_width, container_height)
        
        # Draw the container background INSIDE the form (top-left is y=container_height)
        if 'backgroundColor' in container:
            parser.apply_background_color(
                pdf_canvas,
                container,
                0,                         # x inside the form
                container_height,          # top y inside the form
                container_width,
                container_height
            )
        
        # Draw all fields INSIDE the form, using container dims as the "page" size
        fields = container.get('fields', {})
        for field_name, field_config in fields.items():
            # Get field value from data - use contentSource for formatted fields
            content_source = field_config.get('contentSource', field_name)
            field_value = cheque_data.get(content_source, "")
            
            # Skip empty fields unless they have displayText
            if not field_value and not field_config.get("displayText"):
                continue
            
            # Check conditions
            condition = field_config.get('condition')
            if condition:
                if condition['type'] == 'exists' and not cheque_data.get(condition['field']):
                    continue
                elif condition['type'] == 'boolean' and not cheque_data.get(condition['field'], False):
                    continue
            
            # Draw field (note: now using container_height as the "page" height for form coords)
            draw_field_with_background(pdf_canvas, parser, field_config, field_value, field_name, cheque_data)
            print(f">> Drew field: {field_name} [in form coords]")
        
        # End the form
        pdf_canvas.endForm()
        
        # ---------- NEW: place the form on the page, rotated if needed ----------
        margin_top = 1.2 * mm
        
        # Check if we need to rotate (landscape orientation)
        orientation = template.get('orientation', 0)
        
        if orientation == 90:
            # Landscape: rotate 90° clockwise, horizontally centered, stick to top
            pdf_canvas.saveState()
            
            # Horizontal center (left-right centered)
            center_x = width / 2
            # Top position with margin (after rotation, container_width becomes height)
            top_y = height - margin_top - (container_width / 2)  # container_width becomes height after rotation
            
            # Move to the calculated position
            pdf_canvas.translate(center_x, top_y)
            # Rotate 90° clockwise
            pdf_canvas.rotate(90)
            # Center the form horizontally after rotation
            pdf_canvas.translate(-container_width / 2, -container_height / 2)
            # Place the form
            pdf_canvas.doForm(form_name)
            
            pdf_canvas.restoreState()
        else:
            # Portrait: place normally, centered
            # Center horizontally
            container_x = (width - container_width) / 2
            # Position from top with margin
            container_y = height - margin_top - container_height
            
            pdf_canvas.saveState()
            pdf_canvas.translate(container_x, container_y)
            pdf_canvas.doForm(form_name)
            pdf_canvas.restoreState()
        
        # Save PDF
        pdf_canvas.showPage()
        pdf_canvas.save()
        
        return output_file
        
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def create_sample_data():
    """Create sample JSON data file"""
    sample_data = {
        "payeeName": "Muhammad Asher",
        "payeePrefix": "",
        "payeeSuffix": "",
        "date": datetime.now().strftime("%d/%m/%Y"),
        "dateFormat": "DD/MM/YYYY",
        "amount": "25000",
        "amountNumberPrefix": "Rs. ",
        "amountNumberSuffix": "/-",
        "amountInWords": "Twenty Five Thousand Only",
        "amountWordsPrefix": "Rs ",
        "amountWordsSuffix": " Only",
        "acPayee": True,
        "notNegotiable": True,
        "orBearer": True,
        "payeeNameCase": "TitleCase",
        "amountCase": "TitleCase",
        "currencyStyle": "British",
        "numbering": "International",
        "chequeOrientation": "Portrait"
    }
    
    with open("cheque_data.json", "w") as f:
        json.dump(sample_data, f, indent=2)
    
    print(">> Sample data created: cheque_data.json")
    return sample_data

if __name__ == "__main__":
    import sys
    
    print("=== Cheque PDF Generator ===")
    print(">> Protocol System: ACTIVE")
    print(">> Auto-fix: ENABLED")
    print(">> Auto-orientation: ACTIVE")
    print()
    
    # Check if data file is provided as argument
    data_file = "cheque_data.json"
    if len(sys.argv) > 1:
        data_file = sys.argv[1]
        print(f">> Using data file: {data_file}")
    
    # Create sample data if default file doesn't exist
    if data_file == "cheque_data.json":
        try:
            with open(data_file, 'r') as f:
                pass
        except FileNotFoundError:
            create_sample_data()
    
    # Generate PDF
    result = generate_cheque_pdf(data_file=data_file)
    
    if result:
        print(f"\n>> Success! PDF generated: {result}")
        print("\n>> To customize:")
        print("1. Edit cheque_data.json - change data")
        print("2. Edit templates/Pakistan/Pakistan_Habib Bank Limited.json - change layout")
        print("3. Run: python generate_cheque.py")
        print("\n>> Ready for your layout editing!")
    else:
        print("\nERROR: PDF generation failed. Check the error above.")
#!/usr/bin/env python3
"""
Template Parser for Cheque PDF Generator
Handles all template interpretation and styling logic with protocol validation
"""

from reportlab.lib.units import mm
from layout_protocol import LayoutProtocolValidator, LayoutProtocolError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TemplateParser:
    """
    Template Parser to interpret JSON template properties
    and convert them to ReportLab operations with protocol validation
    
    Note: This parser now works with simplified 8-field pre-processed data:
    - chequeOrientation, payeeName, date, amountInNumber, amountInWords, 
      acPayee, notNegotiable, orBearer
    Complex formatting is done during pre-processing phase.
    """
    
    def __init__(self, validation_mode: str = "auto-fix"):
        """
        Initialize template parser with protocol validation
        
        Args:
            validation_mode: 'strict', 'warn', or 'auto-fix'
        """
        self.default_units = "mm"
        self.validation_mode = validation_mode
        self.validator = LayoutProtocolValidator(mode=validation_mode)
        
        # Font fallback mapping for unsupported fonts
        self.font_fallbacks = {
            'Arial': 'Helvetica',
            'Calibri': 'Helvetica', 
            'Times': 'Times-Roman',
            'Courier': 'Courier'
        }
        
        # Protocol constraints for quick access
        self.constraints = self.validator.constraints
        
        # Validation statistics
        self.validation_stats = {
            'fields_validated': 0,
            'fixes_applied': 0,
            'warnings_issued': 0,
            'errors_caught': 0
        }
    
    def validate_field_config(self, field_config, field_name):
        """
        Validate field configuration against layout protocol
        
        Args:
            field_config: Field configuration dictionary
            field_name: Name of the field for error reporting
            
        Returns:
            Validated (and possibly fixed) field configuration
        """
        try:
            validated_config = self.validator.validate_field(field_config, field_name)
            self.validation_stats['fields_validated'] += 1
            
            # Count fixes applied
            if len(self.validator.fixes_applied) > 0:
                self.validation_stats['fixes_applied'] += len(self.validator.fixes_applied)
                logger.info(f"Applied {len(self.validator.fixes_applied)} fixes to field '{field_name}'")
            
            # Count warnings
            if len(self.validator.warnings_issued) > 0:
                self.validation_stats['warnings_issued'] += len(self.validator.warnings_issued)
                for warning in self.validator.warnings_issued:
                    logger.warning(f"Field '{field_name}': {warning}")
            
            return validated_config
            
        except LayoutProtocolError as e:
            self.validation_stats['errors_caught'] += 1
            logger.error(f"Protocol validation failed for field '{field_name}': {e}")
            
            if self.validation_mode == 'strict':
                raise
            else:
                # Return original config with warning
                logger.warning(f"Using original config for field '{field_name}' due to validation error")
                return field_config
    
    def get_validation_report(self):
        """Get validation statistics and report for simplified data structure"""
        return {
            'validation_mode': self.validation_mode,
            'statistics': self.validation_stats,
            'validator_report': self.validator.get_enterprise_validation_report(),
            'data_structure': 'simplified_8_fields'
        }
    
    def get_fallback_font(self, font_family):
        """Get fallback font for unsupported fonts"""
        return self.font_fallbacks.get(font_family, font_family)
    
    def parse_unit_value(self, value, default_unit="mm"):
        """Parse value with unit (e.g., '10mm', '12pt') and return numeric value and unit"""
        if isinstance(value, (int, float)):
            return value, default_unit
        
        value_str = str(value).strip()
        
        # Handle 'auto' case
        if value_str.lower() == 'auto':
            return 'auto', 'auto'
        
        # Extract unit from end of string
        units = ['mm', 'pt', 'px', 'in', 'cm']
        for unit in units:
            if value_str.endswith(unit):
                numeric_part = value_str[:-len(unit)].strip()
                try:
                    return float(numeric_part), unit
                except ValueError:
                    return 0, unit
        
        # No unit found, assume default
        try:
            return float(value_str), default_unit
        except ValueError:
            return 0, default_unit
    
    def convert_to_points(self, value, unit):
        """Convert value to points based on unit"""
        if unit == "mm":
            return value * mm
        elif unit == "pt":
            return value
        elif unit == "px":
            return value * 0.75  # 96 DPI to 72 DPI conversion
        elif unit == "in":
            return value * 72
        elif unit == "cm":
            return value * mm * 10
        else:
            return value * mm  # default to mm
    
    def apply_background_color(self, pdf_canvas, field, x, y, field_width, field_height):
        """Apply background color if specified in template"""
        if 'backgroundColor' in field:
            bg_color = field['backgroundColor']
            pdf_canvas.setFillColorRGB(bg_color[0], bg_color[1], bg_color[2])
            pdf_canvas.rect(x, y - field_height, field_width, field_height, stroke=0, fill=1)
    
    def apply_text_color(self, pdf_canvas, field):
        """Apply text color from template"""
        text_color = field.get('textColor', [0, 0, 0])
        pdf_canvas.setFillColorRGB(text_color[0], text_color[1], text_color[2])
    
    def apply_font_style(self, pdf_canvas, field):
        """Apply font family and size from template"""
        font_family = field.get('fontFamily', 'Helvetica')
        font_family = self.get_fallback_font(font_family)
        
        font_size_val, font_size_unit = self.parse_unit_value(field.get('fontSize', 12))
        font_size = self.convert_to_points(font_size_val, font_size_unit)
        pdf_canvas.setFont(font_family, font_size)
        
        return font_size
    
    def get_field_dimensions(self, field):
        """Parse and convert field dimensions to points"""
        x_val, x_unit = self.parse_unit_value(field['x'])
        y_val, y_unit = self.parse_unit_value(field['y'])
        width_val, width_unit = self.parse_unit_value(field['width'])
        height_val, height_unit = self.parse_unit_value(field['height'])
        
        return {
            'x_val': x_val, 'x_unit': x_unit,
            'y_val': y_val, 'y_unit': y_unit,
            'width_val': width_val, 'width_unit': width_unit,
            'height_val': height_val, 'height_unit': height_unit
        }
    
    def get_text_alignment_x(self, pdf_canvas, text, field, x, field_width, font_family, font_size):
        """Calculate X position based on text alignment within field bounds"""
        text_align = field.get('textAlign', 'left')
        padding_raw = field.get('padding', 2)
        
        # Parse padding value with units
        if isinstance(padding_raw, (int, float)):
            padding = padding_raw
        else:
            padding_val, padding_unit = self.parse_unit_value(padding_raw)
            padding = self.convert_to_points(padding_val, padding_unit)
        
        # Handle indentation as positioning offset (only for single-line text)
        indent_offset = 0
        if 'indent' in field and field.get('wordWrap') != 'break-word':
            indent_text = field['indent']
            if indent_text:
                # Calculate indent width based on character count and average character width
                font_family = self.get_fallback_font(font_family)
                # Estimate character width (average for proportional fonts)
                avg_char_width = pdf_canvas.stringWidth('M', font_family, font_size)
                
                if '\t' in indent_text:
                    # Tab character: use 4-character width per tab
                    tab_count = indent_text.count('\t')
                    indent_offset = tab_count * avg_char_width * 4
                else:
                    # Space characters: use actual character count
                    space_count = len(indent_text)
                    indent_offset = space_count * avg_char_width
                
                print(f"🔍 Indent calculation: '{indent_text}' -> {space_count} spaces -> {indent_offset:.1f}pt offset")
        
        # Ensure font family uses fallback
        font_family = self.get_fallback_font(font_family)
        text_width = pdf_canvas.stringWidth(text, font_family, font_size)
        
        if text_align == 'right':
            # Right align: position text at right edge minus padding
            return x + field_width - text_width - padding
        elif text_align == 'center':
            # Center align: position text in center of field
            return x + (field_width - text_width) / 2 + indent_offset
        else:  # left align (default)
            # Left align: position text at left edge plus padding plus indent
            return x + padding + indent_offset
    
    def get_text_alignment_y(self, field, y, field_height, font_size):
        """Calculate Y position for proper vertical alignment"""
        # Get vertical alignment preference
        vertical_align = field.get('verticalAlign', 'center')
        
        # Parse padding for vertical spacing
        padding_raw = field.get('padding', 1)
        if isinstance(padding_raw, (int, float)):
            padding = padding_raw
        else:
            padding_val, padding_unit = self.parse_unit_value(padding_raw)
            padding = self.convert_to_points(padding_val, padding_unit)
        
        # Calculate baseline offset (font descender compensation)
        baseline_offset = font_size * 0.25
        
        if vertical_align == 'top':
            # Place text at top of container with padding
            return y - padding - baseline_offset
        elif vertical_align == 'bottom':
            # Place text at bottom of container with padding
            return y - field_height + padding + baseline_offset
        elif vertical_align == 'middle':
            # Place text exactly on the middle line (no centering)
            return y - field_height / 2
        else:  # center (default)
            # True vertical centering with equal space above and below
            center_y = y - field_height / 2
            return center_y + baseline_offset
    
    def apply_border_effects(self, pdf_canvas, field, x, y, field_width, field_height, centered_coords=False):
        """Apply border effects like lines, decorations from template"""
        # Handle border lines
        if field.get('borderLines'):
            border_config = field['borderLines']
            pdf_canvas.setStrokeColorRGB(0, 0, 0)
            line_width_val = border_config.get('lineWidth', 0.5)
            pdf_canvas.setLineWidth(line_width_val)
            
            # Parse line positioning from template
            line_width_percentage = border_config.get('widthPercentage', 80) / 100
            line_width = field_width * line_width_percentage
            
            # Get line offsets from template
            top_offset = border_config.get('topOffset', 2)
            bottom_offset = border_config.get('bottomOffset', -2)
            
            if centered_coords:
                # For rotated/special renderer fields - coordinate system is centered at (0,0)
                if border_config.get('topLine', True):
                    pdf_canvas.line(-line_width/2, top_offset, line_width/2, top_offset)
                if border_config.get('bottomLine', True):
                    pdf_canvas.line(-line_width/2, bottom_offset, line_width/2, bottom_offset)
            else:
                # For regular fields - coordinate system is at field position
                line_start_x = x + (field_width - line_width) / 2
                line_end_x = line_start_x + line_width
                field_center_y = y - field_height / 2
                
                if border_config.get('topLine', True):
                    line_y = field_center_y + top_offset
                    pdf_canvas.line(line_start_x, line_y, line_end_x, line_y)
                if border_config.get('bottomLine', True):
                    line_y = field_center_y + bottom_offset
                    pdf_canvas.line(line_start_x, line_y, line_end_x, line_y)
    
    def apply_strike_through(self, pdf_canvas, field, x, y, field_width, field_height):
        """Apply strike-through effect if specified in template"""
        if field.get('strikeThrough'):
            strike_config = field.get('strikeThrough', {})
            pdf_canvas.setStrokeColorRGB(0, 0, 0)
            line_width = strike_config.get('lineWidth', 1)
            pdf_canvas.setLineWidth(line_width)
            
            # Calculate strike line position
            strike_y = y - field_height / 2
            padding = strike_config.get('padding', 2)
            pdf_canvas.line(x + padding, strike_y, x + field_width - padding, strike_y)
    
    def get_line_height(self, field, font_size):
        """Get line height from template or calculate default"""
        if 'lineHeight' in field:
            line_height_val, line_height_unit = self.parse_unit_value(field['lineHeight'])
            return self.convert_to_points(line_height_val, line_height_unit)
        else:
            return font_size + 2  # Default: font size + 2pt spacing
    
    def apply_rotation(self, pdf_canvas, field, center_x, center_y):
        """Apply rotation transformation from template"""
        rotation = field.get('rotation', 0)
        if rotation != 0:
            pdf_canvas.translate(center_x, center_y)
            pdf_canvas.rotate(rotation)
            return True
        return False
    
    def get_letter_spacing(self, field):
        """Get letter spacing from template"""
        if 'letterSpacing' in field:
            spacing_val, spacing_unit = self.parse_unit_value(field['letterSpacing'])
            return self.convert_to_points(spacing_val, spacing_unit)
        return 0
    
    def get_field_content(self, field_name, field_config, data):
        """Generic field content resolver - handles ALL field types via template configuration"""
        # Check if field should be rendered
        if not self._should_render_field(field_name, field_config, data):
            return None
        
        # Get content based on field configuration
        content_source = field_config.get('contentSource', field_name)
        content_type = field_config.get('contentType', 'text')
        
        if content_type == 'boolean':
            return field_config.get('displayText', field_name.upper())
        elif content_type == 'formatted':
            return self._get_formatted_content(field_name, field_config, data)
        else:
            # Regular text field
            if content_source in data:
                content = str(data[content_source])
                # Apply text transformations
                if field_config.get('textCase'):
                    content = self._format_text_case(content, field_config['textCase'])
                # Add prefix/suffix if specified
                prefix = field_config.get('prefix', '')
                suffix = field_config.get('suffix', '')
                if prefix or suffix:
                    content = f"{prefix}{content}{suffix}"
                return content
            return None
    
    def _should_render_field(self, field_name, field_config, data):
        """Check if field should be rendered based on conditions"""
        # Check visibility condition
        condition = field_config.get('condition')
        if condition:
            if condition.get('type') == 'boolean':
                return data.get(condition['field'], False)
            elif condition.get('type') == 'exists':
                return condition['field'] in data
        
        # Default: render if data exists or it's a boolean/static field
        content_source = field_config.get('contentSource', field_name)
        content_type = field_config.get('contentType', 'text')
        
        if content_type == 'boolean':
            return data.get(field_name, False)
        else:
            # Map template field names to simplified data field names
            field_mapping = {
                'amount': 'amountInNumber',
                'amountInNumber': 'amountInNumber',
                'amountInWords': 'amountInWords'
            }
            mapped_source = field_mapping.get(content_source, content_source)
            return mapped_source in data
    
    def _get_formatted_content(self, field_name, field_config, data):
        """Handle formatted content types (date, amount, etc.) - simplified for pre-processed data"""
        format_type = field_config.get('formatType')
        content_source = field_config.get('contentSource', field_name)
        
        # All formatting is now done in pre-processing, just return the data as-is
        if format_type in ['date', 'amount_number', 'amount_words', 'name']:
            return data.get(content_source)
        
        return None
    
    def _format_text_case(self, text, case_type):
        """Format text case"""
        if case_type == "UpperCase":
            return text.upper()
        elif case_type == "TitleCase":
            return text.title()
        return text
    
    def _format_date(self, date_str, date_format):
        """Format date (simplified version)"""
        try:
            from dateutil.parser import parse as parse_date
            date_obj = parse_date(date_str)
            format_map = {
                "DD/MM/YYYY": "%d/%m/%Y",
                "DD-MM-YYYY": "%d-%m-%Y", 
                "DD-MMM-YYYY": "%d-%b-%Y",
                "DD MMM YYYY": "%d %b %Y",
                "DD/MM/YY": "%d/%m/%y",
                "DD-MMM-YY": "%d-%b-%y",
                "DD-MM-YY": "%d-%m-%y",
                "DD MMM YY": "%d %b %y"
            }
            python_format = format_map.get(date_format, "%d/%m/%Y")
            formatted_date = date_obj.strftime(python_format)
            
            # Convert month abbreviations to uppercase for MMM formats
            if "MMM" in date_format:
                # Define month mapping for uppercase
                month_mapping = {
                    'Jan': 'JAN', 'Feb': 'FEB', 'Mar': 'MAR', 'Apr': 'APR',
                    'May': 'MAY', 'Jun': 'JUN', 'Jul': 'JUL', 'Aug': 'AUG',
                    'Sep': 'SEP', 'Oct': 'OCT', 'Nov': 'NOV', 'Dec': 'DEC'
                }
                
                # Replace each month abbreviation with uppercase version
                for old_month, new_month in month_mapping.items():
                    formatted_date = formatted_date.replace(old_month, new_month)
            
            return formatted_date
        except:
            return date_str
    
    def _format_number(self, amount, currency_style="British", numbering="International"):
        """Format number (simplified version)"""
        try:
            num = int(float(amount))
            if numbering == "Indian":
                # Indian numbering: 12,34,56,789
                s = str(num)
                if len(s) <= 3:
                    return s
                result = s[-3:]
                s = s[:-3]
                while len(s) > 2:
                    result = s[-2:] + ',' + result
                    s = s[:-2]
                if s:
                    result = s + ',' + result
                return result
            else:
                # International numbering: 123,456,789
                return f"{num:,}"
        except:
            return str(amount)
    
    def _number_to_words(self, amount, currency_style="British", case_type="TitleCase", numbering="International"):
        """Convert number to words - deprecated, data is now pre-processed"""
        # Data is pre-processed, return as-is
        return str(amount)

    def apply_container_transformation(self, pdf_canvas, container, container_x, container_y, container_width, container_height):
        """Apply container-level transformations - disabled for Form-based rotation"""
        # We'll rotate when placing the form, not here
        return False

    def restore_container_transformation(self, pdf_canvas, transformation_applied):
        """Restore state after container transformation"""
        if transformation_applied:
            pdf_canvas.restoreState()
    
    def get_transformed_field_position(self, field_x, field_y, container_rotation, container_x, container_y, container_width, container_height):
        """Calculate field position after container transformation (for reference)"""
        if container_rotation == 0:
            return field_x, field_y
        
        # This is for reference - ReportLab handles coordinate transformation automatically
        # when we apply container transformation
        import math
        
        # Container center
        center_x = container_x + container_width / 2
        center_y = container_y + container_height / 2
        
        # Relative position from container center
        rel_x = field_x - center_x
        rel_y = field_y - center_y
        
        # Apply rotation
        angle_rad = math.radians(container_rotation)
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        
        new_rel_x = rel_x * cos_a - rel_y * sin_a
        new_rel_y = rel_x * sin_a + rel_y * cos_a
        
        # Convert back to absolute position
        new_x = center_x + new_rel_x
        new_y = center_y + new_rel_y
        
        return new_x, new_y
    
    def draw_wrapped_text(self, pdf_canvas, text_content, field_config, x, y, width, height):
        """Draw text with word wrapping"""
        
        font_info = self.get_font_info(field_config)
        font_name = font_info['name']
        font_size = font_info['size']
        
        # Calculate line height
        line_height = self.get_line_height(field_config, font_size)
        
        # Simple word wrapping (split by words)
        words = text_content.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            text_width = pdf_canvas.stringWidth(test_line, font_name, font_size)
            
            if text_width <= width or not current_line:
                current_line.append(word)
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        # Calculate first-line indent if specified
        first_line_indent = 0
        if 'indent' in field_config:
            indent_text = field_config['indent']
            if indent_text:
                avg_char_width = font_size * 0.6  # Approximation
                if '\t' in indent_text:
                    tab_count = indent_text.count('\t')
                    first_line_indent = tab_count * avg_char_width * 4
                else:
                    space_count = len(indent_text)
                    first_line_indent = space_count * avg_char_width

        # Draw lines
        current_y = y
        for line_index, line in enumerate(lines):
            if current_y < y - height:  # Stop if we exceed field height
                break
            
            # Apply indent only to the first line
            line_x = x + (first_line_indent if line_index == 0 else 0)
            pdf_canvas.drawString(line_x, current_y, line)
            current_y -= line_height

    def get_font_info(self, field_config):
        """Get font name and size from field configuration"""
        font_family = field_config.get('fontFamily', 'Helvetica')
        font_name = self.get_fallback_font(font_family)
        
        font_size_str = field_config.get('fontSize', '11pt')
        font_size_val, font_size_unit = self.parse_unit_value(font_size_str)
        font_size = self.convert_to_points(font_size_val, font_size_unit)
        
        return {
            'name': font_name,
            'size': font_size
        }
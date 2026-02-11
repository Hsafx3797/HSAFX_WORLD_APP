# 🏦 Cheque Printing App - Backend API

A production-ready FastAPI backend service for generating professional PDF cheques with intelligent template-driven architecture, automatic protocol validation, and advanced text processing capabilities.

## ✨ Core Features

- 🚀 **FastAPI REST API**: Modern async Python web framework with automatic OpenAPI documentation
- 🛡️ **Enterprise Protocol Validation**: Crash-resistant system with auto-fix, warn, and strict modes
- 📐 **Precision Positioning**: Millimeter-accurate placement with negative positioning support for rotated elements
- 🔄 **Automatic Orientation**: Portrait (90°) and Landscape (0°) modes based on data configuration
- 💰 **Advanced Number Processing**: British/American currency styles with Indian/International numbering systems
- 🎨 **Rich Text Effects**: Letter spacing, rotation (±180°, ±135°, ±90°, ±45°), multi-line wrapping, first-line indentation
- 🌍 **Multi-Bank Ready**: Extensible template system for unlimited bank layouts
- 📊 **Comprehensive Validation**: Real-time protocol checking with detailed reporting and auto-correction
- 🌐 **CORS Enabled**: Configured for frontend integration with proper security

## 🏗️ API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Server                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend Request  →  Data Validation  →  Template Engine  │
│       ↓                     ↓                     ↓        │
│  JSON Processing   →  Protocol Check   →  PDF Generation   │
│       ↓                     ↓                     ↓        │
│  Field Processing  →   Layout Engine   →   File Response   │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Framework**: FastAPI + Uvicorn
- **PDF Generation**: ReportLab + Custom Template Engine
- **Validation**: Pydantic v2 + Custom Protocol System  
- **Configuration**: Python-dotenv + Environment variables
- **Data Processing**: JSON + Custom formatters
- **Architecture**: RESTful API with automatic OpenAPI docs

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Cheque PDF Generator API is running"
}
```

### Countries & Banks Mapping
```http
GET /api/countries-banks
```
**Response:**
```json
{
  "Pakistan": {
    "Allied Bank Limited": "templates/Pakistan/Pakistan_Allied Bank Limited.json",
    "Bank AL Habib Limited": "templates/Pakistan/Pakistan_Bank AL Habib Limited.json",
    "HBL Bank": "templates/Pakistan/Pakistan_HBL.json"
  }
}
```

### Generate Cheque PDF
```http
POST /api/generate-cheque
Content-Type: application/json
```

**Request Body:**
```json
{
  "countryName": "Pakistan",
  "bankName": "Allied Bank Limited",
  "chequeOrientation": "Portrait",
  "payeeName": "Muhammad Asher Test Company Ltd",
  "date": "18/10/2025",
  "amountInNumber": "123456879",
  "amountInWords": "One Hundred Twenty-Three Million",
  "acPayee": true,
  "notNegotiable": true,
  "orBearer": false
}
```

**Response:**
- **Content-Type**: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename="cheque_*.pdf"`
- **Body**: Generated PDF file

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)

### Installation

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run Development Server

```bash
# Start FastAPI server with auto-reload
python api_server.py

# Alternative using uvicorn directly
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

**Server will start on:**
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=True
ENVIRONMENT=development

# CORS settings (configure for production)
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# PDF settings
DEFAULT_PAGE_SIZE=A4
DEFAULT_FONT_FAMILY=Arial
DEFAULT_FONT_SIZE=12

# Template settings
TEMPLATES_DIR=templates

# Logging
LOG_LEVEL=INFO
```

## 📁 Project Structure

```
backend/
├── api_server.py              # FastAPI application entry point
├── generate_cheque.py         # Core PDF generation logic
├── template_parser.py         # Template processing engine
├── layout_protocol.py         # Validation and protocol system
├── requirements.txt           # Python dependencies
├── .env                      # Environment configuration
├── data/
│   └── countries_and_bank.json  # Country/Bank mapping
└── templates/
    └── Pakistan/             # Bank-specific templates
        ├── Pakistan_HBL.json
        ├── Pakistan_Allied Bank Limited.json
        └── ...more templates
```

## 🎛️ Data Models

### ChequeData Schema (Pydantic)

```python
class ChequeData(BaseModel):
    countryName: str              # Country selection
    bankName: str                 # Bank selection
    chequeOrientation: str        # "Portrait" or "Landscape"
    payeeName: str               # Payee name
    date: str                    # Date in various formats
    amountInNumber: str          # Numeric amount
    amountInWords: str           # Amount in words
    acPayee: bool                # A/C Payee checkbox
    notNegotiable: bool          # Not Negotiable checkbox
    orBearer: bool               # Or Bearer checkbox
```

### Template Structure

```json
{
  "_meta": {
    "description": "Bank Template Configuration",
    "countryName": "Pakistan",
    "bankName": "HBL Bank",
    "version": "1.0"
  },
  "page": {
    "width": "210mm",
    "height": "297mm",
    "layout": "portrait"
  },
  "chequeContainer": {
    "width": "168mm", 
    "height": "72mm",
    "orientation": 90,
    "fields": {
      "payeeName": {
        "width": "105.5mm",
        "height": "4.75mm",
        "x": "15mm",
        "y": "48.75mm",
        "formatType": "name",
        "contentSource": "payeeName"
      }
    }
  }
}
```

## 🛡️ Security Features

### CORS Configuration
- Configured for specific frontend origins
- Credentials support enabled
- All methods and headers allowed for development

### Input Validation
- Pydantic schema validation
- Type checking and conversion
- Required field enforcement

### Error Handling
- Comprehensive exception handling
- Detailed error responses for debugging
- Graceful fallbacks for missing data

## 🧪 Testing

### Manual API Testing

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test countries/banks endpoint  
curl http://localhost:8000/api/countries-banks

# Test PDF generation
curl -X POST http://localhost:8000/api/generate-cheque \
  -H "Content-Type: application/json" \
  -d '{
    "countryName": "Pakistan",
    "bankName": "Allied Bank Limited", 
    "chequeOrientation": "Portrait",
    "payeeName": "Test Company Ltd",
    "date": "18/10/2025",
    "amountInNumber": "123456",
    "amountInWords": "One Hundred Twenty-Three Thousand",
    "acPayee": true,
    "notNegotiable": false,
    "orBearer": false
  }' --output test_cheque.pdf
```

### Interactive Testing
Visit http://localhost:8000/docs for Swagger UI with:
- Interactive API documentation
- Request/response examples
- Try-it-now functionality
- Schema definitions

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **CORS Error** | Frontend origin not allowed | Add frontend URL to CORS_ORIGINS |
| **PDF Generation Failed** | Invalid template or data | Check logs for specific error |
| **Port Already in Use** | Another service on port 8000 | Change PORT in .env or kill process |
| **Template Not Found** | Missing bank template file | Check templates directory |
| **Dependencies Error** | Missing Python packages | Run `pip install -r requirements.txt` |

### Debug Commands

```bash
# Check server status
curl http://localhost:8000/api/health

# View server logs (when running with python api_server.py)
# Logs appear in terminal

# Test PDF generation directly
python generate_cheque.py

# Validate template
python -c "from layout_protocol import validate_template_file; print(validate_template_file('templates/Pakistan/Pakistan_HBL.json'))"
```

## 📚 Dependencies

```txt
fastapi>=0.104.1          # Modern web framework
uvicorn[standard]>=0.24.0 # ASGI server
pydantic>=2.5.0          # Data validation
reportlab>=4.0.0         # PDF generation
python-dateutil>=2.8.0   # Date parsing
python-multipart>=0.0.6  # Form data support
```

## 🚀 Production Deployment

### Docker Setup

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Configuration

```env
# Production settings
DEBUG=False
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000

# Security
CORS_ORIGINS=["https://yourdomain.com"]

# Logging
LOG_LEVEL=WARNING
```

### Deployment Commands

```bash
# Using uvicorn for production
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4

# Using gunicorn with uvicorn workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api_server:app
```

## 📈 Performance Features

- **Async Processing**: FastAPI async support for concurrent requests
- **Template Caching**: Templates loaded once and cached in memory  
- **Protocol Validation**: Optimized validation with minimal overhead
- **PDF Streaming**: Direct file response without memory buffering
- **Error Recovery**: Graceful handling of edge cases

## 🔗 Integration

### Frontend Integration
This backend is designed to work with the React/Next.js frontend:
- Port 8000 (backend) ↔ Port 3000 (frontend)
- JSON data exchange
- PDF file download/preview
- Real-time form validation

### API Client Example

```typescript
// TypeScript/JavaScript client
const generateCheque = async (data: ChequeData) => {
  const response = await fetch('http://localhost:8000/api/generate-cheque', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    // Handle PDF download/preview
  }
};
```

---

## 📄 License

Cheque Printing App Backend API
© 2025 FastAPI PDF Solutions

---

**🎯 Production Ready**: Enterprise-grade FastAPI service with comprehensive validation, security features, and robust error handling for professional cheque generation.

## ✨ Core Features

- 🚀 **Intelligent Template System**: JSON-driven architecture with automatic orientation and data-driven formatting
- 🛡️ **Enterprise Protocol Validation**: Crash-resistant system with auto-fix, warn, and strict modes
- 📐 **Precision Positioning**: Millimeter-accurate placement with negative positioning support for rotated elements
- 🔄 **Automatic Orientation**: Portrait (90°) and Landscape (0°) modes based on data configuration
- 💰 **Advanced Number Processing**: British/American currency styles with Indian/International numbering systems
- 🎨 **Rich Text Effects**: Letter spacing, rotation (±180°, ±135°, ±90°, ±45°), multi-line wrapping, first-line indentation
- 🌍 **Multi-Bank Ready**: Extensible template system for unlimited bank layouts
- 📊 **Comprehensive Validation**: Real-time protocol checking with detailed reporting and auto-correction

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cheque PDF Generator                     │
├─────────────────────────────────────────────────────────────┤
│  cheque_data.json  →  Auto-Orientation  →  Template Engine │
│       ↓                     ↓                     ↓        │
│  Data Validation   →  Protocol Check   →  PDF Generation   │
│       ↓                     ↓                     ↓        │
│  Field Processing  →   Layout Engine   →   ReportLab PDF   │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| **Main Generator** | `generate_cheque.py` | PDF generation orchestration, orientation logic |
| **Template Engine** | `template_parser.py` | JSON template interpretation, text processing |
| **Protocol System** | `layout_protocol.py` | Validation, constraints, auto-fix capabilities |
| **Data File** | `cheque_data.json` | Input data with formatting preferences |
| **Bank Templates** | `templates/*.json` | Bank-specific layout configurations |

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)

### Installation

```bash
# Clone and navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Generate Your First Cheque

```bash
# Generate PDF with default settings
python generate_cheque.py
```

**Output**: `cheque_Muhammad_Asher_Test_Company_Ltd.pdf`

## 🎛️ Configuration System

### Data Configuration (`cheque_data.json`)

```json
{
  "chequeOrientation": "Portrait",          // Auto-rotation: Portrait=90°, Landscape=0°
  "payeeName": "Muhammad Asher Test Company Ltd",
  "payeeNameCase": "UpperCase",             // UpperCase, TitleCase, LowerCase
  "date": "18/10/2025",
  "dateFormat": "DD MMM YYYY",              // DD/MM/YYYY, DD-MMM-YYYY, DD MMM YYYY
  "amount": 123456879,                      // Numeric amount for conversion
  "numbering": "Indian",                    // Indian (crore/lakh), International
  "currencyStyle": "British",               // British (with "and"), American (minimal "and")
  "amountNumberPrefix": "",                 // Custom prefix for numeric amount
  "amountNumberSuffix": "/-",               // Custom suffix for numeric amount
  "amountWordsPrefix": "",                  // Custom prefix for words
  "amountWordsSuffix": " Only",             // Custom suffix for words
  "acPayee": true,                          // Boolean fields for stamps
  "notNegotiable": true,
  "orBearer": true
}
```

### Template Structure (`templates/pakistan_hbl.json`)

```json
{
  "_meta": {
    "description": "Pakistan HBL Bank Cheque Template",
    "bankName": "HBL",
    "version": "2.1",
    "protocolVersion": "2.1"
  },
  "page": {
    "width": "210mm",
    "height": "297mm",
    "layout": "portrait",
    "backgroundColor": [0.271, 0.271, 0.271]
  },
  "chequeContainer": {
    "width": "168mm",
    "height": "72mm",
    "orientation": 90,                       // Auto-set by orientation logic
    "fields": {
      "payeeName": {
        "width": "105.5mm",
        "height": "4.75mm",
        "x": "15mm",
        "y": "48.75mm",
        "formatType": "name",
        "contentSource": "payeeName"
      },
      "amountInWords": {
        "width": "115mm",
        "height": "15mm",
        "wordWrap": "break-word",
        "indent": "   ",                     // First-line indentation only
        "formatType": "amount_words",
        "contentSource": "amount"
      },
      "acPayee": {
        "x": "-10mm",                        // Negative positioning supported
        "rotation": 45,                      // Diagonal stamp effect
        "displayText": "A/C PAYEE ONLY",
        "borderLines": {
          "topLine": true,
          "bottomLine": true
        }
      }
    }
  }
}
```

## 🎯 Advanced Features

### 1. Automatic Orientation System

The system automatically adjusts template orientation based on data:

```json
// Data Setting → Template Result
"chequeOrientation": "Portrait"  → orientation: 90  (rotated layout)
"chequeOrientation": "Landscape" → orientation: 0   (standard layout)
```

### 2. Currency Style Processing

**British Style:**
```
Input:  123456879
Output: "One Hundred And Twenty-Three Million, Four Hundred And Fifty-Six Thousand, Eight Hundred And Seventy-Nine Only"
```

**American Style:**
```
Input:  123456879  
Output: "One Hundred Twenty-Three Million, Four Hundred Fifty-Six Thousand, Eight Hundred And Seventy-Nine Only"
```

### 3. Intelligent Text Wrapping

```json
"amountInWords": {
  "wordWrap": "break-word",
  "indent": "    ",           // Only indents first line
  "lineHeight": "18pt"
}
```

**Result:**
```
    Twelve Crore, Thirty-Four Lakh, Fifty-Six
Thousand, Eight Hundred And Seventy-Nine Only
```

### 4. Precision Positioning with Negative Values

```json
"acPayee": {
  "x": "-10mm",              // Positions element outside normal boundaries
  "y": "65mm",
  "rotation": 45,            // Combined with rotation for stamps
  "width": "30mm"
}
```

### 5. Dynamic Content Processing

| Format Type | Source Field | Processing |
|-------------|--------------|------------|
| `name` | `payeeName` | Case conversion, prefix/suffix |
| `date` | `date` | Format conversion (DD/MM/YYYY → DD MMM YYYY) |
| `amount_number` | `amount` | Numeric formatting with custom prefix/suffix |
| `amount_words` | `amount` | Number-to-words with currency style |

## 🛡️ Enterprise Protocol System

### Validation Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **auto-fix** | Automatically corrects invalid values | Production (recommended) |
| **warn** | Logs warnings, continues with original | Development/debugging |
| **strict** | Stops on any validation error | Quality assurance |

### Protocol Constraints

```python
# Positioning Constraints
'min_x': -50.0,        # mm - Allows negative positioning
'max_x': 260.0,        # mm - Extended beyond A4 for rotated elements
'min_y': -50.0,        # mm - Supports off-page positioning
'max_y': 347.0,        # mm - Extended boundaries

# Dimension Constraints  
'min_width': 5.0,      # mm - Minimum readable width
'max_width': 200.0,    # mm - A4-safe maximum
'min_height': 1.0,     # mm - Precise measurements
'max_height': 100.0,   # mm - Reasonable limit

# Typography Constraints
'min_font_size': 6,    # pt - Minimum readable
'max_font_size': 24,   # pt - Maximum practical
'rotation_valid': [-180, -135, -90, -45, 0, 45, 90, 135, 180]  # Valid angles
```

### Auto-Fix Examples

```
❌ Input:  "width": "500mm"     →  ✅ Fixed: "width": "200mm"
❌ Input:  "x": "negative"      →  ✅ Fixed: "x": "0mm"  
❌ Input:  "rotation": 30       →  ✅ Fixed: "rotation": 45
❌ Input:  "fontSize": "100pt"  →  ✅ Fixed: "fontSize": "24pt"
```

## 📊 Field Configuration Reference

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `width` | String | Field width with unit | `"105mm"` |
| `height` | String | Field height with unit | `"10mm"` |
| `x` | String | X position (supports negative) | `"15mm"`, `"-10mm"` |
| `y` | String | Y position (supports negative) | `"48.75mm"` |

### Text Properties

| Property | Type | Options | Example |
|----------|------|---------|---------|
| `fontFamily` | String | Helvetica, Times-Roman, Courier | `"Helvetica"` |
| `fontSize` | String | 6pt - 24pt | `"11pt"` |
| `textAlign` | String | left, center, right, justify | `"left"` |
| `verticalAlign` | String | top, center, bottom, middle | `"bottom"` |
| `textColor` | Array | RGB values (0-1) | `[0.0, 0.0, 0.0]` |
| `letterSpacing` | String | Character spacing | `"1mm"` |
| `lineHeight` | String | Line spacing | `"18pt"` |
| `wordWrap` | String | break-word, none | `"break-word"` |
| `indent` | String | First-line indent only | `"    "` |

### Layout Properties

| Property | Type | Options | Example |
|----------|------|---------|---------|
| `rotation` | Number | ±180°, ±135°, ±90°, ±45°, 0° | `45` |
| `backgroundColor` | Array | RGB values (0-1) | `[1.0, 1.0, 0.0]` |
| `precisionMode` | Boolean | Bypass aspect ratio constraints | `true` |

### Content Processing

| Property | Type | Options | Example |
|----------|------|---------|---------|
| `contentType` | String | formatted, boolean, raw | `"formatted"` |
| `formatType` | String | name, date, amount_number, amount_words | `"amount_words"` |
| `contentSource` | String | Field name from data | `"amount"` |
| `displayText` | String | Static text for boolean fields | `"A/C PAYEE ONLY"` |

### Conditional Rendering

```json
"condition": {
  "type": "exists",           // exists, boolean
  "field": "date"             // Field to check
}
```

### Border Effects

```json
"borderLines": {
  "lineWidth": 1.0,           // Line thickness (pt)
  "widthPercentage": 100.0,   // Line width (%)
  "topOffset": 16.0,          // Top line position
  "bottomOffset": 7.0,        // Bottom line position  
  "topLine": true,            // Show top border
  "bottomLine": true,         // Show bottom border
  "color": [0.0, 0.0, 0.0]    // RGB color
}
```

## 🔧 Development Workflow

### 1. Data-Driven Approach

```bash
# Modify data only
edit cheque_data.json

# Generate PDF
python generate_cheque.py
```

### 2. Layout Customization

```bash
# Modify template positioning
edit templates/pakistan_hbl.json

# Test changes
python generate_cheque.py
```

### 3. Multi-Bank Setup

```bash
# Create new bank template
cp templates/pakistan_hbl.json templates/india_sbi.json

# Customize for new bank
edit templates/india_sbi.json

# Use new template
python generate_cheque.py --template templates/india_sbi.json
```

## 🧪 Testing & Validation

### Validation Report

```python
from layout_protocol import validate_template_file

is_valid, report = validate_template_file('templates/pakistan_hbl.json')
print(f"Valid: {is_valid}")
print(f"Report: {report}")
```

### Debug Mode

```python
# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with validation details
python generate_cheque.py
```

## 🎨 Template Examples

### Simple Text Field

```json
"payeeName": {
  "width": "105.5mm",
  "height": "4.75mm", 
  "x": "15mm",
  "y": "48.75mm",
  "fontFamily": "Helvetica",
  "fontSize": "11pt",
  "textAlign": "left",
  "verticalAlign": "bottom",
  "formatType": "name",
  "contentSource": "payeeName"
}
```

### Multi-line Text with Indentation

```json
"amountInWords": {
  "width": "115mm",
  "height": "15mm",
  "x": "8mm", 
  "y": "44mm",
  "wordWrap": "break-word",
  "indent": "   ",
  "lineHeight": "18pt",
  "formatType": "amount_words",
  "contentSource": "amount"
}
```

### Rotated Stamp with Borders

```json
"acPayee": {
  "width": "30mm",
  "height": "8mm",
  "x": "-10mm",
  "y": "65mm", 
  "rotation": 45,
  "fontSize": "8pt",
  "textAlign": "center",
  "displayText": "A/C PAYEE ONLY",
  "borderLines": {
    "topLine": true,
    "bottomLine": true,
    "lineWidth": 1.0,
    "widthPercentage": 100.0
  }
}
```

### Date Field with Letter Spacing

```json
"date": {
  "width": "39mm",
  "height": "5mm",
  "x": "118mm",
  "y": "56.5mm",
  "letterSpacing": "1mm",
  "formatType": "date",
  "contentSource": "date"
}
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Text Cut Off** | Field too small | Increase `width`/`height` or enable `precisionMode` |
| **Positioning Problems** | Coordinates outside bounds | Check X/Y values within template container |
| **Rotation Not Working** | Invalid angle | Use valid angles: 0°, ±45°, ±90°, ±135°, ±180° |
| **Font Issues** | Unsupported font | Use Helvetica, Times-Roman, or Courier |
| **Validation Errors** | Protocol violations | Run in `auto-fix` mode or check constraints |

### Debug Commands

```bash
# Check template validation
python -c "from layout_protocol import validate_template_file; print(validate_template_file('templates/pakistan_hbl.json'))"

# Test orientation logic
python -c "from generate_cheque import apply_orientation_logic; apply_orientation_logic('templates/pakistan_hbl.json', {'chequeOrientation': 'Portrait'})"

# Test number conversion
python -c "from template_parser import TemplateParser; p = TemplateParser(); print(p._number_to_words(123456879, 'British', 'TitleCase', 'Indian'))"
```

## 📚 Dependencies

```python
# Core Dependencies
reportlab>=4.0.0           # PDF generation engine
python-dateutil>=2.8.0     # Advanced date parsing
num2words                   # Number to words conversion

# Optional Enhancements  
pillow>=10.0.0             # Image processing support
```

## 🏆 System Capabilities

### ✅ Fully Implemented Features

- ✅ **Data-Driven Architecture**: Zero hardcoded values, complete customization
- ✅ **Automatic Orientation**: Portrait/Landscape switching based on data
- ✅ **Advanced Number Processing**: British/American styles with Indian numbering
- ✅ **Precision Positioning**: Negative coordinates for rotated elements
- ✅ **Intelligent Text Wrapping**: First-line indentation, multi-line support
- ✅ **Protocol Validation**: Auto-fix with comprehensive error handling
- ✅ **Rotation Support**: Full 360° rotation with diagonal stamps (±45°)
- ✅ **Field Conditional Rendering**: Boolean and existence-based conditions
- ✅ **Border Effects**: Configurable lines with positioning offsets
- ✅ **Font Fallback System**: Automatic font substitution

### 📏 Technical Specifications

- **Page Support**: A4 (210x297mm) with extended boundaries for rotation
- **Positioning Range**: X: -50mm to 260mm, Y: -50mm to 347mm
- **Font Size Range**: 6pt to 24pt with automatic scaling
- **Rotation Angles**: 0°, ±45°, ±90°, ±135°, ±180°
- **Template Protocol**: Version 2.1 with backward compatibility
- **Validation Modes**: auto-fix, warn, strict
- **Field Types**: Text, numeric, boolean, formatted content

## 🚀 Usage Examples

### Basic Generation

```bash
python generate_cheque.py
```

### Custom Data

```bash
# Edit cheque_data.json, then:
python generate_cheque.py
```

### Different Orientations

```json
// Portrait mode (vertical layout)
{"chequeOrientation": "Portrait"}

// Landscape mode (horizontal layout)  
{"chequeOrientation": "Landscape"}
```

---

## 📄 License

Professional Cheque PDF Generator - Enterprise Edition
© 2025 Advanced PDF Solutions

---

**🎯 Ready for Production**: This system provides enterprise-grade cheque generation with bulletproof validation, intelligent automation, and unlimited customization capabilities.
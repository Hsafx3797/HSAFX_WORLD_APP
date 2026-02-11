from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import json
import os
import subprocess
import tempfile
import glob
import time
import re
from pathlib import Path
import uvicorn

app = FastAPI(title="Cheque PDF Generator API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://192.168.100.40:3000",  # Network address
        "http://192.168.100.40:3001"   # Network address
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for backend files
BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR

class ChequeData(BaseModel):
    countryName: str
    bankName: str
    chequeOrientation: str
    payeeName: str
    date: str
    amountInNumber: str
    amountInWords: str
    acPayee: bool
    notNegotiable: bool
    orBearer: bool

class BulkChequeData(BaseModel):
    cheques: list[ChequeData]
    filename: str = "bulk_cheques"

def cleanup_old_temp_files():
    """Clean up temporary cheque PDF files older than 1 hour"""
    try:
        temp_dir = tempfile.gettempdir()
        pattern = os.path.join(temp_dir, "cheque_*.pdf")
        current_time = time.time()
        
        for file_path in glob.glob(pattern):
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                # Remove files older than 1 hour (3600 seconds)
                if file_age > 3600:
                    try:
                        os.unlink(file_path)
                        print(f"🗑️ Cleaned up old temp file: {file_path}")
                    except OSError:
                        pass
    except Exception as e:
        print(f"⚠️ Error during temp file cleanup: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "OK", "message": "Cheque PDF Generator API is running"}

@app.get("/api/countries-banks")
async def get_countries_banks():
    """Serve the countries and banks mapping from countries_and_bank.json"""
    try:
        mapping_path = BACKEND_DIR / "data" / "countries_and_bank.json"
        with open(mapping_path, 'r', encoding='utf-8') as f:
            mapping_data = json.load(f)
        return mapping_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Countries/banks mapping file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading mapping file: {str(e)}")

@app.post("/api/generate-cheque")
async def generate_cheque_pdf(cheque_data: ChequeData):
    """Generate cheque PDF using the Python backend"""
    try:
        # Clean up old temporary PDF files (older than 1 hour)
        cleanup_old_temp_files()
        
        # Write the form data to cheque_data.json
        data_path = BACKEND_DIR / "cheque_data.json"
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(cheque_data.dict(), f, indent=2, ensure_ascii=False)
        
        print(f"✅ Written cheque data to: {data_path}")
        print(f"📊 Data: {cheque_data.dict()}")
        
        # Run the Python generator script
        python_script = BACKEND_DIR / "generate_cheque.py"
        
        # Execute the script in the backend directory
        result = subprocess.run(
            ["python", str(python_script)],
            cwd=str(BACKEND_DIR),
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print(f"🐍 Python script output:")
        print(f"📤 stdout: {result.stdout}")
        if result.stderr:
            print(f"⚠️ stderr: {result.stderr}")
        
        if result.returncode == 0:
            # Find the generated PDF file in temp directory
            temp_dir = tempfile.gettempdir()
            # Apply same sanitization as in generate_cheque.py
            payee_safe = re.sub(r'[<>:"/\\|?*]', '_', cheque_data.payeeName).replace(' ', '_')
            pdf_pattern = os.path.join(temp_dir, f"cheque_{payee_safe}_*.pdf")
            pdf_files = glob.glob(pdf_pattern)
            
            if pdf_files:
                # Get the most recent file
                pdf_file = max(pdf_files, key=os.path.getctime)
                print(f"📄 Found PDF: {pdf_file}")
                
                # Return the PDF as a file response
                return FileResponse(
                    path=str(pdf_file),
                    media_type='application/pdf',
                    filename=f"cheque_{payee_safe}.pdf",
                    headers={
                        "Content-Disposition": f"attachment; filename=cheque_{payee_safe}.pdf",
                        "Content-Security-Policy": "default-src 'self'",
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    }
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "PDF generation succeeded but file not found",
                        "stdout": result.stdout,
                        "stderr": result.stderr
                    }
                )
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "PDF generation failed",
                    "code": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="PDF generation timed out")
    except Exception as e:
        print(f"❌ Error in generate-cheque endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/generate-bulk-cheques")
async def generate_bulk_cheques_pdf(bulk_data: BulkChequeData):
    """Generate multi-page PDF with multiple cheques"""
    try:
        # Clean up old temporary PDF files
        cleanup_old_temp_files()
        
        if not bulk_data.cheques:
            raise HTTPException(status_code=400, detail="No cheque data provided")
        
        print(f"✅ Processing {len(bulk_data.cheques)} cheques for bulk generation")
        
        # Create temporary directory for individual PDFs
        temp_dir = tempfile.gettempdir()
        bulk_temp_dir = os.path.join(temp_dir, f"bulk_{int(time.time())}")
        os.makedirs(bulk_temp_dir, exist_ok=True)
        
        individual_pdfs = []
        
        # Generate individual PDFs for each cheque
        for i, cheque_data in enumerate(bulk_data.cheques):
            print(f"📄 Generating cheque {i+1}/{len(bulk_data.cheques)} for {cheque_data.payeeName}")
            
            # Write individual cheque data
            data_path = BACKEND_DIR / f"temp_cheque_data_{i}.json"
            with open(data_path, 'w', encoding='utf-8') as f:
                json.dump(cheque_data.dict(), f, indent=2, ensure_ascii=False)
            
            # Generate individual PDF
            python_script = BACKEND_DIR / "generate_cheque.py"
            result = subprocess.run(
                ["python", str(python_script), str(data_path)],
                cwd=str(BACKEND_DIR),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Find the generated PDF
                # Apply same sanitization as in generate_cheque.py
                payee_safe = re.sub(r'[<>:"/\\|?*]', '_', cheque_data.payeeName).replace(' ', '_')
                pdf_pattern = os.path.join(temp_dir, f"cheque_{payee_safe}_*.pdf")
                pdf_files = glob.glob(pdf_pattern)
                
                if pdf_files:
                    latest_pdf = max(pdf_files, key=os.path.getctime)
                    # Move to bulk temp directory
                    bulk_pdf_path = os.path.join(bulk_temp_dir, f"cheque_{i+1:03d}_{payee_safe}.pdf")
                    os.rename(latest_pdf, bulk_pdf_path)
                    individual_pdfs.append(bulk_pdf_path)
                    print(f"✅ Generated: {bulk_pdf_path}")
                else:
                    print(f"❌ Failed to find PDF for {cheque_data.payeeName}")
            else:
                print(f"❌ Failed to generate PDF for {cheque_data.payeeName}: {result.stderr}")
            
            # Clean up temporary data file
            try:
                os.unlink(data_path)
            except:
                pass
        
        if not individual_pdfs:
            raise HTTPException(status_code=500, detail="Failed to generate any PDFs")
        
        # Merge PDFs into a single multi-page PDF
        from PyPDF2 import PdfMerger
        
        merger = PdfMerger()
        final_pdf_path = os.path.join(temp_dir, f"bulk_{bulk_data.filename}_{int(time.time())}.pdf")
        
        for pdf_path in individual_pdfs:
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
                print(f"📎 Added {os.path.basename(pdf_path)} to bulk PDF")
        
        with open(final_pdf_path, 'wb') as output_file:
            merger.write(output_file)
        merger.close()
        
        # Clean up individual PDFs
        for pdf_path in individual_pdfs:
            try:
                os.unlink(pdf_path)
            except:
                pass
        
        # Remove bulk temp directory
        try:
            os.rmdir(bulk_temp_dir)
        except:
            pass
        
        print(f"🎉 Bulk PDF generated successfully: {final_pdf_path}")
        print(f"📊 Total pages: {len(individual_pdfs)}")
        
        # Return the merged PDF
        return FileResponse(
            path=str(final_pdf_path),
            media_type='application/pdf',
            filename=f"{bulk_data.filename}.pdf",
            headers={
                "Content-Disposition": f"attachment; filename={bulk_data.filename}.pdf",
                "Content-Security-Policy": "default-src 'self'",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Bulk PDF generation timed out")
    except Exception as e:
        print(f"❌ Error in bulk generate-cheques endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Cheque PDF Generator FastAPI Server...")
    print(f"📁 Backend directory: {BACKEND_DIR}")
    print("📡 Available endpoints:")
    print("  GET  http://localhost:8000/api/health")
    print("  GET  http://localhost:8000/api/countries-banks")
    print("  POST http://localhost:8000/api/generate-cheque")
    print("  POST http://localhost:8000/api/generate-bulk-cheques")
    print("📖 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
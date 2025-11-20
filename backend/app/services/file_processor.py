"""
EduCode Backend - File Processing Service

Extracts text content from various file formats (PDF, PPTX, DOCX)
for AI-powered task generation.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text content from PDF file.

    Args:
        file_path: Path to the PDF file

    Returns:
        Extracted text content

    Raises:
        Exception: If text extraction fails
    """
    try:
        import pdfplumber

        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"--- Page {page_num} ---\n{page_text}")

        extracted_text = "\n\n".join(text_parts)
        logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF: {file_path}")
        return extracted_text

    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
        raise Exception(f"PDF text extraction failed: {str(e)}")


async def extract_text_from_pptx(file_path: str) -> str:
    """
    Extract text content from PowerPoint file.

    Args:
        file_path: Path to the PPTX file

    Returns:
        Extracted text content

    Raises:
        Exception: If text extraction fails
    """
    try:
        from pptx import Presentation

        prs = Presentation(file_path)
        text_parts = []

        for slide_num, slide in enumerate(prs.slides, start=1):
            slide_text_parts = []

            # Extract text from all shapes (text boxes, titles, etc.)
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    slide_text_parts.append(shape.text)

                # Extract text from tables
                if shape.has_table:
                    for row in shape.table.rows:
                        row_text = " | ".join(cell.text for cell in row.cells if cell.text)
                        if row_text:
                            slide_text_parts.append(row_text)

            if slide_text_parts:
                slide_text = "\n".join(slide_text_parts)
                text_parts.append(f"--- Slide {slide_num} ---\n{slide_text}")

        extracted_text = "\n\n".join(text_parts)
        logger.info(f"Successfully extracted {len(extracted_text)} characters from PPTX: {file_path}")
        return extracted_text

    except Exception as e:
        logger.error(f"Failed to extract text from PPTX {file_path}: {str(e)}")
        raise Exception(f"PPTX text extraction failed: {str(e)}")


async def extract_text_from_docx(file_path: str) -> str:
    """
    Extract text content from Word document.

    Args:
        file_path: Path to the DOCX file

    Returns:
        Extracted text content

    Raises:
        Exception: If text extraction fails
    """
    try:
        from docx import Document

        doc = Document(file_path)
        text_parts = []

        # Extract paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)

        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_parts.append(row_text)

        extracted_text = "\n".join(text_parts)
        logger.info(f"Successfully extracted {len(extracted_text)} characters from DOCX: {file_path}")
        return extracted_text

    except Exception as e:
        logger.error(f"Failed to extract text from DOCX {file_path}: {str(e)}")
        raise Exception(f"DOCX text extraction failed: {str(e)}")


async def process_lesson_material(
    file_path: str,
    material_type: str
) -> Optional[str]:
    """
    Process a lesson material file and extract text content.

    This is the main entry point for file processing. It determines
    the appropriate extraction method based on material type.

    Args:
        file_path: Path to the file (local or MinIO path)
        material_type: Type of material (PDF, PPTX, DOCX, etc.)

    Returns:
        Extracted text content, or None if extraction is not supported

    Raises:
        Exception: If text extraction fails for supported types
    """
    material_type = material_type.upper()

    # Only process text-extractable formats
    if material_type not in ["PDF", "PPTX", "DOCX"]:
        logger.info(f"Skipping text extraction for unsupported type: {material_type}")
        return None

    # Verify file exists
    if not Path(file_path).exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Extract based on type
    if material_type == "PDF":
        return await extract_text_from_pdf(file_path)
    elif material_type == "PPTX":
        return await extract_text_from_pptx(file_path)
    elif material_type == "DOCX":
        return await extract_text_from_docx(file_path)

    return None


async def process_multiple_materials(materials: list) -> str:
    """
    Process multiple lesson materials and combine their text content.

    Args:
        materials: List of LessonMaterial objects with use_for_ai_generation=True

    Returns:
        Combined text content from all materials
    """
    text_parts = []

    for material in materials:
        if not material.use_for_ai_generation:
            continue

        # If text already extracted, use it
        if material.extracted_text:
            text_parts.append(f"=== {material.title} ===\n{material.extracted_text}")
            continue

        # Otherwise, extract from file
        try:
            if material.file_path:
                extracted_text = await process_lesson_material(
                    material.file_path,
                    material.material_type.value
                )
                if extracted_text:
                    text_parts.append(f"=== {material.title} ===\n{extracted_text}")
        except Exception as e:
            logger.warning(f"Failed to process material {material.id}: {str(e)}")
            continue

    combined_text = "\n\n".join(text_parts)
    logger.info(f"Combined {len(materials)} materials into {len(combined_text)} characters")
    return combined_text

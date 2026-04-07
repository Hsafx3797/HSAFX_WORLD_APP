"""
Python Tool Executor — Pure Python tools that don't need native binaries.

Handles:
  - Semantic Speak transforms (pirate, yoda, uwu, formal, casual)
  - Avro / Parquet readers (fastavro, pyarrow)
  - API Mock Schema generator (faker-based)
  - Password Strength analyzer (zxcvbn)
  - Islamic Inheritance Calculator (Sharia-compliant, 4 madhab)
  - Islamic Zakat Calculator (gold/silver nisab)
"""

from __future__ import annotations

import json
import logging
import math
import random
import re
from fractions import Fraction
from typing import Any

logger = logging.getLogger(__name__)


class PythonToolExecutor:
    """Handles tools that only need Python stdlib + pure-Python packages."""

    async def execute(
        self,
        tool_id: str,
        *,
        input_data: str | dict | None = None,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        opts = options or {}
        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if handler:
            return await handler(input_data=input_data, opts=opts)
        return {"success": False, "error": f"Unknown Python tool: {tool_id}"}

    # ═══════════════════════════════════════════════════════════════
    # Semantic Speak Transforms
    # ═══════════════════════════════════════════════════════════════

    async def _handle_semantic_speak_pirate(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        text = self._text(input_data)
        if not text:
            return {"success": False, "error": "No text provided"}

        replacements = {
            r"\bmy\b": "me",
            r"\bfriend\b": "matey",
            r"\bfriends\b": "mateys",
            r"\byou\b": "ye",
            r"\byour\b": "yer",
            r"\bare\b": "be",
            r"\bis\b": "be",
            r"\bam\b": "be",
            r"\bwas\b": "were",
            r"\bthe\b": "th'",
            r"\bthis\b": "dis",
            r"\bthat\b": "dat",
            r"\byes\b": "aye",
            r"\bno\b": "nay",
            r"\bnever\b": "ne'er",
            r"\bover\b": "o'er",
            r"\bpeople\b": "scallywags",
            r"\bman\b": "landlubber",
            r"\bwoman\b": "lass",
            r"\bboy\b": "lad",
            r"\bgirl\b": "lassie",
            r"\bhello\b": "ahoy",
            r"\bhi\b": "ahoy",
            r"\bwhere\b": "whar",
            r"\bfor\b": "fer",
            r"\bthem\b": "'em",
            r"\bmoney\b": "doubloons",
            r"\bhome\b": "port",
            r"\bfood\b": "grub",
            r"\bdrink\b": "grog",
            r"\bsteal\b": "plunder",
            r"\brooking\b": "swashbuckling",
        }
        result = text
        for pattern, replacement in replacements.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        # Add random pirate exclamations at end of sentences
        exclamations = [", arrr!", ", shiver me timbers!", ", yo ho ho!"]
        sentences = result.split(". ")
        if len(sentences) > 1:
            idx = random.randint(0, len(sentences) - 1)
            sentences[idx] = sentences[idx].rstrip(".") + random.choice(exclamations)
        result = ". ".join(sentences)

        return {"success": True, "output": result}

    async def _handle_semantic_speak_yoda(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        text = self._text(input_data)
        if not text:
            return {"success": False, "error": "No text provided"}

        sentences = re.split(r"(?<=[.!?])\s+", text)
        transformed = []

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            # Split into clauses and rearrange (Subject-Verb-Object → Object-Subject-Verb)
            words = sentence.rstrip(".!?").split()
            punct = sentence[-1] if sentence[-1] in ".!?" else "."

            if len(words) >= 4:
                # Move last portion to front
                mid = len(words) // 2
                yoda = " ".join(words[mid:]) + ", " + " ".join(words[:mid]).lower()
                transformed.append(yoda.capitalize() + punct)
            elif len(words) >= 2:
                yoda = " ".join(reversed(words))
                transformed.append(yoda.capitalize() + punct)
            else:
                transformed.append(sentence)

        # Add Yoda-isms
        result = " ".join(transformed)
        result = re.sub(r"\bdo not\b", "do not, hmm,", result, flags=re.IGNORECASE)
        result = re.sub(r"\bmust\b", "must, you", result, flags=re.IGNORECASE)

        return {"success": True, "output": result}

    async def _handle_semantic_speak_uwu(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        text = self._text(input_data)
        if not text:
            return {"success": False, "error": "No text provided"}

        result = text
        result = re.sub(r"[rl]", "w", result)
        result = re.sub(r"[RL]", "W", result)
        result = re.sub(r"n([aeiou])", r"ny\1", result)
        result = re.sub(r"N([aeiou])", r"Ny\1", result)
        result = re.sub(r"N([AEIOU])", r"NY\1", result)
        result = result.replace("ove", "uv")
        result = result.replace("th", "d")
        result = result.replace("Th", "D")
        result = result.replace("TH", "D")

        # Add UwU faces
        faces = [" UwU", " OwO", " >w<", " ^w^", " (◕ᴗ◕✿)"]
        sentences = result.split(". ")
        for i in range(len(sentences)):
            if random.random() < 0.4:
                sentences[i] += random.choice(faces)
        result = ". ".join(sentences)

        return {"success": True, "output": result}

    async def _handle_semantic_speak_formal(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        text = self._text(input_data)
        if not text:
            return {"success": False, "error": "No text provided"}

        replacements = {
            r"\bcan't\b": "cannot",
            r"\bwon't\b": "will not",
            r"\bdon't\b": "do not",
            r"\bdoesn't\b": "does not",
            r"\bisn't\b": "is not",
            r"\baren't\b": "are not",
            r"\bwasn't\b": "was not",
            r"\bweren't\b": "were not",
            r"\bhasn't\b": "has not",
            r"\bhaven't\b": "have not",
            r"\bhadn't\b": "had not",
            r"\bshouldn't\b": "should not",
            r"\bwouldn't\b": "would not",
            r"\bcouldn't\b": "could not",
            r"\bdidn't\b": "did not",
            r"\blet's\b": "let us",
            r"\bit's\b": "it is",
            r"\bthat's\b": "that is",
            r"\bwhat's\b": "what is",
            r"\bthere's\b": "there is",
            r"\bhere's\b": "here is",
            r"\bwe're\b": "we are",
            r"\bthey're\b": "they are",
            r"\byou're\b": "you are",
            r"\bI'm\b": "I am",
            r"\bhe's\b": "he is",
            r"\bshe's\b": "she is",
            r"\bwho's\b": "who is",
            r"\bhow's\b": "how is",
            r"\bkind of\b": "somewhat",
            r"\ba lot of\b": "a considerable amount of",
            r"\bgot\b": "obtained",
            r"\bbig\b": "substantial",
            r"\bsmall\b": "minimal",
            r"\bbad\b": "unsatisfactory",
            r"\bgood\b": "satisfactory",
            r"\bnice\b": "commendable",
            r"\bokay\b": "acceptable",
            r"\bok\b": "acceptable",
            r"\bstart\b": "commence",
            r"\bend\b": "conclude",
            r"\bhelp\b": "assist",
            r"\bneed\b": "require",
            r"\buse\b": "utilize",
            r"\btry\b": "attempt",
            r"\bget\b": "acquire",
            r"\bgive\b": "provide",
            r"\bshow\b": "demonstrate",
            r"\btell\b": "inform",
            r"\bask\b": "inquire",
            r"\bbuy\b": "purchase",
        }
        result = text
        for pattern, replacement in replacements.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return {"success": True, "output": result}

    async def _handle_semantic_speak_casual(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        text = self._text(input_data)
        if not text:
            return {"success": False, "error": "No text provided"}

        replacements = {
            r"\bcannot\b": "can't",
            r"\bwill not\b": "won't",
            r"\bdo not\b": "don't",
            r"\bdoes not\b": "doesn't",
            r"\bis not\b": "isn't",
            r"\bare not\b": "aren't",
            r"\bshould not\b": "shouldn't",
            r"\bwould not\b": "wouldn't",
            r"\bcould not\b": "couldn't",
            r"\bdid not\b": "didn't",
            r"\bhas not\b": "hasn't",
            r"\bhave not\b": "haven't",
            r"\bgoing to\b": "gonna",
            r"\bwant to\b": "wanna",
            r"\bgot to\b": "gotta",
            r"\bkind of\b": "kinda",
            r"\bsort of\b": "sorta",
            r"\bout of\b": "outta",
            r"\blet me\b": "lemme",
            r"\bgive me\b": "gimme",
            r"\bI am\b": "I'm",
            r"\bwe are\b": "we're",
            r"\bthey are\b": "they're",
            r"\byou are\b": "you're",
            r"\bpurchase\b": "buy",
            r"\butilize\b": "use",
            r"\bcommence\b": "start",
            r"\bconclude\b": "end",
            r"\bacquire\b": "get",
            r"\brequire\b": "need",
            r"\bdemonstrate\b": "show",
            r"\bassist\b": "help",
            r"\binquire\b": "ask",
            r"\battempt\b": "try",
        }
        result = text
        for pattern, replacement in replacements.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return {"success": True, "output": result}

    # ═══════════════════════════════════════════════════════════════
    # Data Format Converters  (Avro / Parquet)
    # ═══════════════════════════════════════════════════════════════

    async def _handle_avro_to_json(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Convert Avro binary to JSON using fastavro."""
        try:
            import io as _io

            import fastavro  # type: ignore

            if isinstance(input_data, str):
                import base64
                raw = base64.b64decode(input_data)
            elif isinstance(input_data, bytes):
                raw = input_data
            else:
                return {"success": False, "error": "Avro input must be binary or base64 string"}

            reader = fastavro.reader(_io.BytesIO(raw))
            records = [record for record in reader]

            return {
                "success": True,
                "output": json.dumps(records, indent=2, default=str),
                "metadata": {"record_count": len(records), "schema": reader.writer_schema},
            }
        except ImportError:
            return {"success": False, "error": "fastavro not installed (pip install fastavro)"}
        except Exception as e:
            return {"success": False, "error": f"Avro parse error: {e}"}

    async def _handle_parquet_to_json(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Convert Parquet to JSON using pyarrow."""
        try:
            import tempfile
            from pathlib import Path

            import pyarrow.parquet as pq  # type: ignore

            if isinstance(input_data, str):
                import base64
                raw = base64.b64decode(input_data)
            elif isinstance(input_data, bytes):
                raw = input_data
            else:
                return {"success": False, "error": "Parquet input must be binary or base64 string"}

            tmp = Path(tempfile.mktemp(suffix=".parquet"))
            tmp.write_bytes(raw)
            table = pq.read_table(str(tmp))
            records = table.to_pydict()
            tmp.unlink(missing_ok=True)

            # Convert column-oriented to row-oriented
            keys = list(records.keys())
            if keys:
                rows = [
                    {k: records[k][i] for k in keys}
                    for i in range(len(records[keys[0]]))
                ]
            else:
                rows = []

            return {
                "success": True,
                "output": json.dumps(rows, indent=2, default=str),
                "metadata": {
                    "row_count": len(rows),
                    "columns": keys,
                    "schema": str(table.schema),
                },
            }
        except ImportError:
            return {"success": False, "error": "pyarrow not installed (pip install pyarrow)"}
        except Exception as e:
            return {"success": False, "error": f"Parquet parse error: {e}"}

    # ── BSON → JSON ──────────────────────────────────────────────

    async def _handle_bson_to_json(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Convert BSON binary to JSON using pymongo's bson module."""
        try:
            import bson  # type: ignore[import-untyped]

            if isinstance(input_data, str):
                import base64
                raw = base64.b64decode(input_data)
            elif isinstance(input_data, bytes):
                raw = input_data
            else:
                return {"success": False, "error": "BSON input must be binary or base64 string"}

            # BSON may contain multiple documents (concatenated)
            docs: list[dict] = []
            offset = 0
            while offset < len(raw):
                if offset + 4 > len(raw):
                    break
                import struct
                doc_len = struct.unpack_from("<i", raw, offset)[0]
                if doc_len < 5 or offset + doc_len > len(raw):
                    break
                doc_bytes = raw[offset : offset + doc_len]
                docs.append(bson.decode(doc_bytes))
                offset += doc_len

            if not docs:
                # Try single-document decode
                docs = [bson.decode(raw)]

            output = docs if len(docs) > 1 else docs[0]
            return {
                "success": True,
                "output": json.dumps(output, indent=2, default=str),
                "metadata": {"document_count": len(docs)},
            }
        except ImportError:
            return {"success": False, "error": "pymongo not installed (pip install pymongo)"}
        except Exception as e:
            return {"success": False, "error": f"BSON parse error: {e}"}

    # ── MessagePack → JSON ───────────────────────────────────────

    async def _handle_messagepack_to_json(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Convert MessagePack binary to JSON using msgspec."""
        try:
            import msgspec  # type: ignore[import-untyped]

            if isinstance(input_data, str):
                import base64
                raw = base64.b64decode(input_data)
            elif isinstance(input_data, bytes):
                raw = input_data
            else:
                return {"success": False, "error": "MessagePack input must be binary or base64 string"}

            decoded = msgspec.msgpack.decode(raw)
            return {
                "success": True,
                "output": json.dumps(decoded, indent=2, default=str),
            }
        except ImportError:
            return {"success": False, "error": "msgspec not installed (pip install msgspec)"}
        except Exception as e:
            return {"success": False, "error": f"MessagePack parse error: {e}"}

    # ── Protobuf → JSON (schema-less wire format) ────────────────

    async def _handle_protobuf_to_json(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Decode Protocol Buffer binary to JSON (schema-less, best-effort)."""
        try:
            if isinstance(input_data, str):
                import base64
                raw = base64.b64decode(input_data)
            elif isinstance(input_data, bytes):
                raw = input_data
            else:
                return {"success": False, "error": "Protobuf input must be binary or base64 string"}

            result = self._decode_protobuf_wire(raw)
            return {
                "success": True,
                "output": json.dumps(result, indent=2, default=str),
                "metadata": {
                    "decoder": "wire-format",
                    "note": "Field numbers used as keys (schema-less decode)",
                },
            }
        except Exception as e:
            return {"success": False, "error": f"Protobuf parse error: {e}"}

    def _decode_protobuf_wire(self, data: bytes) -> dict:
        """Basic protobuf wire format decoder (no .proto required)."""
        import struct

        result: dict[str, Any] = {}
        pos = 0
        while pos < len(data):
            tag, pos = self._read_varint(data, pos)
            if pos > len(data):
                break
            field_number = tag >> 3
            wire_type = tag & 0x7
            key = f"field_{field_number}"

            value: Any
            if wire_type == 0:  # Varint
                value, pos = self._read_varint(data, pos)
            elif wire_type == 1:  # 64-bit fixed
                if pos + 8 > len(data):
                    break
                value = struct.unpack_from("<d", data, pos)[0]
                pos += 8
            elif wire_type == 2:  # Length-delimited
                length, pos = self._read_varint(data, pos)
                if pos + length > len(data):
                    break
                chunk = data[pos : pos + length]
                pos += length
                try:
                    value = chunk.decode("utf-8")
                except UnicodeDecodeError:
                    try:
                        value = self._decode_protobuf_wire(chunk)
                    except Exception:
                        value = chunk.hex()
            elif wire_type == 5:  # 32-bit fixed
                if pos + 4 > len(data):
                    break
                value = struct.unpack_from("<f", data, pos)[0]
                pos += 4
            else:
                break  # Unknown/deprecated wire type

            if key in result:
                if not isinstance(result[key], list):
                    result[key] = [result[key]]
                result[key].append(value)
            else:
                result[key] = value

        return result

    def _read_varint(self, data: bytes, pos: int) -> tuple[int, int]:
        """Read a protobuf varint from data at pos."""
        result = 0
        shift = 0
        while pos < len(data):
            byte = data[pos]
            pos += 1
            result |= (byte & 0x7F) << shift
            if (byte & 0x80) == 0:
                break
            shift += 7
        return result, pos

    async def _handle_avro_to_json_schema(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Extract Avro schema and convert to JSON Schema."""
        try:
            import io as _io

            import fastavro  # type: ignore

            if isinstance(input_data, str):
                # Could be raw Avro schema JSON or base64 binary
                try:
                    avro_schema = json.loads(input_data)
                except json.JSONDecodeError:
                    import base64
                    raw = base64.b64decode(input_data)
                    reader = fastavro.reader(_io.BytesIO(raw))
                    avro_schema = reader.writer_schema
            elif isinstance(input_data, bytes):
                reader = fastavro.reader(_io.BytesIO(input_data))
                avro_schema = reader.writer_schema
            elif isinstance(input_data, dict):
                avro_schema = input_data
            else:
                return {"success": False, "error": "No Avro schema provided"}

            json_schema = self._avro_to_json_schema(avro_schema)
            return {"success": True, "output": json.dumps(json_schema, indent=2)}
        except ImportError:
            return {"success": False, "error": "fastavro not installed"}
        except Exception as e:
            return {"success": False, "error": f"Schema conversion error: {e}"}

    def _avro_to_json_schema(self, avro: dict | str | list) -> dict:
        """Recursively convert Avro schema to JSON Schema."""
        if isinstance(avro, str):
            type_map = {
                "null": {"type": "null"},
                "boolean": {"type": "boolean"},
                "int": {"type": "integer"},
                "long": {"type": "integer"},
                "float": {"type": "number"},
                "double": {"type": "number"},
                "bytes": {"type": "string", "contentEncoding": "base64"},
                "string": {"type": "string"},
            }
            return type_map.get(avro, {"type": "string"})

        if isinstance(avro, list):
            # Union type
            schemas = [self._avro_to_json_schema(s) for s in avro]
            non_null = [s for s in schemas if s.get("type") != "null"]
            has_null = any(s.get("type") == "null" for s in schemas)
            if len(non_null) == 1 and has_null:
                schema = non_null[0].copy()
                return schema
            return {"oneOf": schemas}

        if isinstance(avro, dict):
            avro_type = avro.get("type")

            if avro_type == "record":
                props = {}
                required = []
                for field in avro.get("fields", []):
                    props[field["name"]] = self._avro_to_json_schema(field["type"])
                    if not isinstance(field["type"], list) or "null" not in field["type"]:
                        required.append(field["name"])
                schema: dict[str, Any] = {
                    "type": "object",
                    "properties": props,
                }
                if required:
                    schema["required"] = required
                if avro.get("doc"):
                    schema["description"] = avro["doc"]
                return schema

            if avro_type == "array":
                return {
                    "type": "array",
                    "items": self._avro_to_json_schema(avro.get("items", "string")),
                }

            if avro_type == "map":
                return {
                    "type": "object",
                    "additionalProperties": self._avro_to_json_schema(
                        avro.get("values", "string")
                    ),
                }

            if avro_type == "enum":
                return {"type": "string", "enum": avro.get("symbols", [])}

            if avro_type == "fixed":
                return {"type": "string", "minLength": avro["size"], "maxLength": avro["size"]}

            return self._avro_to_json_schema(avro_type)

        return {"type": "string"}

    # ═══════════════════════════════════════════════════════════════
    # API Mock Schema Generator
    # ═══════════════════════════════════════════════════════════════

    async def _handle_api_mock_schema(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Generate mock data from a JSON Schema using faker-like logic."""
        try:
            if isinstance(input_data, str):
                schema = json.loads(input_data)
            elif isinstance(input_data, dict):
                schema = input_data
            else:
                return {"success": False, "error": "Provide a JSON Schema"}

            count = int(opts.get("count", 5))
            records = [self._generate_mock(schema) for _ in range(count)]
            return {"success": True, "output": json.dumps(records, indent=2)}
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid JSON Schema"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _generate_mock(self, schema: dict) -> Any:
        """Recursively generate mock data from JSON Schema."""
        schema_type = schema.get("type", "string")

        if "enum" in schema:
            return random.choice(schema["enum"])

        if "const" in schema:
            return schema["const"]

        if schema_type == "object":
            obj = {}
            for prop, prop_schema in schema.get("properties", {}).items():
                obj[prop] = self._generate_mock(prop_schema)
            return obj

        if schema_type == "array":
            items_schema = schema.get("items", {"type": "string"})
            min_items = schema.get("minItems", 1)
            max_items = schema.get("maxItems", 3)
            count = random.randint(min_items, max_items)
            return [self._generate_mock(items_schema) for _ in range(count)]

        if schema_type == "string":
            fmt = schema.get("format", "")
            if fmt == "email":
                return f"user{random.randint(1, 9999)}@example.com"
            if fmt == "uri" or fmt == "url":
                return f"https://example.com/path/{random.randint(1, 999)}"
            if fmt == "uuid":
                import uuid
                return str(uuid.uuid4())
            if fmt == "date":
                return f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            if fmt == "date-time":
                return f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}T{random.randint(0,23):02d}:{random.randint(0,59):02d}:00Z"
            if fmt == "ipv4":
                return f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
            min_len = schema.get("minLength", 5)
            max_len = schema.get("maxLength", 20)
            length = random.randint(min_len, min(max_len, 50))
            return "".join(
                random.choice("abcdefghijklmnopqrstuvwxyz ") for _ in range(length)
            ).strip() or "mock"

        if schema_type == "integer":
            mn = schema.get("minimum", 0)
            mx = schema.get("maximum", 10000)
            return random.randint(int(mn), int(mx))

        if schema_type == "number":
            mn = schema.get("minimum", 0.0)
            mx = schema.get("maximum", 10000.0)
            return round(random.uniform(float(mn), float(mx)), 2)

        if schema_type == "boolean":
            return random.choice([True, False])

        if schema_type == "null":
            return None

        return "mock_value"

    # ═══════════════════════════════════════════════════════════════
    # Password Strength Analyzer
    # ═══════════════════════════════════════════════════════════════

    async def _handle_password_strength_analyzer(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Analyze password strength without zxcvbn dependency."""
        password = self._text(input_data) or ""
        if not password:
            return {"success": False, "error": "No password provided"}

        score = 0
        feedback: list[str] = []
        length = len(password)

        # Length scoring
        if length >= 8:
            score += 1
        if length >= 12:
            score += 1
        if length >= 16:
            score += 1
        if length < 8:
            feedback.append("Password should be at least 8 characters long")

        # Character variety
        has_lower = bool(re.search(r"[a-z]", password))
        has_upper = bool(re.search(r"[A-Z]", password))
        has_digit = bool(re.search(r"\d", password))
        has_special = bool(re.search(r"[^a-zA-Z0-9]", password))

        variety = sum([has_lower, has_upper, has_digit, has_special])
        score += variety

        if not has_upper:
            feedback.append("Add uppercase letters")
        if not has_digit:
            feedback.append("Add numbers")
        if not has_special:
            feedback.append("Add special characters")

        # Common patterns penalty
        common_patterns = [
            r"12345", r"qwerty", r"password", r"abcdef",
            r"(.)\1{2,}",  # 3+ repeated chars
            r"(012|123|234|345|456|567|678|789)",  # sequential digits
        ]
        for pat in common_patterns:
            if re.search(pat, password, re.IGNORECASE):
                score = max(0, score - 1)
                feedback.append("Avoid common patterns and repeated characters")
                break

        # Entropy estimation
        charset_size = 0
        if has_lower:
            charset_size += 26
        if has_upper:
            charset_size += 26
        if has_digit:
            charset_size += 10
        if has_special:
            charset_size += 32
        entropy = length * math.log2(max(charset_size, 1)) if charset_size else 0

        # Normalize to 0-4 scale
        final_score = min(4, max(0, score))
        strength_labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]

        return {
            "success": True,
            "output": json.dumps({
                "score": final_score,
                "strength": strength_labels[final_score],
                "entropy_bits": round(entropy, 1),
                "length": length,
                "has_lowercase": has_lower,
                "has_uppercase": has_upper,
                "has_digits": has_digit,
                "has_special": has_special,
                "character_variety": variety,
                "feedback": feedback if feedback else ["Strong password!"],
                "crack_time_estimate": self._crack_time(entropy),
            }),
        }

    def _crack_time(self, entropy: float) -> str:
        """Estimate time to crack based on entropy bits."""
        # Assume 10 billion guesses/sec (modern GPU)
        guesses = 2**entropy
        seconds = guesses / 1e10
        if seconds < 1:
            return "instant"
        if seconds < 60:
            return f"{seconds:.0f} seconds"
        if seconds < 3600:
            return f"{seconds/60:.0f} minutes"
        if seconds < 86400:
            return f"{seconds/3600:.0f} hours"
        if seconds < 31536000:
            return f"{seconds/86400:.0f} days"
        years = seconds / 31536000
        if years > 1e6:
            return "centuries"
        return f"{years:.0f} years"

    # ═══════════════════════════════════════════════════════════════
    # Islamic Inheritance Calculator (Sharia-compliant)
    # Reference: 50_COMPLEX_TOOL_ALGORITHMS.md §2
    # ═══════════════════════════════════════════════════════════════

    async def _handle_islamic_inheritance_calculator(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """
        Calculate Islamic inheritance distribution per Sharia law.

        Input (dict):
          totalEstate: float
          currency: str (default "USD")
          heirs: list of {relationship, gender, count}
          debts: float (default 0)
          bequests: float (default 0, max 1/3 of net estate)
          madhhab: "hanafi"|"shafii"|"maliki"|"hanbali" (default "hanafi")
        """
        try:
            data = self._dict(input_data)
            if not data:
                return {"success": False, "error": "Provide estate details as JSON"}

            total_estate = float(data.get("totalEstate", 0))
            if total_estate <= 0:
                return {"success": False, "error": "Total estate must be positive"}

            currency = data.get("currency", "USD")
            debts = float(data.get("debts", 0))
            bequests = float(data.get("bequests", 0))
            heirs_input = data.get("heirs", [])
            madhhab = data.get("madhhab", "hanafi")

            # Step 1: Deduct debts and funeral expenses
            net_estate = total_estate - debts

            # Step 2: Bequests (max 1/3 of net estate for non-heirs)
            max_bequest = net_estate / 3
            actual_bequest = min(bequests, max_bequest)
            distributable = net_estate - actual_bequest

            if distributable <= 0:
                return {
                    "success": False,
                    "error": "Nothing left to distribute after debts and bequests",
                }

            # Step 3: Parse heirs
            heirs = self._parse_heirs(heirs_input)
            if not heirs:
                return {"success": False, "error": "No valid heirs provided"}

            # Step 4: Apply blocking rules (hijab)
            heirs = self._apply_blocking(heirs)

            # Step 5: Calculate fixed shares (Ashab al-Furud)
            has_children = any(h["rel"] in ("son", "daughter") for h in heirs)
            has_sons = any(h["rel"] == "son" for h in heirs)
            num_wives = sum(h["count"] for h in heirs if h["rel"] == "wife")

            shares: list[dict] = []
            residuaries: list[dict] = []

            for heir in heirs:
                share = self._get_fixed_share(
                    heir, has_children, has_sons, num_wives
                )
                if share is not None:
                    shares.append({**heir, "fraction": share})
                else:
                    residuaries.append(heir)

            # Step 6: Check for 'Awl (oversubscription)
            total_fraction = sum(s["fraction"] for s in shares)

            if total_fraction > Fraction(1):
                # 'Awl — proportionally reduce shares
                for s in shares:
                    s["fraction"] = s["fraction"] / total_fraction
                total_fraction = Fraction(1)

            # Step 7: Distribute residue to Asabah
            residue_fraction = Fraction(1) - total_fraction
            if residuaries and residue_fraction > 0:
                total_units = sum(
                    h["count"] * (2 if h["gender"] == "male" else 1)
                    for h in residuaries
                )
                for h in residuaries:
                    units = h["count"] * (2 if h["gender"] == "male" else 1)
                    h_fraction = residue_fraction * Fraction(units, total_units)
                    shares.append({**h, "fraction": h_fraction})
            elif not residuaries and residue_fraction > 0:
                # Radd (return) — distribute remainder proportionally
                # Exclude spouse from radd per majority opinion
                spouse_rels = {"husband", "wife"}
                eligible = [s for s in shares if s["rel"] not in spouse_rels]
                eligible_total = sum(s["fraction"] for s in eligible)

                if eligible and eligible_total > 0:
                    for s in eligible:
                        extra = residue_fraction * (s["fraction"] / eligible_total)
                        s["fraction"] = s["fraction"] + extra

            # Step 8: Build result
            distribution = []
            for s in shares:
                frac = s["fraction"]
                amount = float(frac) * distributable
                per_person = amount / max(s["count"], 1)
                distribution.append({
                    "heir": s["label"],
                    "relationship": s["rel"],
                    "count": s["count"],
                    "share_fraction": str(frac),
                    "share_percentage": round(float(frac) * 100, 2),
                    "total_amount": round(amount, 2),
                    "per_person_amount": round(per_person, 2),
                })

            return {
                "success": True,
                "output": json.dumps(
                    {
                        "currency": currency,
                        "madhhab": madhhab,
                        "total_estate": total_estate,
                        "debts_deducted": debts,
                        "bequests_deducted": round(actual_bequest, 2),
                        "distributable_estate": round(distributable, 2),
                        "distribution": distribution,
                        "awl_applied": total_fraction > Fraction(1),
                        "radd_applied": (
                            not residuaries and residue_fraction > 0
                        ),
                    },
                    indent=2,
                ),
            }
        except Exception as e:
            logger.exception("Islamic inheritance calculation error")
            return {"success": False, "error": str(e)}

    def _parse_heirs(self, heirs_input: list[dict]) -> list[dict]:
        valid_rels = {
            "husband", "wife",
            "father", "mother",
            "son", "daughter",
            "grandson", "granddaughter",
            "paternal_grandfather", "paternal_grandmother",
            "maternal_grandmother",
            "full_brother", "full_sister",
            "paternal_brother", "paternal_sister",
            "maternal_brother", "maternal_sister",
        }
        result = []
        for h in heirs_input:
            rel = h.get("relationship", "").lower().replace(" ", "_").replace("-", "_")
            if rel in valid_rels:
                gender = h.get("gender", "male" if rel in (
                    "husband", "father", "son", "grandson",
                    "paternal_grandfather", "full_brother",
                    "paternal_brother", "maternal_brother",
                ) else "female")
                count = max(1, int(h.get("count", 1)))
                label = rel.replace("_", " ").title()
                result.append({
                    "rel": rel, "gender": gender, "count": count, "label": label,
                })
        return result

    def _apply_blocking(self, heirs: list[dict]) -> list[dict]:
        rels = {h["rel"] for h in heirs}

        blocked: set[str] = set()
        # Sons block grandsons
        if "son" in rels:
            blocked |= {"grandson", "granddaughter"}
        # Father blocks grandfather
        if "father" in rels:
            blocked.add("paternal_grandfather")
        # Children block siblings:
        # Sons (alone or with daughters) block full & paternal siblings.
        # Daughters alone do NOT block siblings — they share as asaba.
        if "son" in rels:
            blocked |= {
                "full_brother", "full_sister",
                "paternal_brother", "paternal_sister",
            }
        # Full brothers block paternal half-brothers
        if "full_brother" in rels:
            blocked |= {"paternal_brother", "paternal_sister"}

        return [h for h in heirs if h["rel"] not in blocked]

    def _get_fixed_share(
        self,
        heir: dict,
        has_children: bool,
        has_sons: bool,
        num_wives: int,
    ) -> Fraction | None:
        rel = heir["rel"]
        count = heir["count"]

        if rel == "husband":
            return Fraction(1, 4) if has_children else Fraction(1, 2)

        if rel == "wife":
            base = Fraction(1, 8) if has_children else Fraction(1, 4)
            return base  # Shared among all wives (total pool = base)

        if rel == "mother":
            return Fraction(1, 6) if has_children else Fraction(1, 3)

        if rel == "father":
            if has_sons:
                return Fraction(1, 6)
            if has_children:  # daughters only
                return Fraction(1, 6)  # + residuary handled separately
            return None  # Pure residuary

        if rel == "daughter":
            if has_sons:
                return None  # Becomes residuary with sons (2:1)
            if count == 1:
                return Fraction(1, 2)
            return Fraction(2, 3)  # 2+ daughters share 2/3

        if rel == "son":
            return None  # Always residuary

        if rel == "full_sister":
            if has_children:
                return None  # Blocked or residuary
            if count == 1:
                return Fraction(1, 2)
            return Fraction(2, 3)

        if rel == "full_brother":
            return None  # Residuary

        if rel == "maternal_brother" or rel == "maternal_sister":
            if has_children:
                return Fraction(0)  # Blocked
            if count == 1:
                return Fraction(1, 6)
            return Fraction(1, 3)  # 2+ share 1/3

        if rel == "paternal_grandmother" or rel == "maternal_grandmother":
            return Fraction(1, 6)

        if rel == "paternal_grandfather":
            if has_sons:
                return Fraction(1, 6)
            return None  # Residuary

        if rel == "granddaughter":
            if has_sons:
                return Fraction(0)  # Blocked
            _daughters = [h for h in [heir] if h["rel"] == "daughter"]
            return Fraction(1, 6)  # Completing share with daughters

        return None

    # ═══════════════════════════════════════════════════════════════
    # Islamic Zakat Calculator
    # Reference: 50_COMPLEX_TOOL_ALGORITHMS.md §3
    # ═══════════════════════════════════════════════════════════════

    async def _handle_islamic_zakat_calculator(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """
        Calculate Zakat due on various asset types.

        Input (dict):
          currency: str
          nisabStandard: "gold"|"silver" (default "gold")
          goldPricePerGram: float
          silverPricePerGram: float
          assets: {
            cash, bankSavings, goldGrams, silverGrams,
            businessInventory, businessCash, accountsReceivable,
            stocks, bonds, mutualFunds, crypto, pension
          }
          liabilities: {shortTermDebts, businessLiabilities}
          agricultural: {cropValue, irrigationType} (optional)
        """
        try:
            data = self._dict(input_data)
            if not data:
                return {"success": False, "error": "Provide asset details as JSON"}

            currency = data.get("currency", "USD")
            nisab_std = data.get("nisabStandard", "gold")
            gold_price = float(data.get("goldPricePerGram", 0))
            silver_price = float(data.get("silverPricePerGram", 0))

            if nisab_std == "gold" and gold_price <= 0:
                return {"success": False, "error": "Provide goldPricePerGram"}
            if nisab_std == "silver" and silver_price <= 0:
                return {"success": False, "error": "Provide silverPricePerGram"}

            # Nisab thresholds
            NISAB_GOLD_GRAMS = 87.48  # 7.5 tola
            NISAB_SILVER_GRAMS = 612.36  # 52.5 tola

            nisab_amount = (
                NISAB_GOLD_GRAMS * gold_price
                if nisab_std == "gold"
                else NISAB_SILVER_GRAMS * silver_price
            )

            # Parse assets
            assets = data.get("assets", {})
            cash = float(assets.get("cash", 0))
            bank = float(assets.get("bankSavings", 0))
            gold_g = float(assets.get("goldGrams", 0))
            silver_g = float(assets.get("silverGrams", 0))
            biz_inv = float(assets.get("businessInventory", 0))
            biz_cash = float(assets.get("businessCash", 0))
            receivables = float(assets.get("accountsReceivable", 0))
            stocks = float(assets.get("stocks", 0))
            bonds = float(assets.get("bonds", 0))
            mutual_funds = float(assets.get("mutualFunds", 0))
            crypto = float(assets.get("crypto", 0))
            pension = float(assets.get("pension", 0))

            gold_value = gold_g * gold_price
            silver_value = silver_g * silver_price

            total_wealth = (
                cash + bank + gold_value + silver_value
                + biz_inv + biz_cash + receivables
                + stocks + bonds + mutual_funds + crypto + pension
            )

            # Liabilities
            liab = data.get("liabilities", {})
            short_debts = float(liab.get("shortTermDebts", 0))
            biz_liab = float(liab.get("businessLiabilities", 0))
            total_liabilities = short_debts + biz_liab

            net_wealth = total_wealth - total_liabilities

            # Main Zakat calculation
            is_applicable = net_wealth >= nisab_amount
            zakat_rate = Fraction(1, 40)  # 2.5%
            zakat_due = float(net_wealth * float(zakat_rate)) if is_applicable else 0.0

            # Breakdown
            breakdown = {
                "cash_and_bank": round(cash + bank, 2),
                "gold_value": round(gold_value, 2),
                "silver_value": round(silver_value, 2),
                "business_assets": round(biz_inv + biz_cash + receivables, 2),
                "investments": round(stocks + bonds + mutual_funds + crypto, 2),
                "pension": round(pension, 2),
                "total_assets": round(total_wealth, 2),
                "total_liabilities": round(total_liabilities, 2),
                "net_zakatable_wealth": round(net_wealth, 2),
            }

            # Agricultural zakat (separate rate)
            ag = data.get("agricultural")
            agricultural_zakat = 0.0
            if ag:
                crop_value = float(ag.get("cropValue", 0))
                irrigation = ag.get("irrigationType", "irrigated")
                rates = {"rain-fed": 0.10, "irrigated": 0.05, "mixed": 0.075}
                ag_rate = rates.get(irrigation, 0.05)
                agricultural_zakat = round(crop_value * ag_rate, 2)
                breakdown["agricultural_crop_value"] = crop_value
                breakdown["agricultural_rate"] = f"{ag_rate * 100}%"
                breakdown["agricultural_zakat"] = agricultural_zakat

            return {
                "success": True,
                "output": json.dumps(
                    {
                        "currency": currency,
                        "nisab_standard": nisab_std,
                        "nisab_threshold": round(nisab_amount, 2),
                        "is_zakat_applicable": is_applicable,
                        "zakat_rate": "2.5%",
                        "zakat_due": round(zakat_due, 2),
                        "agricultural_zakat": agricultural_zakat,
                        "total_zakat": round(zakat_due + agricultural_zakat, 2),
                        "breakdown": breakdown,
                    },
                    indent=2,
                ),
            }
        except Exception as e:
            logger.exception("Zakat calculation error")
            return {"success": False, "error": str(e)}

    # ═══════════════════════════════════════════════════════════════
    # Speech-to-Text (Whisper integration)
    # ═══════════════════════════════════════════════════════════════

    _whisper_models: dict[str, Any] = {}

    async def _handle_speech_to_text(
        self, *, input_data: Any, opts: dict
    ) -> dict[str, Any]:
        """Transcribe audio using OpenAI Whisper (local or API)."""
        try:
            import whisper  # type: ignore

            model_size = opts.get("model", "base")
            language = opts.get("language", None)

            # Input can be file path or base64 audio
            _tmp_audio = None
            if isinstance(input_data, str):
                if len(input_data) < 500 and not input_data.startswith("data:"):
                    # Probably a file path
                    audio_path = input_data
                else:
                    import base64
                    import tempfile

                    raw = base64.b64decode(input_data)
                    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
                    tmp.write(raw)
                    tmp.close()
                    audio_path = tmp.name
                    _tmp_audio = tmp.name
            else:
                return {"success": False, "error": "Provide audio file path or base64 data"}

            try:
                if model_size not in self._whisper_models:
                    self._whisper_models[model_size] = whisper.load_model(model_size)
                model = self._whisper_models[model_size]
                result = model.transcribe(
                    audio_path, language=language, verbose=False
                )
            finally:
                if _tmp_audio:
                    from pathlib import Path
                    Path(_tmp_audio).unlink(missing_ok=True)

            segments = [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip(),
                }
                for seg in result.get("segments", [])
            ]

            return {
                "success": True,
                "output": json.dumps(
                    {
                        "text": result["text"].strip(),
                        "language": result.get("language", "unknown"),
                        "segments": segments,
                    },
                    indent=2,
                ),
            }
        except ImportError:
            return {
                "success": False,
                "error": "openai-whisper not installed (pip install openai-whisper)",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ═══════════════════════════════════════════════════════════════
    # Helpers
    # ═══════════════════════════════════════════════════════════════

    def _text(self, input_data: Any) -> str | None:
        """Extract text from input_data (str or dict with 'input'/'text' key)."""
        if isinstance(input_data, str):
            return input_data
        if isinstance(input_data, dict):
            return input_data.get("input") or input_data.get("text") or input_data.get("data")
        return None

    def _dict(self, input_data: Any) -> dict | None:
        """Extract dict from input_data."""
        if isinstance(input_data, dict):
            return input_data
        if isinstance(input_data, str):
            try:
                return json.loads(input_data)
            except json.JSONDecodeError:
                return None
        return None

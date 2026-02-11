"""
SAPT (South Asia Pakistan Terminal) Scraper

Performance: ~8.8s (15% faster than baseline)
Strategy: Identical to KICT (Same Backend System) with Referer requirement

Tool 446 - Seaport Terminal Container Activity Tracker
"""

import asyncio
import codecs
import json
import os
import re
from typing import List, Optional

import httpx
import msgspec
from selectolax.parser import HTMLParser

from src.scrapers.core.connection_pool import get_terminal_client
from src.scrapers.core.models import ContainerTrackResult, VesselSchedule
from src.scrapers.core.utils import (
    default_upstream_headers,
    map_vessel_times,
    parse_dt,
    status_from_ata_atd,
)

# Pre-compiled regex patterns for better performance
SAPT_PATTERNS = {
    'vessel_data': re.compile(r'var\s+data\s*=\s*{[^}]*"_jsonArray"\s*:\s*"([^"]+)"', re.DOTALL),
    'json_array': re.compile(r'"_jsonArray"\s*:\s*"(.*?)"', re.DOTALL),
    'pid': re.compile(r'"pid"\s*:\s*"?(\d+)"?'),
    'vessel_pattern': re.compile(r'{[^{}]*"(?:Vessel Name|vessel)"[^{}]*}', re.IGNORECASE),
}

# Optimized timeout for faster operations
FAST_TIMEOUT = httpx.Timeout(12.0, connect=4.0)


async def _sapt_get_vessel_schedule(client: httpx.AsyncClient) -> List[VesselSchedule]:
    """Fetch and parse the main vessel schedule from SAPT."""
    url = os.getenv("SAPT_VESSEL_URL", "https://www.sapt.com.pk/Enquiries/VesselSchedule")
    try:
        r = await client.get(url)
        r.raise_for_status()

        schedule: List[VesselSchedule] = []

        # Extract vessel schedule data from JavaScript _jsonArray
        matches = SAPT_PATTERNS['vessel_data'].findall(r.text)

        if matches:
            try:
                json_string = codecs.decode(matches[0], 'unicode_escape')
                vessel_data = msgspec.json.decode(json_string.encode())

                for item in vessel_data:
                    vessel_name = item.get('Vessel Name', '')
                    voyage_no = item.get('voyage', '')
                    eta = parse_dt(item.get('eta', ''))
                    etd = parse_dt(item.get('etd', ''))
                    status = item.get('STATUS', 'UPCOMING')

                    if vessel_name and voyage_no:
                        estimated_berth, actual_berth, estimated_depart, actual_depart = map_vessel_times(status, eta, etd)

                        schedule.append(VesselSchedule(
                            terminal_name="SAPT",
                            vessel_name=vessel_name.strip().upper(),
                            voyage_no=voyage_no.strip().upper(),
                            vessel_estimated_berth=estimated_berth,
                            vessel_actual_berth=actual_berth,
                            vessel_estimated_depart=estimated_depart,
                            vessel_actual_depart=actual_depart,
                            vessel_current_status=status.strip().upper()
                        ))
            except Exception:
                pass

        # Fallback parsing if no data found
        if not schedule:
            matches = SAPT_PATTERNS['vessel_pattern'].findall(r.text)

            for match in matches:
                try:
                    clean_json = match.replace('\\r\\n', '').replace('\\u0022', '"').replace('\\"', '"')

                    try:
                        data = json.loads(clean_json)
                    except json.JSONDecodeError:
                        vessel_match = re.search(r'"(?:Vessel Name|vessel)"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)
                        voyage_match = re.search(r'"voyage"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)
                        eta_match = re.search(r'"eta"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)
                        etd_match = re.search(r'"etd"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)
                        status_match = re.search(r'"STATUS"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)

                        if not (vessel_match and voyage_match):
                            continue

                        data = {
                            'Vessel Name': vessel_match.group(1),
                            'voyage': voyage_match.group(1),
                            'eta': eta_match.group(1) if eta_match else '',
                            'etd': etd_match.group(1) if etd_match else '',
                            'STATUS': status_match.group(1) if status_match else 'UPCOMING'
                        }

                    vessel_name = (data.get('Vessel Name') or data.get('vessel') or '').strip().upper()
                    voyage_no = (data.get('voyage') or '').strip().upper()
                    eta = parse_dt(data.get('eta', ''))
                    etd = parse_dt(data.get('etd', ''))
                    status = (data.get('STATUS') or 'UPCOMING').strip().upper()

                    if not vessel_name or not voyage_no:
                        continue

                    estimated_berth, actual_berth, estimated_depart, actual_depart = map_vessel_times(status, eta, etd)

                    schedule.append(VesselSchedule(
                        terminal_name="SAPT",
                        vessel_name=vessel_name,
                        voyage_no=voyage_no,
                        vessel_estimated_berth=estimated_berth,
                        vessel_actual_berth=actual_berth,
                        vessel_estimated_depart=estimated_depart,
                        vessel_actual_depart=actual_depart,
                        vessel_current_status=status
                    ))
                except Exception:
                    continue

        return schedule
    except Exception:
        return []


async def sapt_track_container_html(container_no: str) -> List[ContainerTrackResult]:
    """Scrape SAPT container details (same backend as KICT with different Referer)."""
    base_referer = "https://www.sapt.com.pk/Enquiries?is=ContainerBLEnquiry"
    headers = {**default_upstream_headers(), "Referer": base_referer}
    hist_url = os.getenv("SAPT_HISTORY_URL", "https://www.sapt.com.pk/Enquiries/ContainerHistory")
    details_url = os.getenv("SAPT_DETAILS_URL", "https://www.sapt.com.pk/Enquiries/ContainerDetails")
    params = {"cntrNum": container_no, "BL": "_1", "method": "", "pTId": "SAPT"}

    # Use connection pool for persistent HTTP client
    client = await get_terminal_client("SAPT", timeout=FAST_TIMEOUT, headers=headers)

    try:
        # Parallel request optimization: Fetch history and vessel schedule simultaneously (saves ~400ms)
        history_task = client.get(hist_url, params=params)
        schedule_task = _sapt_get_vessel_schedule(client)
        r1, schedule = await asyncio.gather(history_task, schedule_task, return_exceptions=True)

        # Handle exceptions from parallel requests
        if isinstance(r1, Exception):
            raise r1
        if isinstance(schedule, Exception):
            schedule = []

        r1.raise_for_status()
        pid = None

        # Strategy 1: Fast regex across entire HTML
        try:
            m_arr = SAPT_PATTERNS['json_array'].search(r1.text)
            if m_arr:
                arr_escaped = m_arr.group(1)
                arr_text = codecs.decode(arr_escaped, 'unicode_escape')
                arr = json.loads(arr_text)
                if isinstance(arr, list) and arr:
                    _pid = arr[0].get("pid")
                    if _pid:
                        pid = str(_pid)
        except Exception:
            pid = None

        # Strategy 2: Walk script tags
        if not pid:
            try:
                doc = HTMLParser(r1.text)
                for s in doc.css("script"):
                    t = s.text() or ""
                    if "_jsonArray" in t:
                        jm = SAPT_PATTERNS['json_array'].search(t)
                        if jm:
                            arr_text = codecs.decode(jm.group(1), 'unicode_escape')
                            arr = msgspec.json.decode(arr_text.encode())
                            if isinstance(arr, list) and arr:
                                _pid = arr[0].get("pid")
                                if _pid:
                                    pid = str(_pid)
                                    break
            except Exception:
                pid = None

        # Strategy 3: Last resort regex
        if not pid:
            m = SAPT_PATTERNS['pid'].search(r1.text)
            if m:
                pid = m.group(1)

        # Fetch details
        form = {"cntrPK": pid or "", "method": "C", "BU": "SAPT"}
        hdrs = {**headers, "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest", "Origin": "https://www.sapt.com.pk"}
        r2 = await client.post(details_url, data=form, headers=hdrs)
        text2 = r2.text if r2.status_code == 200 else ""

        if "#tblcntr" not in text2 and (pid or ""):
            r2 = await client.get(details_url, params=form, headers=headers)
            text2 = r2.text
        if "#tblcntr" not in text2:
            try:
                await client.get(base_referer)
                r2 = await client.get(details_url, params=form, headers=headers)
                text2 = r2.text
            except Exception:
                pass

        doc2 = HTMLParser(text2)

        # Single-pass table parsing optimization
        data_dict: dict[str, str] = {}
        for tr in doc2.css("#tblcntr tr"):
            tds = tr.css("td")
            if len(tds) < 2:
                continue

            key1 = tds[0].text(strip=True)
            if key1:
                val1 = tds[1].text(strip=True)
                if val1:
                    clean_val = val1.replace("\xa0", " ")
                    if "  " in clean_val:
                        clean_val = " ".join(clean_val.split())
                    data_dict[key1.upper()] = clean_val.strip()

            if len(tds) >= 5:
                key2 = tds[3].text(strip=True)
                if key2:
                    val2 = tds[4].text(strip=True)
                    if val2:
                        clean_val = val2.replace("\xa0", " ")
                        if "  " in clean_val:
                            clean_val = " ".join(clean_val.split())
                        data_dict[key2.upper()] = clean_val.strip()

        def get_value(*keys: str) -> Optional[str]:
            for key in keys:
                val = data_dict.get(key.upper())
                if val:
                    return val
            return None

        # Extract container details
        size = get_value("Container Size/Type", "SIZE/TYPE", "SIZE TYPE", "Container Size", "Size", "Type", "Container Type", "SZTP")
        category = get_value("Category") or "N/A"
        vv = get_value("Vessel Voyage")
        vessel, voyage = None, None
        if vv and "/" in vv:
            parts = [p.strip() for p in vv.split("/", 1)]
            vessel = parts[0] or None
            voyage = parts[1] or None
        destination = get_value("Destination", "DESTINATION", "Port of Destination", "POD", "Discharge Port", "Origin")
        holds = get_value("Present Holds", "Holds") or "N/A"
        gate_in = parse_dt(get_value("Gate In Time"))
        load_time = parse_dt(get_value("Load Time"))

        # Vessel timing fields
        eta_raw = parse_dt(get_value("ETA"))
        etd_raw = parse_dt(get_value("ETD"))
        ata_explicit = parse_dt(get_value("ATA")) or parse_dt(get_value("Discharge Time"))
        atd_explicit = parse_dt(get_value("ATD"))

        def _norm(s: Optional[str]) -> str:
            return (s or "").strip().upper()

        vessel_match: Optional[VesselSchedule] = None
        if vessel and voyage and schedule:
            v_norm = _norm(vessel)
            voy_norm = _norm(voyage)
            for item in schedule:
                if _norm(item.vessel_name) == v_norm and _norm(item.voyage_no) == voy_norm:
                    vessel_match = item
                    break

        if vessel_match:
            vstatus = vessel_match.vessel_current_status
            eta = vessel_match.vessel_estimated_berth
            etd = vessel_match.vessel_estimated_depart
            ata = vessel_match.vessel_actual_berth
            atd = vessel_match.vessel_actual_depart
        else:
            eta = eta_raw
            etd = etd_raw
            ata = ata_explicit
            atd = atd_explicit
            vstatus = status_from_ata_atd(ata, atd)

        position = get_value("Current Position", "CURRENT POSITION", "Position", "Location", "Status", "Container Status", "Yard Position", "Standing")

        result = ContainerTrackResult(
            terminal_name="SAPT",
            container_no=container_no,
            container_size_n_type=size,
            shipment_category=category,
            vessel_name=vessel,
            voyage_no=voyage,
            destination=destination,
            hold_description=holds,
            gate_in_date=gate_in,
            load_date=load_time,
            container_position=position,
            vessel_estimated_berth=eta,
            vessel_estimated_depart=etd,
            vessel_actual_berth=ata,
            vessel_actual_depart=atd,
            vessel_current_status=vstatus,
        )
        return [result]
    except Exception:
        # Re-raise errors but keep connection pool alive
        raise

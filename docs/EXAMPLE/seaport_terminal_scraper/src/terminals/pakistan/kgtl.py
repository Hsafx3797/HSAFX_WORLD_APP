import os
from typing import List, Optional
import re
import httpx
from selectolax.parser import HTMLParser
from datetime import datetime

from src.core.utils import (
    req_timeout as _req_timeout,
    default_upstream_headers as _default_upstream_headers,
    parse_dt as _parse_dt,
    status_from_ata_atd as _status_from_ata_atd,
)
from src.core.models import ContainerTrackResult, VesselSchedule
from src.core.connection_pool import get_terminal_client

async def kgtl_track_container_html(container_no: str) -> List[ContainerTrackResult]:
    base = os.getenv("KGTL_TRACK_URL", "https://www.kgtl.com.pk/en/online-tracking")
    headers = _default_upstream_headers()
    
    # Use connection pool for persistent HTTP client (40-50% speedup via connection reuse)
    client = await get_terminal_client("KGTL", timeout=_req_timeout(), headers=headers)
    
    try:
        r1 = await client.get(base)
        r1.raise_for_status()
        html = HTMLParser(r1.text)
        def _val(id_: str) -> str:
            n = html.css_first(f"input#{id_.replace('$','_')}")
            return n.attributes.get("value", "") if n else ""
        form = {
            "header$scrptmngr": "updPnlTracking|btnSearch",
            "__EVENTTARGET": "",
            "__EVENTARGUMENT": "",
            "__LASTFOCUS": "",
            "__VIEWSTATE": _val("__VIEWSTATE"),
            "__VIEWSTATEGENERATOR": _val("__VIEWSTATEGENERATOR"),
            "__EVENTVALIDATION": _val("__EVENTVALIDATION"),
            "txtSearch": container_no,
            "radio": "rdioCon",
            "footer:$txtEmail": "",
            "__ASYNCPOST": "true",
            "btnSearch": "Search",
        }
        delta_headers = {
            **headers,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "X-MicrosoftAjax": "Delta=true",
            "Referer": base,
        }
        r2 = await client.post(base, data=form, headers=delta_headers)
        r2.raise_for_status()
        text = r2.text
        m = re.search(r"updatePanel\|updPnlTracking\|(.*?)(?:\|\d+\|updatePanel\|footer_updpnl\||$)", text, re.S)
        panel_html = m.group(1) if m else text
        doc = HTMLParser(panel_html)
        def txt(sel: str) -> Optional[str]:
            el = doc.css_first(sel)
            return (el.text(strip=True) or None) if el else None
        # Prefer equipment description explicitly over size text
        size = txt("#lblDescription") or txt("#lblSize")
        category = txt("#lblCategory")
        vessel = txt("#lblVessel")
        voyage = txt("#lblVoyage")
        destination = txt("#lblDestination") or txt("#lblPOD")
        holds = txt("#lblHolds")
        gate_in = None
        load_date = None
        grid = doc.css_first("#grdEvents")
        if grid:
            for tr in grid.css("tr"):
                tds = tr.css("td")
                if len(tds) == 2:
                    activity = (tds[0].text(strip=True) or "").upper()
                    if activity == "UNIT_IN_GATE":
                        gate_in = _parse_dt(tds[1].text(strip=True))
                    elif activity == "UNIT_LOAD":
                        load_date = _parse_dt(tds[1].text(strip=True))
        if not gate_in:
            gate_in = _parse_dt(txt("#lblGateInTime"))
        if not load_date:
            load_date = _parse_dt(txt("#lblLoadTime"))
        position = txt("#lblStatus") or txt("#lblPosition")
        eta = _parse_dt(txt("#lblETA"))
        etd = _parse_dt(txt("#lblETD"))
        ata = _parse_dt(txt("#lblATA"))
        atd = _parse_dt(txt("#lblATD"))
        if not (size or category or vessel or position or destination):
            def _rx(id_):
                m = re.search(fr"id=\"{id_}\"[^>]*>(.*?)<", panel_html, re.I|re.S)
                return (m.group(1).strip() if m else None)
            size = size or _rx("lblSize") or _rx("lblDescription")
            category = category or _rx("lblCategory")
            vessel = vessel or _rx("lblVessel")
            voyage = voyage or _rx("lblVoyage")
            destination = destination or _rx("lblDestination") or _rx("lblPOD")
            holds = holds or _rx("lblHolds")
            position = position or _rx("lblStatus") or _rx("lblPosition")
            eta = eta or _parse_dt(_rx("lblETA"))
            etd = etd or _parse_dt(_rx("lblETD"))
            ata = ata or _parse_dt(_rx("lblATA"))
            atd = atd or _parse_dt(_rx("lblATD"))
        # Compute status if possible
        vstatus = _status_from_ata_atd(ata, atd)
        return [ContainerTrackResult(
            terminal_name="KGTL",
            container_no=container_no,
            container_size_n_type=size or "",
            shipment_category=category or "",
            vessel_name=vessel or "",
            voyage_no=voyage or "",
            destination=destination or "",
            hold_description=holds or "",
            gate_in_date=gate_in,
            load_date=load_date,
            container_position=position or "",
            vessel_estimated_berth=eta,
            vessel_estimated_depart=etd,
            vessel_actual_berth=ata,
            vessel_actual_depart=atd,
            vessel_current_status=vstatus,
        )]
    except Exception:
        # Re-raise errors but keep connection pool alive for next request
        raise

async def kgtl_fetch_vessel_html(vessel_name_query: str) -> List[VesselSchedule]:
    base = os.getenv("KGTL_VESSEL_PAGE", "https://www.kgtl.com.pk/en/vessel-schedule")
    headers = _default_upstream_headers()
    
    # Use connection pool for persistent HTTP client (40-50% speedup via connection reuse)
    client = await get_terminal_client("KGTL", timeout=_req_timeout(), headers=headers)
    
    try:
        r = await client.get(base)
        r.raise_for_status()
        doc = HTMLParser(r.text)
        table = doc.css_first("#VesselScheduleGrid")
        if not table:
            for tbl in doc.css("table"):
                headers = [th.text(strip=True).lower() for th in tbl.css("th")]
                if headers and ("vessel name" in headers and "voyage" in headers):
                    table = tbl
                    break
        if not table:
            return []
        q = vessel_name_query.strip().lower()
        results: List[VesselSchedule] = []
        rows = table.css("tr")
        if not rows:
            return []
        header_cells = rows[0].css("th")
        headers = [c.text(strip=True).lower() for c in header_cells]
        def idx(name: str) -> int:
            try:
                return headers.index(name)
            except ValueError:
                return -1
        i_name = idx("vessel name")
        i_voy = idx("voyage")
        i_phase = idx("phase")
        i_ata = idx("ata")
        i_eta = idx("eta")
        i_atd = idx("atd")
        i_etd = idx("etd")
        for tr in rows[1:]:
            tds = tr.css("td")
            if not tds:
                continue
            name = (tds[i_name].text(strip=True) if 0 <= i_name < len(tds) else "") or ""
            if q and q not in name.lower():
                continue
            voy = (tds[i_voy].text(strip=True) if 0 <= i_voy < len(tds) else None) or None
            ata = _parse_dt((tds[i_ata].text(strip=True) if 0 <= i_ata < len(tds) else None))
            eta = _parse_dt((tds[i_eta].text(strip=True) if 0 <= i_eta < len(tds) else None))
            atd = _parse_dt((tds[i_atd].text(strip=True) if 0 <= i_atd < len(tds) else None))
            etd = _parse_dt((tds[i_etd].text(strip=True) if 0 <= i_etd < len(tds) else None))
            phase = (tds[i_phase].text(strip=True) if 0 <= i_phase < len(tds) else None)
            status = phase or _status_from_ata_atd(ata, atd)
            results.append(VesselSchedule(
                terminal_name="KGTL",
                vessel_name=name,
                voyage_no=voy,
                vessel_estimated_berth=eta,
                vessel_estimated_depart=etd,
                vessel_actual_berth=ata,
                vessel_actual_depart=atd,
                vessel_current_status=status,
            ))
        return results
    except Exception:
        # Re-raise errors but keep connection pool alive for next request
        raise

"""Convert the supplied Excel timetable into compact JSON consumed by the web app."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.utils.cell import range_boundaries


CLASS_ORDER = [
    "ZOP BS-3A",
    "I/1A/2026",
    "I/2A/2026",
    "I/3A/2026",
    "I/4A/2026",
    "I/5A/2026",
    "II/1A/2026",
    "II/2A/2026",
    "II/3A/2026",
    "II/4A/2026",
    "III/1A/2026",
    "III/2A/2026",
    "III/3A/2026",
    "III/4A/2026",
    "ZOP VŠ-4A",
    "TECC AB-26A",
    "SZZ-3A",
    "SZZ-4A",
    "VZOČ-10A",
]

SKIP_LABELS = {"Třída", "KURZ", "ZOP_2022"}
ROOM_LIKE = re.compile(r"^(?:\d+|6A-P\d+)$", re.IGNORECASE)
DAY_IDS = ["mon", "tue", "wed", "thu", "fri"]


def slug(value: str) -> str:
    value = value.lower().replace("/", "-")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def parse_header_date(value: object) -> str:
    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", str(value or ""))
    if not match:
        raise ValueError(f"Neplatné datum v záhlaví: {value!r}")
    day, month, year = map(int, match.groups())
    return datetime(year, month, day).date().isoformat()


def parse_week_number(value: object) -> int:
    match = re.search(r"Týden\s*:\s*(\d+)", str(value or ""), re.IGNORECASE)
    if not match:
        raise ValueError(f"Neplatné číslo týdne v záhlaví: {value!r}")
    return int(match.group(1))


def normalize_class_name(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.replace("\xa0", " ").strip()
    if not text or text in SKIP_LABELS or re.match(r"Týden\s*:", text, re.IGNORECASE):
        return None
    if ROOM_LIKE.fullmatch(text):
        return None
    return re.sub(r"\s+p\.\s*$", "", text, flags=re.IGNORECASE).strip()


def classroom_below(worksheet, row_number: int) -> str | None:
    value = worksheet.cell(row_number + 1, 1).value
    if isinstance(value, (int, float)):
        return str(int(value))
    if isinstance(value, str) and ROOM_LIKE.fullmatch(value.replace("\xa0", " ").strip()):
        return value.replace("\xa0", " ").strip()
    return None


def ordered_classes(names: set[str]) -> list[str]:
    extras = sorted(name for name in names if name not in CLASS_ORDER)
    return [name for name in CLASS_ORDER if name in names] + extras


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit(
            "Použití: extract_schedule.py INPUT.xlsx [DALŠÍ_INPUT.xlsx ...] OUTPUT.json"
        )

    sources = [Path(value) for value in sys.argv[1:-1]]
    output = Path(sys.argv[-1])
    weeks: list[dict[str, object]] = []
    seen_week_numbers: set[int] = set()
    discovered_classes: set[str] = set()
    classroom_votes: dict[str, dict[str, int]] = {}

    parsed_weeks: list[tuple] = []

    for source in sources:
        workbook = openpyxl.load_workbook(source, data_only=False)
        for worksheet in workbook.worksheets:
            week_header = worksheet.cell(1, 1).value
            if not re.search(r"Týden\s*:", str(week_header or ""), re.IGNORECASE):
                continue
            week_number = parse_week_number(week_header)
            if week_number in seen_week_numbers:
                raise ValueError(f"Týden {week_number} je ve vstupních souborech dvakrát")
            seen_week_numbers.add(week_number)
            day_columns = [
                cell.column
                for cell in worksheet[2]
                if isinstance(cell.value, str)
                and re.match(r"^(Po|Út|St|Čt|Pá)\s", cell.value.strip())
            ][:5]
            if len(day_columns) != 5:
                raise ValueError(f"List {worksheet.title}: nenalezeno všech pět dnů")

            days = []
            for day_index, column in enumerate(day_columns):
                date_iso = parse_header_date(worksheet.cell(2, column).value)
                days.append({"id": DAY_IDS[day_index], "date": date_iso})

            merge_anchors: dict[tuple[int, int], tuple[int, int]] = {}
            for merged in worksheet.merged_cells.ranges:
                min_col, min_row, max_col, _ = range_boundaries(str(merged))
                merge_anchors[(min_row, min_col)] = (min_col, max_col)

            class_rows: dict[str, int] = {}
            for cell in worksheet["A"]:
                class_name = normalize_class_name(cell.value)
                if not class_name:
                    continue
                class_rows[class_name] = cell.row
                discovered_classes.add(class_name)
                room = classroom_below(worksheet, cell.row)
                if room:
                    classroom_votes.setdefault(class_name, {})
                    classroom_votes[class_name][room] = (
                        classroom_votes[class_name].get(room, 0) + 1
                    )

            parsed_weeks.append(
                (week_number, worksheet, class_rows, merge_anchors, days, day_columns)
            )

    classes = ordered_classes(discovered_classes)
    classrooms = {
        class_name: max(votes, key=votes.get)
        for class_name, votes in classroom_votes.items()
        if votes
    }

    for week_number, worksheet, class_rows, merge_anchors, days, day_columns in parsed_weeks:
        schedules: dict[str, list[dict[str, object]]] = {
            class_name: [] for class_name in classes
        }

        for class_name in classes:
            row_number = class_rows.get(class_name)
            if not row_number:
                continue

            block_index = 0
            for cell in worksheet[row_number][1:]:
                if cell.value is None:
                    continue
                min_col, max_col = merge_anchors.get(
                    (cell.row, cell.column), (cell.column, cell.column)
                )
                day_index = max(
                    (
                        i
                        for i, start_col in enumerate(day_columns)
                        if start_col <= min_col
                    ),
                    default=-1,
                )
                if day_index < 0:
                    continue
                day_end = (
                    day_columns[day_index + 1] - 1
                    if day_index < 4
                    else worksheet.max_column
                )
                max_col = min(max_col, day_end)
                slot_start = worksheet.cell(3, min_col).value
                slot_end = worksheet.cell(3, max_col).value
                if not isinstance(slot_start, int) or not isinstance(slot_end, int):
                    continue

                block_index += 1
                block_id = (
                    f"w{week_number}-{slug(class_name)}-{DAY_IDS[day_index]}-"
                    f"{slot_start}-{slot_end}-{block_index}"
                )
                schedules[class_name].append(
                    {
                        "id": block_id,
                        "dayId": DAY_IDS[day_index],
                        "slotStart": slot_start,
                        "slotEnd": slot_end,
                        "raw": re.sub(
                            r"\s+", " ", str(cell.value).replace("\u00a0", " ")
                        ).strip(),
                    }
                )

        weeks.append(
            {
                "id": str(week_number),
                "label": f"Týden {week_number}",
                "startDate": days[0]["date"],
                "endDate": days[-1]["date"],
                "days": days,
                "schedules": schedules,
            }
        )

    payload = {
        "source": ", ".join(source.name for source in sources),
        "classes": classes,
        "classrooms": classrooms,
        "weeks": sorted(weeks, key=lambda week: int(str(week["id"]))),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    output.write_text(json_text, encoding="utf-8")
    public_output = Path(__file__).resolve().parents[1] / "public" / "schedule.json"
    public_output.parent.mkdir(parents=True, exist_ok=True)
    public_output.write_text(json_text, encoding="utf-8")


if __name__ == "__main__":
    main()

import json
import random
import uuid
from datetime import datetime, timedelta

def generate_random_date(start_year=2023, end_year=2026):
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    random_days = random.randrange((end_date - start_date).days)
    return (start_date + timedelta(days=random_days)).strftime("%Y-%m-%dT%H:00:00.000Z")

def generate_fake_record():
    is_deleted = random.choice([True, False])

    titles = ["DRIL/BOLT U/C 2 CONV", "RIB 4 INSTALLATION", "FS UPR CVR 1 INST", "PYL MNT PLT BRKT INST", "ARS CVR SPLR4 5 INST"]
    groups = ["J4807 - UPPER COVER", "J4808 - LOWER COVER", "J4806 - WINGBOX"]
    users = ["stephen.webber@airbus.com", "andy@andyedwards.uk", "daniel.da.orton.external@airbus.com", "brendan.brierley@airbus.com", "teodor.baghina.external@airbus.com"]

    return {
        "deliverable_id": f"del{uuid.uuid4().hex[:10]}",
        "project_id": f"prj{uuid.uuid4().hex[:12]}",
        "project_name": "RBA Mat",
        "deliverable_ref": f"AE{random.randint(57250000, 57259999)}",
        "deliverable_title": random.choice(titles),
        "deliverable_group": random.choice(groups),
        "deliverable_issue": random.choice(["A", "B", "C", "D", "E"]),
        "mer_code": random.choice(["ABC", "DE7", "XYZ"]),
        "rework_cycle": str(random.choice([1, 2, 3, 4, "H4"])),

        "compile_planned": generate_random_date(2023, 2024),
        "compile_forecast": generate_random_date(2023, 2024),
        "compile_actual": generate_random_date(2023, 2024),

        "app_planned": generate_random_date(2024, 2025),
        "app_forecast": generate_random_date(2024, 2025),
        "app_actual": random.choice([generate_random_date(2024, 2025), None]),

        "me_app_planned": generate_random_date(2024, 2025),
        "me_app_forecast": generate_random_date(2024, 2025),
        "me_app_actual": random.choice([generate_random_date(2024, 2025), None]),

        "auth_planned": generate_random_date(2025, 2026),
        "auth_forecast": random.choice([generate_random_date(2025, 2026), None]),
        "auth_actual": random.choice([generate_random_date(2025, 2026), None]),

        "created_at": generate_random_date(2023, 2023),
        "created_by": random.choice(users),
        "last_updated": generate_random_date(2025, 2026),
        "last_updated_by": random.choice(users),

        "is_deleted": is_deleted,
        "deleted_at": generate_random_date(2026, 2026) if is_deleted else None,
        "deleted_by": random.choice(users) if is_deleted else None,
        "last_request_id": f"req{uuid.uuid4().hex[:12]}" if is_deleted else None
    }

def main():
    # Generate 100 rows of fake data
    fake_data = [generate_fake_record() for _ in range(1000)]

    # Export to a JSON file
    filename = 'fake_airbus_data.json'
    with open(filename, 'w') as f:
        json.dump(fake_data, f, indent=2)

    print(f"Successfully exported 100 fake records to {filename}")

if __name__ == "__main__":
    main()

import requests

BASE_URL = "http://localhost:8000"


def test_create_event():
    print("\n--- Test 1: Create Event with date & time ---")
    payload = {
        "title": "Team Meeting",
        "description": "Weekly sync",
        "event_date": "2026-04-25",
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "event_type": "general",
        "created_by": 1,
        "assigned_to": None,
        "color": "#3498db"
    }
    res = requests.post(f"{BASE_URL}/events/", json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
    return res.json().get("id")


def test_create_undated_event():
    print("\n--- Test 2: Create Event WITHOUT date (task list only) ---")
    payload = {
        "title": "Follow up with client",
        "description": "Call John",
        "event_date": None,
        "start_time": None,
        "end_time": None,
        "event_type": "task",
        "created_by": 1,
        "color": "#e74c3c"
    }
    res = requests.post(f"{BASE_URL}/events/", json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")


def test_create_assigned_event():
    print("\n--- Test 3: Create Assigned Event (assigned to another user) ---")
    payload = {
        "title": "Review Report",
        "description": "Review Q1 report",
        "event_date": "2026-04-25",
        "start_time": "14:00:00",
        "end_time": "15:00:00",
        "event_type": "task",
        "created_by": 1,
        "assigned_to": 2,
        "color": "#2ecc71"
    }
    res = requests.post(f"{BASE_URL}/events/", json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")


def test_get_events_by_date():
    print("\n--- Test 4: Get Events for user 1 on 2026-04-25 ---")
    res = requests.get(f"{BASE_URL}/events/", params={"user_id": 1, "event_date": "2026-04-25"})
    print(f"Status: {res.status_code}")
    events = res.json()
    print(f"Total events found: {len(events)}")
    for e in events:
        print(f"  - [{e['event_type']}] {e['title']} | {e['event_date']} {e['start_time']} | created_by: {e['created_by']} assigned_to: {e['assigned_to']}")


def test_get_undated_events():
    print("\n--- Test 5: Get Undated Events for user 1 (task list) ---")
    res = requests.get(f"{BASE_URL}/events/undated", params={"user_id": 1})
    print(f"Status: {res.status_code}")
    events = res.json()
    print(f"Total undated events: {len(events)}")
    for e in events:
        print(f"  - [{e['event_type']}] {e['title']} | no date")


def test_get_events_by_range():
    print("\n--- Test 6: Get Events for user 1 in date range ---")
    res = requests.get(f"{BASE_URL}/events/", params={
        "user_id": 1,
        "start_date": "2026-04-01",
        "end_date": "2026-04-30"
    })
    print(f"Status: {res.status_code}")
    events = res.json()
    print(f"Total events in April: {len(events)}")
    for e in events:
        print(f"  - {e['title']} | {e['event_date']}")


def test_update_event(event_id):
    print(f"\n--- Test 7: Update Event {event_id} ---")
    payload = {"title": "Team Meeting (Updated)", "color": "#9b59b6"}
    res = requests.patch(f"{BASE_URL}/events/{event_id}", json=payload)
    print(f"Status: {res.status_code}")
    print(f"Updated title: {res.json().get('title')}")


def test_delete_event(event_id):
    print(f"\n--- Test 8: Delete Event {event_id} ---")
    res = requests.delete(f"{BASE_URL}/events/{event_id}")
    print(f"Status: {res.status_code} (204 = deleted successfully)")


if __name__ == "__main__":
    print("=" * 50)
    print("SWTS Calendar - Event API Tests")
    print("=" * 50)

    event_id = test_create_event()
    test_create_undated_event()
    test_create_assigned_event()
    test_get_events_by_date()
    test_get_undated_events()
    test_get_events_by_range()

    if event_id:
        test_update_event(event_id)
        test_delete_event(event_id)

    print("\n" + "=" * 50)
    print("All tests done!")
    print("=" * 50)

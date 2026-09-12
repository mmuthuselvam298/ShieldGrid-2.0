import pytest
from fastapi.testclient import TestClient
from app.database.session import Base, engine, SessionLocal
from main import app

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_policies(client):
    res = client.get("/api/policies")
    assert res.status_code == 200
    policies = res.json()
    assert len(policies) >= 3

def test_load_synthetic_demo_and_lifecycle(client):
    # 1. Load synthetic KYC document
    load_res = client.post("/api/demo/load/kyc")
    assert load_res.status_code == 200
    doc_data = load_res.json()
    doc_id = doc_data["id"]
    assert doc_data["status"] == "ANALYZED"
    assert doc_data["risk_score"] > 0
    assert doc_data["findings_count"] > 0

    # 2. Get document details
    detail_res = client.get(f"/api/documents/{doc_id}")
    assert detail_res.status_code == 200
    findings = detail_res.json()["findings"]
    assert len(findings) > 0
    first_finding_id = findings[0]["id"]

    # 3. Update finding review status
    update_res = client.put(f"/api/findings/{first_finding_id}", json={
        "status": "APPROVED",
        "redaction_mode": "BLACK_BOX"
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "APPROVED"

    # 4. Redact document
    redact_res = client.post(f"/api/documents/{doc_id}/redact", json={
        "default_mode": "BLACK_BOX"
    })
    assert redact_res.status_code == 200
    redact_data = redact_res.json()
    assert redact_data["redacted_count"] > 0
    assert "download_url" in redact_data

    # 5. Download sanitized document
    download_res = client.get(f"/api/documents/{doc_id}/download")
    assert download_res.status_code == 200
    assert len(download_res.content) > 0

    # 6. Check analytics
    analytics_res = client.get("/api/analytics")
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["documents_processed"] >= 1
    assert analytics_data["total_entities_detected"] > 0

    # 7. Check audit logs
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert "DOCUMENT_UPLOADED" in actions
    assert "ANALYSIS_COMPLETED" in actions
    assert "REDACTION_APPLIED" in actions

    # 8. Delete document
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
    
    # Confirm deletion
    get_after_del = client.get(f"/api/documents/{doc_id}")
    assert get_after_del.status_code == 404

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Policy
from app.schemas.schemas import PolicyResponse, PolicyBase

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()

@router.post("", response_model=PolicyResponse)
def create_policy(payload: PolicyBase, db: Session = Depends(get_db)):
    existing = db.query(Policy).filter(Policy.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy with this ID already exists")

    pol = Policy(
        id=payload.id,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
        config_json=payload.config_json
    )
    db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol

@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(policy_id: str, payload: PolicyBase, db: Session = Depends(get_db)):
    pol = db.query(Policy).filter(Policy.id == policy_id).first()
    if not pol:
        raise HTTPException(status_code=404, detail="Policy not found")

    pol.name = payload.name
    pol.description = payload.description
    pol.is_default = payload.is_default
    pol.config_json = payload.config_json

    db.commit()
    db.refresh(pol)
    return pol

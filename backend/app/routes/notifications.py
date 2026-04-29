
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(tags=["notifications"])


from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class NotificationRead(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    read: bool
    related_id: Optional[int]
    related_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
async def get_notifications(
    user_id: int = Query(..., description="User ID"),
    read: Optional[bool] = Query(None, description="Filter by read status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Notification).where(Notification.user_id == user_id)

        if read is not None:
            query = query.where(Notification.read == read)

        query = query.order_by(Notification.created_at.desc())

        count_query = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        if read is not None:
            count_query = count_query.where(Notification.read == read)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        result = await db.execute(query)
        notifications = result.scalars().all()

        return {
            "data": {
                "items": [NotificationRead.model_validate(n) for n in notifications],
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size if size > 0 else 0
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch notifications: {str(e)}"
        )


@router.post("", response_model=dict)
async def create_notification(
    notification_data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        notification = Notification(**notification_data.model_dump())
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        return {
            "data": NotificationRead.model_validate(notification),
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create notification: {str(e)}"
        )


@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        notification.read = True
        await db.commit()
        await db.refresh(notification)

        return {
            "data": NotificationRead.model_validate(notification),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark notification as read: {str(e)}"
        )


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        await db.delete(notification)
        await db.commit()

        return {
            "data": {"id": notification_id},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete notification: {str(e)}"
        )


@router.get("/user/{user_id}/unread-count", response_model=dict)
async def get_unread_count(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(func.count(Notification.id)).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == False
                )
            )
        )
        count = result.scalar()

        return {
            "data": {"count": count},
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get unread count: {str(e)}"
        )

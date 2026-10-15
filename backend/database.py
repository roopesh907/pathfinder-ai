
import os
from typing import Any, cast
from uuid import UUID, uuid4

import psycopg
from psycopg.rows import dict_row


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()

    if not url:
        raise RuntimeError(
            "DATABASE_URL is missing. Configure it in the backend environment."
        )

    # Support connection URLs using the older postgres:// prefix.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    return url


async def connect_db():
    """Open an asynchronous PostgreSQL connection."""
    return await psycopg.AsyncConnection.connect(
        get_database_url(),
        row_factory=cast(Any, dict_row),
    )


async def create_conversation(
    session_id: UUID,
    title: str = "New conversation",
) -> UUID:
    async with await connect_db() as conn:
        cursor = await conn.execute(
            """
            INSERT INTO public.conversations (session_id, title)
            VALUES (%s, %s)
            RETURNING id
            """,
            (session_id, title[:80]),
        )
        row = cast(dict[str, UUID] | None, await cursor.fetchone())

        if row is None:
            raise RuntimeError("Conversation was not created.")

        return row["id"]


async def save_messages(
    conversation_id: UUID,
    user_message: str,
    assistant_reply: str,
) -> None:
    async with await connect_db() as conn:
        await conn.execute(
            """
            INSERT INTO public.messages (conversation_id, role, content)
            VALUES (%s, 'user', %s), (%s, 'assistant', %s)
            """,
            (
                conversation_id,
                user_message,
                conversation_id,
                assistant_reply,
            ),
        )

        await conn.execute(
            """
            UPDATE public.conversations
            SET updated_at = now()
            WHERE id = %s
            """,
            (conversation_id,),
        )


async def get_conversations(session_id: UUID) -> list[dict]:
    async with await connect_db() as conn:
        cursor = await conn.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM public.conversations
            WHERE session_id = %s
            ORDER BY updated_at DESC
            """,
            (session_id,),
        )
        return cast(list[dict], await cursor.fetchall())


async def get_conversation_messages(
    conversation_id: UUID,
) -> list[dict]:
    async with await connect_db() as conn:
        cursor = await conn.execute(
            """
            SELECT id, role, content, created_at
            FROM public.messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (conversation_id,),
        )
        return cast(list[dict], await cursor.fetchall())


async def conversation_belongs_to_session(
    conversation_id: UUID,
    session_id: UUID,
) -> bool:
    async with await connect_db() as conn:
        cursor = await conn.execute(
            """
            SELECT 1
            FROM public.conversations
            WHERE id = %s AND session_id = %s
            """,
            (conversation_id, session_id),
        )
        return await cursor.fetchone() is not None


async def delete_conversation(
    conversation_id: UUID,
    session_id: UUID,
) -> bool:
    """
    Delete a conversation only when it belongs to the supplied session.

    Related messages are removed by the database's ON DELETE CASCADE
    foreign-key constraint. The ownership check and deletion happen in
    the same SQL statement.
    """
    async with await connect_db() as conn:
        cursor = await conn.execute(
            """
            DELETE FROM public.conversations
            WHERE id = %s AND session_id = %s
            RETURNING id
            """,
            (conversation_id, session_id),
        )
        return await cursor.fetchone() is not None


def new_session_id() -> UUID:
    return uuid4()

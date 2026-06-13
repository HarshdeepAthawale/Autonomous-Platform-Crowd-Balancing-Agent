"""Shared singletons (in-memory for the demo). Swappable for Redis/SQLite later."""
from .schedule import Schedule
from .store import Store

store = Store()
schedule = Schedule()

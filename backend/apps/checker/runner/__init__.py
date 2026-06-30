"""Backend-internal runner adapter boundary.

This package contains DTO contracts, pure status mapping and a fail-closed
DisabledRunner provider. Real execution must stay behind the checker execution
gate until a reviewed worker integration exists.
"""

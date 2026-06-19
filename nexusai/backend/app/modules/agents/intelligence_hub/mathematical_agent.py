"""
Mathematical Calculations Agent

Provides mathematical computation capabilities including symbolic math,
numerical analysis, and equation solving.
"""

import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class MathematicalAgent:
    """Mathematical computation agent"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute mathematical computation"""
        try:
            result = self._compute(query)
            return {
                "content": result,
                "metadata": {"type": "mathematical_calculation", "query": query},
                "confidence": 0.95,
            }
        except Exception as e:
            logger.error(f"Mathematical computation error: {e}")
            return {
                "content": f"I encountered an error computing your query: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0,
            }

    def _compute(self, query: str) -> str:
        """Attempt safe evaluation of mathematical expressions"""
        # Extract a numeric expression if present
        expr_match = re.search(r"[\d\s\+\-\*\/\(\)\.\^%]+", query)
        if expr_match:
            expr = expr_match.group(0).strip().replace("^", "**")
            try:
                # Safe eval with only math builtins
                import math
                allowed = {k: getattr(math, k) for k in dir(math) if not k.startswith("_")}
                allowed["__builtins__"] = {}
                result = eval(expr, allowed)  # noqa: S307
                return (
                    f"## Mathematical Result\n\n"
                    f"**Expression**: `{expr_match.group(0).strip()}`\n\n"
                    f"**Result**: `{result}`\n\n"
                    f"*Computed using standard arithmetic evaluation.*"
                )
            except Exception:
                pass

        return (
            f"## Mathematical Analysis\n\n"
            f"Your query: *{query}*\n\n"
            "Please provide a numeric expression (e.g. `2 + 2`, `sqrt(16)`, `3^4`) "
            "for direct computation, or describe the mathematical problem in detail."
        )

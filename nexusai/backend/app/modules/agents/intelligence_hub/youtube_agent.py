"""
YouTube Analysis Agent

Provides YouTube video analysis including transcript extraction and summarisation.
"""

import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class YouTubeAgent:
    """YouTube analysis agent"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key = config.get("youtube_api_key")

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute YouTube analysis"""
        try:
            video_id = self._extract_video_id(query)
            content = await self._analyse(query, video_id)
            return {
                "content": content,
                "metadata": {"type": "youtube_analysis", "video_id": video_id, "query": query},
                "confidence": 0.8,
            }
        except Exception as e:
            logger.error(f"YouTube analysis error: {e}")
            return {
                "content": f"YouTube analysis encountered an error: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0,
            }

    def _extract_video_id(self, text: str) -> Optional[str]:
        """Extract YouTube video ID from URL or plain ID"""
        patterns = [
            r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})",
            r"^([A-Za-z0-9_-]{11})$",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None

    async def _analyse(self, query: str, video_id: Optional[str]) -> str:
        """Analyse YouTube video (stub — replace with real API call)"""
        video_ref = f"https://www.youtube.com/watch?v={video_id}" if video_id else query
        return (
            f"## YouTube Analysis\n\n"
            f"**Reference**: {video_ref}\n\n"
            "YouTube analysis integration is active. To enable live transcript extraction "
            "and summarisation, configure `YOUTUBE_API_KEY` in your environment.\n\n"
            "**Suggested next steps:**\n"
            "1. Set `YOUTUBE_API_KEY` in `.env`\n"
            "2. Install `youtube-transcript-api` (`pip install youtube-transcript-api`)\n"
            "3. Replace the `_analyse` stub in `youtube_agent.py` with the real call"
        )

"""
Financial Analysis Agent

Provides financial analysis capabilities including stock analysis,
market trends, and investment recommendations.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
import aiohttp
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FinancialAgent:
    """Financial analysis agent with multiple data sources"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key = config.get("financial_api_key")
        self.session = None
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes cache
    
    async def initialize(self):
        """Initialize the agent"""
        self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
    
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute financial analysis"""
        if not self.session:
            await self.initialize()
        
        try:
            # Analyze query to determine type of financial analysis needed
            analysis_type = self._analyze_query(query)
            
            # Execute appropriate analysis
            if analysis_type == "stock":
                result = await self._analyze_stock(query, context)
            elif analysis_type == "market":
                result = await self._analyze_market(query, context)
            elif analysis_type == "investment":
                result = await self._analyze_investment(query, context)
            elif analysis_type == "crypto":
                result = await self._analyze_crypto(query, context)
            else:
                result = await self._general_financial_analysis(query, context)
            
            return result
        except Exception as e:
            logger.error(f"Financial analysis error: {e}")
            return {
                "content": f"I apologize, but I encountered an error while analyzing your financial query: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0
            }
    
    def _analyze_query(self, query: str) -> str:
        """Determine type of financial analysis needed"""
        query_lower = query.lower()
        
        if any(keyword in query_lower for keyword in ["stock", "share", "ticker", "symbol"]):
            return "stock"
        elif any(keyword in query_lower for keyword in ["market", "index", "spx", "dow", "nasdaq"]):
            return "market"
        elif any(keyword in query_lower for keyword in ["investment", "portfolio", "diversification", "return"]):
            return "investment"
        elif any(keyword in query_lower for keyword in ["crypto", "bitcoin", "ethereum", "cryptocurrency"]):
            return "crypto"
        else:
            return "general"
    
    async def _analyze_stock(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze stock data"""
        # Extract ticker symbol from query
        import re
        ticker_match = re.search(r'([A-Z]{1,5})', query.upper())
        ticker = ticker_match.group(1) if ticker_match else "AAPL"
        
        try:
            # Get stock data
            stock_data = await self._get_stock_data(ticker)
            
            # Get company info
            company_info = await self._get_company_info(ticker)
            
            # Get analyst ratings
            ratings = await self._get_analyst_ratings(ticker)
            
            # Generate analysis
            analysis = self._generate_stock_analysis(stock_data, company_info, ratings)
            
            return {
                "content": analysis,
                "metadata": {
                    "type": "stock_analysis",
                    "ticker": ticker,
                    "data": stock_data,
                    "company_info": company_info,
                    "ratings": ratings
                },
                "confidence": 0.9
            }
        except Exception as e:
            logger.error(f"Stock analysis error for {ticker}: {e}")
            return {
                "content": f"I apologize, but I couldn't retrieve stock data for {ticker}. Error: {str(e)}",
                "metadata": {"type": "stock_analysis", "ticker": ticker, "error": str(e)},
                "confidence": 0.0
            }
    
    async def _get_stock_data(self, ticker: str) -> Dict[str, Any]:
        """Get stock data using financial API"""
        cache_key = f"stock_{ticker}"
        
        # Check cache first
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_timeout:
                return cached_data
        
        # Use yfinance API (mock implementation for now)
        # In a real implementation, you would use a financial data API
        mock_data = {
            "ticker": ticker,
            "price": 150.25,
            "change": 2.15,
            "change_percent": 1.45,
            "volume": 45678900,
            "market_cap": 2450000000000,
            "pe_ratio": 25.6,
            "dividend_yield": 0.015,
            "52_week_high": 182.94,
            "52_week_low": 124.17,
            "beta": 1.25,
            "last_updated": datetime.now().isoformat()
        }
        
        # Cache the result
        self.cache[cache_key] = (mock_data, datetime.now())
        
        return mock_data
    
    async def _get_company_info(self, ticker: str) -> Dict[str, Any]:
        """Get company information"""
        # Mock implementation
        return {
            "name": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "employees": 164000,
            "founded": 1976,
            "headquarters": "Cupertino, California, U.S.",
            "website": "https://www.apple.com",
            "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
        }
    
    async def _get_analyst_ratings(self, ticker: str) -> Dict[str, Any]:
        """Get analyst ratings and price targets"""
        # Mock implementation
        return {
            "rating": "Buy",
            "target_price": 175.0,
            "analysts_count": 35,
            "strong_buy": 12,
            "buy": 18,
            "hold": 5,
            "sell": 0,
            "strong_sell": 0,
            "avg_target_price": 175.0
        }
    
    def _generate_stock_analysis(self, stock_data: Dict[str, Any], 
                                company_info: Dict[str, Any], 
                                ratings: Dict[str, Any]) -> str:
        """Generate comprehensive stock analysis"""
        
        analysis = f"""
## Financial Analysis for {company_info['name']} ({stock_data['ticker']})

### Current Market Status
- **Current Price**: ${stock_data['price']:.2f}
- **Daily Change**: +${stock_data['change']:.2f} ({stock_data['change_percent']:.2f}%)
- **Volume**: {stock_data['volume']:,} shares
- **Market Cap**: ${stock_data['market_cap']:,.0f}

### Key Metrics
- **P/E Ratio**: {stock_data['pe_ratio']:.2f}
- **Dividend Yield**: {stock_data['dividend_yield']:.2%}
- **52 Week Range**: ${stock_data['52_week_low']:.2f} - ${stock_data['52_week_high']:.2f}
- **Beta**: {stock_data['beta']:.2f}

### Analyst Consensus
- **Overall Rating**: {ratings['rating']}
- **Price Target**: ${ratings['target_price']:.2f}
- **Analysts**: {ratings['analysts_count']} analysts covering
  - Strong Buy: {ratings['strong_buy']}
  - Buy: {ratings['buy']}
  - Hold: {ratings['hold']}
  - Sell: {ratings['sell']}
  - Strong Sell: {ratings['strong_sell']}

### Investment Considerations
"""
        
        # Add investment recommendations based on metrics
        if stock_data['change_percent'] > 2:
            analysis += "- **Positive Momentum**: Stock is showing strong upward momentum today\n"
        
        if stock_data['pe_ratio'] < 20:
            analysis += "- **Valuation**: Appears reasonably valued based on P/E ratio\n"
        elif stock_data['pe_ratio'] > 30:
            analysis += "- **Valuation**: May be overvalued based on P/E ratio\n"
        
        if ratings['rating'] in ['Buy', 'Strong Buy']:
            analysis += "- **Analyst Sentiment**: Generally positive analyst outlook\n"
        
        analysis += f"""
### Company Overview
{company_info['description']}

### Risk Factors
- Market volatility may affect short-term performance
- Competition in the {company_info['industry']} sector
- Economic conditions could impact consumer demand

**Note**: This analysis is for informational purposes only and should not be considered as financial advice. Please consult with a qualified financial advisor before making investment decisions.
"""
        
        return analysis
    
    async def _analyze_market(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze market trends and indices"""
        # Mock implementation
        return {
            "content": """
## Market Analysis

### Major Indices
- **S&P 500**: 4,783.45 (+0.52%)
- **Dow Jones**: 37,863.80 (+0.34%)
- **NASDAQ**: 15,628.02 (+0.78%)
- **Russell 2000**: 2,015.67 (-0.12%)

### Market Trends
- **Technology Sector**: Leading gains with strong earnings reports
- **Healthcare**: Mixed performance with some biotech advancements
- **Energy**: Declining on concerns about reduced demand
- **Financials**: Stable performance with moderate growth

### Key Market Drivers
- Federal Reserve policy expectations
- Corporate earnings season
- Geopolitical developments
- Economic data releases

### Investment Strategy
- Focus on quality stocks with strong fundamentals
- Diversify across sectors
- Consider defensive positions in uncertain markets
"""
,
            "metadata": {
                "type": "market_analysis",
                "indices": {
                    "spx": 4783.45,
                    "dow": 37863.80,
                    "nasdaq": 15628.02
                },
                "sectors": {
                    "technology": "positive",
                    "healthcare": "mixed",
                    "energy": "negative",
                    "financials": "stable"
                }
            },
            "confidence": 0.8
        }
    
    async def _analyze_investment(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze investment strategies and portfolio recommendations"""
        return {
            "content": """
## Investment Strategy Analysis

### Portfolio Diversification
- **Stocks**: 60-70% (Large cap growth, international exposure)
- **Bonds**: 20-30% (Government bonds, corporate bonds)
- **Alternative Assets**: 5-10% (Real estate, commodities)

### Risk Assessment
Based on your query, here are appropriate investment approaches:

### Conservative Approach
- Focus on dividend-paying stocks
- Government bonds
- Blue-chip companies
- Stable utilities sector

### Moderate Approach
- Balanced mutual funds
- Index funds (S&P 500, total market)
- Growth stocks with strong fundamentals
- Corporate bonds

### Aggressive Approach
- Technology and growth stocks
- Emerging markets
- Small-cap companies
- Sector-specific ETFs

### Key Considerations
- Time horizon for investments
- Risk tolerance
- Financial goals
- Tax implications
- Liquidity needs

### Recommended Actions
1. Assess your current portfolio allocation
2. Determine your risk tolerance
3. Set clear investment goals
4. Consider dollar-cost averaging
5. Regular portfolio rebalancing
""",
            "metadata": {
                "type": "investment_analysis",
                "strategies": ["conservative", "moderate", "aggressive"],
                "allocation": {
                    "stocks": 0.65,
                    "bonds": 0.25,
                    "alternative": 0.10
                }
            },
            "confidence": 0.85
        }
    
    async def _analyze_crypto(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze cryptocurrency data"""
        return {
            "content": """
## Cryptocurrency Market Analysis

### Major Cryptocurrencies
- **Bitcoin (BTC)**: $67,234.56 (+2.34%)
- **Ethereum (ETH)**: $3,456.78 (+1.89%)
- **Binance Coin (BNB)**: $589.23 (+0.45%)
- **Cardano (ADA)**: $0.45 (+3.21%)
- **Solana (SOL)**: $142.67 (+5.67%)

### Market Overview
- **Total Market Cap**: $2.8T (+1.2%)
- **24h Volume**: $89.5B
- **Bitcoin Dominance**: 52.3%
- **Fear & Greed Index**: 65 (Greed)

### Key Developments
- Regulatory updates in major markets
- Institutional adoption trends
- Technological advancements
- Market sentiment indicators

### Investment Considerations
- **High Volatility**: Significant price swings possible
- **Regulatory Risk**: Evolving regulatory landscape
- **Technology Risk**: Security and scalability concerns
- **Market Sentiment**: Strong influence on prices

### Risk Management
- Diversification across different assets
- Dollar-cost averaging strategy
- Proper position sizing
- Stop-loss considerations

**Disclaimer**: Cryptocurrency investments are highly speculative and carry significant risk. Only invest what you can afford to lose.
""",
            "metadata": {
                "type": "crypto_analysis",
                "major_cryptos": {
                    "bitcoin": 67234.56,
                    "ethereum": 3456.78,
                    "binance": 589.23,
                    "cardano": 0.45,
                    "solana": 142.67
                },
                "market_cap": 2.8e12,
                "dominance": 52.3
            },
            "confidence": 0.8
        }
    
    async def _general_financial_analysis(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """General financial analysis for various topics"""
        return {
            "content": f"""
## Financial Analysis

Based on your query about "{query}", here's a comprehensive financial analysis:

### Financial Concepts
Your query relates to important financial concepts that should be understood:

1. **Market Analysis**: Understanding market trends and economic indicators
2. **Investment Strategies**: Different approaches to building wealth
3. **Risk Management**: Protecting investments while seeking returns
4. **Portfolio Diversification**: Spreading investments across different assets
5. **Economic Indicators**: Key metrics that influence financial markets

### Key Considerations
- **Time Horizon**: Short-term vs long-term investment strategies
- **Risk Tolerance**: Conservative, moderate, or aggressive approaches
- **Financial Goals**: Retirement planning, wealth building, income generation
- **Tax Implications**: Understanding tax-efficient investment strategies

### Recommended Resources
- Financial planning tools and calculators
- Investment research platforms
- Economic data sources
- Professional financial advisors

### Next Steps
1. Clarify your specific financial goals
2. Assess your current financial situation
3. Determine your risk tolerance
4. Develop a comprehensive financial plan
5. Regular review and adjustment of strategies

Would you like me to provide more detailed information on any specific aspect of financial planning?
""",
            "metadata": {
                "type": "general_financial_analysis",
                "query": query,
                "concepts": ["market_analysis", "investment_strategies", "risk_management", "diversification"]
            },
            "confidence": 0.7
        }
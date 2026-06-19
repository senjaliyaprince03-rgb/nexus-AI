import streamlit as st
from agno.agent import Agent, RunResponse
from agno.utils.pprint import pprint_run_response
from agno.models.groq import Groq
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.yfinance import YFinanceTools
from agno.tools.arxiv import ArxivTools
from agno.tools.calculator import CalculatorTools
from agno.tools.wikipedia import WikipediaTools
from agno.tools.newspaper4k import Newspaper4kTools
from agno.tools.youtube import YouTubeTools
from agno.team.team import Team
import os
from dotenv import load_dotenv

@st.cache_resource
def initialize_agents():
    load_dotenv()
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

    web_agent = Agent(
        name="Web Agent",
        role="Search the web for information",
        model=Groq(id="gemma2-9b-it"),
        tools=[DuckDuckGoTools()],
        instructions=[
            "Search for the most recent and relevant information",
            "Focus on extracting factual information only",
            "Always include and cite your sources with clear attribution",
            "Prioritize reputable news sources and official websites",
            "When presenting information, use clear headings and bullet points"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    finance_agent = Agent(
        name="Financial Data Analyst",
        role="Analyze financial data, metrics, stock performance, and company fundamentals",
        # model=Groq(id="mistral-saba-24b"),
        model=Groq(id="llama-3.3-70b-versatile"),
        tools=[YFinanceTools(stock_price=True, analyst_recommendations=True,
                             stock_fundamentals=True, company_info=True)],
        instructions=[
            "Present financial data in well-formatted tables with clear headers",
            "Double-check all numerical data before presenting it",
            "When comparing multiple companies, use the same metrics for each",
            "Clearly separate factual data from analysis or recommendations"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    research_agent = Agent(
        name="Research Agent",
        role="Search and analyze academic papers",
        model=Groq(id="deepseek-r1-distill-llama-70b"),
        tools=[ArxivTools()],
        instructions=[
            "Search for relevant academic papers on arXiv",
            "Provide structured summaries with: Title, Authors, Publication Date, Abstract",
            "Focus on papers from the last 3 years when possible",
            "Cite papers using their complete arXiv IDs"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    math_agent = Agent(
        name="Math Agent",
        role="Perform mathematical calculations",
        model=Groq(id="mistral-saba-24b"),
        tools=[CalculatorTools(enable_all=True)],
        instructions=[
            "Perform calculations carefully and accurately",
            "For complex calculations, break them down into simpler steps",
            "Include units in your answers when applicable",
            "Provide the final result clearly"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    wiki_agent = Agent(
        name="Wikipedia Agent",
        role="Search and summarize Wikipedia articles",
        model=Groq(id="gemma2-9b-it"),
        tools=[WikipediaTools()],
        instructions=[
            "Search Wikipedia for relevant articles",
            "Structure summaries with clear headings for different sections",
            "Focus on key facts, dates, and definitions",
            "Maintain neutrality when presenting information",
            "Include important contextual information for proper understanding"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    news_agent = Agent(
        name="News Agent",
        role="Summarize news articles",
        model=Groq(id="gemma2-9b-it"),
        tools=[Newspaper4kTools()],
        instructions=[
            "Extract and summarize key information from news articles",
            "Structure summaries with: Headline, Publication, Date, Key Points",
            "Distinguish between facts and opinions in the article",
            "Identify the main entities and topics discussed",
            "Include the article's source in your summary"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    youtube_agent = Agent(
        name="YouTube Agent",
        role="Analyze and summarize YouTube videos",
        model=Groq(id="gemma2-9b-it"),
        tools=[YouTubeTools()],
        instructions=[
            "Obtain and analyze captions from YouTube videos",
            "Structure summaries with: Video Title, Channel, Key Points",
            "Focus on the main topics and arguments presented",
            "Include timestamps for important sections when possible",
            "Keep summaries concise and focused on the most relevant information"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    generic_agent = Agent(
        name="General Query Agent",
        role="Answer general queries and provide information",
        # model=Groq(id="deepseek-r1-distill-llama-70b"),
        model=Groq(id="llama-3.3-70b-versatile"),
        instructions=[
            "Provide clear and concise answers to general queries",
            "Use bullet points for lists and structured information",
            "Draw upon general knowledge to answer questions",
            "If the query requires specialized knowledge, defer to other agents"
        ],
        show_tool_calls=True,
        markdown=True,
    )

    agent_team = Team(
        name="Multi-Agent Team",
        mode="route",
        model=Groq(id="deepseek-r1-distill-llama-70b"),
        # model=Groq(id="llama-3.3-70b-versatile"),
        members=[web_agent, finance_agent, research_agent, math_agent,
                 wiki_agent, news_agent, youtube_agent, generic_agent],
        show_tool_calls=True,
        markdown=True,
        description="You are a query-based router that directs questions to the most appropriate specialized agent.",
        instructions=[
            "First analyze the query to determine which specialized agent would be most appropriate",
            "For generic questions, about which you have all relevant information to be answered, use the General Query Agent",
            "For web searches and current information, use the Web Agent",
            "For financial analysis or financial query, always use the Finance Agent",
            "For mathematical calculations, always use the Math Agent",
            "For academic research questions, use the Research Agent",
            "For Wikipedia-based information, use the Wikipedia Agent",
            "For news article analysis, use the News Agent",
            "For YouTube video summaries, use the YouTube Agent",
            "Always format the final response with clear headings, bullet points, and tables where appropriate",
            "When presenting the final answer, focus on clarity and accuracy over comprehensiveness"
        ],
        show_members_responses=True,
    )

    return agent_team


agent_team_combined_model = initialize_agents()


def process_query(query):
    response: RunResponse = agent_team_combined_model.run(query)
    return response.content

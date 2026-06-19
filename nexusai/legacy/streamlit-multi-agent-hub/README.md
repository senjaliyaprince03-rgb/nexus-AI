# NexusAI - Multi-Agent Intelligence Hub

NexusAI is a comprehensive multi-agent intelligence platform that leverages the power of LLMs (Large Language Models) through Agno's multi-agent framework and LangChain to provide intelligent responses across multiple domains. The application combines specialized agents with RAG (Retrieval-Augmented Generation) capabilities, allowing users to query various knowledge sources and perform domain-specific tasks through a unified interface.

![NexusAI Logo](https://img.icons8.com/fluency/96/artificial-intelligence.png)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
  - [General Queries](#general-queries)
  - [Financial Analysis](#financial-analysis)
  - [Academic Research](#academic-research)
  - [Mathematical Calculations](#mathematical-calculations)
  - [Wikipedia Search](#wikipedia-search)
  - [News Article Analysis](#news-article-analysis)
  - [YouTube Video Summaries](#youtube-video-summaries)
  - [RAG Knowledge Base](#rag-knowledge-base)
- [Code Structure](#code-structure)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Features

NexusAI offers a wide range of capabilities through its specialized agents:

- **Web Search**: Retrieve up-to-date information from the web using DuckDuckGo
- **Financial Analysis**: Analyze stocks, compare companies, and get investment recommendations
- **Academic Research**: Search and summarize academic papers from arXiv
- **Mathematical Calculations**: Perform various mathematical operations and calculations
- **Wikipedia Search**: Search and summarize Wikipedia articles
- **News Article Analysis**: Analyze and summarize news articles from URLs
- **YouTube Video Summaries**: Generate summaries from YouTube video transcripts
- **RAG Knowledge Base**: Build and query your own knowledge base with documents and URLs

## 🏗️ Architecture

NexusAI follows a modular architecture with the following key components:

1. **Multi-Agent System**: A team of specialized agents powered by Agno's framework, each focused on a specific domain or task
2. **Retrieval-Augmented Generation (RAG)**: Integration with AstraDB and Langchain for vector storage, document retrieval and query processing
3. **Web Interface**: A Streamlit-based user interface for interacting with all the system's capabilities
4. **Document Processing**: Handlers for various document types (web pages, PDFs, etc.)

### System Flow:

1. User submits a query through the Streamlit interface
2. The query is routed to the appropriate specialized agent by the main agent team
3. The agent processes the query, potentially using its specific tools (web search, financial data, etc.)
4. Results are formatted and displayed back to the user in the UI

For RAG functionality:
1. User uploads documents or provides URLs
2. Documents are processed, chunked, and stored in AstraDB vector database 
3. User queries are used to retrieve relevant context from the vector database
4. An LLM generates responses using the retrieved context

## 💻 Tech Stack

NexusAI is built with the following technologies:

- **Agno**: Multi-agent framework for agent orchestration
- **LangChain**: Framework for developing applications powered by language models
- **Groq**: LLM API provider for various models (gemma2, mistral, deepseek-r1)
- **DataStax AstraDB**: Serverless vector database built on Apache Cassandra
- **Streamlit**: Web application framework for the user interface
- **Sentence Transformers**: Text embedding models for document vectorization
- **Various Python libraries**: 
  - duckduckgo-search for web search
  - yfinance for financial data
  - arXiv for research papers
  - Wikipedia for encyclopedia entries
  - newspaper4k for news article processing
  - YouTube for video transcript analysis

## 🛠️ Setup and Installation

### Prerequisites

- Python 3.9+ (recommended version 3.10)
- Groq API key
- AstraDB account with API key and endpoint
- Sufficient disk space for storing document embeddings

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub.git
cd NexusAI-Multi-Agent-Intelligence-Hub
```

2. **Create and activate a virtual environment**

```bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. **Install required packages**

```bash
pip install -r requirements.txt
```

4. **Create a .env file for environment variables**

Create a `.env` file in the project root directory with the following variables:

```
GROQ_API_KEY=your_groq_api_key
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_token
ASTRA_DB_API_ENDPOINT=your_astra_db_endpoint
```

5. **Create data directories**

```bash
mkdir -p data/pdfs
```

6. **Run the Streamlit application**

```bash
streamlit run app.py
```

The application should now be running on http://localhost:8501 (or another port if specified).

### Environment Variables

- `GROQ_API_KEY`: Your API key for accessing Groq LLM models
- `ASTRA_DB_APPLICATION_TOKEN`: Token for authenticating with AstraDB
- `ASTRA_DB_API_ENDPOINT`: Endpoint URL for your AstraDB instance

## 📘 Usage Guide

### General Queries

Use the General Query tab to ask any question. The system will route your query to the most appropriate agent.

**Example queries:**
- "What are the health benefits of meditation?"
- "How does quantum computing work?"
- "What are the latest advancements in renewable energy?"

### Financial Analysis

The Financial Analysis tab is designed for finance-related questions and stock analysis.

**Example queries:**
- "Compare Apple and Microsoft stocks over the past year"
- "What are the best performing tech stocks this quarter?"
- "Analyze Tesla's financial fundamentals"

### Academic Research

Search and summarize academic papers from arXiv in the Academic Research tab.

**Example usage:**
1. Enter a research topic (e.g., "quantum machine learning")
2. Select the maximum number of papers to retrieve
3. Click "Search Papers"

### Mathematical Calculations

Perform various mathematical calculations in the Math Calculator tab.

**Example queries:**
- "Calculate compound interest on $10,000 at 5% for 10 years"
- "What is the square root of 144?"
- "Solve the equation 3x + 5 = 20"

### Wikipedia Search

Search and summarize Wikipedia articles in the Wikipedia Search tab.

**Example usage:**
1. Enter a topic (e.g., "quantum physics")
2. Click "Search Wikipedia"

### News Article Analysis

Get summaries of news articles in the News Article Summary tab.

**Example usage:**
1. Paste the URL of a news article
2. Click "Summarize Article"

### YouTube Video Summaries

Get summaries of YouTube videos in the YouTube Video Summary tab.

**Example usage:**
1. Paste a YouTube video URL
2. Click "Summarize Video"

**Note:** Currently supports videos up to 15-16 minutes with English subtitles/captions.

### RAG Knowledge Base

Build and query your own knowledge base in the RAG Knowledge Base tab.

**Adding content to your knowledge base:**
1. Enter URLs (one per line) to add web pages to your knowledge base
2. Upload PDF files to add to your knowledge base
3. Click the respective buttons to process and add the content

**Querying your knowledge base:**
1. Enter your query related to the content you've added
2. Click "Submit Query"

**Managing your knowledge base:**
- Use the "Clear Knowledge Base Memory" button to reset the knowledge base

## 📁 Code Structure

The project consists of the following key files:

- `app.py`: Main Streamlit application with the user interface
- `multiagents.py`: Definition and initialization of all specialized agents
- `agent_memory.py`: RAG implementation with AstraDB integration

### app.py

Contains the Streamlit UI code, including:
- Page configuration and styling
- Tab-based navigation
- Query processing functions
- RAG knowledge base management UI

### multiagents.py

Implements the multi-agent system, including:
- Individual agent definitions with specific roles and tools
- Agent team configuration for query routing
- Processing logic for different query types

### agent_memory.py

Implements the RAG system with AstraDB, including:
- Vector store configuration
- Document processing utilities (URLs, PDFs)
- Query processing pipeline

## 🔧 Customization

### Adding New Agents

To add a new specialized agent, modify `multiagents.py`:

1. Import the necessary tools
2. Create a new Agent instance with appropriate configuration
3. Add the new agent to the agent_team members list

Example:
```python
new_agent = Agent(
    name="New Agent",
    role="Description of the agent's role",
    model=Groq(id="model-id"),
    tools=[NewTools()],
    instructions=[
        "Instructions for the agent",
    ],
    show_tool_calls=True,
    markdown=True,
)

# Add to agent_team members list
```

### Modifying RAG Capabilities

To customize the RAG functionality, modify `agent_memory.py`:

1. Adjust the chunk size and overlap for document splitting
2. Change the embedding model
3. Modify the retrieval parameters (k value)
4. Update the prompt template

## ⚠️ Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure all API keys are correctly set in the `.env` file
   - Check for any whitespace or quotes around the keys

2. **Model Unavailability**
   - If a Groq model is unavailable, try updating to another available model in `multiagents.py`

3. **Memory Issues**
   - For large documents, you might need to adjust the chunk size in `agent_memory.py`

4. **PDF Processing Errors**
   - Ensure PDFs are not password-protected
   - Check that the PyPDF parser can correctly read the PDF format

5. **AstraDB Connection Issues**
   - Verify your network can reach the AstraDB endpoint
   - Confirm your application token has the correct permissions

### Deployment on Heroku
To deploy on Heroku, follow these steps in this video: [Heroku Deployment](https://www.youtube.com/watch?v=ZKy3Mass9_E)
### Deployment on Streammlit cloud (easy and free, but shuts down after sometime)
To deploy on Streamlit cloud, just go onto its website and create a new app. Then, link your GitHub repository and select the branch you want to deploy. Streamlit will automatically install the required packages and run the app.

### Logs

For debugging purposes, the application provides logging information:
- Check the console output for error messages
- Look for Streamlit warnings in the browser

## 🤝 Contributing

Contributions to NexusAI are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your code follows the project's coding style and includes appropriate tests.

## 📄 License

[MIT License](LICENSE) - Feel free to use this code for your own projects.

---

## 📬 Contact

For any questions or support, please open an issue on the GitHub repository or contact the project maintainer.

---

*NexusAI - Empowering intelligent decisions through multi-agent AI*

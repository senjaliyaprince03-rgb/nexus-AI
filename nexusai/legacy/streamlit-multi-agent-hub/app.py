# import time
# import multiagents
# from try_chatting_with_history import vstore_delete_all_docs_with_history, urls_docs_insert_to_db_with_history, pdfs_docs_insert_to_db_with_history, process_rag_query_with_memory
# from agent_memory import urls_docs_insert_to_db, pdfs_docs_insert_to_db, process_rag_query, vstore_delete_all_docs
# from pathlib import Path
# import streamlit as st
# # Set page configuration
# st.set_page_config(
#     page_title="NexusAI",
#     page_icon="🧠",
#     layout="wide",
#     initial_sidebar_state="expanded"
# )

# # Initialize knowledge base on app refresh
# if 'initialized' not in st.session_state:
#     # This will only run once when the app first loads or is refreshed
#     vstore_delete_all_docs()
#     vstore_delete_all_docs_with_history()
#     # if chat history from prev session exists, clear it
#     if "chat_history" in st.session_state:
#         st.session_state.chat_history = []
#     st.session_state.initialized = True


# st.markdown("""
# <style>
#     .main-header {
#         font-size: 2.5rem;
#         font-weight: 700;
#         color: #4527A0;
#         margin-bottom: 1rem;
#     }
#     .sub-header {
#         font-size: 1.5rem;
#         font-weight: 500;
#         color: #5E35B1;
#         margin-top: 2rem;
#     }
#     .info-text {
#         color: #555;
#         font-size: 0.9rem;
#     }
#     .highlight {
#         background-color: #E8EAF6;
#         padding: 0.2rem 0.5rem;
#         border-radius: 0.25rem;
#         font-weight: 500;
#     }
# </style>
# """, unsafe_allow_html=True)

# # App title and description
# st.markdown('<div class="main-header">NexusAI: Multi-Agent Intelligence Hub</div>',
#             unsafe_allow_html=True)

# # Helper functions for processing different query types


# def process_query(query, button_clicked):
#     if button_clicked and query:
#         with st.spinner("Processing your query..."):
#             try:
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 error_message = st.error(f"Error: {e}")
#                 time.sleep(4)
#                 error_message.empty()
#     elif button_clicked and not query:
#         st.warning("Please enter a query.")


# def process_financial_query(query, button_clicked):
#     if button_clicked and query:
#         with st.spinner("Analyzing financial data..."):
#             try:
#                 full_query = f"Use financial tool to answer the query: {query}"
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(full_query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 st.error(f"Error: {e}")
#                 time.sleep(4)
#     elif button_clicked:
#         st.warning("Please enter a financial query.")


# def process_research_query(topic, max_results, button_clicked):
#     if button_clicked and topic:
#         with st.spinner("Searching academic papers..."):
#             try:
#                 query = f"Find {max_results} recent research papers about {topic} and summarize them"
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 error_message = st.error(f"Error: {e}")
#                 time.sleep(4)
#                 error_message.empty()
#     elif button_clicked and not topic:
#         st.warning("Please enter a research topic.")


# def process_wiki_query(topic, button_clicked):
#     if button_clicked and topic:
#         with st.spinner("Searching Wikipedia..."):
#             try:
#                 query = f"Summarize the Wikipedia article on {topic}"
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 error_message = st.error(f"Error: {e}")
#                 time.sleep(4)
#                 error_message.empty()
#     elif button_clicked and not topic:
#         st.warning("Please enter a topic.")


# def process_news_query(url, button_clicked):
#     if button_clicked and url:
#         with st.spinner("Summarizing news article..."):
#             try:
#                 query = f"Analyze this news article: {url}"
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 error_message = st.error(f"Error: {e}")
#                 time.sleep(4)
#                 error_message.empty()
#     elif button_clicked and not url:
#         st.warning("Please enter a news article URL.")


# def process_youtube_query(url, button_clicked):
#     if button_clicked and url:
#         with st.spinner("Summarizing YouTube video..."):
#             try:
#                 query = f"Summarize this YouTube video: {url}"
#                 response_placeholder = st.empty()
#                 response = multiagents.process_query(query)
#                 response_placeholder.markdown(response)
#             except Exception as e:
#                 error_message = st.error(f"Error: {e}")
#                 time.sleep(4)
#                 error_message.empty()
#     elif button_clicked and not url:
#         st.warning("Please enter a YouTube video URL.")


# # Sidebar with capabilities
# with st.sidebar:
#     st.image("https://img.icons8.com/fluency/96/artificial-intelligence.png", width=80)
#     st.header("Capabilities")
#     st.markdown("""
#     NexusAI can help you with:
#     - 🌐 Web searches and information retrieval
#     - 📊 Financial data analysis and stock recommendations
#     - 📚 Academic research paper summaries
#     - 🧮 Mathematical calculations
#     - 📖 Wikipedia article summaries
#     - 📰 News article analysis
#     - 🎥 YouTube video summaries
#     - 🧠 RAG knowledge base for document processing and queries via Langchain
#     - 🧠 Advanced RAG with memory track for greater context via Langgraph
#     """)

#     st.markdown("---")
#     st.caption(
#         "NexusAI uses Agno's multi-agent framework to provide intelligent responses across multiple domains.")

# # Main content area
# tab_options = [
#     "General Query",
#     "Financial Analysis",
#     "Academic Research",
#     "Math Calculator",
#     "Wikipedia Search",
#     "News Article Summary",
#     "YouTube Video Summary",
#     "RAG Knowledge Base",
#     "Advanced RAG with Memory"
# ]

# selected_tab = st.selectbox("Select functionality:", tab_options)

# # Function to create a card container


# def create_card(title, content):
#     st.markdown(
#         f'<div class="sub-header">{title}</div>', unsafe_allow_html=True)
#     # st.markdown('<div class="card">', unsafe_allow_html=True)
#     content()
#     # st.markdown('</div>', unsafe_allow_html=True)


# # Display different UI based on selected tab
# if selected_tab == "General Query":
#     create_card("Ask NexusAI Anything", lambda: (
#         st.markdown(
#             "Your query will be routed to the most appropriate specialized agent."),
#         query := st.text_area("Enter your query:", height=100),
#         process_button := st.button("Submit Query", key="general_query"),
#         process_query(query, process_button)
#     ))

# elif selected_tab == "Financial Analysis":
#     create_card("Financial Data Analysis", lambda: (
#         st.markdown(
#             "Ask any finance-related question or request stock analysis."),
#         query := st.text_area("Enter your financial query:", placeholder="E.g., 'Compare Apple and Microsoft stocks' or 'What are the best performing tech stocks this year?'"),
#         submit_button := st.button("Analyze", key="financial_analysis"),
#         process_financial_query(query, submit_button)
#     ))


# elif selected_tab == "Academic Research":
#     create_card("Academic Research Papers", lambda: (
#         st.markdown("Search and summarize academic papers from arXiv."),
#         research_topic := st.text_input("Research Topic:"),
#         max_results := st.slider("Maximum number of papers:", 1, 5, 3),
#         process_button := st.button("Search Papers", key="academic_research"),
#         process_research_query(research_topic, max_results, process_button)
#     ))

# elif selected_tab == "Math Calculator":
#     create_card("Mathematical Calculations", lambda: (
#         st.markdown("Perform various mathematical calculations."),
#         st.markdown('<p class="info-text">Examples: "Calculate compound interest on $10,000 at 5% for 10 years", "What is the square root of 144?"</p>', unsafe_allow_html=True),
#         math_query := st.text_area("Enter calculation:"),
#         process_button := st.button("Calculate", key="math_calc"),
#         process_query(math_query, process_button)
#     ))

# elif selected_tab == "Wikipedia Search":
#     create_card("Wikipedia Search", lambda: (
#         st.markdown("Search and summarize Wikipedia articles."),
#         wiki_topic := st.text_input("Topic:"),
#         process_button := st.button("Search Wikipedia", key="wiki_search"),
#         process_wiki_query(wiki_topic, process_button)
#     ))

# elif selected_tab == "News Article Summary":
#     create_card("News Article Summary", lambda: (
#         st.markdown("Get a summary of any news article."),
#         st.markdown(
#             '<p class="info-text">Enter the URL of a news article you want to summarize</p>', unsafe_allow_html=True),
#         article_url := st.text_input("Article URL:"),
#         process_button := st.button("Summarize Article", key="news_summary"),
#         process_news_query(article_url, process_button)
#     ))

# elif selected_tab == "YouTube Video Summary":
#     create_card("YouTube Video Summary", lambda: (
#         st.markdown("Get a summary of a YouTube video."),
#         st.markdown(
#             '<p class="info-text">Currently supports videos up to 15-16 minutes with English subtitles/captions</p>', unsafe_allow_html=True),
#         video_url := st.text_input("YouTube URL:"),
#         process_button := st.button("Summarize Video", key="youtube_summary"),
#         process_youtube_query(video_url, process_button)
#     ))

# elif selected_tab == "RAG Knowledge Base":
#     st.markdown('<div class="sub-header">RAG Knowledge Base</div>',
#                 unsafe_allow_html=True)
#     st.markdown('<div class="card">', unsafe_allow_html=True)

#     # Add Clear Memory button at the top of the RAG section
#     clear_memory_button = st.button("Clear Knowledge Base Memory")
#     if clear_memory_button:
#         with st.spinner("Clearing knowledge base..."):
#             vstore_delete_all_docs()
#             st.success("Knowledge base has been reset successfully!")

#     st.markdown("Upload documents or provide URLs to build your knowledge base.")
#     st.markdown('<p class="info-text">Note: Initial processing may take some time.</p>',
#                 unsafe_allow_html=True)

#     st.subheader("Add Web Pages or PDF URLs")
#     urls = st.text_area("Enter URLs (one per line):", height=100)
#     add_urls_button = st.button("Add URLs to Knowledge Base")

#     st.subheader("Upload PDF Documents")
#     uploaded_files = st.file_uploader(
#         "Choose PDF files", accept_multiple_files=True, type="pdf")
#     upload_button = st.button("Upload Files to Knowledge Base")

#     st.subheader("Query Your Knowledge Base")
#     query = st.text_area("Enter your query:", height=100)
#     query_button = st.button("Submit Query")

#     PDF_DIR = Path(__file__).parent / "data" / "pdfs"
#     PDF_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
#     if upload_button and uploaded_files:
#         for uploaded_file in uploaded_files:
#             # Save each file in the data/pdfs directory
#             file_path = PDF_DIR / uploaded_file.name
#             with open(file_path, "wb") as f:
#                 f.write(uploaded_file.read())
#         st.success(
#             f"{len(uploaded_files)} file(s) uploaded successfully to {PDF_DIR}")

#     if add_urls_button:
#         urls_docs_insert_to_db(urls.split('\n'))
#     if upload_button:
#         pdfs_docs_insert_to_db(PDF_DIR)
#     if query_button:
#         answer = process_rag_query(query)
#         st.markdown(answer)

#     st.markdown('</div>', unsafe_allow_html=True)


# elif selected_tab == "Advanced RAG with Memory":
#     st.markdown('<div class="sub-header">Advanced RAG with Memory</div>',
#                 unsafe_allow_html=True)
#     st.markdown('<div class="card">', unsafe_allow_html=True)

#     # Information about Advanced RAG with Memory
#     st.markdown("""
#     This Advanced RAG system maintains conversation history for more contextual responses.
#     It uses LangGraph to:
#     - Rewrite questions based on conversation context
#     - Evaluate document relevance
#     - Refine searches when needed
#     - Provide direct answers when no relevant documents exist
#     """)

#     # Add Clear Memory button at the top of the Advanced RAG section
#     clear_memory_button = st.button("Clear Advanced RAG Memory")
#     if clear_memory_button:
#         with st.spinner("Clearing advanced knowledge base..."):
#             vstore_delete_all_docs_with_history()
#             st.success(
#                 "Advanced RAG knowledge base has been reset successfully!")

#     st.markdown(
#         "Upload documents or provide URLs to build your knowledge base with memory support.")
#     st.markdown('<p class="info-text">Note: This system maintains conversation history for contextual responses.</p>',
#                 unsafe_allow_html=True)

#     st.subheader("Add Web Pages or PDF URLs")
#     urls = st.text_area("Enter URLs (one per line):",
#                         height=100, key="urls_memory")
#     add_urls_button = st.button("Add URLs to Memory-Enabled Knowledge Base")

#     st.subheader("Upload PDF Documents")
#     uploaded_files = st.file_uploader(
#         "Choose PDF files", accept_multiple_files=True, type="pdf", key="pdfs_memory")
#     upload_button = st.button("Upload Files to Memory-Enabled Knowledge Base")

#     # Chat history container
#     if "chat_history" not in st.session_state:
#         st.session_state.chat_history = []

#     st.subheader("Query Your Memory-Enabled Knowledge Base")

#     # Display chat history with color styling and emojis
#     chat_container = st.container()
#     with chat_container:
#         for message in st.session_state.chat_history:
#             if message["role"] == "user":
#                 st.markdown(
#                     f"""
#                     <div style="background-color: #E8F4FF; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
#                         <strong>👤 You:</strong> {message['content']}
#                     </div>
#                     """,
#                     unsafe_allow_html=True
#                 )
#             else:
#                 st.markdown(
#                     f"""
#                     <div style="background-color: #F0F0F0; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
#                         <strong>🤖 AI:</strong> {message['content']}
#                     </div>
#                     """,
#                     unsafe_allow_html=True
#                 )

#     # Query input
#     query = st.text_area("Enter your query:", height=100, key="query_memory")
#     query_button = st.button("Submit Query to Memory-Enabled System")

#     PDF_DIR = Path(__file__).parent / "data" / "history" / "pdfs"
#     PDF_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
#     if upload_button and uploaded_files:
#         with st.spinner("Processing and uploading files..."):
#             for uploaded_file in uploaded_files:
#                 # Save each file in the data/memory_pdfs directory
#                 file_path = PDF_DIR / uploaded_file.name
#                 with open(file_path, "wb") as f:
#                     f.write(uploaded_file.read())
#             st.success(
#                 f"{len(uploaded_files)} file(s) uploaded successfully to {PDF_DIR}")
#             # Add files to the memory-enabled vector store
#             pdfs_docs_insert_to_db_with_history(PDF_DIR)
#             st.success(
#                 "Documents processed and added to memory-enabled knowledge base!")

#     if add_urls_button and urls:
#         with st.spinner("Processing URLs..."):
#             url_list = [url.strip() for url in urls.split('\n') if url.strip()]
#             if url_list:
#                 urls_docs_insert_to_db_with_history(url_list)
#                 st.success(
#                     f"{len(url_list)} URL(s) processed and added to memory-enabled knowledge base!")
#             else:
#                 st.warning("No valid URLs provided.")

#     if query_button and query:
#         with st.spinner("Processing your query with contextual memory..."):
#             # Add user query to chat history
#             st.session_state.chat_history.append(
#                 {"role": "user", "content": query})

#             # Process the query with the memory-enabled system
#             answer = process_rag_query_with_memory(query)

#             # Add AI response to chat history
#             st.session_state.chat_history.append(
#                 {"role": "assistant", "content": answer})

#             # Force refresh to show updated chat history
#             st.rerun()

#     st.markdown('</div>', unsafe_allow_html=True)


import streamlit as st
# Set page configuration
st.set_page_config(
    page_title="NexusAI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)
import time
import multiagents
from try_chatting_with_history import vstore_delete_all_docs_with_history, urls_docs_insert_to_db_with_history, pdfs_docs_insert_to_db_with_history, process_rag_query_with_memory
from agent_memory import urls_docs_insert_to_db, pdfs_docs_insert_to_db, process_rag_query, vstore_delete_all_docs
from pathlib import Path

# Initialize knowledge base on app refresh
if 'initialized' not in st.session_state:
    # This will only run once when the app first loads or is refreshed
    vstore_delete_all_docs()
    vstore_delete_all_docs_with_history()
    # if chat history from prev session exists, clear it
    if "chat_history" in st.session_state:
        st.session_state.chat_history = []
    st.session_state.initialized = True


st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #4527A0;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.5rem;
        font-weight: 500;
        color: #5E35B1;
        margin-top: 2rem;
    }
    .info-text {
        color: #555;
        font-size: 0.9rem;
    }
    .highlight {
        background-color: #E8EAF6;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)

# App title and description
st.markdown('<div class="main-header">NexusAI: Multi-Agent Intelligence Hub</div>',
            unsafe_allow_html=True)

# Helper functions for processing different query types


def process_query(query, button_clicked):
    if button_clicked and query:
        with st.spinner("Processing your query..."):
            try:
                response_placeholder = st.empty()
                response = multiagents.process_query(query)
                response_placeholder.markdown(response)
            except Exception as e:
                error_message = st.error(f"Error: {e}")
                time.sleep(4)
                error_message.empty()
    elif button_clicked and not query:
        st.warning("Please enter a query.")


def process_financial_query(query, button_clicked):
    if button_clicked and query:
        with st.spinner("Analyzing financial data..."):
            try:
                full_query = f"Use financial tool to answer the query: {query}"
                response_placeholder = st.empty()
                response = multiagents.process_query(full_query)
                response_placeholder.markdown(response)
            except Exception as e:
                st.error(f"Error: {e}")
                time.sleep(4)
    elif button_clicked:
        st.warning("Please enter a financial query.")


def process_research_query(topic, max_results, button_clicked):
    if button_clicked and topic:
        with st.spinner("Searching academic papers..."):
            try:
                query = f"Find {max_results} recent research papers about {topic} and summarize them"
                response_placeholder = st.empty()
                response = multiagents.process_query(query)
                response_placeholder.markdown(response)
            except Exception as e:
                error_message = st.error(f"Error: {e}")
                time.sleep(4)
                error_message.empty()
    elif button_clicked and not topic:
        st.warning("Please enter a research topic.")


def process_wiki_query(topic, button_clicked):
    if button_clicked and topic:
        with st.spinner("Searching Wikipedia..."):
            try:
                query = f"Summarize the Wikipedia article on {topic}"
                response_placeholder = st.empty()
                response = multiagents.process_query(query)
                response_placeholder.markdown(response)
            except Exception as e:
                error_message = st.error(f"Error: {e}")
                time.sleep(4)
                error_message.empty()
    elif button_clicked and not topic:
        st.warning("Please enter a topic.")


def process_news_query(url, button_clicked):
    if button_clicked and url:
        with st.spinner("Summarizing news article..."):
            try:
                query = f"Analyze this news article: {url}"
                response_placeholder = st.empty()
                response = multiagents.process_query(query)
                response_placeholder.markdown(response)
            except Exception as e:
                error_message = st.error(f"Error: {e}")
                time.sleep(4)
                error_message.empty()
    elif button_clicked and not url:
        st.warning("Please enter a news article URL.")


def process_youtube_query(url, button_clicked):
    if button_clicked and url:
        with st.spinner("Summarizing YouTube video..."):
            try:
                query = f"Summarize this YouTube video: {url}"
                response_placeholder = st.empty()
                response = multiagents.process_query(query)
                response_placeholder.markdown(response)
            except Exception as e:
                error_message = st.error(f"Error: {e}")
                time.sleep(4)
                error_message.empty()
    elif button_clicked and not url:
        st.warning("Please enter a YouTube video URL.")


# Sidebar with capabilities
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/artificial-intelligence.png", width=80)
    st.header("Capabilities")
    st.markdown("""
    NexusAI can help you with:
    - 🌐 Web searches and information retrieval
    - 📊 Financial data analysis and stock recommendations
    - 📚 Academic research paper summaries
    - 🧮 Mathematical calculations
    - 📖 Wikipedia article summaries
    - 📰 News article analysis
    - 🎥 YouTube video summaries
    - 🧠 RAG knowledge base for document processing and queries via Langchain
    - 🧠 Advanced RAG with memory track for greater context via Langgraph
    """)

    st.markdown("---")
    st.caption(
        "NexusAI uses Agno's multi-agent framework to provide intelligent responses across multiple domains.")

# Main content area - Split into two separate dropdowns
tab_categories = ["Standard Agents", "RAG Agents"]
selected_category = st.radio("Select category:", tab_categories)

if selected_category == "Standard Agents":
    standard_options = [
        "General Query",
        "Financial Analysis",
        "Academic Research",
        "Math Calculator",
        "Wikipedia Search",
        "News Article Summary",
        "YouTube Video Summary"
    ]
    selected_tab = st.selectbox("Select functionality:", standard_options)

else:  # RAG Agents
    rag_options = [
        "Chat with documents",
        "Advanced documents chat with Memory"
    ]
    selected_tab = st.selectbox("Select RAG functionality:", rag_options)

# Function to create a card container


def create_card(title, content):
    st.markdown(
        f'<div class="sub-header">{title}</div>', unsafe_allow_html=True)
    # st.markdown('<div class="card">', unsafe_allow_html=True)
    content()
    # st.markdown('</div>', unsafe_allow_html=True)


# Display different UI based on selected tab
if selected_tab == "General Query":
    create_card("Ask NexusAI Anything", lambda: (
        st.markdown(
            "Your query will be routed to the most appropriate specialized agent."),
        query := st.text_area("Enter your query:", height=100),
        process_button := st.button("Submit Query", key="general_query"),
        process_query(query, process_button)
    ))

elif selected_tab == "Financial Analysis":
    create_card("Financial Data Analysis", lambda: (
        st.markdown(
            "Ask any finance-related question or request stock analysis."),
        query := st.text_area("Enter your financial query:", placeholder="E.g., 'Compare Apple and Microsoft stocks' or 'What are the best performing tech stocks this year?'"),
        submit_button := st.button("Analyze", key="financial_analysis"),
        process_financial_query(query, submit_button)
    ))


elif selected_tab == "Academic Research":
    create_card("Academic Research Papers", lambda: (
        st.markdown("Search and summarize academic papers from arXiv."),
        research_topic := st.text_input("Research Topic:"),
        max_results := st.slider("Maximum number of papers:", 1, 5, 3),
        process_button := st.button("Search Papers", key="academic_research"),
        process_research_query(research_topic, max_results, process_button)
    ))

elif selected_tab == "Math Calculator":
    create_card("Mathematical Calculations", lambda: (
        st.markdown("Perform various mathematical calculations."),
        st.markdown('<p class="info-text">Examples: "Calculate compound interest on $10,000 at 5% for 10 years", "What is the square root of 144?"</p>', unsafe_allow_html=True),
        math_query := st.text_area("Enter calculation:"),
        process_button := st.button("Calculate", key="math_calc"),
        process_query(math_query, process_button)
    ))

elif selected_tab == "Wikipedia Search":
    create_card("Wikipedia Search", lambda: (
        st.markdown("Search and summarize Wikipedia articles."),
        wiki_topic := st.text_input("Topic:"),
        process_button := st.button("Search Wikipedia", key="wiki_search"),
        process_wiki_query(wiki_topic, process_button)
    ))

elif selected_tab == "News Article Summary":
    create_card("News Article Summary", lambda: (
        st.markdown("Get a summary of any news article."),
        st.markdown(
            '<p class="info-text">Enter the URL of a news article you want to summarize</p>', unsafe_allow_html=True),
        article_url := st.text_input("Article URL:"),
        process_button := st.button("Summarize Article", key="news_summary"),
        process_news_query(article_url, process_button)
    ))

elif selected_tab == "YouTube Video Summary":
    create_card("YouTube Video Summary", lambda: (
        st.markdown("Get a summary of a YouTube video."),
        st.markdown(
            '<p class="info-text">Currently supports videos up to 15-16 minutes with English subtitles/captions</p>', unsafe_allow_html=True),
        video_url := st.text_input("YouTube URL:"),
        process_button := st.button("Summarize Video", key="youtube_summary"),
        process_youtube_query(video_url, process_button)
    ))

elif selected_tab == "Chat with documents":
    st.markdown('<div class="sub-header">RAG Knowledge Base</div>',
                unsafe_allow_html=True)
    st.markdown('<div class="card">', unsafe_allow_html=True)

    # Add Clear Memory button at the top of the RAG section
    clear_memory_button = st.button("Clear Knowledge Base Memory")
    if clear_memory_button:
        with st.spinner("Clearing knowledge base..."):
            vstore_delete_all_docs()
            st.success("Knowledge base has been reset successfully!")

    st.markdown("Upload documents or provide URLs to build your knowledge base.")
    st.markdown('<p class="info-text">Note: Initial processing may take some time.</p>',
                unsafe_allow_html=True)

    st.subheader("Add Web Pages or PDF URLs")
    urls = st.text_area("Enter URLs (one per line):", height=100)
    add_urls_button = st.button("Add URLs to Knowledge Base")

    st.subheader("Upload PDF Documents")
    uploaded_files = st.file_uploader(
        "Choose PDF files", accept_multiple_files=True, type="pdf")
    upload_button = st.button("Upload Files to Knowledge Base")

    st.subheader("Query Your Knowledge Base")
    query = st.text_area("Enter your query:", height=100)
    query_button = st.button("Submit Query")

    PDF_DIR = Path(__file__).parent / "data" / "pdfs"
    PDF_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
    if upload_button and uploaded_files:
        for uploaded_file in uploaded_files:
            # Save each file in the data/pdfs directory
            file_path = PDF_DIR / uploaded_file.name
            with open(file_path, "wb") as f:
                f.write(uploaded_file.read())
        st.success(
            f"{len(uploaded_files)} file(s) uploaded successfully to {PDF_DIR}")

    if add_urls_button:
        urls_docs_insert_to_db(urls.split('\n'))
    if upload_button:
        pdfs_docs_insert_to_db(PDF_DIR)
    if query_button:
        answer = process_rag_query(query)
        st.markdown(answer)

    st.markdown('</div>', unsafe_allow_html=True)


elif selected_tab == "Advanced documents chat with Memory":
    st.markdown('<div class="sub-header">Advanced RAG with Memory</div>',
                unsafe_allow_html=True)
    st.markdown('<div class="card">', unsafe_allow_html=True)

    # Information about Advanced RAG with Memory
    st.markdown("""
    This Advanced RAG system maintains conversation history for more contextual responses.
    It uses LangGraph to:
    - Rewrite questions based on conversation context
    - Evaluate document relevance
    - Refine searches when needed
    - Provide direct answers when no relevant documents exist
    """)

    # Add Clear Memory button at the top of the Advanced RAG section
    clear_memory_button = st.button("Clear Advanced RAG Memory")
    if clear_memory_button:
        with st.spinner("Clearing advanced knowledge base..."):
            vstore_delete_all_docs_with_history()
            st.success(
                "Advanced RAG knowledge base has been reset successfully!")

    st.markdown(
        "Upload documents or provide URLs to build your knowledge base with memory support.")
    st.markdown('<p class="info-text">Note: This system maintains conversation history for contextual responses.</p>',
                unsafe_allow_html=True)

    st.subheader("Add Web Pages or PDF URLs")
    urls = st.text_area("Enter URLs (one per line):",
                        height=100, key="urls_memory")
    add_urls_button = st.button("Add URLs to Memory-Enabled Knowledge Base")

    st.subheader("Upload PDF Documents")
    uploaded_files = st.file_uploader(
        "Choose PDF files", accept_multiple_files=True, type="pdf", key="pdfs_memory")
    upload_button = st.button("Upload Files to Memory-Enabled Knowledge Base")

    # Chat history container
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    st.subheader("Query Your Memory-Enabled Knowledge Base")

    # Display chat history with color styling and emojis
    chat_container = st.container()
    with chat_container:
        for message in st.session_state.chat_history:
            if message["role"] == "user":
                st.markdown(
                    f"""
                    <div style="background-color: #E8F4FF; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
                        <strong>👤 You:</strong> {message['content']}
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            else:
                st.markdown(
                    f"""
                    <div style="background-color: #F0F0F0; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
                        <strong>🤖 AI:</strong> {message['content']}
                    </div>
                    """,
                    unsafe_allow_html=True
                )

    # Query input
    query = st.text_area("Enter your query:", height=100, key="query_memory")
    query_button = st.button("Submit Query to Memory-Enabled System")

    PDF_DIR = Path(__file__).parent / "data" / "history" / "pdfs"
    PDF_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
    if upload_button and uploaded_files:
        with st.spinner("Processing and uploading files..."):
            for uploaded_file in uploaded_files:
                # Save each file in the data/memory_pdfs directory
                file_path = PDF_DIR / uploaded_file.name
                with open(file_path, "wb") as f:
                    f.write(uploaded_file.read())
            st.success(
                f"{len(uploaded_files)} file(s) uploaded successfully to {PDF_DIR}")
            # Add files to the memory-enabled vector store
            pdfs_docs_insert_to_db_with_history(PDF_DIR)
            st.success(
                "Documents processed and added to memory-enabled knowledge base!")

    if add_urls_button and urls:
        with st.spinner("Processing URLs..."):
            url_list = [url.strip() for url in urls.split('\n') if url.strip()]
            if url_list:
                urls_docs_insert_to_db_with_history(url_list)
                st.success(
                    f"{len(url_list)} URL(s) processed and added to memory-enabled knowledge base!")
            else:
                st.warning("No valid URLs provided.")

    if query_button and query:
        with st.spinner("Processing your query with contextual memory..."):
            # Add user query to chat history
            st.session_state.chat_history.append(
                {"role": "user", "content": query})

            # Process the query with the memory-enabled system
            answer = process_rag_query_with_memory(query)

            # Add AI response to chat history
            st.session_state.chat_history.append(
                {"role": "assistant", "content": answer})

            # Force refresh to show updated chat history
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

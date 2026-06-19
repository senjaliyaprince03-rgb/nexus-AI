from langgraph.checkpoint.memory import MemorySaver
from langchain.schema import Document
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import TypedDict, List
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_astradb import AstraDBVectorStore
import cassio
import os
from langchain_community.document_loaders import WebBaseLoader
from pathlib import Path
from langchain_community.document_loaders import FileSystemBlobLoader
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import PyPDFParser
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

from dotenv import load_dotenv
load_dotenv()

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
# HF_TOKEN=os.getenv("HUGGINGFACEHUB_API_TOKEN")
# from langchain_huggingface import HuggingFaceEndpointEmbeddings
# embedding = HuggingFaceEndpointEmbeddings(
#     model="sentence-transformers/all-MiniLM-L6-v2",
#     task="feature-extraction",
#     huggingfacehub_api_token=HF_TOKEN,
#     model_kwargs={'device': 'cpu', 'normalize_embeddings': True},
# )

vstore = AstraDBVectorStore(
    collection_name="nexusaiagnolanggraphwithhistory",
    embedding=embedding,
    token=os.getenv("ASTRA_DB_APPLICATION_TOKEN"),
    api_endpoint=os.getenv("ASTRA_DB_API_ENDPOINT"),
)
print("Astra vector store configured for langgraph based rag with history")

# from langchain_chroma import Chroma
# VSTORE_DIR = Path(__file__).parent / "data" / "chroma"
# VSTORE_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
# vstore = Chroma(
#     collection_name="nexusaiagnolanggraphwithhistory",
#     embedding_function=embedding,
#     persist_directory=VSTORE_DIR.__str__()
# )
# print("Chroma vector store configured for history based RAG chats")


def vstore_delete_all_docs_with_history():
    """
    Delete the existing vector store and recreate it.
    """
    global vstore  # Add this line to modify the global variable
    vstore.clear() # This method is not available in Chroma, its for AstraDBVectorStore
    # vstore.reset_collection() # for chroma
    print("All documents deleted from the vector store with history.")


def urls_to_docs(urls: list[str]):
    """
    Convert a list of URLs to documents using WebBaseLoader.
    """
    loader_multiple_pages = WebBaseLoader(urls)
    docs = loader_multiple_pages.load()
    textsplitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    final_docs = textsplitter.split_documents(docs)
    print(f"Loaded {len(final_docs)} documents from URLs.")
    return final_docs


def urls_docs_insert_to_db_with_history(urls: list[str]):
    """
    Insert documents from URLs to the AstraDB vector store.
    """
    if not urls:
        print("No URLs provided.")
    else:
        url_based_docs = urls_to_docs(urls)
        vstore.add_documents(url_based_docs)
        print("Documents from URLs inserted to the vector store.")


def pdfs_to_docs(pdf_dir: Path):
    """
    Convert PDF files to documents using GenericLoader
    I know that pdf are stored in the data/pdfs directory
    Thus, I will use the FileSystemBlobLoader to load all pdfs from there
    """
    loader = GenericLoader(
        blob_loader=FileSystemBlobLoader(
            path=str(pdf_dir),
            glob="*.pdf",
        ),
        blob_parser=PyPDFParser(),
    )
    docs = loader.load()
    textsplitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    final_docs = textsplitter.split_documents(docs)
    print(f"Loaded {len(final_docs)} documents from PDFs.")
    return final_docs


def pdfs_docs_insert_to_db_with_history(pdf_dir: Path):
    """
    Insert documents from PDFs to the AstraDB vector store.
    """
    if not pdf_dir.exists() or not any(pdf_dir.glob("*.pdf")):
        print("No PDFs found in 'data/history/pdfs/'.")
    else:
        pdf_based_docs = pdfs_to_docs(pdf_dir)
        vstore.add_documents(pdf_based_docs)
        print("Documents from PDFs inserted to the vector store.")


rag_llm = ChatGroq(model='gemma2-9b-it')
print("Groq model configured")

# Set up the retriever for contextual information retrieval
retriever = vstore.as_retriever(search_type="mmr", search_kwargs={'k': 3})
# setup template for the prompt
template = """Answer the question based on the following context and the Chathistory. Especially take the latest question into consideration:

Chathistory: {history}

Context: {context}

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

# setup chain for the RAG pipeline
rag_chain = prompt | rag_llm

def init_graph():
    """
    Initialize the graph with the retriever and chain.
    """
    class AgentState(TypedDict):
        messages: List[BaseMessage]
        documents: List[Document]
        rephrased_question: str
        proceed_to_generate: bool
        rephrase_count: int
        question: HumanMessage


    def question_rewriter(state: AgentState):
        print(f"Entering question_rewriter with following state: {state}")

        # Reset state variables except for 'question' and 'messages'
        state["documents"] = []
        state["rephrased_question"] = ""
        state["proceed_to_generate"] = False
        state["rephrase_count"] = 0

        if "messages" not in state or state["messages"] is None:
            state["messages"] = []

        if state["question"] not in state["messages"]:
            state["messages"].append(state["question"])

        if len(state["messages"]) > 1:
            conversation = state["messages"][:-1]
            current_question = state["question"].content
            messages = [
                SystemMessage(
                    content="You are a helpful assistant that rephrases the user's question to be a standalone question optimized for retrieval."
                )
            ]
            messages.extend(conversation)
            messages.append(HumanMessage(content=current_question))
            rephrase_prompt = ChatPromptTemplate.from_messages(messages)
            llm = ChatGroq(model='gemma2-9b-it')
            prompt = rephrase_prompt.format()
            response = llm.invoke(prompt)
            better_question = response.content.strip()
            print(f"question_rewriter: Rephrased question: {better_question}")
            state["rephrased_question"] = better_question
        else:
            state["rephrased_question"] = state["question"].content
        return state

    # class GradeQuestion(BaseModel):
    #     score: str = Field(
    #         description="Question is about the specified topics? If yes -> 'Yes' if not -> 'No'"
    #     )
    # def question_classifier(state: AgentState):
    #     print("Entering question_classifier")
    #     system_message = SystemMessage(
    #         content=""" You are a classifier that determines whether a user's question is about one of the following topics

    #     1. Gym History & Founder
    #     2. Operating Hours
    #     3. Membership Plans
    #     4. Fitness Classes
    #     5. Personal Trainers
    #     6. Facilities & Equipment
    #     7. Anything else about Peak Performance Gym

    #     If the question IS about any of these topics, respond with 'Yes'. Otherwise, respond with 'No'.

    #     """
    #     )

    #     human_message = HumanMessage(
    #         content=f"User question: {state['rephrased_question']}"
    #     )
    #     grade_prompt = ChatPromptTemplate.from_messages(
    #         [system_message, human_message])
    #     llm = ChatGroq(model='gemma2-9b-it')
    #     structured_llm = llm.with_structured_output(GradeQuestion)
    #     grader_llm = grade_prompt | structured_llm
    #     result = grader_llm.invoke({})
    #     state["on_topic"] = result.score.strip()
    #     print(f"question_classifier: on_topic = {state['on_topic']}")
    #     return state

    # def on_topic_router(state: AgentState):
    #     print("Entering on_topic_router")
    #     on_topic = state.get("on_topic", "").strip().lower()
    #     if on_topic == "yes":
    #         print("Routing to retrieve")
    #         return "retrieve"
    #     else:
    #         print("Routing to off_topic_response")
    #         return "off_topic_response"

    def retrieve(state: AgentState):
        print("Entering retrieve")
        documents = retriever.invoke(state["rephrased_question"])
        print(f"retrieve: Retrieved {len(documents)} documents")
        state["documents"] = documents
        return state

    class GradeDocument(BaseModel):
        score: str = Field(
            description="Document is relevant to the question? If yes -> 'Yes' if not -> 'No'"
        )

    def retrieval_grader(state: AgentState):
        print("Entering retrieval_grader")
        system_message = SystemMessage(
            content="""You are a grader assessing the relevance of a retrieved document to a user question.
    Only answer with 'Yes' or 'No'.

    If the document contains information relevant to the user's question, respond with 'Yes'.
    Otherwise, respond with 'No'."""
        )

        llm = ChatGroq(model='gemma2-9b-it')
        structured_llm = llm.with_structured_output(GradeDocument)

        relevant_docs = []
        for doc in state["documents"]:
            human_message = HumanMessage(
                content=f"User question: {state['rephrased_question']}\n\nRetrieved document:\n{doc.page_content}"
            )
            grade_prompt = ChatPromptTemplate.from_messages(
                [system_message, human_message])
            grader_llm = grade_prompt | structured_llm
            result = grader_llm.invoke({})
            print(
                f"Grading document: {doc.page_content[:30]}... Result: {result.score.strip()}"
            )
            if result.score.strip().lower() == "yes":
                relevant_docs.append(doc)
        state["documents"] = relevant_docs
        state["proceed_to_generate"] = len(relevant_docs) > 0
        print(f"retrieval_grader: proceed_to_generate = {state['proceed_to_generate']}")
        return state

    def proceed_router(state: AgentState):
        print("Entering proceed_router")
        rephrase_count = state.get("rephrase_count", 0)
        if state.get("proceed_to_generate", False):
            print("Routing to generate_answer")
            return "generate_answer"
        elif rephrase_count >= 2:
            print("Maximum rephrase attempts reached. Cannot find relevant documents.")
            return "cannot_answer"
        else:
            print("Routing to refine_question")
            return "refine_question"

    def refine_question(state: AgentState):
        print("Entering refine_question")
        rephrase_count = state.get("rephrase_count", 0)
        if rephrase_count >= 2:
            print("Maximum rephrase attempts reached")
            return state
        question_to_refine = state["rephrased_question"]
        system_message = SystemMessage(
            content="""You are a helpful assistant that slightly refines the user's question to improve retrieval results.
    Provide a slightly adjusted version of the question."""
        )
        human_message = HumanMessage(
            content=f"Original question: {question_to_refine}\n\nProvide a slightly refined question."
        )
        refine_prompt = ChatPromptTemplate.from_messages(
            [system_message, human_message])
        llm = ChatGroq(model='gemma2-9b-it')
        prompt = refine_prompt.format()
        response = llm.invoke(prompt)
        refined_question = response.content.strip()
        print(f"refine_question: Refined question: {refined_question}")
        state["rephrased_question"] = refined_question
        state["rephrase_count"] = rephrase_count + 1
        return state

    def generate_answer(state: AgentState):
        print("Entering generate_answer")
        if "messages" not in state or state["messages"] is None:
            raise ValueError("State must include 'messages' before generating an answer.")

        history = state["messages"]
        documents = state["documents"]
        rephrased_question = state["rephrased_question"]

        response = rag_chain.invoke(
            {"history": history, "context": documents,
                "question": rephrased_question}
        )

        generation = response.content.strip()

        state["messages"].append(AIMessage(content=generation))
        print(f"generate_answer: Generated response: {generation}")
        return state

    def cannot_answer(state: AgentState):
        print("Entering cannot_answer")
        if "messages" not in state or state["messages"] is None:
            state["messages"] = []
        # state["messages"].append(
        #     AIMessage(
        #         content="I'm sorry, but I cannot find the information you're looking for."
        #     )
        # )
        # lets redirect to off topic question
        # return state
        state["messages"].append(
            AIMessage(
                content="I'm sorry! I cannot find the information you're looking for in context, So I will redirect you to the off topic question. and answer it with my best knowledge!"
            )
        )
        print("Redirecting to off_topic_question")
        return state

    def off_topic_response(state: AgentState):
        print("Entering off_topic_response")
        if "messages" not in state or state["messages"] is None:
            state["messages"] = []
        # state["messages"].append(
        #     AIMessage(content="I'm sorry! I cannot answer this question!"))
        # return state
        # Use the LLM directly without context to answer the query
        system_message = SystemMessage(
            content="You are a helpful assistant. Answer the user's question to the best of your ability."
        )
        
        question = state["question"].content
        human_message = HumanMessage(content=question)
        
        direct_prompt = ChatPromptTemplate.from_messages([system_message, human_message])
        llm = ChatGroq(model='gemma2-9b-it')
        
        response = llm.invoke(direct_prompt.format())
        direct_answer = response.content.strip()
        
        state["messages"].append(AIMessage(content=direct_answer))
        print(f"off_topic_question: Generated direct response: {direct_answer[:50]}...")
        return state

    # Workflow
    checkpointer = MemorySaver()
    workflow = StateGraph(AgentState)
    workflow.add_node("question_rewriter", question_rewriter)
    # workflow.add_node("question_classifier", question_classifier)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("retrieval_grader", retrieval_grader)
    workflow.add_node("generate_answer", generate_answer)
    workflow.add_node("refine_question", refine_question)
    workflow.add_node("cannot_answer", cannot_answer)
    workflow.add_node("off_topic_response", off_topic_response)

    # workflow.add_edge("question_rewriter", "question_classifier")
    workflow.add_edge("question_rewriter", "retrieve")
    # workflow.add_conditional_edges(
    #     "question_classifier",
    #     on_topic_router,
    #     {
    #         "retrieve": "retrieve",
    #         "off_topic_response": "off_topic_response",
    #     },
    # )
    workflow.add_edge("retrieve", "retrieval_grader")
    workflow.add_conditional_edges(
        "retrieval_grader",
        proceed_router,
        {
            "generate_answer": "generate_answer",
            "refine_question": "refine_question",
            "cannot_answer": "cannot_answer",
        },
    )
    workflow.add_edge("refine_question", "retrieve")
    workflow.add_edge("generate_answer", END)
    # workflow.add_edge("cannot_answer", END)
    workflow.add_edge("cannot_answer", "off_topic_response")
    workflow.add_edge("off_topic_response", END)
    workflow.set_entry_point("question_rewriter")
    graph = workflow.compile(checkpointer=checkpointer)
    return graph


graph = init_graph()


def process_rag_query_with_memory(query):
    """
    Process a query using the RAG pipeline.
    """
    input_data = {"question": HumanMessage(content=query)}
    response=graph.invoke(input=input_data, config={"configurable": {"thread_id": 1}})
    # Extract the last AIMessage from the messages list
    if response and "messages" in response:
        messages = response["messages"]
        # Find the last AIMessage in the list
        for message in reversed(messages):
            if isinstance(message, AIMessage):
                return message.content
    
    # Return a default message if no AIMessage is found
    return "No response generated."
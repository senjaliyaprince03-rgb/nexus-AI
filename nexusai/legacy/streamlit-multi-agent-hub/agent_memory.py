
# I will try now using langchain for the same purpose, as i dont know why using agno with local as well as cloud dbs is not working properly. when deployed
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_astradb import AstraDBVectorStore
import cassio
import os
from dotenv import load_dotenv
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
# from langchain_google_genai import ChatGoogleGenerativeAI
load_dotenv()

os.environ['ASTRA_DB_APPLICATION_TOKEN'] = os.getenv(
    'ASTRA_DB_APPLICATION_TOKEN')
os.environ['ASTRA_DB_API_ENDPOINT'] = os.getenv('ASTRA_DB_API_ENDPOINT')
# os.environ['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')

# google_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash-001")
# google_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite-001")


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

# from langchain_chroma import Chroma
# VSTORE_DIR = Path(__file__).parent / "data" / "chroma"
# VSTORE_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
# vstore = Chroma(
#     collection_name="nexusaiagnolanggraphwithhistory",
#     embedding_function=embedding,
#     persist_directory=VSTORE_DIR.__str__(),
# )
# print("Chroma vector store configured")

vstore = AstraDBVectorStore(
    collection_name="nexusaiagnolangchain",
    embedding=embedding,
    token=os.getenv("ASTRA_DB_APPLICATION_TOKEN"),
    api_endpoint=os.getenv("ASTRA_DB_API_ENDPOINT"),
)
print("Astra vector store configured")


def vstore_delete_all_docs():
    """
    Delete the existing vector store and recreate it.
    """
    global vstore  # Add this line to modify the global variable
    vstore.clear() # This method is not available in Chroma, its for AstraDBVectorStore
    # vstore.reset_collection() # for chroma
    print("All documents deleted from the vector store.")


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


def urls_docs_insert_to_db(urls: list[str]):
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


def pdfs_docs_insert_to_db(pdf_dir: Path):
    """
    Insert documents from PDFs to the AstraDB vector store.
    """
    if not pdf_dir.exists() or not any(pdf_dir.glob("*.pdf")):
        print("No PDFs found in 'data/pdfs/'.")
    else:
        pdf_based_docs = pdfs_to_docs(pdf_dir)
        vstore.add_documents(pdf_based_docs)
        print("Documents from PDFs inserted to the vector store.")


groq_api_key = os.getenv("GROQ_API_KEY")
# llm = google_model
llm = ChatGroq(
    api_key=groq_api_key,  # it can also read my default if in env its named GROQ_API_KEY
    model='gemma2-9b-it'
)
print("Groq model configured")


retriever = vstore.as_retriever(search_type="mmr", search_kwargs={"k": 3})
prompt_template = """
Answer the question based only on the supplied context. If you don't know the answer, say you don't know the answer.
Context: {context}
Question: {question}
Your answer:
"""
prompt = ChatPromptTemplate.from_template(prompt_template)
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)


def process_rag_query(query):
    """
    Process a query using the RAG pipeline.
    """
    response = chain.invoke(query)
    print(response)
    return response

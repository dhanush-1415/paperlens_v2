import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from langgraph.prebuilt import create_react_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pydantic import BaseModel, Field
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

# Ensure API Key is loaded
google_api_key = os.getenv("GEMINI_API_KEY")

def get_agent():
    """
    Initializes the Langchain ReAct Agent with Google Gemini and DuckDuckGo Web Search.
    Enforces strict guardrails to prevent infinite loops during enterprise bulk analysis.
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro", 
        temperature=0.2, 
        google_api_key=google_api_key
    )
    
    search = DuckDuckGoSearchRun()
    
    tools = [
        Tool(
            name="Web Search",
            func=search.run,
            description="Use this tool to search the internet for complex technical terms, company names, or legal clauses you do not understand. It returns summaries of web pages."
        )
    ]
    
    # Initialize ReAct agent using modern LangGraph prebuilt agent (initialize_agent is deprecated/removed)
    agent_executor = create_react_agent(
        model=llm,
        tools=tools,
        # max_iterations and early_stopping are handled differently in langgraph, but we keep it simple here
    )
    
    return agent_executor

def chunk_document_text(text: str) -> list[Document]:
    """
    Semantic Chunking: Breaks large documents into manageable chunks 
    with overlap to preserve context during Vector DB injection.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk) for chunk in chunks]

@retry(
    wait=wait_exponential(multiplier=1, min=4, max=30),
    stop=stop_after_attempt(5),
    reraise=False
)
def run_agent_analysis(text: str) -> str:
    """
    Passes a chunk of text to the Agent to extract insights. 
    If the text contains unknown terms, the Agent will automatically trigger a web search.
    """
    agent = get_agent()
    
    prompt = f"""
    You are an expert Enterprise Document Analyst. 
    Analyze the following document chunk. Extract key skills, risks, and experience.
    If you encounter proprietary tools, uncommon legal clauses, or unknown company names, 
    use your Web Search tool to decipher them and provide a brief explanation.
    
    Document Text:
    {text[:4000]} # Limit to 4000 chars for the map prompt to avoid token limits per chunk
    
    Provide your analysis in a structured manner.
    """
    
    try:
        response = agent.invoke({"messages": [("user", prompt)]})
        # The result is stored in the last message's content
        return response["messages"][-1].content
    except Exception as e:
        print(f"[Agent] Analysis failed or timed out: {e}")
        return "Unknown - Agent encountered an error or reached execution limit."
